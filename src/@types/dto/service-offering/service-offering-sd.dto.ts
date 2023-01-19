import { ApiProperty } from '@nestjs/swagger'
import { CredentialSubjectDto } from '../common'
import { TermsAndConditionsDto } from '../common'

export class ServiceOfferingSelfDescriptionDto extends CredentialSubjectDto {
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

  @ApiProperty({
    description: 'List of data protection regime.',
    type: [String],
    required: false
  })
  public dataProtectionRegime?: string[]

  @ApiProperty({
    description: 'List of methods to export data out of the service.',
    type: [String],
    required: true
  })
  public dataExport: string[]
}
