import { BadRequestException, ConflictException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ShaclService } from './shacl.service'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { lastValueFrom } from 'rxjs'
import { Proof2210vpService } from './proof.2210vp.service'
import {
  CredentialSubjectDto,
  SignatureDto,
  SignedSelfDescriptionDto,
  ValidationResult,
  VerifiableCredentialDto,
  VerifiableSelfDescriptionDto
} from '../../@types/dto/common'
import { validationResultWithoutContent } from '../../@types/type'
import { SelfDescriptionTypes } from '../../@types/enums'
import { EXPECTED_PARTICIPANT_CONTEXT_TYPE, EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE } from '../../@types/constants'
import { VerifiablePresentationDto } from '../../@types/dto/common/presentation-meta.dto'
import { ParticipantSelfDescriptionDto } from '../../@types/dto/participant'
import { ServiceOfferingSelfDescriptionDto } from '../../@types/dto/service-offering'
import { IntentType, IVerifiableCredential, TypedVerifiableCredential, TypedVerifiablePresentation } from '../../@types/type/SSI.types'
import { SDParserPipe } from '../../utils/pipes'
import { getDidWeb } from '../../utils/methods'
import { SsiTypesParserPipe } from '../../utils/pipes/ssi-types-parser.pipe'

@Injectable()
export class SelfDescription2210vpService {
  static readonly SHAPE_PATHS = {
    PARTICIPANT: '/v2206/api/shape/files?file=participant&type=ttl',
    SERVICE_OFFERING: '/v2206/api/shape/files?file=service-offering&type=ttl'
  }
  private readonly logger = new Logger(SelfDescription2210vpService.name)

  constructor(
    private readonly httpService: HttpService,
    private readonly shaclService: ShaclService,
    private readonly proofService: Proof2210vpService
  ) {}

  public async validate(typedVerifiablePresentation: TypedVerifiablePresentation): Promise<validationResultWithoutContent> {
    if (typedVerifiablePresentation.intent !== IntentType.GET_COMPLIANCE_PARTICIPANT) {
      if (
        !SsiTypesParserPipe.hasVerifiableCredential(
          typedVerifiablePresentation.originalVerifiablePresentation,
          'LegalPerson',
          typedVerifiablePresentation.originalVerifiablePresentation.holder
        )
      ) {
        throw new BadRequestException('Expected a VerifiableCredential of type LegalPerson')
      }
      const complianceVC = SsiTypesParserPipe.getTypedVerifiableCredentialWithTypeAndIssuer(
        typedVerifiablePresentation,
        'ParticipantCredential',
        getDidWeb()
      )
      const legalPersonVC = SsiTypesParserPipe.getTypedVerifiableCredentialWithTypeAndIssuer(
        typedVerifiablePresentation,
        'LegalPerson',
        typedVerifiablePresentation.originalVerifiablePresentation.holder
      )
      const serviceOfferingVC = SsiTypesParserPipe.getTypedVerifiableCredentialWithTypeAndIssuer(
        typedVerifiablePresentation,
        'ServiceOffering',
        typedVerifiablePresentation.originalVerifiablePresentation.holder
      )

      const expectedContexts = {
        [SelfDescriptionTypes.PARTICIPANT]: EXPECTED_PARTICIPANT_CONTEXT_TYPE,
        [SelfDescriptionTypes.SERVICE_OFFERING]: EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE
      }
      //fixme: @nklomp because this should be always present at this point?
      const legalPersonShapeValidation = await this.checkCredentialShape(legalPersonVC, expectedContexts[legalPersonVC.type])
      let serviceOfferingShapeValidation
      if (serviceOfferingVC) {
        serviceOfferingShapeValidation = this.checkCredentialShape(serviceOfferingVC, expectedContexts[serviceOfferingVC.type])
      }
      const isValidSignature: boolean = await this.checkParticipantCredential(
        { selfDescription: legalPersonVC.rawVerifiableCredential, proof: complianceVC.rawVerifiableCredential.proof },
        legalPersonVC.rawVerifiableCredential.proof.jws
      )
      const shapeResult: ValidationResult = serviceOfferingShapeValidation
        ? {
            ...serviceOfferingShapeValidation,
            ...legalPersonShapeValidation,
            conforms: serviceOfferingShapeValidation.conforms && legalPersonShapeValidation.conforms
          }
        : legalPersonShapeValidation
      const conforms: boolean = shapeResult.conforms && isValidSignature // && content.conforms
      return {
        conforms,
        shape: shapeResult,
        // content,
        isValidSignature
      }
    }
  }

