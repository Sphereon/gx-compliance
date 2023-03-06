import { ApiBody, ApiExtraModels, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger'
import {
  Body,
  Controller,
  HttpStatus,
  Post,
  HttpCode,
  ConflictException,
  BadRequestException,
  Query,
  InternalServerErrorException,
  Get,
  Param
} from '@nestjs/common'
import { SelfDescriptionService } from '../common/services'
import { SignedSelfDescriptionDto, ValidationResultDto, VerifiableCredentialDto, VerifiableSelfDescriptionDto } from '../common/dto'
import { VerifyServiceOfferingDto, ServiceOfferingSelfDescriptionDto } from './dto'
import { ApiVerifyResponse } from '../common/decorators'
import { getApiVerifyBodySchema } from '../common/utils/api-verify-raw-body-schema.util'
import { SignedSelfDescriptionSchema, VerifySdSchema } from '../common/schema/selfDescription.schema'
import ServiceOfferingExperimentalSD from '../tests/fixtures/service-offering-sd.json'
import { CredentialTypes } from '../common/enums'
import { UrlSDParserPipe, SDParserPipe, JoiValidationPipe, BooleanQueryValidationPipe } from '../common/pipes'
import { SelfDescriptionTypes } from '../common/enums'
import { HttpService } from '@nestjs/axios'
import { ServiceOfferingContentValidationService } from './services/content-validation.service'

const credentialType = CredentialTypes.service_offering
@ApiTags(credentialType)
@Controller({ path: '/api/service-offering' })
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

  @Get('/:functionName')
  @ApiOperation({ summary: 'Test a compliance rule', description: 'For more details on using this API route please see: https://gitlab.com/gaia-x/lab/compliance/gx-compliance/-/tree/dev#api-endpoint-with-dynamic-routes' })
  async callFunction(@Param('functionName') functionName: string, @Body() body: any) {
    return this.serviceOfferingContentValidationService[functionName](body);
  }

  private async verifySignedServiceOfferingSD(
    serviceOfferingSelfDescription: SignedSelfDescriptionDto<ServiceOfferingSelfDescriptionDto>,
    verifyParticipant = true
  ): Promise<ValidationResultDto> {
    try {
      const validationResult: ValidationResultDto = await this.selfDescriptionService.verify(serviceOfferingSelfDescription)
      if (!validationResult.conforms) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          message: {
            ...validationResult
          },
          error: 'Conflict'
        })
      }
      return validationResult
    } catch (error) {
      if (error.status == 409) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          message: error.response.message,
          error: 'Conflict'
        })
      } else {
        throw new InternalServerErrorException()
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
