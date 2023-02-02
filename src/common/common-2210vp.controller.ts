import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Body, Controller, Post, UsePipes } from '@nestjs/common'
import { Proof2210vpService, SelfDescription2210vpService } from './services'
import { ParticipantSelfDescriptionDto } from '../participant/dto'
import { ServiceOfferingSelfDescriptionDto } from '../service-offering/dto'
import { VerifiableCredentialDto } from './dto'
import ParticipantSD from '../tests/fixtures/participant-sd.json'
import ServiceOfferingExperimentalSD from '../tests/fixtures/service-offering-sd.json'
import { JoiValidationPipe } from './pipes'
import { VerifiablePresentationSchema } from './schema/selfDescription.schema'
import { CredentialTypes } from './enums'
import { getTypeFromSelfDescription } from './utils'
import { VerifiablePresentationDto } from './dto/presentation-meta.dto'
import { IVerifiableCredential } from './@types/SSI.types'
import { Signature2210vpService } from './services/signature.2010vp.service'

const credentialType = CredentialTypes.common

const commonSDExamples = {
  participant: { summary: 'Participant SD Example', value: ParticipantSD.selfDescriptionCredential },
  service: { summary: 'Service Offering Experimental SD Example', value: ServiceOfferingExperimentalSD.selfDescriptionCredential }
}

@ApiTags(credentialType)
//TODO: fix the path at the high level instead of this
@Controller({ path: '2020VP' })
export class Common2010VPController {
  constructor(
    private readonly selfDescriptionService: SelfDescription2210vpService,
    private readonly signatureService: Signature2210vpService,
    private readonly proofService: Proof2210vpService
  ) {}

  @ApiResponse({
    status: 201,
    description: 'Successfully signed posted content. Will return the posted JSON with an additional "proof" property added.'
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
    type: VerifiablePresentationDto,
    //fixme: create examples for compliance
    examples: commonSDExamples
  })
  @ApiOperation({ summary: 'Gets a selfDescribed VP and returns a Compliance VC in response' })
  @UsePipes(new JoiValidationPipe(VerifiablePresentationSchema))
  @Post('compliance')
  async createComplianceCredential(@Body() verifiableSelfDescription: VerifiablePresentationDto): Promise<IVerifiableCredential> {
    const sd = JSON.parse(JSON.stringify(verifiableSelfDescription))
    await this.proofService.validate(sd)
    const type: string = getTypeFromSelfDescription(sd.verifiableCredential[0])

    await this.selfDescriptionService.validateSelfDescription(sd, type)
    return await this.signatureService.createComplianceCredentialFromSelfDescription(sd)
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
