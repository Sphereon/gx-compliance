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
  Schema_caching,
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
import { RegistryService } from './registry.service'
const expectedContexts = {
  [SelfDescriptionTypes.PARTICIPANT]: EXPECTED_PARTICIPANT_CONTEXT_TYPE,
  [SelfDescriptionTypes.SERVICE_OFFERING]: EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE
}


let cache: Schema_caching = {
  LegalPerson:{

  },
  ServiceOfferingExperimental:{

  }
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
    let serviceOfferingContentValidationService = new ServiceOfferingContentValidationService(this.proofService, this.httpService)
    const { selfDescriptionCredential: selfDescription, raw, rawCredentialSubject, complianceCredential, proof } = signedSelfDescription
    const type: string = selfDescription.type.find(t => t !== 'VerifiableCredential')
    const shape:ValidationResult = await this.ShapeVerification(selfDescription,rawCredentialSubject,type)
    const parsedRaw = JSON.parse(raw)
    const isValidSignature: boolean = await this.checkParticipantCredential({ selfDescription: parsedRaw, proof: complianceCredential?.proof },proof?.jws )
    //const isValidSignature = true //test-purpose
    const validationFns: { [key: string]: () => Promise<ValidationResultDto> } = {
      [SelfDescriptionTypes.PARTICIPANT]: async () =>  {
        const content:ValidationResult = await participantContentValidationService.validate(selfDescription.credentialSubject as ParticipantSelfDescriptionDto)
        const conforms: boolean = shape.conforms && isValidSignature && content.conforms
    
        return {conforms, isValidSignature, content, shape}
      },
      [SelfDescriptionTypes.SERVICE_OFFERING]: async () => {
        const get_SD:SignedSelfDescriptionDto<ParticipantSelfDescriptionDto> = await new Promise(async(resolve, reject) => 
        {
          try  {
            const response = await this.httpService.get(selfDescription.credentialSubject.providedBy).toPromise()
            const { data } = response
            const participantSD = new SDParserPipe(SelfDescriptionTypes.PARTICIPANT).transform(data)
            resolve(participantSD as SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>)
          } catch(e) {
            reject(new ConflictException("Participant SD not found"))
          }
        })
        const participant_verif = await this.validate(get_SD)
        const content = await serviceOfferingContentValidationService.validate(signedSelfDescription as SignedSelfDescriptionDto<ServiceOfferingSelfDescriptionDto>, get_SD as SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>, participant_verif)
        const conforms: boolean = shape.conforms && isValidSignature && content.conforms
        return {conforms, isValidSignature, content, shape}
      }
    }
    return (await validationFns[type]()) || undefined

  } catch(e) {
    throw(e)
  }

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
        const rawPrepared = {
          ...JSON.parse(rawCredentialSubject), 
          ...expectedContexts[type]
        }
        const selfDescriptionDataset: DatasetExt = await this.shaclService.loadFromJsonLD(JSON.stringify(rawPrepared))
        if(this.Cache_check(type) == true) {
          const shape: ValidationResult = await this.shaclService.validate(cache[type].shape, selfDescriptionDataset)
          return shape
        } else {
          const shapePath = await new Promise<string>((resolve,reject) =>{
            if (!(type in expectedContexts)) reject(new ConflictException('Provided Type is not supported'))
            if(!this.getShapePath(type)) {
              reject(new BadRequestException('Provided Type does not exist for Self Descriptions'))
            } else {
              resolve(this.getShapePath(type))
            }
          })
          let schema = await this.getShaclShape(shapePath)
          cache[type].shape = schema
          const shape: ValidationResult = await this.shaclService.validate(schema, selfDescriptionDataset)
          return shape
        }
      } catch (e) {
        throw(e)
      }
  }

  private Cache_check(type:string):boolean {
    let cached = false
    if(cache[type].shape) {
      cached = true
    } 
    return cached
  }
  
}

  