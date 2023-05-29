import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Body, ConflictException, Controller, HttpStatus, Post, Query } from '@nestjs/common'
import { SignatureService } from './services'
import { ComplianceCredentialDto, CredentialSubjectDto, ValidationResult, VerifiableCredentialDto, VerifiablePresentationDto } from './dto'
import ParticipantVP from '../tests/fixtures/participant-vp.json'
import ServiceOfferingVP from '../tests/fixtures/service-offering-vp.json'
import { EcoVerifiablePresentationValidationService } from './services/eco-verifiable-presentation-validation.service'
import { EcoSignatureService } from './services/eco-signature.service'
import { HttpService } from '@nestjs/axios'

const VPExample = {
  participant: { summary: 'Participant', value: ParticipantVP },
  service: { summary: 'Service Offering', value: ServiceOfferingVP }
}

@ApiTags('credential-offer')
@Controller({ path: '/api/eco/' })
export class EcoCommonController {
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
    summary:
      'Check Gaia-X compliance rules and outputs a VerifiableCredential from your VerifiablePresentation. This API needs your compliance credential from gx-compliance'
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
    summary: 'Checks the received VP and the compliance credential in it'
  })
  @ApiBody({
    type: VerifiablePresentationDto,
    examples: VPExample,
    required: false
  })
  @ApiQuery({
    name: 'vpid',
    type: 'string',
    description: 'Optional. Should be url_encoded if an URL',
    required: false,
    example: 'https://storage.gaia-x.eu/credential-offers/b3e0a068-4bf8-4796-932e-2fa83043e203'
  })
  @Post('verify')
  async verifyVP(
    @Body() vp?: VerifiablePresentationDto<VerifiableCredentialDto<CredentialSubjectDto>>,
    @Query('vpid') vpid?: string
  ): Promise<ValidationResult> {
    if (!vp && !vpid) {
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        message: 'You have to provide either a VerifiablePresentation or a valid url to you VerifiablePresentation.',
        error: 'Conflict'
      })
    }
    const verifiablePresentation: VerifiablePresentationDto<VerifiableCredentialDto<CredentialSubjectDto>> = vp ? vp : await this.getVpFromUrl(vpid)
    const validationResult = await this.verifiablePresentationValidationService.validateVerifiablePresentation(verifiablePresentation)
    if (!validationResult.conforms) {
      throw new ConflictException({
        statusCode: HttpStatus.CONFLICT,
        message: {
          ...validationResult
        },
        error: 'Conflict'
      })
    }
    await this.ecoSignatureService.validateComplianceCredentials(verifiablePresentation)
    return {
      conforms: true,
      results: []
    }
  }

  constructor(
    private readonly httpService: HttpService,
    private readonly signatureService: SignatureService,
    private readonly ecoSignatureService: EcoSignatureService,
    private readonly verifiablePresentationValidationService: EcoVerifiablePresentationValidationService
  ) {}

  private async getVpFromUrl(vpid: string) {
    const response = await this.httpService.get(vpid).toPromise()
    return response.data
  }
}
