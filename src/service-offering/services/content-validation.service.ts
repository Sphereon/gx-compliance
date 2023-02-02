import { Injectable } from '@nestjs/common'
import { ServiceOfferingSelfDescriptionDto } from '../dto/service-offering-sd.dto'
import { ValidationResult, ValidationResultDto } from '../../common/dto'
import typer from 'media-typer'
@Injectable()
export class ServiceOfferingContentValidationService {
  async validate(data: ServiceOfferingSelfDescriptionDto, providedByResult?: ValidationResultDto): Promise<ValidationResult> {
    const results = []

    results.push(this.checkDataProtectionRegime(data?.dataProtectionRegime))
    results.push(this.checkDataExport(data?.dataExport))

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
