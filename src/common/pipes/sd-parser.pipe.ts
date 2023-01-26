import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'
import {
  AddressDto,
  CredentialSubjectDto,
  SignatureDto,
  SignedSelfDescriptionDto,
  VerifiableCredentialDto,
  VerifiableSelfDescriptionDto
} from '../dto'
import { SelfDescriptionTypes } from '../enums'
import { getTypeFromSelfDescription } from '../utils'
import { EXPECTED_PARTICIPANT_CONTEXT_TYPE, EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE } from '../constants'
import { RegistrationNumberDto } from '../../participant/dto/registration-number.dto'
import { ServiceOfferingSelfDescriptionDto } from '../../service-offering/dto'
import { ParticipantSelfDescriptionDto } from '../../participant/dto'
import { IVerifiablePresentation } from '../@types'

@Injectable()
export class SDParserPipe
  implements PipeTransform<VerifiableSelfDescriptionDto<CredentialSubjectDto>, SignedSelfDescriptionDto<CredentialSubjectDto>>
{
  constructor(private readonly sdType: string) {}

  // TODO extract to common const
  private readonly addressFields = ['legalAddress', 'headquarterAddress']

  transform(
    verifiableSelfDescriptionDto: VerifiableSelfDescriptionDto<CredentialSubjectDto> | VerifiableCredentialDto<any> | IVerifiablePresentation
  ): SignedSelfDescriptionDto<CredentialSubjectDto> {
    if (
      this.sdType === SelfDescriptionTypes.VC ||
      verifiableSelfDescriptionDto['selfDescriptionCredential']?.type.includes('VerifiablePresentation')
    ) {
      return this.transformVerifiableCredential(verifiableSelfDescriptionDto as VerifiableCredentialDto<any>)
    }
    try {
      const { complianceCredential, selfDescriptionCredential } = verifiableSelfDescriptionDto as VerifiableSelfDescriptionDto<CredentialSubjectDto>

      const type = getTypeFromSelfDescription(selfDescriptionCredential)
      if (this.sdType !== type) throw new BadRequestException(`Expected @type of ${this.sdType}`)

      const { credentialSubject } = selfDescriptionCredential
      delete selfDescriptionCredential.credentialSubject

      const flatten = {
        sd: { ...selfDescriptionCredential },
        cs: { ...credentialSubject }
      }

      for (const key of Object.keys(flatten)) {
        const keys = Object.keys(flatten[key])
        const cred = flatten[key]
        keys.forEach(key => {
          const strippedKey = this.replacePlaceholderInKey(key, type)
          cred[strippedKey] = this.getValueFromShacl(cred[key], strippedKey, type)
        })
      }

      return {
        selfDescriptionCredential: {
          ...flatten.sd,
          credentialSubject: { ...flatten.cs }
        } as VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>,
        proof: selfDescriptionCredential.proof as SignatureDto,
        raw: JSON.stringify({ ...selfDescriptionCredential, credentialSubject: { ...credentialSubject } }),
        rawCredentialSubject: JSON.stringify({ ...credentialSubject }),
        complianceCredential
      }
    } catch (error) {
      throw new BadRequestException(`Transformation failed: ${error.message}`)
    }
  }

  private getMinimalSelfDescription(type: string) {
    const minimalSelfDescriptions: { [key: string]: CredentialSubjectDto } = {
      [SelfDescriptionTypes.SERVICE_OFFERING]: {
        providedBy: undefined,
        termsAndConditions: undefined
      } as ServiceOfferingSelfDescriptionDto,
      [SelfDescriptionTypes.PARTICIPANT]: {
        registrationNumber: undefined,
        legalAddress: undefined,
        headquarterAddress: undefined
      } as ParticipantSelfDescriptionDto
    }

    if (!(type in minimalSelfDescriptions)) throw new BadRequestException(`Provided type of ${type} is not supported.`)

    return minimalSelfDescriptions[type]
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

  private transformVerifiableCredential(verifiableCredential: VerifiableCredentialDto<any>) {
    try {
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
        selfDescriptionCredential: {
          ...flatten.sd,
          credentialSubject: { ...flatten.cs }
        } as VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>,
        proof: verifiableCredential.proof as SignatureDto,
        raw: JSON.stringify({ ...verifiableCredential, credentialSubject: { ...credentialSubject } }),
        rawCredentialSubject: JSON.stringify({ ...credentialSubject })
      }
    } catch (error) {
      throw new BadRequestException(`Transformation failed: ${error.message}`)
    }
  }
}
