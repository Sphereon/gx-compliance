import { ApiBody, ApiResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Body, Controller, Post, UsePipes } from '@nestjs/common'
import { SignatureService, SelfDescriptionService, ProofService } from './services'
import { ParticipantSelfDescriptionDto } from '../participant/dto'
import { ServiceOfferingSelfDescriptionDto } from '../service-offering/dto'
import { ComplianceCredentialDto, VerifiableCredentialDto } from './dto'
import ParticipantSD from '../tests/fixtures/participant-sd.json'
import ServiceOfferingExperimentalSD from '../tests/fixtures/service-offering-sd.json'
import { JoiValidationPipe } from './pipes'
import { ParticipantSelfDescriptionSchema } from './schema/selfDescription.schema'
import { CredentialTypes } from './enums'
import { getTypeFromSelfDescription } from './utils'

const credentialType = CredentialTypes.common

const commonSDExamples = {
  participant: { summary: 'Participant SD Example', value: ParticipantSD.selfDescriptionCredential },
  service: { summary: 'Service Offering Experimental SD Example', value: ServiceOfferingExperimentalSD.selfDescriptionCredential }
}
@ApiTags(credentialType)
@Controller({ path: '' })
export class CommonController {
  constructor(
    private readonly selfDescriptionService: SelfDescriptionService,
    private readonly signatureService: SignatureService,
    private readonly proofService: ProofService
  ) { }

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
  @ApiOperation({ summary: 'Canonize, hash and sign a valid Self Description' })
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
}
