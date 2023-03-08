import { ApiProperty } from '@nestjs/swagger'
import { SignatureDto } from './signature.dto'

//TODO: refactor togi use for all credentials (compliance, sd)
export abstract class VerifiableCredentialDto<T extends CredentialSubjectDto> {
  @ApiProperty({
    description: 'The context to be used for the self description.'
  })
  public '@context': string[] | any

  @ApiProperty({
    description: 'The type of the self description.'
  })
  public type: string[]

  @ApiProperty({
    description: 'The identifier of the self description.',
    required: false
  })
  public id?: string

  @ApiProperty({
    description: 'The claims of the credential.'
  })
  public credentialSubject: T

  @ApiProperty({
    description: 'The identifier of the issuer of the credential.'
  })
  public issuer: string

  @ApiProperty({
    description: 'The date of issuance of the credential.'
  })
  public issuanceDate: string

  @ApiProperty({
    description: 'The proof of the credential.'
  })
  public proof: SignatureDto
}

export abstract class CredentialSubjectDto {
  @ApiProperty({
    description: 'The identifier of the credential subject.'
  })
  public 'id': string
}
