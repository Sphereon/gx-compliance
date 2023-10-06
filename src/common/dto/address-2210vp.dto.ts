import { ApiProperty } from '@nestjs/swagger'

export class Address2210vpDto {
  @ApiProperty({
    description: 'Physical location of head quarter in ISO 3166-1 alpha2, alpha-3 or numeric format.'
  })
  public 'country-name': string

  @ApiProperty({
    description: 'GPS in ISO 6709:2008/Cor 1:2009 format.',
    required: false
  })
  public gps?: string

  @ApiProperty({
    description: 'The v:street-address property specifies the street address of a postal address.',
    required: false
  })
  public 'street-address'?: string | string[]

  @ApiProperty({
    description: 'The v:postal-code property specifies the postal code property of the address.',
    required: false
  })
  public 'postal-code'?: string | string[]

  @ApiProperty({
    description: 'The v:locality property specifies the locality (e.g., city) of a postal address.',
    required: false
  })
  public 'locality'?: string | string[]
}
