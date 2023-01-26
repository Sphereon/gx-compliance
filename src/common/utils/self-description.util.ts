import { VerifiableCredentialDto } from '../dto'
import { SUPPORTED_TYPES } from '../constants'
import { BadRequestException, ConflictException } from '@nestjs/common'

export function getTypeFromSelfDescription(selfDescription: VerifiableCredentialDto<any>): string {
  const sdTypes = selfDescription.type
  if (!sdTypes) throw new BadRequestException('Expected type to be defined in Self Description')

  const types = sdTypes.filter(type => SUPPORTED_TYPES.includes(type))
  if (types.length === 0) {
    throw new ConflictException('Provided type for Self Description is not supported')
  } else if (types.length > 1) {
    throw new ConflictException('Multiple provided types for for a Self Description are not supported')
  }

  return types[0]
}
