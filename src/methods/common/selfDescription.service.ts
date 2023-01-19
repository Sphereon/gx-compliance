import { BadRequestException, Injectable, ConflictException, HttpStatus, Logger } from '@nestjs/common'
import { SDParserPipe } from '../../utils/pipes'
import { HttpService } from '@nestjs/axios'
import { ParticipantSelfDescriptionDto } from '../../@types/dto/participant'
import { ProofService } from './proof.service'
import { ServiceOfferingSelfDescriptionDto } from '../../@types/dto/service-offering'
import { ShaclService } from './shacl.service'
import { ParticipantContentValidationService } from '../participant/content-validation.service'
import { ServiceOfferingContentValidationService } from '../service-offering/content-validation.service'
import {
  CredentialSubjectDto,
  SignatureDto,
  SignedSelfDescriptionDto,
  ValidationResult,
  ValidationResultDto,
  VerifiableCredentialDto,
  VerifiableSelfDescriptionDto,
} from '../../@types/dto/common'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { SelfDescriptionTypes } from '../../@types/enums'
import { EXPECTED_PARTICIPANT_CONTEXT_TYPE, EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE } from '../../@types/constants'
import { validationResultWithoutContent } from '../../@types/type'
import { lastValueFrom } from 'rxjs'
import { rejects } from 'assert'
import { RegistryService } from './registry.service'
import { Console } from 'console'
const expectedContexts = {
  [SelfDescriptionTypes.PARTICIPANT]: EXPECTED_PARTICIPANT_CONTEXT_TYPE,
  [SelfDescriptionTypes.SERVICE_OFFERING]: EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE
}



@Injectable()
export class SelfDescriptionService {
  static readonly SHAPE_PATHS = {
    PARTICIPANT: '/v2206/api/shape/files?file=participant&type=ttl',
    SERVICE_OFFERING: '/v2206/api/shape/files?file=service-offering&type=ttl'
  }
  private readonly logger = new Logger(SelfDescriptionService.name)

  constructor(private readonly httpService: HttpService, private readonly shaclService: ShaclService, private readonly proofService: ProofService) { }



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

  public async validate(signedSelfDescription: any ): Promise<ValidationResultDto> {
    try {
    let participantContentValidationService = new ParticipantContentValidationService(this.httpService, new RegistryService(this.httpService))
    let serviceOfferingContentValidationService = new ServiceOfferingContentValidationService()
    const { selfDescriptionCredential: selfDescription, raw, rawCredentialSubject, complianceCredential, proof } = signedSelfDescription
    const type: string = selfDescription.type.find(t => t !== 'VerifiableCredential')
    const shape:ValidationResult = await this.ShapeVerification(selfDescription,rawCredentialSubject,type)
    const parsedRaw = JSON.parse(raw)
    const isValidSignature: boolean = await this.checkParticipantCredential(
            { selfDescription: parsedRaw, proof: complianceCredential?.proof },
             proof?.jws )
    // const isValidSignature = true //test-purpose
    const validationFns: { [key: string]: () => Promise<ValidationResultDto> } = {
      [SelfDescriptionTypes.PARTICIPANT]: async () =>  {
        const content:ValidationResult = await participantContentValidationService.validate(selfDescription.credentialSubject as ParticipantSelfDescriptionDto)
        const conforms: boolean = shape.conforms && isValidSignature && content.conforms
    
        return {conforms, isValidSignature, content, shape}
      },
      [SelfDescriptionTypes.SERVICE_OFFERING]: async () => {
        console.log("Provided by verification has started")
        const participant_verif: ValidationResultDto = await this.validateProvidedByParticipantSelfDescriptions(selfDescription.credentialSubject.providedBy)
        const content = await serviceOfferingContentValidationService.validate(selfDescription.credentialSubject as ServiceOfferingSelfDescriptionDto, participant_verif)
        const conforms: boolean = shape.conforms && isValidSignature && content.conforms
        return {conforms, isValidSignature, content, shape}
      }
    }

    return (await validationFns[type]()) || undefined

  } catch(e) {
    throw(e)
  }

  }

  private async validateProvidedByParticipantSelfDescriptions(
    providedBy: ServiceOfferingSelfDescriptionDto['providedBy']
  ): Promise<ValidationResultDto> {
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

  private async ShapeVerification(selfDescription:VerifiableCredentialDto<CredentialSubjectDto>, rawCredentialSubject:string, type:string):Promise<ValidationResult> {
      try {
        const shapePath = await new Promise<string>((resolve,reject) =>{
          if (!(type in expectedContexts)) reject(new ConflictException('Provided Type is not supported'))
          if(!this.getShapePath(type)) {
            reject(new BadRequestException('Provided Type does not exist for Self Descriptions'))
          } else {
            resolve(this.getShapePath(type))
          }
        })
        const rawPrepared = {
          ...JSON.parse(rawCredentialSubject), 
          ...expectedContexts[type]
        }
        const selfDescriptionDataset: DatasetExt = await this.shaclService.loadFromJsonLD(JSON.stringify(rawPrepared))
        const shape: ValidationResult = await this.shaclService.validate(await this.getShaclShape(shapePath), selfDescriptionDataset)
        return shape
    
      } catch (e) {
        throw(e)
      }
  }
  
}

  