  public async validateVP(signedSelfDescription: VerifiablePresentationDto): Promise<validationResultWithoutContent> {
    const serviceOfferingVC = signedSelfDescription.verifiableCredential.filter(vc => vc.type.includes('ServiceOfferingExperimental'))[0]
    const participantVC = signedSelfDescription.verifiableCredential.filter(vc => vc.type.includes('ParticipantCredential'))[0]
    /**
     * I will not change the following lines for now
     */
    const type: string = serviceOfferingVC.type.find(t => t !== 'VerifiableCredential')
    const shapePath: string = this.getShapePath(type)
    if (!shapePath) throw new BadRequestException('Provided Type does not exist for Self Descriptions')
    const expectedContexts = {
      [SelfDescriptionTypes.PARTICIPANT]: EXPECTED_PARTICIPANT_CONTEXT_TYPE,
      [SelfDescriptionTypes.SERVICE_OFFERING]: EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE
    }

    if (!(type in expectedContexts)) throw new ConflictException('Provided Type is not supported')
    /**
     * end of unchanged lines
     */
    const isValidVP = await this.proofService.validateVP(signedSelfDescription)
    if (!isValidVP) {
      throw new BadRequestException('ServiceOffering VP is not valid')
    }
    if (participantVC.credentialSubject.id === serviceOfferingVC.issuer) {
      return {
        shape: undefined,
        conforms: true
      }
    } else {
      return {
        shape: undefined,
        conforms: false
      }
    }
  }

