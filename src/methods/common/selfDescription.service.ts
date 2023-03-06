import { BadRequestException, Injectable, ConflictException, HttpStatus, Logger } from '@nestjs/common'
import { SDParserPipe } from '../pipes/sd-parser.pipe'
import { HttpService } from '@nestjs/axios'
import { ParticipantSelfDescriptionDto } from '../../participant/dto'
import { ProofService } from './proof.service'
import { ServiceOfferingSelfDescriptionDto } from '../../service-offering/dto/service-offering-sd.dto'
import { ParticipantContentValidationService } from '../../participant/services/content-validation.service'
import { ServiceOfferingContentValidationService } from '../../service-offering/services/content-validation.service'
import { ShaclService } from './shacl.service'
import {
  CredentialSubjectDto,
  SignatureDto,
  
  SignedSelfDescriptionDto,
  ValidationResult,
  ValidationResultDto,
  VerifiableCredentialDto,
  VerifiableSelfDescriptionDto
} from '../dto'

import { SelfDescriptionTypes } from '../enums'
import { validationResultWithoutContent } from '../@types'
import { lastValueFrom } from 'rxjs'
import { RegistryService } from './registry.service'


@Injectable()
export class SelfDescriptionService {
  
  private readonly logger = new Logger(SelfDescriptionService.name)

  constructor(private readonly httpService: HttpService, private readonly shaclService: ShaclService, private readonly proofService: ProofService) {}

