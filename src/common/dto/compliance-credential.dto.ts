import { ApiProperty } from '@nestjs/swagger'
import { CredentialSubjectDto } from './credential-meta.dto'

export class ComplianceCredentialDto extends CredentialSubjectDto {
  @ApiProperty({
    description: 'Context of the Compliance Credential.'
  })
  hash: string
}
