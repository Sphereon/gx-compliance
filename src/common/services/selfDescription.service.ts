import { BadRequestException, ConflictException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { SDParserPipe } from '../pipes/sd-parser.pipe'
import { HttpService } from '@nestjs/axios'
import { ParticipantSelfDescriptionDto } from '../../participant/dto'
import { ProofService } from './proof.service'
import { ServiceOfferingSelfDescriptionDto } from '../../service-offering/dto/service-offering-sd.dto'
import { ShaclService } from './shacl.service'
import {
  CredentialSubjectDto,
  SignatureDto,
  SignedSelfDescriptionDto,
  ValidationResult,
  VerifiableCredentialDto,
  VerifiableSelfDescriptionDto
} from '../dto'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { SelfDescriptionTypes } from '../enums'
import { EXPECTED_PARTICIPANT_CONTEXT_TYPE, EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE } from '../constants'
import { IVerifiablePresentation, validationResultWithoutContent } from '../@types'
import { lastValueFrom } from 'rxjs'
import { VerifiablePresentationDto } from '../dto/presentation-meta.dto'

@Injectable()
export class SelfDescriptionService {
  static readonly SHAPE_PATHS = {
    PARTICIPANT: '/v2206/api/shape/files?file=participant&type=ttl',
    SERVICE_OFFERING: '/v2206/api/shape/files?file=service-offering&type=ttl'
  }
  private readonly logger = new Logger(SelfDescriptionService.name)

  constructor(private readonly httpService: HttpService, private readonly shaclService: ShaclService, private readonly proofService: ProofService) {}

  public async validate(signedSelfDescription: SignedSelfDescriptionDto<CredentialSubjectDto>): Promise<validationResultWithoutContent> {
    const { selfDescriptionCredential: selfDescription, raw, rawCredentialSubject, complianceCredential, proof } = signedSelfDescription

    const type: string = selfDescription.type.find(t => t !== 'VerifiableCredential')
    const shapePath: string = this.getShapePath(type)
    if (!shapePath) throw new BadRequestException('Provided Type does not exist for Self Descriptions')

    const expectedContexts = {
      [SelfDescriptionTypes.PARTICIPANT]: EXPECTED_PARTICIPANT_CONTEXT_TYPE,
      [SelfDescriptionTypes.SERVICE_OFFERING]: EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE
    }

    if (!(type in expectedContexts)) throw new ConflictException('Provided Type is not supported')

    const rawPrepared = {
      ...JSON.parse(rawCredentialSubject), // TODO: refactor to object, check if raw is still needed
      ...expectedContexts[type]
    }
    const selfDescriptionDataset: DatasetExt = await this.shaclService.loadFromJsonLD(JSON.stringify(rawPrepared))

    const shape: ValidationResult = await this.shaclService.validate(await this.getShaclShape(shapePath), selfDescriptionDataset)
    // const content: ValidationResult = await this.validateContent(selfDescription, type)

    const parsedRaw = JSON.parse(raw)

    const isValidSignature: boolean = await this.checkParticipantCredential(
      { selfDescription: parsedRaw, proof: complianceCredential?.proof },
      proof?.jws
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
    const isValidVP = await this.proofService.validate(signedSelfDescription)
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
    const _SDParserPipe = new SDParserPipe(sdType)
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

  private async validateProvidedByParticipantSelfDescriptions(
    providedBy: ServiceOfferingSelfDescriptionDto['providedBy']
  ): Promise<validationResultWithoutContent> {
    const response = await this.httpService.get(providedBy).toPromise()
    const { data } = response

    const participantSD = new SDParserPipe(SelfDescriptionTypes.PARTICIPANT).transform(data)
    return await this.validate(participantSD)
  }

  private getShapePath(type: string): string | undefined {
    const shapePathType = {
      [SelfDescriptionTypes.PARTICIPANT]: 'PARTICIPANT',
      [SelfDescriptionTypes.SERVICE_OFFERING]: 'SERVICE_OFFERING'
    }

    return SelfDescriptionService.SHAPE_PATHS[shapePathType[type]] || undefined
  }

  private async checkParticipantCredential(selfDescription, jws: string): Promise<boolean> {
    try {
      const result: boolean = await this.proofService.validate(selfDescription, true, jws)
      return result
    } catch (error) {
      this.logger.error(error)
      return false
    }
  }

  async validateVC(selfDescriptionDto: ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto | VerifiableCredentialDto<any>) {
    let isValidVC: boolean
    if (selfDescriptionDto['selfDescriptionCredential']) {
      isValidVC = await this.proofService.validate(selfDescriptionDto['selfDescriptionCredential'] as VerifiableCredentialDto<any>)
    } else {
      isValidVC = await this.proofService.validate(selfDescriptionDto as VerifiableCredentialDto<any>)
    }
    if (!isValidVC) {
      throw new BadRequestException('VC is not valid')
    }
    if (
      selfDescriptionDto['selfDescriptionCredential'] &&
      selfDescriptionDto['selfDescriptionCredential'].credentialSubject.id === selfDescriptionDto['selfDescriptionCredential'].issuer
    ) {
      return {
        shape: undefined,
        conforms: true
      }
    } else if (selfDescriptionDto['credentialSubject'] && selfDescriptionDto['credentialSubject'].id === selfDescriptionDto['issuer']) {
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
