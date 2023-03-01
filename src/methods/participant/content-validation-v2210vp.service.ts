import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ValidationResult } from '../../@types/dto/common'
import countryCodes from '../../utils/static/validation/2206/iso-3166-2-country-codes.json'
import countryListEEA from '../../utils/static/validation/country-codes.json'
import { ParticipantSelfDescriptionDto } from '../../@types/dto/participant'
import { RegistryService } from '../common'
import { ParticipantSelfDescriptionV2210vpDto } from '../../@types/dto/participant/participant-sd-v2210vp.dto'
import { Address2210vpDto } from '../../@types/dto/common/address-2210vp.dto'
@Injectable()
export class ParticipantContentValidationV2210vpService {
  constructor(private readonly httpService: HttpService, private readonly registryService: RegistryService) {}

  async validate(data: ParticipantSelfDescriptionV2210vpDto): Promise<ValidationResult> {
    const { legalAddress, leiCode, registrationNumber } = data
    const checkUSAAndValidStateAbbreviation = this.checkUSAAndValidStateAbbreviation(legalAddress)

    const validationPromises: Promise<ValidationResult>[] = []
    validationPromises.push(this.checkRegistrationNumbers(registrationNumber))
    validationPromises.push(this.checkValidLeiCode(leiCode, data))
    // commenting this because gx has removed terms and conditions for LegalPerson credential
    // validationPromises.push(this.checkTermsAndConditions(termsAndConditions))
    validationPromises.push(this.CPR08_CheckDid(this.parseDid(data)))
    const results = await Promise.all(validationPromises)
    return this.mergeResults(...results, checkUSAAndValidStateAbbreviation)
  }

  async checkTermsAndConditions(termsAndConditionsHash: string): Promise<ValidationResult> {
    const errorMessage = 'Terms and Conditions does not match against SHA512 of the Generic Terms and Conditions'
    //TODO: update to 22.06 once available
    const tac = await this.registryService.getTermsAndConditions('22.04')

    return this.validateAgainstObject(tac, tac => tac.hash === termsAndConditionsHash, errorMessage)
  }

  private async getDataFromLeiCode(leiCode: string): Promise<Array<any>> {
    const URL = `https://api.gleif.org/api/v1/lei-records?filter%5Blei%5D=${leiCode}`
    try {
      const res = await this.httpService.get(URL).toPromise()
      return res.data.data
    } catch (error) {
      console.error(error)
    }
  }

  async checkValidLeiCode(leiCode: string, selfDescription: ParticipantSelfDescriptionV2210vpDto): Promise<ValidationResult> {
    let leiResult = { conforms: true, results: [] }
    if (!leiCode) return leiResult
    const leiData = await this.getLeiData(leiCode)

    if (leiData) leiResult = this.checkValidLeiCountries(leiData, selfDescription)
    else leiResult = { conforms: false, results: ['leiCode: the given leiCode is invalid or does not exist'] }
    return leiResult
  }

  checkValidLeiCountry(leiCountry: string, sdIsoCode: string, path: string): ValidationResult {
    const results = []
    const conforms = this.isValidLeiCountry(leiCountry, sdIsoCode)

    if (!conforms) {
      results.push(`leiCode: the ${path}.country in the lei-record needs to reference the same country as ${path}.code`)
    }

    return { conforms, results }
  }

  checkValidLeiCountries(leiData: any, selfDescription: ParticipantSelfDescriptionV2210vpDto): ValidationResult {
    const { legalAddress, headquartersAddress } = leiData[0].attributes.entity

    const checkValidLegalLeiCountry = this.checkValidLeiCountry(legalAddress.country, selfDescription.legalAddress?.['country-name'], 'legalAddress')
    const checkValidHeadquarterLeiCountry = this.checkValidLeiCountry(
      headquartersAddress.country,
      selfDescription.headquarterAddress?.['country-name'],
      'headquarterAddress'
    )

    return this.mergeResults(checkValidLegalLeiCountry, checkValidHeadquarterLeiCountry)
  }

  async getLeiData(leiCode: string): Promise<any> {
    const leiData = await this.getDataFromLeiCode(leiCode)

    const conforms = leiData && leiData[0] && leiData[0].attributes && leiData[0].attributes.entity

    return conforms ? leiData : undefined
  }

  // since gx made the type of registeration number a simple string, we're just looking if it is present
  async checkRegistrationNumbers(registrationNumber: string): Promise<ValidationResult> {
    try {
      if (registrationNumber) {
        return {
          conforms: true,
          results: []
        }
      }
    } catch (error) {
      console.error(error)
      return {
        conforms: false,
        results: ['registrationNumber could not be verified']
      }
    }
  }

  private async validateAgainstObject<T>(object: T, validateFn: (obj: T) => boolean, message: string): Promise<ValidationResult> {
    let conforms = false
    const results = [message]

    try {
      conforms = validateFn(object)
      // clear error message from results if conforms = true
      conforms && results.splice(0, results.length)

      return {
        conforms,
        results
      }
    } catch (e) {
      console.error(e.message)
      return {
        conforms,
        results
      }
    }
  }

  checkUSAAndValidStateAbbreviation(legalAddress: Address2210vpDto): ValidationResult {
    let conforms = true
    const results = []

    const country = this.getISO31662Country(legalAddress['country-name'])

    if (!country) {
      conforms = false
      results.push('legalAddress.code: needs to be a valid ISO-3166-2 country principal subdivision code')
    }

    return {
      conforms,
      results
    }
  }

  private mergeResults(...results: ValidationResult[]): ValidationResult {
    const resultArray = results.map(res => res.results)
    const res = resultArray.reduce((p, c) => c.concat(p))
    return {
      conforms: results.filter(r => !r.conforms).length == 0,
      results: res
    }
  }

  private getISO31661Country(country: string) {
    const result = countryListEEA.find(c => {
      return c.alpha2 === country || c.alpha3 === country || c.code === country
    })

    return result
  }

  private getISO31662Country(code: string) {
    const result = countryCodes.find(c => {
      return c.code === code || c.country_code === code
    })

    return result
  }

  private isValidLeiCountry(leiCountry: string, sdIsoCode: string): boolean {
    const leiCountryISO = this.getISO31661Country(leiCountry)
    const sdCountryISO = this.getISO31662Country(sdIsoCode)

    const countryMatches = leiCountryISO && sdCountryISO ? leiCountryISO?.alpha2 === sdCountryISO?.country_code : false

    return countryMatches
  }

  parseJSONLD(jsonLD, values = []) {
    for (const key in jsonLD) {
      if (jsonLD.hasOwnProperty(key)) {
        const element = jsonLD[key]
        if (typeof element === 'object') {
          this.parseJSONLD(element, values)
        } else {
          values.push(element)
        }
      }
    }
    return values
  }

  parseDid(jsonLD, tab = []) {
    const values = this.parseJSONLD(jsonLD)
    for (let i = 0; i < values.length; i++) {
      if (values[i].startsWith('did:web:')) {
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

  async CPR08_CheckDid(arr): Promise<ValidationResult> {
    const invalidUrls = await this.checkDidUrls(arr)
    const isValid = invalidUrls.length == 0 ? true : false
    //return { ruleName: "CPR-08_CheckDid", status: isValid, invalidUrls: invalidUrls }
    return { conforms: isValid, results: invalidUrls }
  }
}
