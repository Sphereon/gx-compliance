import { ApiProperty } from '@nestjs/swagger'
import { CredentialSubjectDto, VerifiableCredentialDto } from './credential-meta.dto'

export abstract class VerifiablePresentationDto<T extends VerifiableCredentialDto<CredentialSubjectDto>> {
  @ApiProperty({
    description: 'The context to be used for the verifiable presentation.'
  })
  public '@context': string[] | any

  @ApiProperty({
    description: 'The type of verifiable presentation.'
  })
  public '@type': string[]

  @ApiProperty({
    description: 'The identifier of the self description.',
    required: false
  })
  public '@id'?: string

  @ApiProperty({
    description: 'The verifiable credential included in the VP'
  })
  public verifiableCredential: T[]
}
