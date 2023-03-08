import { ApiBody, ApiExtraModels, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Body, Controller, HttpStatus, Post, HttpCode, ConflictException, BadRequestException, Query } from '@nestjs/common'
import SphereonServiceOfferingVP from '../../test/datas/2010VP/sphereon-service-offering.json'
import { HttpService } from '@nestjs/axios'
import { SelfDescriptionService, ShaclService } from '../common/services'
import { ApiVerifyResponse } from '../common/decorators'
import {
  CredentialSubjectDto,
  Schema_caching,
  SignedSelfDescriptionDto,
  ValidationResult,
  ValidationResultDto,
  VerifiableCredentialDto,
  VerifiableSelfDescriptionDto
} from '../common/dto'
import { ServiceOfferingSelfDescriptionDto, VerifyServiceOfferingDto } from '../service-offering/dto'
import { getApiVerifyBodySchema } from '../common/utils'
import { BooleanQueryValidationPipe, JoiValidationPipe, SDParserPipe } from '../common/pipes'
import { SsiTypesParserPipe } from '../common/pipes/ssi-types-parser.pipe'
import { validationResultWithoutContent } from '../common/@types'
import { VerifiablePresentationDto } from '../common/dto/presentation-meta.dto'
import { vcSchema } from '../common/schema/ssi.schema'
import { CredentialTypes, SelfDescriptionTypes } from '../common/enums'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { EXPECTED_PARTICIPANT_CONTEXT_TYPE, EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE } from '../common/constants'
import { SelfDescription2210vpService } from '../common/services/selfDescription.2210vp.service'
import { ServiceOfferingContentValidation2210vpService } from './services/content-validation.2210vp.service'
import { Proof2210vpService } from '../common/services/proof.2210vp.service'
import { TypedVerifiableCredential, TypedVerifiablePresentation } from '../common/@types/SSI.types'
import { ServiceOfferingController } from './service-offering.controller'
import { ServiceOfferingContentValidationService } from './services/content-validation.service'

const credentialType = CredentialTypes.service_offering

const expectedContexts = {
  [SelfDescriptionTypes.PARTICIPANT]: EXPECTED_PARTICIPANT_CONTEXT_TYPE,
  [SelfDescriptionTypes.SERVICE_OFFERING]: EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE
}

const cache: Schema_caching = {
  LegalPerson: {},
  ServiceOfferingExperimental: {}
}

@ApiTags(credentialType)
@Controller({ path: '2210vp/service-offering' })
export class ServiceOfferingV2210vpController {
  constructor(
    private readonly httpService: HttpService,
    private readonly selfDescription2210vpService: SelfDescription2210vpService,
    private readonly serviceOfferingContentValidation2210vpService: ServiceOfferingContentValidation2210vpService,
    private readonly shaclService: ShaclService,
    private readonly proof2210vpService: Proof2210vpService,
    private readonly selfDescriptionService: SelfDescriptionService,
    private readonly serviceOfferingContentValidationService: ServiceOfferingContentValidationService
  ) {}

  @ApiVerifyResponse(credentialType)
  @Post('verify/raw')
  @ApiOperation({ summary: 'Validate a Service Offering Self Description' })
  @ApiExtraModels(VerifiableSelfDescriptionDto, VerifiableCredentialDto, ServiceOfferingSelfDescriptionDto)
  @ApiQuery({
    name: 'store',
    type: Boolean,
    description: 'Store Self Description for learning purposes for six months in the storage service',
    required: false
  })
  @ApiQuery({
    name: 'verifyParticipant',
    type: Boolean,
    required: false
  })
  @ApiBody(
    getApiVerifyBodySchema('ServiceOfferingExperimental', {
      service: { summary: 'Service Offering Experimental SD Example', value: SphereonServiceOfferingVP }
    })
  )
  @HttpCode(HttpStatus.OK)
  async verifyServiceOfferingVP(
    @Body() rawData: VerifiablePresentationDto | VerifiableSelfDescriptionDto<ServiceOfferingSelfDescriptionDto>,
    @Query('store', new BooleanQueryValidationPipe()) storeSD: boolean,
    @Query('verifyParticipant', new BooleanQueryValidationPipe()) verifyParticipant: boolean
  ): Promise<ValidationResultDto> {
    if (!rawData['type'] || !(rawData['type'] as string[]).includes('VerifiablePresentation')) {
      const sdParser = new SDParserPipe(SelfDescriptionTypes.SERVICE_OFFERING)
      const transformed: SignedSelfDescriptionDto<ServiceOfferingSelfDescriptionDto> = sdParser.transform(
        rawData as VerifiableSelfDescriptionDto<ServiceOfferingSelfDescriptionDto>
      ) as SignedSelfDescriptionDto<ServiceOfferingSelfDescriptionDto>
      return await new ServiceOfferingController(this.selfDescriptionService, this.serviceOfferingContentValidationService).verifyServiceOfferingRaw(
        transformed,
        storeSD,
        verifyParticipant
      )
    }
    const typedVerifiablePresentation = new SsiTypesParserPipe().transform(rawData as VerifiablePresentationDto) as TypedVerifiablePresentation
    return await this.verifyAndStoreSignedServiceOfferingVP(typedVerifiablePresentation, storeSD, verifyParticipant)
  }

