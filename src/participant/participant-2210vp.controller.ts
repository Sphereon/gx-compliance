import { ApiBody, ApiExtraModels, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Body, ConflictException, Controller, HttpCode, HttpStatus, Post, Query } from '@nestjs/common'
import { ApiVerifyResponse } from '../common/decorators'
import { getApiVerifyBodySchema } from '../common/utils'
import {
  CredentialSubjectDto,
  SignedSelfDescriptionDto,
  ValidationResultDto,
  VerifiableCredentialDto,
  VerifiableSelfDescriptionDto
} from '../common/dto'
import { JoiValidationPipe, BooleanQueryValidationPipe, SDParserPipe } from '../common/pipes'
import { vcSchema, VerifiablePresentationSchema } from '../common/schema/ssi.schema'
import { CredentialTypes } from '../common/enums'
import { SelfDescription2210vpService } from '../common/services/selfDescription.2210vp.service'
import ParticipantVC from '../../test/datas/2010VP/sphereon-LegalPerson.json'
import { validationResultWithoutContent } from '../common/@types'
import SphereonParticipantVP from '../../test/datas/2010VP/sphereon-participant-vp.json'
import { VerifiablePresentationDto } from '../common/dto/presentation-meta.dto'
import { SsiTypesParserPipe } from '../common/pipes/ssi-types-parser.pipe'
import { IVerifiableCredential, TypedVerifiableCredential, TypedVerifiablePresentation } from '../common/@types/SSI.types'
import { ParticipantContentValidationV2210vpService } from './services/content-validation-v2210vp.service'
import { ParticipantSelfDescriptionV2210vpDto } from './dto/participant-sd-v2210vp.dto'
import { HttpService } from '@nestjs/axios'
import { ParticipantController } from './participant.controller'
import {ParticipantSelfDescriptionDto, VerifyParticipantDto} from "./dto";

const credentialType = CredentialTypes.participant
@ApiTags(credentialType)
@Controller({ path: '2210vp/participant' })
export class Participant2210vpController {
  constructor(
    private readonly selfDescriptionService: SelfDescription2210vpService,
    private readonly participantContentValidationService: ParticipantContentValidationV2210vpService,
    private readonly httpService: HttpService,
    private readonly gxParticipantController: ParticipantController
  ) {}

  @ApiVerifyResponse(credentialType)
  @Post('verify/raw')
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
    @Body(new JoiValidationPipe(VerifiablePresentationSchema))
    rawData: VerifiablePresentationDto | VerifiableSelfDescriptionDto<ParticipantSelfDescriptionDto>,
    @Query('store', new BooleanQueryValidationPipe()) storeSD: boolean
  ): Promise<ValidationResultDto> {
    if (!rawData['type'] || !(rawData['type'] as string[]).includes('VerifiablePresentation')) {
      const sdParser = new SDParserPipe('LegalPerson')
      const transformed: SignedSelfDescriptionDto<ParticipantSelfDescriptionDto> = sdParser.transform(
        rawData as VerifiableSelfDescriptionDto<CredentialSubjectDto>
      ) as SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>
      return await this.gxParticipantController.verifyParticipantRaw(transformed, storeSD)
    }
    const typedVerifiablePresentation = new SsiTypesParserPipe().transform(rawData as VerifiablePresentationDto) as TypedVerifiablePresentation
    return await this.verifyAndStoreSignedParticipantVP(typedVerifiablePresentation, storeSD)
  }

  @ApiVerifyResponse(credentialType)
  @Post('verify')
  @ApiOperation({ summary: 'Validate a Participant Self Description VP via its URL' })
  @ApiExtraModels(VerifiablePresentationDto)
  @ApiBody({
    type: VerifyParticipantDto
  })
  @ApiQuery({
    name: 'store',
    type: Boolean,
    description: 'Store Self Description for learning purposes for six months in the storage service',
    required: false
  })
  @HttpCode(HttpStatus.OK)
  async verifyParticipantUrl(
    @Body() verifyParticipant,
    @Query('store', new BooleanQueryValidationPipe()) storeSD: boolean
  ): Promise<ValidationResultDto> {
    const { url } = verifyParticipant
    let typesVerifiablePresentation: TypedVerifiablePresentation
    try {
      const response = await this.httpService.get(url, { transformResponse: r => r }).toPromise()
      const { data: rawData } = response
      const dataJson = JSON.parse(rawData)
      if (!dataJson['type'] || !(dataJson['type'] as string[]).includes('VerifiablePresentation')) {
        const sdParser = new SDParserPipe('LegalPerson')
        const transformed: SignedSelfDescriptionDto<ParticipantSelfDescriptionDto> = sdParser.transform(
          dataJson
        ) as SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>
        return await this.gxParticipantController.verifyParticipantRaw(transformed, storeSD)
      }
      typesVerifiablePresentation = new SsiTypesParserPipe().transform(dataJson) as TypedVerifiablePresentation
    } catch (e) {
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        message: `Can't get the VerifiablePresentation from url: ${url}`,
        error: 'Conflict'
      })
    }

    return await this.verifyAndStoreSignedParticipantVP(typesVerifiablePresentation, storeSD)
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
    participantVC: TypedVerifiableCredential
  ): Promise<ValidationResultDto> {
    const validationResult: ValidationResultDto = await this.validateSignedParticipantVC(participantVC.rawVerifiableCredential)
    return validationResult
  }

  private async verifyAndStoreSignedParticipantVP(typedVerifiablePresentation: TypedVerifiablePresentation, storeSD?: boolean) {
    const result = await this.verifySignedParticipantVP(typedVerifiablePresentation)
    if (result?.conforms && storeSD) {
      result.storedSdUrl = await this.selfDescriptionService.storeSelfDescription(
        typedVerifiablePresentation.originalVerifiablePresentation as VerifiablePresentationDto
      )
    }

    return result
  }

  private async verifySignedParticipantVP(typedVerifiablePresentation: TypedVerifiablePresentation): Promise<ValidationResultDto> {
    const validationResult = await this.selfDescriptionService.validate(typedVerifiablePresentation)

    const content = await this.participantContentValidationService.validate(
      typedVerifiablePresentation.getTypedVerifiableCredentials('LegalPerson')[0]
        .transformedCredentialSubject as unknown as ParticipantSelfDescriptionV2210vpDto
    )
    validationResult.conforms = validationResult.conforms && content.conforms
    if (!validationResult.conforms)
      throw new ConflictException({ statusCode: HttpStatus.CONFLICT, message: { ...validationResult, content }, error: 'Conflict' })

    return { ...validationResult, content } as ValidationResultDto
  }

  private async validateSignedParticipantVC(participantVC: IVerifiableCredential) {
    const validationResult: validationResultWithoutContent = await this.selfDescriptionService.validateVC(participantVC)
    //fixme validate should receive the credentialSubject
    const content = await this.participantContentValidationService.validate(
      participantVC.credentialSubject as unknown as ParticipantSelfDescriptionV2210vpDto
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
