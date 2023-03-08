import { Injectable } from '@nestjs/common'
import { ValidationResult, ValidationResultDto } from '../../common/dto'
import { HttpService } from '@nestjs/axios'
import typer from 'media-typer'
import { Proof2210vpService } from '../../common/services/proof.2210vp.service'
import { ICredentialSubject, TypedVerifiablePresentation } from '../../common/@types/SSI.types'

@Injectable()
export class ServiceOfferingContentValidation2210vpService {
  constructor(private readonly proofService: Proof2210vpService, private readonly httpService: HttpService) {}

  async validateServiceOfferingCredentialSubject(credentialSubject: ICredentialSubject): Promise<ValidationResult> {
    const results = []
    if (credentialSubject.dataProtectionRegime) results.push(this.checkDataProtectionRegime(credentialSubject.dataProtectionRegime))
    if (credentialSubject.dataExport) results.push(this.checkDataExport(credentialSubject.dataExport))
    //TODO(ksadjad): do we need the following two?
    results.push(await this.CSR06_CheckDid(this.parseJSONLD(credentialSubject, 'did:web')))
    results.push(await this.CSR04_Checkhttp(this.parseJSONLD(credentialSubject, 'https://')))
    return this.mergeResults(...results)
  }

  async validate(serviceOfferingVP: TypedVerifiablePresentation, providedByResult?: ValidationResultDto): Promise<ValidationResult> {
    const results = []
    results.push(await this.checkVcprovider(serviceOfferingVP))
    //todo(ksadjad): here we should throw exception if we don't see any vc of this type
    results.push(await this.checkKeyChainProvider(serviceOfferingVP.getTypedVerifiableCredentials('LegalPerson')![0], serviceOfferingVP.getTypedVerifiableCredentials('ServiceOffering')))
    const data = serviceOfferingVP.getTypedVerifiableCredentials('ServiceOffering')[0]
    results.push(await this.validateServiceOfferingCredentialSubject(data.transformedCredentialSubject))
    if (!serviceOfferingVP.getTypedVerifiableCredentials('ServiceOffering').length) {
      results.push({
        conforms: false,
        results: ['Provider does not have a Compliance Credential']
      })
    }
    const mergedResults: ValidationResult = this.mergeResults(...results)
    if (!providedByResult || !providedByResult.conforms) {
      mergedResults.conforms = false
      mergedResults.results.push(
        !providedByResult?.conforms
          ? `providedBy: provided Participant SD does not conform.`
          : `providedBy: could not load Participant SD at ${data.transformedCredentialSubject.providedBy}.`
      )
    }

    return mergedResults
  }

  checkVcprovider(typedVerifiablePresentation: TypedVerifiablePresentation): ValidationResult {
    const result = { conforms: true, results: [] }
    if (!typedVerifiablePresentation.getTypedVerifiableCredentials('ComplianceCredential')) {
      result.conforms = false
      result.results.push('Provider does not have a Compliance Credential')
    }
    return result
  }
  async checkKeyChainProvider(Participant_SDCredential: any, Service_offering_SDCredential: any): Promise<ValidationResult> {
    //Only key comparison for now
    const result = { conforms: true, results: [] }
    const key_Participant = await this.proofService.getPublicKeys(Participant_SDCredential)
    const key_Service = await this.proofService.getPublicKeys(Service_offering_SDCredential)
    if (!key_Participant.publicKeyJwk || !key_Service.publicKeyJwk) {
      result.conforms = false
      result.results.push('KeychainCheck: Key cannot be retrieved')
    }
    const raw_participant = await this.proofService.loadCertificatesRaw(key_Participant.x5u)
    const raw_SO = await this.proofService.loadCertificatesRaw(key_Service.x5u)
    const SO_certificate_chain = raw_SO.split('-----END CERTIFICATE-----')
    const Participant_certificate_chain = raw_participant.split('-----END CERTIFICATE-----')
    SO_certificate_chain.pop()
    Participant_certificate_chain.pop()
    if (this.compare(SO_certificate_chain, Participant_certificate_chain) == false) {
      result.conforms = false
      result.results.push('KeychainCheck: Keys are not from the same keychain')
    }
    return result
  }

