import { ApiBody, ApiExtraModels, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Body, ConflictException, Controller, HttpCode, HttpStatus, Post, Query } from '@nestjs/common'
import { ApiVerifyResponse } from '../common/decorators'
import { getApiVerifyBodySchema } from '../common/utils/api-verify-raw-body-schema.util'
import { SignedSelfDescriptionDto, ValidationResultDto, VerifiableCredentialDto } from '../common/dto'
import { ParticipantSelfDescriptionDto } from './dto'
import { SDParserPipe, JoiValidationPipe, BooleanQueryValidationPipe } from '../common/pipes'
import { vcSchema, VerifiablePresentationSchema } from '../common/schema/selfDescription.schema'
import { CredentialTypes, SelfDescriptionTypes } from '../common/enums'
import { ParticipantContentValidationService } from './services/content-validation.service'
import { SelfDescription2210vpService } from '../common/services'
import ParticipantVC from '../tests/fixtures/2010VP/sphereon-LegalPerson.json'
import { validationResultWithoutContent } from '../common/@types'
import SphereonParticipantVP from '../tests/fixtures/2010VP/sphereon-participant-vp.json'
import { VerifiablePresentationDto } from '../common/dto/presentation-meta.dto'
import { SsiTypesParserPipe } from '../common/pipes/ssi-types-parser.pipe'

const credentialType = CredentialTypes.participant
@ApiTags(credentialType)
@Controller({ path: 'participant' })
export class ParticipantController {
  constructor(
    private readonly selfDescriptionService: SelfDescription2210vpService,
    private readonly participantContentValidationService: ParticipantContentValidationService
  ) {}

  @ApiVerifyResponse(credentialType)
  @Post('onboard')
  @ApiOperation({ summary: 'Validate a Participant Self Description VP' })
  @ApiExtraModels(VerifiablePresentationDto)
  @ApiQuery({
    name: 'store',
    type: Boolean,
    description: 'Store Self Description for learning purposes for six months in the storage service',
    required: false
  })
  @ApiBody(
    getApiVerifyBodySchema('Participant', {
      service: { summary: 'Participant SD Example', value: SphereonParticipantVP }
    })
  )
  @HttpCode(HttpStatus.OK)
  async verifyParticipantVP(
    @Body(new JoiValidationPipe(VerifiablePresentationSchema), new SsiTypesParserPipe())
    signedSelfDescriptionDto: SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>,
    @Query('store', new BooleanQueryValidationPipe()) storeSD: boolean
  ): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.verifyAndStoreSignedParticipantVP(signedSelfDescriptionDto, storeSD)
    return validationResult
  }

  @ApiVerifyResponse(credentialType)
  @Post('validate/vc')
  @ApiOperation({ summary: 'Validate a Participant VerifiableCredential' })
  @ApiExtraModels(VerifiableCredentialDto)
  @ApiBody(
    getApiVerifyBodySchema('Participant', {
      service: { summary: 'Participant VC Example', value: ParticipantVC }
    })
  )
  @HttpCode(HttpStatus.OK)
  async validateParticipantVC(
    @Body(new JoiValidationPipe(vcSchema), new SsiTypesParserPipe())
    participantVC: ParticipantSelfDescriptionDto
  ): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.validateSignedParticipantVC(participantVC)
    return validationResult
  }

  private async verifyAndStoreSignedParticipantVP(
    participantSelfDescription: SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>,
    storeSD?: boolean
  ) {
    const result = await this.verifySignedParticipantVP(participantSelfDescription)
    if (result?.conforms && storeSD) result.storedSdUrl = await this.selfDescriptionService.storeSelfDescription(participantSelfDescription)

    return result
  }

  private async verifySignedParticipantVP(
    participantSelfDescription: SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>
  ): Promise<ValidationResultDto> {
    const validationResult = await this.selfDescriptionService.validate(participantSelfDescription)

    const content = await this.participantContentValidationService.validate(
      (participantSelfDescription.selfDescriptionCredential as VerifiableCredentialDto<ParticipantSelfDescriptionDto>).credentialSubject
    )
    validationResult.conforms = validationResult.conforms && content.conforms
    if (!validationResult.conforms)
      throw new ConflictException({ statusCode: HttpStatus.CONFLICT, message: { ...validationResult, content }, error: 'Conflict' })

    return { ...validationResult, content }
  }

  private async validateSignedParticipantVC(participantVC: ParticipantSelfDescriptionDto) {
    const validationResult: validationResultWithoutContent = await this.selfDescriptionService.validateVC(participantVC['selfDescriptionCredential'])
    const content = await this.participantContentValidationService.validate(participantVC['selfDescriptionCredential'].credentialSubject)
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
}
