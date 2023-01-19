import { Injectable } from '@nestjs/common'
import { ServiceOfferingSelfDescriptionDto } from '../../@types/dto/service-offering'
import { SignedSelfDescriptionDto, ValidationResult, ValidationResultDto, VerifiableCredentialDto } from '../../@types/dto/common'
import { ProofService } from '../common/proof.service'

import typer from 'media-typer'
import { ParticipantSelfDescriptionDto, SignedParticipantSelfDescriptionDto } from 'src/@types/dto/participant'
@Injectable()
export class ServiceOfferingContentValidationService {
  constructor(
    private readonly proofService: ProofService
    ) {}

  async validate(Service_offering_SD: SignedSelfDescriptionDto<ServiceOfferingSelfDescriptionDto>, Provided_by_SD:SignedSelfDescriptionDto<ParticipantSelfDescriptionDto> , providedByResult?: ValidationResultDto): Promise<ValidationResult> {
    const results = []
    let data = Service_offering_SD.selfDescriptionCredential.credentialSubject
    results.push(this.checkDataProtectionRegime(data?.dataProtectionRegime))
    results.push(this.checkDataExport(data?.dataExport))
    results.push(this.checkVcprovider(Provided_by_SD))
    results.push(await this.checkKeyChainProvider(Provided_by_SD.selfDescriptionCredential, Service_offering_SD.selfDescriptionCredential))
    const mergedResults: ValidationResult = this.mergeResults(...results)

    if (!providedByResult || !providedByResult.conforms) {
      mergedResults.conforms = false
      mergedResults.results.push(
        !providedByResult?.conforms
          ? `providedBy: provided Participant SD does not conform.`
          : `providedBy: could not load Participant SD at ${data.providedBy}.`
      )
    }

    return mergedResults
  }

  private checkVcprovider(Participant_SD: SignedSelfDescriptionDto<ParticipantSelfDescriptionDto>): ValidationResult {
    const result = { conforms: true, results: [] }
      if(!Participant_SD.complianceCredential) {
      result.conforms = false
      result.results.push('Provider does not have a Compliance Credential')
    }
    return result
  }
  private async checkKeyChainProvider(Participant_SDCredential: any, Service_offering_SDCredential: any): Promise<ValidationResult> { //Only key comparison for now
    const result = { conforms: true, results: [] }
    const key_Participant = await this.proofService.getPublicKeys(Participant_SDCredential)
    let key_Service = await this.proofService.getPublicKeys(Service_offering_SDCredential)
    if( !key_Participant.publicKeyJwk || !key_Service.publicKeyJwk) {
      result.conforms = false
      result.results.push('KeychainCheck: Key cannot be retrieved')
    }
    if(JSON.stringify(key_Participant.publicKeyJwk) !== JSON.stringify(key_Service.publicKeyJwk) ) {
      result.conforms = false
      result.results.push('KeychainCheck: Service-offering self-description was not issued by provider')
    }
    return result
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


  private checkDataExport(dataExport: any): ValidationResult {
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

  private mergeResults(...results: ValidationResult[]): ValidationResult {
    const resultArray = results.map(res => res.results)
    const res = resultArray.reduce((p, c) => c.concat(p))

    return {
      conforms: results.filter(r => !r.conforms).length == 0,
      results: res
    }
  }
}