  compare(certchain1, certchain2): boolean {
    let includes = false
    for (let i = 0; i < certchain1.length; i++) {
      if (certchain2.includes(certchain1[i])) {
        includes = true
        break
      }
    }
    return includes
  }
  private checkDataProtectionRegime(dataProtectionRegime: any): ValidationResult {
    const dataProtectionRegimeList = ['GDPR2016', 'LGPD2019', 'PDPA2012', 'CCPA2018', 'VCDPA2021']
    const result = { conforms: true, results: [] }

    if (dataProtectionRegime && !dataProtectionRegimeList.includes(dataProtectionRegime[0])) {
      result.conforms = false
      result.results.push(`dataProtectionRegime: ${dataProtectionRegime} is not a valid dataProtectionRegime`)
    }

    return result
  }

  checkDataExport(dataExport: any): ValidationResult {
    const requestTypes = ['API', 'email', 'webform', 'unregisteredLetter', 'registeredLetter', 'supportCenter']
    const accessTypes = ['digital', 'physical']
    const result = { conforms: true, results: [] }

    if (!dataExport) {
      return { conforms: false, results: ['dataExport: types are missing.'] }
    }

    if (dataExport['gx-service-offering:requestType'] && !requestTypes.includes(dataExport['gx-service-offering:requestType'])) {
      result.conforms = false
      result.results.push(`requestType: ${dataExport['gx-service-offering:requestType']} is not a valid requestType`)
    }

    if (dataExport['gx-service-offering:accessType'] && !accessTypes.includes(dataExport['gx-service-offering:accessType'])) {
      result.conforms = false
      result.results.push(`accessType: ${dataExport['gx-service-offering:accessType']} is not a valid accessType`)
    }

    if (dataExport['gx-service-offering:formatType'] && !typer.test(dataExport['gx-service-offering:formatType'])) {
      result.conforms = false
      result.results.push(`formatType: ${dataExport['gx-service-offering:formatType']} is not a valid formatType`)
    }

    return result
  }

  parseJSONLD(jsonLD, type: string, values = [], tab = []) {
    for (const key in jsonLD) {
      if (jsonLD.hasOwnProperty(key)) {
        const element = jsonLD[key]
        if (typeof element === 'object') {
          this.parseJSONLD(element, type, values, tab)
        } else {
          values.push(element)
        }
      }
    }
    for (let i = 0; i < values.length; i++) {
      if (values[i].includes(type)) {
        tab.push(values[i])
      }
    }
    return tab.filter((item, index) => tab.indexOf(item) === index)
  }
  async checkDidUrls(arrayDids, invalidUrls = []) {
    await Promise.all(
      arrayDids.map(async element => {
        try {
          await this.httpService.get(element.replace('did:web:', 'https://')).toPromise()
        } catch (e) {
          invalidUrls.push(element)
        }
      })
    )
    return invalidUrls
  }
  async CSR06_CheckDid(jsonLd): Promise<ValidationResult> {
    const invalidUrls = await this.checkDidUrls(this.parseJSONLD(jsonLd, 'did:web:'))
    const isValid = invalidUrls.length == 0 ? true : false
    //return { ruleName: "CPR-08_CheckDid", status: isValid, invalidUrls: invalidUrls }
    return { conforms: isValid, results: invalidUrls }
  }

  async CSR04_Checkhttp(jsonLd): Promise<ValidationResult> {
    const invalidUrls = await this.checkUrls(this.parseJSONLD(jsonLd, 'https://'))
    const isValid = invalidUrls.length == 0 ? true : false
    return { conforms: isValid, results: invalidUrls }
  }

  async checkUrls(array, invalidUrls = []) {
    await Promise.all(
      array.map(async element => {
        try {
          await this.httpService.get(element).toPromise()
        } catch (e) {
          invalidUrls.push(element)
        }
      })
    )
    return invalidUrls
  }

  private mergeResults(...results: ValidationResult[]): ValidationResult {
    const resultArray = results.map(res => res.results)
    const res = resultArray.reduce((p, c) => c.concat(p))

    return {
      conforms: results.filter(r => !r.conforms).length == 0,
      results: res
    }
  }
}
