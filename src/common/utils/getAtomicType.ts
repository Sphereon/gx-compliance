import { VerifiableCredentialDto } from '../dto'
import { ParticipantSelfDescriptionDto } from '../../participant/dto'
import { ServiceOfferingSelfDescriptionDto } from '../../service-offering/dto'

export function getEcoAtomicType(vc: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>): string {
  if (vc.type && Array.isArray(vc.type) && vc.type.filter(t => t !== 'VerifiableCredential').length > 0) {
    return getAtomicTypeFromArray(vc.type)
  } else if (vc.type && !Array.isArray(vc.type) && vc.type != 'VerifiableCredential') {
    return getAtomicTypeFromString(<string>vc.type)
  } else if (Array.isArray(vc.credentialSubject)) {
    //todo: discuss this with Niels
    return Array.isArray(vc.credentialSubject[0].type)
      ? getAtomicTypeFromArray(vc.credentialSubject[0].type)
      : getAtomicTypeFromString(vc.credentialSubject[0].type)
  } else if (
    vc.credentialSubject.type &&
    Array.isArray(vc.credentialSubject.type) &&
    vc.credentialSubject.type.filter(t => t !== 'VerifiableCredential').length > 0
  ) {
    return getAtomicTypeFromArray(vc.credentialSubject.type)
  } else if (vc.credentialSubject.type) {
    return getAtomicTypeFromString(<string>vc.credentialSubject.type)
  }
}

export function getAtomicType(vc: VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>): string {
  if (vc.type && Array.isArray(vc.type) && vc.type.filter(t => t !== 'VerifiableCredential').length > 0) {
    return getAtomicTypeFromArray(vc.type)
  } else if (vc.type && !Array.isArray(vc.type) && vc.type != 'VerifiableCredential') {
    return getAtomicTypeFromString(<string>vc.type)
  } else if (
    vc.credentialSubject.type &&
    Array.isArray(vc.credentialSubject.type) &&
    vc.credentialSubject.type.filter(t => t !== 'VerifiableCredential').length > 0
  ) {
    return getAtomicTypeFromArray(vc.credentialSubject.type)
  } else if (vc.credentialSubject.type) {
    return getAtomicTypeFromString(<string>vc.credentialSubject.type)
  }
}

function getAtomicTypeFromArray(types: string[]) {
  const baseType = types.find(t => t !== 'VerifiableCredential')[0]
  return getAtomicTypeFromString(baseType)
}

function getAtomicTypeFromString(type: string) {
  return type.substring(type.lastIndexOf(':') + 1)
}