  public async verify(signedSelfDescription: any): Promise<ValidationResultDto> {
    try {
      const participantContentValidationService = new ParticipantContentValidationService(this.httpService, new RegistryService(this.httpService))
      const serviceOfferingContentValidationService = new ServiceOfferingContentValidationService(this.proofService, this.httpService)
      const { selfDescriptionCredential: selfDescription, raw, rawCredentialSubject, complianceCredential, proof } = signedSelfDescription
      const type: string = selfDescription.type.find(t => t !== 'VerifiableCredential')
      const link:string = selfDescription["@context"].find(t => t !== "https://www.w3.org/2018/credentials/v1")
      const shape: ValidationResult = await this.shaclService.ShapeVerification(rawCredentialSubject, type)
      const parsedRaw = JSON.parse(raw)
      const isValidSignature: boolean = await this.checkParticipantCredential({ selfDescription: parsedRaw, proof: complianceCredential?.proof },proof?.jws )
      //const isValidSignature = true //test-purpose
      const validationFns: { [key: string]: () => Promise<ValidationResultDto> } = {
        [SelfDescriptionTypes.PARTICIPANT]: async () => {
          const content: ValidationResult = await participantContentValidationService.validate(
            selfDescription.credentialSubject as ParticipantSelfDescriptionDto
          )
          const conforms: boolean = shape.conforms && isValidSignature && content.conforms

          return { conforms, isValidSignature, content, shape }
        },
        [SelfDescriptionTypes.SERVICE_OFFERING]: async () => {
          const get_SD: SignedSelfDescriptionDto<ParticipantSelfDescriptionDto> = await new Promise(async (resolve, reject) => {
            try {
              const response = await this.httpService.get(selfDescription.credentialSubject.providedBy).toPromise()
              const { data } = response
              const participantSD = new SDParserPipe(SelfDescriptionTypes.PARTICIPANT).transform(data)
              resolve(participantSD as SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>)
            } catch (e) {
              reject(new ConflictException('Participant SD not found'))
            }
          })
          const participant_verif = await this.verify(get_SD)
          const content = await serviceOfferingContentValidationService.validate(
            signedSelfDescription as SignedSelfDescriptionDto<ServiceOfferingSelfDescriptionDto>,
            get_SD as SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>,
            participant_verif
          )
          const conforms: boolean = shape.conforms && isValidSignature && content.conforms
          return { conforms, isValidSignature, content, shape }
        }
      }
      return (await validationFns[type]()) || undefined
    } catch (e) {
      throw e
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
      const link:string = selfDescription["@context"].find(t => t !== "https://www.w3.org/2018/credentials/v1")
      const shape: ValidationResult = await this.shaclService.ShapeVerification( rawCredentialSubject, type)

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




  public async verify_v2(signedSelfDescription: any): Promise<ValidationResultDto> {
    try {
      const { selfDescriptionCredential: selfDescription, raw, rawCredentialSubject, complianceCredential, proof } = signedSelfDescription
      const type: string = selfDescription.type.find(t => t !== 'VerifiableCredential')
      const parsedRaw = JSON.parse(raw)
      const isValidSignature: boolean = await this.checkParticipantCredential({ selfDescription: parsedRaw, proof: complianceCredential?.proof },proof?.jws )
      const validationFns: { [key: string]: () => Promise<ValidationResultDto> } = {
        [SelfDescriptionTypes.PARTICIPANT]: async () => {
          const conforms: boolean = isValidSignature
          
          return { conforms, isValidSignature }
        },
        [SelfDescriptionTypes.SERVICE_OFFERING]: async () => {
          const get_SD: SignedSelfDescriptionDto<ParticipantSelfDescriptionDto> = await new Promise(async (resolve, reject) => {
            try {
              const response = await this.httpService.get(selfDescription.credentialSubject.providedBy).toPromise()
              const { data } = response
              const participantSD = new SDParserPipe(SelfDescriptionTypes.PARTICIPANT).transform(data)
              resolve(participantSD as SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>)
            } catch (e) {
              reject(new ConflictException('Participant SD not found'))
            }
          })
          const participant_verif = await this.verify(get_SD)
          const conforms: boolean =  isValidSignature && participant_verif.conforms
          return { conforms, isValidSignature }
        }
      }
      return (await validationFns[type]()) || undefined
    } catch (e) {
      throw e
    }
  }

  public async validate(signedSelfDescription: any): Promise<ValidationResultDto> {
    try {
      const participantContentValidationService = new ParticipantContentValidationService(this.httpService, new RegistryService(this.httpService))
      const serviceOfferingContentValidationService = new ServiceOfferingContentValidationService(this.proofService, this.httpService)
      const { selfDescriptionCredential: selfDescription, raw, rawCredentialSubject, complianceCredential, proof } = signedSelfDescription
      const type: string = selfDescription.type.find(t => t !== 'VerifiableCredential')
      const link:string = selfDescription["@context"].find(t => t !== "https://www.w3.org/2018/credentials/v1")
      const shape: ValidationResult = await this.shaclService.ShapeVerification(rawCredentialSubject, type)
      const validationFns: { [key: string]: () => Promise<ValidationResultDto> } = {
        [SelfDescriptionTypes.PARTICIPANT]: async () => {
          const content: ValidationResult = await participantContentValidationService.validate(
            selfDescription.credentialSubject as ParticipantSelfDescriptionDto
          )
          const conforms: boolean = shape.conforms  && content.conforms

          return { conforms, content, shape }
        },
        [SelfDescriptionTypes.SERVICE_OFFERING]: async () => {
          const get_SD: SignedSelfDescriptionDto<ParticipantSelfDescriptionDto> = await new Promise(async (resolve, reject) => {
            try {
              const response = await this.httpService.get(selfDescription.credentialSubject.providedBy).toPromise()
              const { data } = response
              const participantSD = new SDParserPipe(SelfDescriptionTypes.PARTICIPANT).transform(data)
              resolve(participantSD as SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>)
            } catch (e) {
              reject(new ConflictException('Participant SD not found'))
            }
          })
          const participant_verif = await this.verify_v2(get_SD)
          const content = await serviceOfferingContentValidationService.validate(
            signedSelfDescription as SignedSelfDescriptionDto<ServiceOfferingSelfDescriptionDto>,
            get_SD as SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>,
            participant_verif
          )
          const conforms: boolean = shape.conforms && content.conforms
          return { conforms, content, shape }
        }
      }
      return (await validationFns[type]()) || undefined
    } catch (e) {
      throw e
    }
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
