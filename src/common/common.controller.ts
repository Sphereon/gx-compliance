import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Body, ConflictException, Controller, HttpStatus, Post, Query } from '@nestjs/common'
import { SignatureService } from './services'
import { ComplianceCredentialDto, CredentialSubjectDto, VerifiableCredentialDto, VerifiablePresentationDto } from './dto'
import ParticipantVP from '../tests/fixtures/participant-vp.json'
import ServiceOfferingVP from '../tests/fixtures/service-offering-vp.json'
import { VerifiablePresentationValidationService } from './services/verifiable-presentation-validation.service'

const VPExample = {
  participant: { summary: 'Participant', value: ParticipantVP },
  service: { summary: 'Service Offering', value: ServiceOfferingVP }
}

@ApiTags('credential-offer')
@Controller({ path: '/api/' })
export class CommonController {
  @ApiResponse({
    status: 201,
    description: 'Successfully signed VC.'
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid JSON request body.'
  })
  @ApiResponse({
    status: 409,
    description: 'Invalid Participant Self Description.'
  })
  @ApiOperation({
    summary: 'Check Gaia-X compliance rules and outputs a VerifiableCredentials from your VerifiablePresentation'
  })
  @ApiBody({
    type: VerifiablePresentationDto,
    examples: VPExample
  })
  @ApiQuery({
    name: 'vcid',
    type: 'string',
    description: 'Output VC ID. Optional. Should be url_encoded if an URL',
    required: false,
    example: 'https://storage.gaia-x.eu/credential-offers/b3e0a068-4bf8-4796-932e-2fa83043e203'
  })
  @Post('credential-offers')
  async issueVC(
    @Body() vp: VerifiablePresentationDto<VerifiableCredentialDto<CredentialSubjectDto>>,
    @Query('vcid') vcid?: string
  ): Promise<VerifiableCredentialDto<ComplianceCredentialDto>> {
    const validationResult = await this.verifiablePresentationValidationService.validateVerifiablePresentation(vp)
    if (!validationResult.conforms) {
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        message: {
          ...validationResult
        },
        error: 'Conflict'
      })
    }
    return await this.signatureService.createComplianceCredential(vp, vcid)
  }

  constructor(
    private readonly signatureService: SignatureService,
    private readonly verifiablePresentationValidationService: VerifiablePresentationValidationService
  ) {}
}
