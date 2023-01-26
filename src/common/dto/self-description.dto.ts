import { ApiProperty } from '@nestjs/swagger'
import { ComplianceCredentialDto, CredentialSubjectDto, VerifiableCredentialDto } from '.'
import { SignatureDto } from './signature.dto'

export class VerifySdDto {
  @ApiProperty({
    description: 'The HTTP location of the Self Description to verify',
    example: 'https://example.eu/path/to/selfdescription'
  })
  public url: string
}

export class VerifiableSelfDescriptionDto<T extends CredentialSubjectDto> {
  public selfDescriptionCredential: VerifiableCredentialDto<T>
  public complianceCredential?: VerifiableCredentialDto<ComplianceCredentialDto>
}

export class SignedSelfDescriptionDto<T extends CredentialSubjectDto> extends VerifiableSelfDescriptionDto<T> {
  public rawCredentialSubject: string
  public raw: string
  public proof?: SignatureDto
}
