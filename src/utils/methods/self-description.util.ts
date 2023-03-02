import { VerifiableCredentialDto } from '../../@types/dto/common'
import { BadRequestException, ConflictException } from '@nestjs/common'
import { IVerifiableCredential, ServiceOfferingType } from '../../@types/type/SSI.types'

export function getTypeFromSelfDescription(verifiableCredential: VerifiableCredentialDto<any> | IVerifiableCredential): string {
  const sdTypes = verifiableCredential.type
  if (!sdTypes) throw new BadRequestException('Expected type to be defined in Verifiable Credential')
  const subjectType = verifiableCredential.credentialSubject['type']
    ? verifiableCredential.credentialSubject['type']
    : verifiableCredential.credentialSubject['@type']
  //todo: ask @nklomp if this way for recognizing dcat datasets is valid
  if (!subjectType && verifiableCredential.credentialSubject['@graph']) {
    return 'ServiceOffering'
  }
  if (sdTypes.length === 1 && sdTypes[0] === 'VerifiableCredential' && subjectType) {
    for (const type of Object.values(ServiceOfferingType)) {
      if ((subjectType as string).includes(type)) {
        return 'ServiceOffering'
      }
    }
    if ((subjectType as string).includes('LegalPerson')) {
      return 'LegalPerson'
    }
    //fixme: we might wanna expand this to include other types as well (resource?)
    throw new Error('Expecting ServiceOffering type in credentialSubject.type')
  }
  //fixme: we might wanna limit this to prevent unknown types
  const type = verifiableCredential.type.find(t => t !== 'VerifiableCredential')
  if (!type) {
    throw new ConflictException('Provided type for VerifiableCredential is not supported')
  }
  return type
}
