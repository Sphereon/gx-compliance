import { ApiBody, ApiExtraModels, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Body, Controller, HttpStatus, Post, HttpCode, ConflictException, BadRequestException, Query } from '@nestjs/common'
import ServiceOfferingVC from '../../tests/fixtures/2010VP/sphereon-service-offering-vc.json'
import SphereonServiceOfferingVP from '../../tests/fixtures/2010VP/sphereon-service-offering.json'
import { HttpService } from '@nestjs/axios'
import { RegistryService, SelfDescriptionService, ShaclService } from '../../methods/common'
import { ServiceOfferingContentValidationService } from '../../methods/service-offering/content-validation.service'
import { ApiVerifyResponse } from '../../utils/decorators'
import {
  CredentialSubjectDto,
  Schema_caching,
  SignedSelfDescriptionDto,
  ValidationResult,
  ValidationResultDto,
  VerifiableCredentialDto,
  VerifiableSelfDescriptionDto
} from '../../@types/dto/common'
import { ServiceOfferingSelfDescriptionDto } from '../../@types/dto/service-offering'
import { getApiVerifyBodySchema } from '../../utils/methods'
import { BooleanQueryValidationPipe, JoiValidationPipe, SDParserPipe } from '../../utils/pipes'
import { SignedSelfDescriptionSchema } from '../../utils/schema/selfDescription.schema'
import { SsiTypesParserPipe } from '../../utils/pipes/ssi-types-parser.pipe'
import { validationResultWithoutContent } from '../../@types/type'
import { VerifiablePresentationDto } from '../../@types/dto/common/presentation-meta.dto'
import { vcSchema, VerifiablePresentationSchema } from '../../utils/schema/ssi.schema'
import { ParticipantSelfDescriptionDto } from '../../@types/dto/participant'
import { CredentialTypes, SelfDescriptionTypes } from '../../@types/enums'
import { ParticipantContentValidationService } from '../../methods/participant/content-validation.service'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { EXPECTED_PARTICIPANT_CONTEXT_TYPE, EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE } from '../../@types/constants'
import { SelfDescription2210vpService } from '../../methods/common/selfDescription.2210vp.service'
import { ServiceOfferingContentValidation2210vpService } from '../../methods/service-offering/content-validation.2210vp.service'
import { Proof2210vpService } from '../../methods/common/proof.2210vp.service'
import { IVerifiableCredential, TypedVerifiableCredential, TypedVerifiablePresentation } from '../../@types/type/SSI.types'

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
    private readonly selfDescriptionService: SelfDescription2210vpService,
    private readonly serviceOfferingContentValidationService: ServiceOfferingContentValidation2210vpService,
    private readonly shaclService: ShaclService,
    private readonly proofService: Proof2210vpService
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
    @Body(new JoiValidationPipe(VerifiablePresentationSchema), new SsiTypesParserPipe())
    typedVerifiablePresentation: TypedVerifiablePresentation,
    @Query('store', new BooleanQueryValidationPipe()) storeSD: boolean,
    @Query('verifyParticipant', new BooleanQueryValidationPipe()) verifyParticipant: boolean
  ): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.verifyAndStoreSignedServiceOfferingVP(
      typedVerifiablePresentation,
      storeSD,
      verifyParticipant
    )
    return validationResult
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

    const validationResult: validationResultWithoutContent = await this.selfDescriptionService.validate(serviceOfferingSelfDescription)
    const content = await this.serviceOfferingContentValidationService.validate(
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
    }
  }

  private async validateSignedServiceOfferingVC(typedServiceOfferingVC: TypedVerifiableCredential): Promise<ValidationResultDto> {
    const validationResult: validationResultWithoutContent = await this.selfDescriptionService.validateVC(
      typedServiceOfferingVC.rawVerifiableCredential
    )
    const content = await this.serviceOfferingContentValidationService.validateServiceOfferingCredentialSubject(
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
      result.storedSdUrl = await this.selfDescriptionService.storeSelfDescription(serviceOfferingVerifiablePresentation as VerifiablePresentationDto)
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
          if (!this.getShapePath(type)) {
            reject(new BadRequestException('Provided Type does not exist for Self Descriptions'))
          } else {
            resolve(this.getShapePath(type))
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
    return await this.shaclService.loadFromUrl(`${process.env.REGISTRY_URL || 'https://registry.gaia-x.eu'}${shapePath}`)
  }

  private getShapePath(type: string): string | undefined {
    const shapePathType = {
      [SelfDescriptionTypes.PARTICIPANT]: 'PARTICIPANT',
      [SelfDescriptionTypes.SERVICE_OFFERING]: 'SERVICE_OFFERING'
    }

    return SelfDescriptionService.SHAPE_PATHS[shapePathType[type]] || undefined
  }

  private Cache_check(type: string): boolean {
    let cached = false
    if (cache[type].shape) {
      cached = true
    }
    return cached
  }
}
