import { ApiBody, ApiExtraModels, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Body, Controller, HttpStatus, Post, HttpCode, ConflictException, BadRequestException, Query } from '@nestjs/common'
import { SelfDescriptionService } from '../../methods/common'
import { SignedSelfDescriptionDto, ValidationResultDto, VerifiableCredentialDto, VerifiableSelfDescriptionDto } from '../../@types/dto/common'
import { VerifyServiceOfferingDto, ServiceOfferingSelfDescriptionDto } from '../../@types/dto/service-offering'
import { ApiVerifyResponse } from '../../utils/decorators'
import { getApiVerifyBodySchema } from '../../utils/methods/api-verify-raw-body-schema.util'
import { SignedSelfDescriptionSchema, VerifySdSchema } from '../../utils/schema/selfDescription.schema'
import ServiceOfferingExperimentalSD from '../../tests/fixtures/service-offering-sd.json'
import { CredentialTypes } from '../../@types/enums'
import { UrlSDParserPipe, SDParserPipe, JoiValidationPipe, BooleanQueryValidationPipe } from '../../utils//pipes'
import { SelfDescriptionTypes } from '../../@types/enums'
import { HttpService } from '@nestjs/axios'
import { validationResultWithoutContent } from '../../@types/type'
import { ServiceOfferingContentValidationService } from '../../methods/service-offering/content-validation.service'

const credentialType = CredentialTypes.service_offering
@ApiTags(credentialType)
@Controller({ path: 'service-offering' })
export class ServiceOfferingController {
  constructor(
    private readonly selfDescriptionService: SelfDescriptionService,
    private readonly serviceOfferingContentValidationService: ServiceOfferingContentValidationService
  ) {}
  @ApiVerifyResponse(credentialType)
  @Post('verify')
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
  @ApiBody({
    type: VerifyServiceOfferingDto
  })
  @ApiOperation({ summary: 'Validate a Service Offering Self Description from a URL' })
  @HttpCode(HttpStatus.OK)
  async verifyServiceOffering(
    @Body(new JoiValidationPipe(VerifySdSchema), new UrlSDParserPipe(SelfDescriptionTypes.SERVICE_OFFERING, new HttpService()))
    serviceOfferingSelfDescription: SignedSelfDescriptionDto<ServiceOfferingSelfDescriptionDto>,
    @Query('store', new BooleanQueryValidationPipe()) storeSD: boolean,
    @Query('verifyParticipant', new BooleanQueryValidationPipe(true)) verifyParticipant: boolean
  ): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.verifyAndStoreSignedServiceOfferingSD(
      serviceOfferingSelfDescription,
      storeSD,
      verifyParticipant
    )

    return validationResult
  }

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
    getApiVerifyBodySchema(SelfDescriptionTypes.SERVICE_OFFERING, {
      service: { summary: 'Service Offering Experimental SD Example', value: ServiceOfferingExperimentalSD }
    })
  )
  @HttpCode(HttpStatus.OK)
  async verifyServiceOfferingRaw(
    @Body(new JoiValidationPipe(SignedSelfDescriptionSchema), new SDParserPipe(SelfDescriptionTypes.SERVICE_OFFERING))
    serviceOfferingSelfDescription: SignedSelfDescriptionDto<ServiceOfferingSelfDescriptionDto>,
    @Query('store', new BooleanQueryValidationPipe()) storeSD: boolean,
    @Query('verifyParticipant', new BooleanQueryValidationPipe(true)) verifyParticipant: boolean
  ): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.verifyAndStoreSignedServiceOfferingSD(
      serviceOfferingSelfDescription,
      storeSD,
      verifyParticipant
    )
    return validationResult
  }

  private async verifySignedServiceOfferingSD(
    serviceOfferingSelfDescription: SignedSelfDescriptionDto<ServiceOfferingSelfDescriptionDto>,
    verifyParticipant = true
  ): Promise<ValidationResultDto> {
    if (verifyParticipant) {
      try {
        const validationResult: ValidationResultDto = await this.selfDescriptionService.validate(serviceOfferingSelfDescription)
        if (!validationResult.conforms)
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          message: {
            ...validationResult,
          },
          error: 'Conflict'
        })
      return validationResult
      
      } catch (error) {
        if (error.status == 409) {
          throw new ConflictException({
            statusCode: HttpStatus.CONFLICT,
            message: error.response.message,
            error: 'Conflict'
          })
        }
      }
    }
  }

  private async verifyAndStoreSignedServiceOfferingSD(
    serviceOfferingSelfDescription: SignedSelfDescriptionDto<ServiceOfferingSelfDescriptionDto>,
    storeSD?: boolean,
    verifyParticipant?: boolean
  ) {
    const result = await this.verifySignedServiceOfferingSD(serviceOfferingSelfDescription, verifyParticipant)
    if (result?.conforms && storeSD) result.storedSdUrl = await this.selfDescriptionService.storeSelfDescription(serviceOfferingSelfDescription)
    return result
  }
}
