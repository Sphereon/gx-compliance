import { ApiBody, ApiResponse, ApiOperation, ApiTags, ApiExtraModels, ApiQuery } from '@nestjs/swagger'
import { Body, Controller, Post, UsePipes, Query, HttpStatus, ConflictException,InternalServerErrorException } from '@nestjs/common'
import { SignatureService, SelfDescriptionService, ProofService } from './services'
import { ParticipantSelfDescriptionDto } from '../participant/dto'
import { ServiceOfferingSelfDescriptionDto } from '../service-offering/dto'
import { ComplianceCredentialDto, SignedSelfDescriptionDto, VerifiableCredentialDto, ValidationResultDto, VerifiableSelfDescriptionDto, CredentialSubjectDto } from './dto'
import ParticipantSD from '../tests/fixtures/participant-sd.json'
import ServiceOfferingExperimentalSD from '../tests/fixtures/service-offering-sd.json'
import { JoiValidationPipe, BooleanQueryValidationPipe } from './pipes'
import { ParticipantSelfDescriptionSchema } from './schema/selfDescription.schema'
import { CredentialTypes } from './enums'
import { getTypeFromSelfDescription } from './utils'
import { SDParserPipe } from './pipes'
import { ApiVerifyResponse } from './decorators'

const credentialType = CredentialTypes.common

const commonSDExamples = {
  participant: { summary: 'Participant SD Example', value: ParticipantSD.selfDescriptionCredential },
  service: { summary: 'Service Offering Experimental SD Example', value: ServiceOfferingExperimentalSD.selfDescriptionCredential }
}

const commonFullExample = {
  participant: { summary: 'Participant SD Example', value: ParticipantSD },
  service: { summary: 'Service Offering Experimental SD Example', value: ServiceOfferingExperimentalSD }
}

@ApiTags(credentialType)
@Controller({ path: '/api/' })
export class CommonController {
  constructor(
    private readonly selfDescriptionService: SelfDescriptionService,
    private readonly signatureService: SignatureService,
    private readonly proofService: ProofService
  ) {}

  @ApiResponse({
    status: 201,
    description: 'Succesfully signed posted content. Will return the posted JSON with an additional "proof" property added.'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid JSON request body.'
  })
  @ApiResponse({
    status: 409,
    description: 'Invalid Participant Self Description.'
  })
  @ApiBody({
    type: VerifiableCredentialDto,
    examples: commonSDExamples
  })
  @ApiOperation({ summary: 'Canonize, hash and sign a valid Self Description (Actual Compliance credential issuance method)' })
  @UsePipes(new JoiValidationPipe(ParticipantSelfDescriptionSchema))
  @Post('sign')
  async signSelfDescription(
    @Body() verifiableSelfDescription: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>
  ): Promise<{ complianceCredential: VerifiableCredentialDto<ComplianceCredentialDto> }> {
    await this.proofService.validate(JSON.parse(JSON.stringify(verifiableSelfDescription)))
    const type: string = getTypeFromSelfDescription(verifiableSelfDescription)
    await this.selfDescriptionService.validateSelfDescription(verifiableSelfDescription, type)
    const complianceCredential: { complianceCredential: VerifiableCredentialDto<ComplianceCredentialDto> } =
      await this.signatureService.createComplianceCredential(verifiableSelfDescription)
      return complianceCredential
  }
  @Post('normalize')
  @ApiResponse({
    status: 201,
    description: 'Normalized Self Description.'
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request.'
  })
  @ApiOperation({ summary: 'Normalize (canonize) a Self Description using URDNA2015' })
  @ApiBody({
    type: VerifiableCredentialDto,
    examples: commonSDExamples
  })
  async normalizeSelfDescriptionRaw(
    @Body() selfDescription: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>
  ): Promise<string> {
    const normalizedSD: string = await this.signatureService.normalize(selfDescription)

    return normalizedSD
  }


  @ApiResponse({
    status: 201,
    description: 'Succesfully signed posted content. Will return the posted JSON with an additional "proof" property added.'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid JSON request body.'
  })
  @ApiResponse({
    status: 409,
    description: 'Invalid Participant Self Description.'
  })
  @ApiBody({
    type: VerifiableCredentialDto,
    examples: commonSDExamples
  })
  @ApiOperation({ summary: 'Canonize, hash and sign a valid Self Description (Proposal: Verify shape and content according to trust framework before emitting Compliance credential)' })
  @UsePipes(new JoiValidationPipe(ParticipantSelfDescriptionSchema))
  @Post('vc-issuance')
  async vc_issuance(
    @Body() verifiableSelfDescription: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>
  ): Promise<{ complianceCredential: VerifiableCredentialDto<ComplianceCredentialDto> }> {
    let proof = await this.proofService.validate(JSON.parse(JSON.stringify(verifiableSelfDescription)))
    const type = await getTypeFromSelfDescription(verifiableSelfDescription)
    const _SDParserPipe = new SDParserPipe(type)
    const verifiableSelfDescription_compliance: VerifiableSelfDescriptionDto<CredentialSubjectDto> = {
      selfDescriptionCredential: { ...verifiableSelfDescription }
    }
    let validationResult = await this.selfDescriptionService.validate(_SDParserPipe.transform(verifiableSelfDescription_compliance))
    if (!validationResult.conforms) {
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        message: {
          ...validationResult
        },
        error: 'Conflict'
      })
    }
    const complianceCredential: { complianceCredential: VerifiableCredentialDto<ComplianceCredentialDto> } =
      await this.signatureService.createComplianceCredential(verifiableSelfDescription)

    return complianceCredential
  }

  @ApiVerifyResponse(credentialType)
  @Post('verify')
  @ApiOperation({ summary: 'Validate a Self Description' })
  @ApiExtraModels(VerifiableSelfDescriptionDto, VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>, ServiceOfferingSelfDescriptionDto)
  @ApiQuery({
    name: 'store',
    type: Boolean,
    description: 'Store Self Description for learning purposes for six months in the storage service',
    required: false
  })
  @ApiBody({
    type: SignedSelfDescriptionDto,
    examples: commonFullExample
  })
  async verifyRaw(
    @Body()
    SelfDescription: SignedSelfDescriptionDto<ServiceOfferingSelfDescriptionDto>,
    @Query('store', new BooleanQueryValidationPipe()) storeSD: boolean,
  ): Promise<ValidationResultDto> {
    const type = await getTypeFromSelfDescription(SelfDescription.selfDescriptionCredential)
    const _SDParserPipe = new SDParserPipe(type)
    const verifiableSelfDescription_compliance: SignedSelfDescriptionDto<CredentialSubjectDto> = 
    _SDParserPipe.transform(SelfDescription)
    try {
      const validationResult: ValidationResultDto = await this.selfDescriptionService.verify(verifiableSelfDescription_compliance)
      if (!validationResult.conforms) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          message: {
            ...validationResult
          },
          error: 'Conflict'
        })
      }
      if (validationResult?.conforms && storeSD) validationResult.storedSdUrl = await this.selfDescriptionService.storeSelfDescription(SelfDescription)
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
}
