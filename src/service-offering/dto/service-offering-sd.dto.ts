import { ApiProperty } from '@nestjs/swagger'
import { SelfDescriptionMetaDto, WrappedSelfDescriptionDto } from '../../common/dto/self-description.dto'
import { SignatureDto } from '../../common/dto/signature.dto'
import { TermsAndConditionsDto } from '../../common/dto/terms-and-conditions.dto'
import { ComplianceCredentialDto } from '../../participant/dto/participant-sd.dto'

export class ServiceOfferingSelfDescriptionDto extends SelfDescriptionMetaDto {
  @ApiProperty({
    description: "The context to be used for the self description. The 'gx-participant' context is required for Participant Self Descriptions",
    example: {
      sh: 'http://www.w3.org/ns/shacl#',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
      'gx-participant': 'http://w3id.org/gaia-x/participant#'
    }
  })
  public '@context': SelfDescriptionMetaDto['@context']

  @ApiProperty({
    description: "The type of the self description. 'gx-participant:LegalPerson' is required for Participant Self Descriptions.",
    example: 'gx-participant:LegalPerson'
  })
  public '@type': SelfDescriptionMetaDto['@type']

  @ApiProperty({
    description: 'A resolvable link to the participant Self-Description providing the service.'
  })
  public providedBy: string

  @ApiProperty({
    description: 'Resolvable link(s) to the Self-Description(s) of resources related to the service and that can exist independently of it.',
    type: [String],
    required: false
  })
  public aggregationOf?: string[]

  @ApiProperty({
    description: 'Physical location of the companys legal registration.',
    type: () => [TermsAndConditionsDto]
  })
  public termsAndConditions: TermsAndConditionsDto[]
}
export class WrappedServiceOfferingSelfDescriptionDto implements WrappedSelfDescriptionDto<ServiceOfferingSelfDescriptionDto> {
  @ApiProperty({
    description: 'A wrapped Self Description.'
  })
  public selfDescription: ServiceOfferingSelfDescriptionDto
}

// TODO clean up
export class SignedServiceOfferingSelfDescriptionDto {
  public selfDescription: ServiceOfferingSelfDescriptionDto

  public proof?: SignatureDto

  public raw: string

  public complianceCredential?: ComplianceCredentialDto
}