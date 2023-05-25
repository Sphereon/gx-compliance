import { ApiProperty } from '@nestjs/swagger'

export class AddressDto {
  @ApiProperty({
    description: 'Country principal subdivision code in ISO 3166-2 format'
  })
  public countrySubdivisionCode: string
}
