import { BadRequestException, Injectable, ConflictException, HttpStatus, Logger } from '@nestjs/common'
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
import { EXPECTED_PARTICIPANT_CONTEXT_TYPE, EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE, getSdContext } from '../constants'
import { validationResultWithoutContent } from '../@types'
import { lastValueFrom } from 'rxjs'

@Injectable()
export class SelfDescriptionService {
  private SHAPE_PATHS: any
  private readonly logger = new Logger(SelfDescriptionService.name)

  constructor(private readonly httpService: HttpService, private readonly shaclService: ShaclService, private readonly proofService: ProofService) {
    this.SHAPE_PATHS = {
      PARTICIPANT: `${process.env.SHACL_SHAPE_BASE_PATH}/gax-trust-framework/gax-participant/legal-personShape.ttl`,
      SERVICE_OFFERING: `${process.env.SHACL_SHAPE_BASE_PATH}/gax-trust-framework/gax-service/service-offeringShape.ttl`
    }
  }

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

  //TODO: Could be potentially merged with validate()
  public async validateSelfDescription(
    participantSelfDescription: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>,
    sdType: string
  ): Promise<validationResultWithoutContent> {
    const _SDParserPipe = new SDParserPipe(sdType)

    const verifableSelfDescription: VerifiableSelfDescriptionDto<CredentialSubjectDto> = {
      complianceCredential: {
        proof: {} as SignatureDto,
        credentialSubject: { id: '', hash: '' },
        '@context': [],
        type: [],
        id: '',
        issuer: '',
        issuanceDate: new Date().toISOString()
      },
      selfDescriptionCredential: { ...participantSelfDescription }
    }

    const { selfDescriptionCredential: selfDescription, rawCredentialSubject } = _SDParserPipe.transform(verifableSelfDescription)

    try {
      const type: string = selfDescription.type.find(t => t !== 'VerifiableCredential') // selfDescription.type

      const rawPrepared: any = {
        ...JSON.parse(rawCredentialSubject),
        ...(type === 'LegalPerson' ? EXPECTED_PARTICIPANT_CONTEXT_TYPE : EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE),
        '@context': getSdContext()
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
    sd: SignedSelfDescriptionDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>
  ): Promise<string> {
    try {
      const signedSelfDescriptionJson = {
        selfDescriptionCredential: sd.selfDescriptionCredential,
        complianceCredential: sd.complianceCredential
      }
      const storageServiceResponse = await lastValueFrom(
        this.httpService.post(`${process.env.SD_STORAGE_BASE_URL}/self-descriptions/`, signedSelfDescriptionJson, {
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

    return this.SHAPE_PATHS[shapePathType[type]] || undefined
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
}
