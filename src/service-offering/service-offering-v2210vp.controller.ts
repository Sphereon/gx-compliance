import { ApiBody, ApiExtraModels, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Body, Controller, HttpStatus, Post, HttpCode, ConflictException, BadRequestException, Query } from '@nestjs/common'
import { SelfDescription2210vpService } from '../common/services'
import { ValidationResultDto, VerifiableCredentialDto, VerifiableSelfDescriptionDto } from '../common/dto'
import { ServiceOfferingSelfDescriptionDto } from './dto'
import { ApiVerifyResponse } from '../common/decorators'
import { getApiVerifyBodySchema } from '../common/utils/api-verify-raw-body-schema.util'
import { SignedSelfDescriptionSchema } from '../common/schema/selfDescription.schema'
import { vcSchema } from '../common/schema/ssi.schema'
import ServiceOfferingVC from '../tests/fixtures/2010VP/sphereon-service-offering-vc.json'
import SphereonServiceOfferingVP from '../tests/fixtures/2010VP/sphereon-service-offering.json'
import { CredentialTypes } from '../common/enums'
import { JoiValidationPipe, BooleanQueryValidationPipe } from '../common/pipes'
import { HttpService } from '@nestjs/axios'
import { validationResultWithoutContent } from '../common/@types'
import { ServiceOfferingContentValidationService } from './services/content-validation.service'
import { VerifiablePresentationDto } from '../common/dto/presentation-meta.dto'
import { SsiTypesParserPipe } from '../common/pipes/ssi-types-parser.pipe'

const credentialType = CredentialTypes.service_offering
@ApiTags(credentialType)
@Controller({ path: 'service-offering' })
export class ServiceOfferingController {
  constructor(
    private readonly selfDescriptionService: SelfDescription2210vpService,
    private readonly serviceOfferingContentValidationService: ServiceOfferingContentValidationService
  ) {}

  @ApiVerifyResponse(credentialType)
  @Post('onboard')
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
    @Body(new JoiValidationPipe(SignedSelfDescriptionSchema), new SsiTypesParserPipe())
    serviceOfferingSelfDescription: VerifiablePresentationDto,
    @Query('store', new BooleanQueryValidationPipe()) storeSD: boolean,
    @Query('verifyParticipant', new BooleanQueryValidationPipe(true)) verifyParticipant: boolean
  ): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.verifyAndStoreSignedServiceOfferingVP(
      serviceOfferingSelfDescription,
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
      service: { summary: 'Service Offering VC Example', value: ServiceOfferingVC }
    })
  )
  @HttpCode(HttpStatus.OK)
  async validateServiceOfferingVC(
    @Body(new JoiValidationPipe(vcSchema), new SsiTypesParserPipe())
    serviceOfferingVC: ServiceOfferingSelfDescriptionDto
  ): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.validateSignedServiceOfferingVC(serviceOfferingVC)
    return validationResult
  }

  private async verifySignedServiceOfferingVP(
    serviceOfferingSelfDescription: VerifiablePresentationDto,
    verifyParticipant = true
  ): Promise<ValidationResultDto> {
    // TODO Use actual validate functions instead of a remote call
    if (verifyParticipant) {
      try {
        const httpService = new HttpService()
        for (const vc1 of serviceOfferingSelfDescription.verifiableCredential.filter(vc => vc.type.indexOf('ServiceOfferingExperimental') != -1)) {
          await httpService
            .post('https://compliance.gaia-x.eu/v2206/api/participant/verify', {
              url: vc1.credentialSubject.providedBy
            })
            .toPromise()
        }
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

    const validationResult: validationResultWithoutContent = await this.selfDescriptionService.validateVP(serviceOfferingSelfDescription)
    const serviceOfferingVC = serviceOfferingSelfDescription.verifiableCredential.filter(vc => vc.type.indexOf('ServiceOfferingExperimental'))[0]
    const content = await this.serviceOfferingContentValidationService.validate(
      //TODO: fix this later
      serviceOfferingVC.credentialSubject as unknown as ServiceOfferingSelfDescriptionDto,
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
  private async validateSignedServiceOfferingVC(serviceOfferingVC: ServiceOfferingSelfDescriptionDto): Promise<ValidationResultDto> {
    const validationResult: validationResultWithoutContent = await this.selfDescriptionService.validateVC(serviceOfferingVC)
    const content = await this.serviceOfferingContentValidationService.validate(serviceOfferingVC['selfDescriptionCredential'].credentialSubject, {
      conforms: true,
      shape: { conforms: true, results: [] },
      content: { conforms: true, results: [] },
      isValidSignature: true
    })

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
    serviceOfferingSelfDescription: VerifiablePresentationDto,
    storeSD?: boolean,
    verifyParticipant?: boolean
  ) {
    const result = await this.verifySignedServiceOfferingVP(serviceOfferingSelfDescription, verifyParticipant)
    if (result?.conforms && storeSD) result.storedSdUrl = await this.selfDescriptionService.storeSelfDescription(serviceOfferingSelfDescription)
    return result
  }
}
