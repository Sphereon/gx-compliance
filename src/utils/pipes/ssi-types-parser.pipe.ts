import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import { AddressDto, VerifiableCredentialDto } from '../../@types/dto/common'
import { SelfDescriptionTypes } from '../../@types/enums'
import { EXPECTED_PARTICIPANT_CONTEXT_TYPE, EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE } from '../../@types/constants'
import { RegistrationNumberDto } from '../../@types/dto/participant'
import { VerifiablePresentationDto } from '../../@types/dto/common/presentation-meta.dto'
import {
  IntentType,
  IVerifiableCredential,
  IVerifiablePresentation,
  TypedVerifiableCredential,
  TypedVerifiablePresentation
} from '../../@types/type/SSI.types'
import { getDidWeb, getTypeFromSelfDescription } from '../methods'

@Injectable()
export class SsiTypesParserPipe
  implements PipeTransform<VerifiableCredentialDto<any> | VerifiablePresentationDto, TypedVerifiableCredential | TypedVerifiablePresentation>
{
  private readonly addressFields = ['legalAddress', 'headquarterAddress']

  transform(
    verifiableSelfDescriptionDto: VerifiableCredentialDto<any> | VerifiablePresentationDto
  ): TypedVerifiableCredential | TypedVerifiablePresentation {
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
    if (!sdType) {
      return key
    }
    const keyType = sdType.substring(0, sdType.lastIndexOf(':') + 1)

    return key.replace(keyType, '')
  }

  private transformVerifiableCredential(verifiableCredential: VerifiableCredentialDto<any>): TypedVerifiableCredential {
    try {
      const originalVerifiableCredential = { ...verifiableCredential }
      const type = getTypeFromSelfDescription(verifiableCredential)
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
        rawVerifiableCredential: originalVerifiableCredential as IVerifiableCredential,
        transformedCredentialSubject: flatten.cs
      }
    } catch (error) {
      throw new BadRequestException(`Transformation failed: ${error.message}`)
    }
  }

  private transformVerifiablePresentation(verifiablePresentationDto: VerifiablePresentationDto): TypedVerifiablePresentation {
    try {
      const types: string[] = []
      const originalVP = JSON.parse(JSON.stringify(verifiablePresentationDto))
      verifiablePresentationDto.verifiableCredential.forEach(vc => types.push(getTypeFromSelfDescription(vc as VerifiableCredentialDto<any>)))
      const typedVerifiableCredentials: TypedVerifiableCredential[] = []
      for (const vc of verifiablePresentationDto.verifiableCredential) {
        typedVerifiableCredentials.push(this.transformVerifiableCredential(vc as VerifiableCredentialDto<any>))
      }
      const intent: IntentType = SsiTypesParserPipe.discoverIntent(typedVerifiableCredentials)
      return new TypedVerifiablePresentation(intent, typedVerifiableCredentials, originalVP)
    } catch (error) {
      throw new BadRequestException(`Transformation failed: ${error.message}`)
    }
  }

  //todo implement logic for other intents
  private static discoverIntent(typedVerifiableCredentials: TypedVerifiableCredential[]): IntentType {
    let hasEcosystemServiceOfferingCompliance = false
    let hasEcosystemParticipantCompliance = false
    let hasServiceOfferingCredential = false
    let hasGxServiceOfferingCompliance = false
    let hasGxParticipantCompliance = false
    let hasParticipantCredential = false
    for (const tvc of typedVerifiableCredentials) {
      //fixme: right now the way we're recognizing ecosystem compliance from gx-compliance is with their "id" field which is a hack. later we can change it to `issuer` or better than that each ecosystem will have their own compliance type, but for the lack of documentation, I'm not implementing that right now. take a look at src/tests/fixtures/2010VP/compliance-vps.json
      if (tvc.type === 'ParticipantCredential') {
        if (tvc.rawVerifiableCredential.id.startsWith('https://catalogue.gaia-x.eu')) {
          hasGxParticipantCompliance = true
        } else {
          hasEcosystemParticipantCompliance = true
        }
      } else if (tvc.type === 'ServiceOfferingCredentialExperimental') {
        if (tvc.rawVerifiableCredential.id.startsWith('https://catalogue.gaia-x.eu')) {
          hasGxServiceOfferingCompliance = true
        } else {
          hasEcosystemServiceOfferingCompliance = true
        }
      } else if (tvc.type === 'ServiceOffering') {
        hasServiceOfferingCredential = true
      } else if (tvc.type === 'Participant' || tvc.type === 'LegalPerson') {
        hasParticipantCredential = true
      }
    }

    if (hasEcosystemServiceOfferingCompliance) {
      return IntentType.ONBOARD_ECOSYSTEM_SERVICE_OFFERING
    } else if (hasEcosystemParticipantCompliance && hasServiceOfferingCredential) {
      if (hasServiceOfferingCredential) {
        return IntentType.GET_ECOSYSTEM_COMPLIANCE_SERVICE_OFFERING
      }
      return IntentType.ONBOARD_ECOSYSTEM_PARTICIPANT
    }
    // right now this can't work correctly so we have to handle it another way
    else if (hasParticipantCredential && hasGxParticipantCompliance && !hasServiceOfferingCredential) {
      if (getDidWeb() === 'did:web:compliance.gaia-x.eu') {
        return IntentType.ONBOARD_PARTICIPANT
      } else {
        return IntentType.GET_ECOSYSTEM_COMPLIANCE_PARTICIPANT
      }
    } else if (hasGxServiceOfferingCompliance) {
      return IntentType.ONBOARD_SERVICE_OFFERING
    } else if (hasServiceOfferingCredential) {
      return IntentType.GET_COMPLIANCE_SERVICE_OFFERING
    } else if (hasParticipantCredential) {
      return IntentType.GET_COMPLIANCE_PARTICIPANT
    }
  }

  public static hasVerifiableCredential(
    verifiablePresentation: VerifiablePresentationDto | IVerifiablePresentation,
    credentialType: string,
    issuerAddress?: string
  ): boolean {
    for (const vc of verifiablePresentation.verifiableCredential) {
      const type = getTypeFromSelfDescription(vc as VerifiableCredentialDto<any>)
      if (type === credentialType && ((issuerAddress && vc.issuer === issuerAddress) || !issuerAddress)) {
        return true
      }
    }
    return false
  }

  //fixme: right now we're returning the first instance, we have to think about: 1. is there a valid scenario in which we encounter 2 VCs of the same type and same issuer? 2. do we want to throw an error here if we encounter this situation?
  public static getTypedVerifiableCredentialWithTypeAndIssuer(
    typedVerifiablePresentation: TypedVerifiablePresentation,
    credentialType: string,
    issuerAddress: string
  ): TypedVerifiableCredential {
    for (const tvc of typedVerifiablePresentation.typedVerifiableCredentials) {
      if (tvc.type === credentialType && tvc.rawVerifiableCredential.issuer === issuerAddress) {
        return tvc
      }
    }
    return null
  }
}
