import { ApiProperty } from '@nestjs/swagger'

export class SignatureDto {
  @ApiProperty({
    description: 'Type of the proof'
  })
  public type: string

  @ApiProperty({
    description: 'Creation date of the proof'
  })
  public created: string

  @ApiProperty({
    description: 'The proofPurpose property is used to associate a purpose, such as assertionMethod or authentication with a proof'
  })
  public proofPurpose: string

  @ApiProperty({
    description: 'JSON Web Signature for a given self description'
  })
  public jws: string

  @ApiProperty({
    description: 'Public key as PEM-encoded SPKI string'
  })
  public verificationMethod: string
}
