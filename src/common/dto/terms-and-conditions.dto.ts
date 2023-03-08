import { ApiProperty } from '@nestjs/swagger'

export class TermsAndConditionsDto {
  @ApiProperty({
    description: 'A resolvable link to the Terms and Conditions document.'
  })
  public url: string

  @ApiProperty({
    description: 'sha256 hash of the document provided at the given url.'
  })
  public hash: string
}
