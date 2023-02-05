import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Body, Controller, Post, UsePipes } from '@nestjs/common'
import { Proof2210vpService } from '../../methods/common/proof.2210vp.service'
import { SelfDescription2210vpService } from '../../methods/common/selfDescription.2210vp.service'
import { ParticipantSelfDescriptionDto } from '../../@types/dto/participant'
import { ServiceOfferingSelfDescriptionDto } from '../../@types/dto/service-offering'
import { VerifiableCredentialDto } from '../../@types/dto/common'
import ComplianceRequests from '../../tests/fixtures/2010VP/compliance-request-vps.json'
import { JoiValidationPipe } from '../../utils/pipes'
import { VerifiablePresentationSchema } from '../../utils/schema/ssi.schema'
import { CredentialTypes } from '../../@types/enums'
import { VerifiablePresentationDto } from '../../@types/dto/common/presentation-meta.dto'
import { IVerifiableCredential, WrappedVerifiablePresentation } from '../../@types/type/SSI.types'
import { Signature2210vpService } from '../../methods/common/signature.2010vp.service'
import { SsiTypesParserPipe } from '../../utils/pipes/ssi-types-parser.pipe'

const credentialType = CredentialTypes.common

const commonSDExamples = {
  participant: { summary: 'Participant SD Example', value: ComplianceRequests.selfDescriptionCredential },
  //todo: add service offering sd example
  service: { summary: 'Service Offering Experimental SD Example', value: ComplianceRequests.selfDescriptionCredential }
}

@ApiTags(credentialType)
//TODO: fix the path at the high level instead of this
@Controller({ path: '2210vp' })
export class Common2010VPController {
  constructor(
    private readonly selfDescriptionService: SelfDescription2210vpService,
    private readonly signatureService: Signature2210vpService,
    private readonly proofService: Proof2210vpService
  ) {}

  @ApiResponse({
    status: 201,
    description: 'Successfully created a Participant Verifiable Credential.'
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
  @UsePipes(new JoiValidationPipe(VerifiablePresentationSchema), new SsiTypesParserPipe())
  @Post('compliance')
  async createComplianceCredential(@Body() wrappedVerifiablePresentation: WrappedVerifiablePresentation): Promise<IVerifiableCredential> {
    const sd = JSON.parse(wrappedVerifiablePresentation.raw)
    await this.proofService.validateVP(sd)
    const type: string = wrappedVerifiablePresentation.type

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