  //TODO: Could be potentially merged with validate()
  public async validateSelfDescription(
    participantSelfDescription: TypedVerifiablePresentation,
    sdType: string
  ): Promise<validationResultWithoutContent> {
    // const type = sdType === 'Participant' || sdType === 'LegalPerson' ? 'LegalPerson' : 'ServiceOffering'
    const _SDParserPipe = new SDParserPipe('LegalPerson')
    //fixme: we're getting the number 0 on the list, but it should consider the issuer for getting the right value? or is it the case that this credential should be singular in this list?
    const participantTypedVC = participantSelfDescription.getTypedVerifiableCredentials('LegalPerson')[0]
    const verifiableSelfDescription: VerifiableSelfDescriptionDto<CredentialSubjectDto> = {
      complianceCredential: {
        proof: {} as SignatureDto,
        credentialSubject: { id: '', hash: '' },
        '@context': [],
        type: [],
        id: '',
        issuer: '',
        issuanceDate: new Date().toISOString()
      },
      selfDescriptionCredential: { ...participantTypedVC.rawVerifiableCredential } as VerifiableCredentialDto<any>
    }

    const { selfDescriptionCredential: selfDescription } = _SDParserPipe.transform(verifiableSelfDescription)
    try {
      const type: string = selfDescription.type.find(t => t !== 'VerifiableCredential') // selfDescription.type
      const shape: ValidationResult = await this.checkCredentialShape(
        participantTypedVC,
        type === 'LegalPerson' ? EXPECTED_PARTICIPANT_CONTEXT_TYPE : EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE
      )

      // const content: ValidationResult = await this.validateContent(selfDescription, type)
      const conforms: boolean = shape.conforms // && content.conforms
      const result = {
        conforms,
        //content,
        shape
      }

      if (!conforms) throw new ConflictException(result)

      return result
    } catch (error) {
      if (error.status === 409) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          message: error.response,
          error: 'Conflict'
        })
      }
      this.logger.error(error.message)
      throw new BadRequestException('Provided Self Description cannot be validated.')
    }
  }

  public async getShaclShape(shapePath: string): Promise<DatasetExt> {
    return await this.shaclService.loadFromUrl(`${process.env.REGISTRY_URL || 'https://registry.gaia-x.eu'}${shapePath}`)
  }

  public async storeSelfDescription(
    sd: SignedSelfDescriptionDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto> | VerifiablePresentationDto
  ): Promise<string> {
    try {
      const storageServiceResponse = await lastValueFrom(
        this.httpService.post(`${process.env.SD_STORAGE_BASE_URL}/self-descriptions/`, sd, {
          timeout: 5000,
          headers: { 'X-API-KEY': process.env.SD_STORAGE_API_KEY }
        }),
        {
          defaultValue: null
        }
      )
      return `${process.env.SD_STORAGE_BASE_URL}/self-descriptions/${storageServiceResponse?.data?.id}`
    } catch (error) {
      if (error?.response?.status === 409) {
        this.logger.log(`Storing Self Description failed: ${error.message} - ${error.response?.data?.message} - id: ${error.response?.data?.id}`)
        return `${process.env.SD_STORAGE_BASE_URL}/self-descriptions/${error?.response?.data?.id}`
      }
      throw error
    }
  }

  // private async validateContent(selfDescription, type): Promise<ValidationResult> {
  //   const validationFns: { [key: string]: () => Promise<ValidationResult> } = {
  //     [SelfDescriptionTypes.PARTICIPANT]: async () => {
  //       return await this.participantContentValidationService.validate(selfDescription)
  //     },
  //     [SelfDescriptionTypes.SERVICE_OFFERING]: async () => {
  //       const result: validationResultWithoutContent = await this.validateProvidedByParticipantSelfDescriptions(selfDescription.providedBy)
  //       return await this.serviceOfferingContentValidationService.validate(selfDescription as ServiceOfferingSelfDescriptionDto, result)
  //     }
  //   }

  //   return (await validationFns[type]()) || undefined
  // }

  private getShapePath(type: string): string | undefined {
    const shapePathType = {
      [SelfDescriptionTypes.PARTICIPANT]: 'PARTICIPANT',
      [SelfDescriptionTypes.SERVICE_OFFERING]: 'SERVICE_OFFERING'
    }

    return SelfDescription2210vpService.SHAPE_PATHS[shapePathType[type]] || undefined
  }

  private async checkParticipantCredential(selfDescription, jws: string): Promise<boolean> {
    try {
      const result: boolean = await this.proofService.validateVC(selfDescription, true, jws)
      return result
    } catch (error) {
      this.logger.error(error)
      return false
    }
  }

  async validateVC(verifiableCredential: IVerifiableCredential) {
    const isValidVC = await this.proofService.validateVC(verifiableCredential as VerifiableCredentialDto<any>)

    if (!isValidVC) {
      throw new BadRequestException('VC is not valid')
    }
    if (verifiableCredential.credentialSubject.id === verifiableCredential.issuer) {
      return {
        shape: undefined,
        conforms: true
      }
    } else if (verifiableCredential.credentialSubject && verifiableCredential.credentialSubject.id === verifiableCredential.issuer) {
      return {
        shape: undefined,
        conforms: true
      }
    } else {
      return {
        shape: undefined,
        conforms: false
      }
    }
  }

  private async checkCredentialShape(typedVerifiableCredential: TypedVerifiableCredential, context: any): Promise<ValidationResult> {
    const shapePath: string = this.getShapePath(typedVerifiableCredential.type)
    const rawCredentialSubject = typedVerifiableCredential.rawVerifiableCredential.credentialSubject
    const rawPrepared = {
      ...rawCredentialSubject, // TODO: refactor to object, check if raw is still needed
      ...context
    }
    const selfDescriptionDataset: DatasetExt = await this.shaclService.loadFromJsonLD(JSON.stringify(rawPrepared))
    return await this.shaclService.validate(await this.getShaclShape(shapePath), selfDescriptionDataset)
  }
}
