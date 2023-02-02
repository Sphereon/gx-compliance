import { ApiProperty } from '@nestjs/swagger'

export class AddressDto {
  @ApiProperty({
    description: 'Country principal subdivision code in ISO 3166-2 format'
  })
  public code: string

  @ApiProperty({
    description: 'Country Code in ISO 3166-1 alpha-2 format',
    required: false
  })
  public country_code?: string
}
