import { CredentialSubjectDto, VerifiableCredentialDto } from '../dto'
import { SUPPORTED_TYPES } from '../constants'
import { BadRequestException, ConflictException } from '@nestjs/common'

export function getTypeFromSelfDescription(selfDescription: VerifiableCredentialDto<CredentialSubjectDto>): string {
  const types = selfDescription.type
  if (!types) throw new BadRequestException('Expected type to be defined in Self Description')

  const type: string = types.find(t => t !== 'VerifiableCredential')
  if (!SUPPORTED_TYPES.includes(type)) throw new ConflictException('Provided type for Self Description is not supported')

  return type
}
