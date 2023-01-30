import { ApiBody, ApiExtraModels, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Body, ConflictException, Controller, HttpCode, HttpStatus, Post, Query } from '@nestjs/common'
import { ApiVerifyResponse } from '../../utils/decorators'
import { getApiVerifyBodySchema } from '../../utils/methods/api-verify-raw-body-schema.util'
import { SignedSelfDescriptionDto, ValidationResultDto, VerifiableCredentialDto, VerifiableSelfDescriptionDto } from '../../@types/dto/common'
import { VerifyParticipantDto, ParticipantSelfDescriptionDto } from '../../@types/dto/participant'
import { UrlSDParserPipe, SDParserPipe, JoiValidationPipe, BooleanQueryValidationPipe } from '../../utils/pipes'
import { SignedSelfDescriptionSchema, VerifySdSchema } from '../../utils/schema/selfDescription.schema'
import ParticipantSD from '../../tests/fixtures/participant-sd.json'
import { CredentialTypes, SelfDescriptionTypes } from '../../@types/enums'
import { HttpService } from '@nestjs/axios'

import { SelfDescriptionService } from '../../methods/common'

const credentialType = CredentialTypes.participant
@ApiTags(credentialType)
@Controller({ path: 'participant' })
export class ParticipantController {
  constructor(
    private readonly selfDescriptionService: SelfDescriptionService,
  ) {}

  @ApiVerifyResponse(credentialType)
  @Post('verify')
  @ApiQuery({
    name: 'store',
    type: Boolean,
    description: 'Store Self Description for learning purposes for six months in the storage service',
    required: false
  })
  @ApiBody({
    type: VerifyParticipantDto
  })
  @ApiOperation({ summary: 'Validate a Participant Self Description from a URL' })
  @HttpCode(HttpStatus.OK)
  async verifyParticipant(
    @Body(new JoiValidationPipe(VerifySdSchema), new UrlSDParserPipe(SelfDescriptionTypes.PARTICIPANT, new HttpService()))
    participantSelfDescription: SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>,
    @Query('store', new BooleanQueryValidationPipe()) storeSD: boolean
  ): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.verifyAndStoreSignedParticipantSD(participantSelfDescription, storeSD)
    return validationResult
  }

  @ApiVerifyResponse(credentialType)
  @Post('verify/raw')
  @ApiOperation({ summary: 'Validate a Participant Self Description' })
  @ApiExtraModels(VerifiableSelfDescriptionDto, VerifiableCredentialDto, ParticipantSelfDescriptionDto)
  @ApiQuery({
    name: 'store',
    type: Boolean,
    description: 'Store Self Description for learning purposes for six months in the storage service',
    required: false
  })
  @ApiBody(
    getApiVerifyBodySchema('Participant', {
      service: { summary: 'Participant SD Example', value: ParticipantSD }
    })
  )
  @HttpCode(HttpStatus.OK)
  async verifyParticipantRaw(
    @Body(new JoiValidationPipe(SignedSelfDescriptionSchema), new SDParserPipe(SelfDescriptionTypes.PARTICIPANT))
    participantSelfDescription: SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>,
    @Query('store', new BooleanQueryValidationPipe()) storeSD: boolean
  ): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.verifyAndStoreSignedParticipantSD(participantSelfDescription, storeSD)
    return validationResult
  }

  private async verifySignedParticipantSD(
    participantSelfDescription: SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>
  ): Promise<ValidationResultDto> {
    const is_valid = await this.selfDescriptionService.validate(participantSelfDescription)

    if (!is_valid.conforms)
      throw new ConflictException({ statusCode: HttpStatus.CONFLICT, message: { ...is_valid }, error: 'Conflict' })

    return is_valid
  }

  private async verifyAndStoreSignedParticipantSD(
    participantSelfDescription: SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>,
    storeSD?: boolean
  ) {
    const result = await this.verifySignedParticipantSD(participantSelfDescription)
    if (result?.conforms && storeSD) result.storedSdUrl = await this.selfDescriptionService.storeSelfDescription(participantSelfDescription)

    return result
  }
}