  @ApiVerifyResponse(credentialType)
  @Post('verify')
  @ApiOperation({ summary: 'Validate a ServiceOffering Self Description VP via its URL' })
  @ApiExtraModels(VerifiablePresentationDto)
  @ApiBody({
    type: VerifyServiceOfferingDto
  })
  @ApiQuery({
    name: 'store',
    type: Boolean,
    description: 'Store Self Description for learning purposes for six months in the storage service',
    required: false
  })
  @ApiQuery({
    name: 'verifyParticipant',
    type: Boolean,
    required: false
  })
  @HttpCode(HttpStatus.OK)
  async verifyServiceOfferingUrl(
    @Body() verifyServiceOffering,
    @Query('store', new BooleanQueryValidationPipe()) storeSD: boolean,
    @Query('verifyParticipant', new BooleanQueryValidationPipe()) verifyParticipant: boolean
  ): Promise<ValidationResultDto> {
    const { url } = verifyServiceOffering
    let typesVerifiablePresentation: TypedVerifiablePresentation
    try {
      const response = await this.httpService.get(url, { transformResponse: r => r }).toPromise()
      const { data: rawData } = response
      const dataJson = JSON.parse(rawData)
      if (!dataJson['type'] || !(rawData['type'] as string[]).includes('VerifiablePresentation')) {
        const sdParser = new SDParserPipe(SelfDescriptionTypes.SERVICE_OFFERING)
        const transformed: SignedSelfDescriptionDto<ServiceOfferingSelfDescriptionDto> = sdParser.transform(
          dataJson
        ) as SignedSelfDescriptionDto<ServiceOfferingSelfDescriptionDto>
        return await new ServiceOfferingController(
          this.selfDescriptionService,
          this.serviceOfferingContentValidationService
        ).verifyServiceOfferingRaw(transformed, storeSD, verifyParticipant)
      }
      typesVerifiablePresentation = new SsiTypesParserPipe().transform(dataJson) as TypedVerifiablePresentation
    } catch (e) {
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        message: `Can't get the VerifiablePresentation from url: ${url}`,
        error: 'Conflict'
      })
    }

    return await this.verifyAndStoreSignedServiceOfferingVP(typesVerifiablePresentation, storeSD)
  }

  @ApiVerifyResponse(credentialType)
  @Post('validate/vc')
  @ApiOperation({ summary: 'Validate a Service Offering VerifiableCredential' })
  @ApiExtraModels(VerifiableCredentialDto)
  @ApiBody(
    getApiVerifyBodySchema('ServiceOfferingExperimental', {
      service: { summary: 'Service Offering VC Example', value: SphereonServiceOfferingVP.verifiableCredential[2] }
    })
  )
  @HttpCode(HttpStatus.OK)
  async validateServiceOfferingVC(
    @Body(new JoiValidationPipe(vcSchema), new SsiTypesParserPipe())
    typedVerifiableCredential: TypedVerifiableCredential
  ): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.validateSignedServiceOfferingVC(typedVerifiableCredential)
    return validationResult
  }

  private async verifySignedServiceOfferingVP(
    serviceOfferingSelfDescription: TypedVerifiablePresentation,
    verifyParticipant: boolean
  ): Promise<ValidationResultDto> {
    // TODO Use actual validate functions instead of a remote call
    const serviceOffering = SsiTypesParserPipe.getTypedVerifiableCredentialWithTypeAndIssuer(serviceOfferingSelfDescription, 'ServiceOffering')
    if (!serviceOffering) {
      throw new Error("Couldn't find a valid ServiceOffering")
    }
    // fixme: disabling this check because we have valid instances which don't have this property
    /*if (!serviceOffering.rawVerifiableCredential.credentialSubject.providedBy) {
      throw new Error("Couldn't find a valid the 'providedBy` field of the ServiceOffering")
    }*/
    if (verifyParticipant) {
      try {
        const httpService = new HttpService()
        await httpService
          .post('https://compliance.gaia-x.eu/v2206/api/participant/verify', {
            url: serviceOffering.rawVerifiableCredential.credentialSubject.providedBy
          })
          .toPromise()
      } catch (error) {
        console.error({ error })
        if (error.response.status == 409) {
          throw new ConflictException({
            statusCode: HttpStatus.CONFLICT,
            message: {
              ...error.response.data.message
            },
            error: 'Conflict'
          })
        }

        throw new BadRequestException('The provided url does not point to a valid Participant SD')
      }
    }

    const validationResult = await this.selfDescription2210vpService.validate(serviceOfferingSelfDescription)
    const content = await this.serviceOfferingContentValidation2210vpService.validate(
      //TODO: fix this later
      serviceOfferingSelfDescription,
      {
        conforms: true,
        shape: { conforms: true, results: [] },
        content: { conforms: true, results: [] },
        isValidSignature: true
      }
    )

    if (!validationResult.conforms)
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        message: {
          ...validationResult,
          content
        },
        error: 'Conflict'
      })

    return {
      ...validationResult,
      content
    } as ValidationResultDto
  }

  private async validateSignedServiceOfferingVC(typedServiceOfferingVC: TypedVerifiableCredential): Promise<ValidationResultDto> {
    const validationResult: validationResultWithoutContent = await this.selfDescription2210vpService.validateVC(
      typedServiceOfferingVC.rawVerifiableCredential
    )
    const content = await this.serviceOfferingContentValidation2210vpService.validateServiceOfferingCredentialSubject(
      typedServiceOfferingVC.rawVerifiableCredential
    )

    if (!validationResult.conforms)
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        message: {
          ...validationResult,
          content
        },
        error: 'Conflict'
      })

    return {
      ...validationResult,
      content
    }
  }

  private async verifyAndStoreSignedServiceOfferingVP(
    serviceOfferingSelfDescription: TypedVerifiablePresentation,
    storeSD?: boolean,
    verifyParticipant?: boolean
  ) {
    const serviceOfferingVerifiablePresentation = serviceOfferingSelfDescription.originalVerifiablePresentation
    const result = await this.verifySignedServiceOfferingVP(serviceOfferingSelfDescription, verifyParticipant)
    if (result?.conforms && storeSD) {
      result.storedSdUrl = await this.selfDescription2210vpService.storeSelfDescription(
        serviceOfferingVerifiablePresentation as VerifiablePresentationDto
      )
    }
    return result
  }

  private async ShapeVerification(
    selfDescription: VerifiableCredentialDto<CredentialSubjectDto>,
    rawCredentialSubject: string,
    type: string
  ): Promise<ValidationResult> {
    try {
      const rawPrepared = {
        ...JSON.parse(rawCredentialSubject),
        ...expectedContexts[type]
      }
      const selfDescriptionDataset: DatasetExt = await this.shaclService.loadFromJsonLD(JSON.stringify(rawPrepared))
      if (this.Cache_check(type) == true) {
        const shape: ValidationResult = await this.shaclService.validate(cache[type].shape, selfDescriptionDataset)
        return shape
      } else {
        const shapePath = await new Promise<string>((resolve, reject) => {
          if (!(type in expectedContexts)) reject(new ConflictException('Provided Type is not supported'))
          if (!this.shaclService.getShapePath(type)) {
            reject(new BadRequestException('Provided Type does not exist for Self Descriptions'))
          } else {
            resolve(this.shaclService.getShapePath(type))
          }
        })
        const schema = await this.getShaclShape(shapePath)
        cache[type].shape = schema
        const shape: ValidationResult = await this.shaclService.validate(schema, selfDescriptionDataset)
        return shape
      }
    } catch (e) {
      throw e
    }
  }

  public async getShaclShape(shapePath: string): Promise<DatasetExt> {
    //fixme: since gaia-x registry is down, I'm changing this fallback url
    return await this.shaclService.loadFromUrl(`${process.env.REGISTRY_URL || 'http://20.76.5.229'}${shapePath}`)
  }

  private Cache_check(type: string): boolean {
    let cached = false
    if (cache[type].shape) {
      cached = true
    }
    return cached
  }
}
