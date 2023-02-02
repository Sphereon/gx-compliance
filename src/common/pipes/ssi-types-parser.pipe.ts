import { PipeTransform, Injectable, BadRequestException, ConflictException } from '@nestjs/common'
import { AddressDto, VerifiableCredentialDto } from '../dto'
import { SelfDescriptionTypes } from '../enums'
import { EXPECTED_PARTICIPANT_CONTEXT_TYPE, EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE } from '../constants'
import { RegistrationNumberDto } from '../../participant/dto/registration-number.dto'
import { VerifiablePresentationDto } from '../dto/presentation-meta.dto'
import { IProof, IVerifiableCredential, WrappedVerifiableCredential, WrappedVerifiablePresentation } from '../@types/SSI.types'

//fixme: once rebased to 2210-Henry, use constants instead of literal strings
@Injectable()
export class SsiTypesParserPipe
  implements PipeTransform<VerifiableCredentialDto<any> | VerifiablePresentationDto, WrappedVerifiableCredential | WrappedVerifiablePresentation>
{
  // TODO extract to common const
  private readonly addressFields = ['legalAddress', 'headquarterAddress']

  transform(
    verifiableSelfDescriptionDto: VerifiableCredentialDto<any> | VerifiablePresentationDto
  ): WrappedVerifiableCredential | WrappedVerifiablePresentation {
    if (!verifiableSelfDescriptionDto['type']) {
      throw new Error("Can't transform non-ssi type")
    }
    if (verifiableSelfDescriptionDto['type'].includes('VerifiableCredential')) {
      return this.transformVerifiableCredential(verifiableSelfDescriptionDto as VerifiableCredentialDto<any>)
    } else if (verifiableSelfDescriptionDto['type'].includes('VerifiablePresentation')) {
      return this.transformVerifiablePresentation(verifiableSelfDescriptionDto as VerifiablePresentationDto)
    }
    throw new Error(`Can't transform unsupported type: ${verifiableSelfDescriptionDto['type']}`)
  }

  private getAddressValues(address: any): AddressDto {
    const code = this.getValueFromShacl(address['gx-participant:addressCode'], 'code', SelfDescriptionTypes.PARTICIPANT)
    const country_code = this.getValueFromShacl(address['gx-participant:addressCountryCode'], 'country_code', SelfDescriptionTypes.PARTICIPANT)

    return { code, country_code }
  }

  private getRegistrationNumberValues(registrationNumber: any): RegistrationNumberDto[] {
    if (registrationNumber.constructor !== Array) registrationNumber = [registrationNumber]

    const values = []
    for (const num of registrationNumber) {
      const rType = this.getValueFromShacl(num['gx-participant:registrationNumberType'], 'type', SelfDescriptionTypes.PARTICIPANT)
      const rNumber = this.getValueFromShacl(num['gx-participant:registrationNumberNumber'], 'number', SelfDescriptionTypes.PARTICIPANT)
      values.push({ type: rType, number: rNumber })
    }
    return values
  }

  private getValueFromShacl(shacl: any, key: string, type: string): any {
    if (type === SelfDescriptionTypes.PARTICIPANT && this.addressFields.includes(key)) {
      return this.getAddressValues(shacl)
    }
    if (type === SelfDescriptionTypes.PARTICIPANT && key === 'registrationNumber') {
      return this.getRegistrationNumberValues(shacl)
    }

    return shacl && typeof shacl === 'object' && '@value' in shacl ? shacl['@value'] : shacl
  }

  private replacePlaceholderInKey(key: string, type: string): string {
    const sdTypes = {
      [SelfDescriptionTypes.SERVICE_OFFERING]: EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE['@type'],
      [SelfDescriptionTypes.PARTICIPANT]: EXPECTED_PARTICIPANT_CONTEXT_TYPE['@type']
    }
    const sdType = sdTypes[type]

    const keyType = sdType.substring(0, sdType.lastIndexOf(':') + 1)

    return key.replace(keyType, '')
  }

  private transformVerifiableCredential(verifiableCredential: VerifiableCredentialDto<any>): WrappedVerifiableCredential {
    try {
      const type = SsiTypesParserPipe.getGXTypeFromVerifiableCredential(verifiableCredential)
      const { credentialSubject } = verifiableCredential
      delete verifiableCredential.credentialSubject

      const flatten = {
        sd: { ...verifiableCredential },
        cs: { ...credentialSubject }
      }
      delete flatten.sd.credentialSubject

      for (const key of Object.keys(flatten)) {
        const keys = Object.keys(flatten[key])
        const cred = flatten[key]
        keys.forEach(key => {
          const strippedKey = this.replacePlaceholderInKey(key, type)
          cred[strippedKey] = this.getValueFromShacl(cred[key], strippedKey, type)
        })
      }

      return {
        type,
        rawVerifiableCredential: verifiableCredential as IVerifiableCredential,
        transformedCredentialSubject: flatten.cs,
        proof: verifiableCredential.proof as IProof,
        raw: JSON.stringify({ ...verifiableCredential, credentialSubject: { ...credentialSubject } }),
        rawCredentialSubject: JSON.stringify({ ...credentialSubject })
      }
    } catch (error) {
      throw new BadRequestException(`Transformation failed: ${error.message}`)
    }
  }

  private transformVerifiablePresentation(verifiablePresentationDto: VerifiablePresentationDto): WrappedVerifiablePresentation {
    try {
      const types: string[] = []
      verifiablePresentationDto.verifiableCredential.forEach(vc => types.push(SsiTypesParserPipe.getGXTypeFromVerifiableCredential(vc as VerifiableCredentialDto<any>)))
      let type = 'Participant'
      if (types.includes('ServiceOffering')) {
        type = 'ServiceOffering'
      }
      const participantCredentials: WrappedVerifiableCredential[] = []
      const complianceCredentials: WrappedVerifiableCredential[] = []
      const serviceOfferingCredentials: WrappedVerifiableCredential[] = []
      for (const vc of verifiablePresentationDto.verifiableCredential) {
        const wrappedVC = this.transformVerifiableCredential(vc as VerifiableCredentialDto<any>)
        switch (wrappedVC.type) {
          case 'Participant':
            participantCredentials.push(wrappedVC)
            break
          case 'ServiceOffering':
            serviceOfferingCredentials.push(wrappedVC)
            break
          case 'ParticipantCredential':
            complianceCredentials.push(wrappedVC)
            break
          default:
            throw new Error(`Can't map ${wrappedVC.type}`)
        }
      }
      return {
        type,
        participantCredentials,
        complianceCredentials,
        serviceOfferingCredentials,
        proof: verifiablePresentationDto.proof,
        raw: JSON.stringify(verifiablePresentationDto)
      }
    } catch (error) {
      throw new BadRequestException(`Transformation failed: ${error.message}`)
    }
  }

  private static getGXTypeFromVerifiableCredential(verifiableCredential: VerifiableCredentialDto<any>): string {
    const sdTypes = verifiableCredential.type
    if (!sdTypes) throw new BadRequestException('Expected type to be defined in Verifiable Credential')
    if (sdTypes.length === 1 && sdTypes[0] === 'VerifiableCredential') {
      if (verifiableCredential.credentialSubject['type'] && (verifiableCredential.credentialSubject.type as string).includes('ServiceOffering')) {
        return 'ServiceOffering'
      }
      //fixme: we might wanna expand this to include other types as well (resource?)
      throw new Error('Expecting ServiceOffering type in credentialSubject.type')
    }
    //fixme: we might wanna limit this to prevent unknown types
    const types = verifiableCredential.type.find(t => t !== 'VerifiableCredential')
    if (types.length === 0) {
      throw new ConflictException('Provided type for VerifiableCredential is not supported')
    } else if (types.length > 1) {
      throw new ConflictException('Multiple provided types for for a Self Description are not supported')
    }
    return types[0] === 'LegalPerson' ? 'Participant' : types[0]
  }
}
