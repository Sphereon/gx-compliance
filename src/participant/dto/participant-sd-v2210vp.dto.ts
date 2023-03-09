import { ApiProperty } from '@nestjs/swagger'
import { CredentialSubjectDto, SignatureDto } from '../../common/dto'
import { Address2210vpDto } from '../../common/dto/address-2210vp.dto'

export class ParticipantSelfDescriptionV2210vpDto extends CredentialSubjectDto {
  @ApiProperty({
    description: 'Legally binding name'
  })
  public legalName: string

  @ApiProperty({
    description: 'Legally binding name'
  })
  public legalForm: string

  @ApiProperty({
    description: 'Country’s registration number which identifies one specific entity. Valid formats are local, EUID, EORI, vatID, leiCode.'
  })
  public registrationNumber: string

  @ApiProperty({
    description: 'Physical location of the companys head quarter.'
  })
  public headquarterAddress: Address2210vpDto

  @ApiProperty({
    description: 'Physical location of the companys legal registration.'
  })
  public legalAddress: Address2210vpDto

  @ApiProperty({
    description: 'Unique LEI number as defined by https://www.gleif.org.',
    required: false
  })
  public leiCode?: string

  @ApiProperty({
    description: 'A (list of) direct participant(s) that this entity is a subOrganization of, if any.',
    required: false
  })
  public parentOrganisation?: string | string[]

  @ApiProperty({
    description: 'A (list of) direct participant(s) with a legal mandate on this entity, e.g., as a subsidiary.',
    required: false
  })
  public subOrganisation?: string | string[]

  public proof: SignatureDto
}
