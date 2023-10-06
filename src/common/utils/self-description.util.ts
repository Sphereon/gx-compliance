import { VerifiableCredentialDto } from '../../common/dto'
import { BadRequestException, ConflictException } from '@nestjs/common'
import { IVerifiableCredential, ServiceOfferingType } from '../@types/SSI.types'

export function getTypeFromSelfDescription(verifiableCredential: VerifiableCredentialDto<any> | IVerifiableCredential): string {
  const sdTypes = verifiableCredential.type
  if (!sdTypes) throw new BadRequestException('Expected type to be defined in Verifiable Credential')
  const subjectType = verifiableCredential.credentialSubject['type']
    ? verifiableCredential.credentialSubject['type']
    : verifiableCredential.credentialSubject['@type']
  const json = JSON.stringify(verifiableCredential)
  if (!subjectType && (json.includes(ServiceOfferingType.DcatDataset.valueOf()) || json.includes(ServiceOfferingType.DcatDataService.valueOf()))) {
    return 'ServiceOffering'
  } else if (sdTypes.length === 1 && sdTypes[0] === 'VerifiableCredential' && subjectType) {
    for (const type of Object.values(ServiceOfferingType)) {
      if (containsType(subjectType, type)) {
        return 'ServiceOffering'
      }
    }
    if (containsType(subjectType, 'LegalPerson')) {
      return 'LegalPerson'
    }
    throw new Error(`Expecting ServiceOffering type in credentialSubject.type. Received: ${subjectType}`)
  }
  //todo: we might wanna limit this to prevent unknown types. Why not simply throw the exception once we reacht this point?
  const type = verifiableCredential.type.find(t => t !== 'VerifiableCredential')
  if (!type) {
    throw new ConflictException('Provided type for VerifiableCredential is not supported')
  }
  return type
}

function containsType(arrayOrString: any, searchValue: string) {
  if (!arrayOrString) {
    return false
  } else if (typeof arrayOrString === 'string') {
    return arrayOrString.includes(searchValue)
  } else if (Array.isArray(arrayOrString)) {
    return arrayOrString.find(elt => elt.includes(searchValue))
  } else {
    arrayOrString.toString().includes(searchValue)
  }
}
