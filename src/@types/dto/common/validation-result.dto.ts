import { ApiProperty } from '@nestjs/swagger'

export class ValidationResult {
  @ApiProperty({
    description: 'The data conforms with the given rules or shape'
  })
  public conforms: boolean

  @ApiProperty({
    type: [String],
    description: 'Error messages'
  })
  public results: string[]
}

export class credentialSubject {
  @ApiProperty({
    description: 'Unique id for the credential subject'
  })
  public id: string

  @ApiProperty({
    description: 'Hash of the self description'
  })
  public sdHash: string
}

export class ValidationResultDto {
  @ApiProperty({
    description: 'The data conforms with the given rules and shape and has a valid signature'
  })
  public conforms: boolean

  @ApiProperty({
    description: 'The SHACL Shape validation results'
  })
  public shape?: ValidationResult

  @ApiProperty({
    description: 'Content validation results'
  })
  public content?: ValidationResult

  @ApiProperty({
    description: 'The credential subject of the SD'
  })
  public credentialSubject?: credentialSubject

  @ApiProperty({
    description: 'The signature of the credential subject of the SD'
  })
  public isValidCredentialSubject?: boolean

  @ApiProperty({
    description: 'The signature is valid and belongs to the SD'
  })
  public isValidSignature?: boolean

  @ApiProperty({
    description: 'The URL of the stored Self Description'
  })
  public storedSdUrl?: string
}
