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
import { IVerifiableCredential, IVerifiablePresentation, WrappedVerifiablePresentation } from '../../@types/type/SSI.types'
import { SDParserPipe } from '../../utils/pipes'

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

  public async validate(wrappedVerifiablePresentation: WrappedVerifiablePresentation): Promise<validationResultWithoutContent> {
    const type = wrappedVerifiablePresentation.type === 'Participant'? 'LegalPerson': 'ServiceOfferingExperimental'
    const shapePath: string = this.getShapePath(type)
    if (!shapePath) throw new BadRequestException('Provided Type does not exist for Self Descriptions')

    const expectedContexts = {
      [SelfDescriptionTypes.PARTICIPANT]: EXPECTED_PARTICIPANT_CONTEXT_TYPE,
      [SelfDescriptionTypes.SERVICE_OFFERING]: EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE
    }

    if (!(type in expectedContexts)) {
      throw new ConflictException('Provided Type is not supported')
    }
    const rawCredentialSubject =
      wrappedVerifiablePresentation.type === 'Participant'
        ? wrappedVerifiablePresentation.participantCredentials[0].rawCredentialSubject
        : wrappedVerifiablePresentation.serviceOfferingCredentials[0].rawCredentialSubject
    const rawPrepared = {
      ...JSON.parse(rawCredentialSubject), // TODO: refactor to object, check if raw is still needed
      ...expectedContexts[wrappedVerifiablePresentation.type]
    }
    const selfDescriptionDataset: DatasetExt = await this.shaclService.loadFromJsonLD(JSON.stringify(rawPrepared))

    const shape: ValidationResult = await this.shaclService.validate(await this.getShaclShape(shapePath), selfDescriptionDataset)
    // const content: ValidationResult = await this.validateContent(selfDescription, type)

    const parsedRaw = JSON.parse(wrappedVerifiablePresentation.participantCredentials[0].raw)

    const isValidSignature: boolean = await this.checkParticipantCredential(
      { selfDescription: parsedRaw, proof: wrappedVerifiablePresentation.complianceCredentials[0].proof },
      wrappedVerifiablePresentation.participantCredentials[0].proof.jws
    )

    const conforms: boolean = shape.conforms && isValidSignature // && content.conforms

    return {
      conforms,
      shape,
      // content,
      isValidSignature
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
    participantSelfDescription: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto> | IVerifiablePresentation,
    sdType: string
  ): Promise<validationResultWithoutContent> {
    let participantVC: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>
    const type = sdType === 'Participant' ? 'LegalPerson' : 'ServiceOffering'
    const _SDParserPipe = new SDParserPipe(type)
    if (participantSelfDescription.type.includes('VerifiablePresentation')) {
      participantVC = (participantSelfDescription as IVerifiablePresentation)
        .verifiableCredential[0] as unknown as VerifiableCredentialDto<ParticipantSelfDescriptionDto>
    } else {
      participantVC = participantSelfDescription as VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>
    }
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
      selfDescriptionCredential: { ...participantVC }
    }

    const { selfDescriptionCredential: selfDescription, rawCredentialSubject } = _SDParserPipe.transform(verifiableSelfDescription)
    try {
      const type: string = selfDescription.type.find(t => t !== 'VerifiableCredential') // selfDescription.type

      const rawPrepared: any = {
        ...JSON.parse(rawCredentialSubject),
        ...(type === 'LegalPerson' ? EXPECTED_PARTICIPANT_CONTEXT_TYPE : EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE)
      }

      const selfDescriptionDataset: DatasetExt = await this.shaclService.loadFromJsonLD(JSON.stringify(rawPrepared))

      const shapePath: string = this.getShapePath(type)
      const shape: ValidationResult = await this.shaclService.validate(await this.getShaclShape(shapePath), selfDescriptionDataset)

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
}
