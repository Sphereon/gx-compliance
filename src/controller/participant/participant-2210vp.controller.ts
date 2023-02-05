import { ApiBody, ApiExtraModels, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Body, ConflictException, Controller, HttpCode, HttpStatus, Post, Query } from '@nestjs/common'
import { ApiVerifyResponse } from '../../utils/decorators'
import { getApiVerifyBodySchema } from '../../utils/methods'
import { SignedSelfDescriptionDto, ValidationResultDto, VerifiableCredentialDto } from '../../@types/dto/common'
import { ParticipantSelfDescriptionDto } from '../../@types/dto/participant'
import { JoiValidationPipe, BooleanQueryValidationPipe } from '../../utils/pipes'
import { vcSchema, VerifiablePresentationSchema } from '../../utils/schema/ssi.schema'
import { CredentialTypes } from '../../@types/enums'
import { ParticipantContentValidationService } from '../../methods/participant/content-validation.service'
import { SelfDescription2210vpService } from '../../methods/common/selfDescription.2210vp.service'
import ParticipantVC from '../../tests/fixtures/2010VP/sphereon-LegalPerson.json'
import { validationResultWithoutContent } from '../../@types/type'
import SphereonParticipantVP from '../../tests/fixtures/2010VP/sphereon-participant-vp.json'
import { VerifiablePresentationDto } from '../../@types/dto/common/presentation-meta.dto'
import { SsiTypesParserPipe } from '../../utils/pipes/ssi-types-parser.pipe'
import { IVerifiableCredential, WrappedVerifiableCredential } from '../../@types/type/SSI.types'

const credentialType = CredentialTypes.participant
@ApiTags(credentialType)
@Controller({ path: '2210vp/participant' })
export class Participant2210vpController {
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
    participantVC: WrappedVerifiableCredential
  ): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.validateSignedParticipantVC(JSON.parse(participantVC.raw))
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

  private async validateSignedParticipantVC(participantVC: IVerifiableCredential) {
    const validationResult: validationResultWithoutContent = await this.selfDescriptionService.validateVC(participantVC)
    //fixme validate should recieve the credentialSubject
    const content = await this.participantContentValidationService.validate(
      participantVC.credentialSubject as unknown as ParticipantSelfDescriptionDto
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
}
