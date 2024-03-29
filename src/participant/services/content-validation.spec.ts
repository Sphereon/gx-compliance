import { Test, TestingModule } from '@nestjs/testing'
import { ParticipantContentValidationService } from './content-validation.service'
import { ParticipantSelfDescriptionDto } from '../dto/participant-sd.dto'
import { HttpModule } from '@nestjs/axios'
import { AddressDto } from '../../common/dto'
import { RegistrationNumberDto, RegistrationNumberTypes } from '../dto/registration-number.dto'
import { CommonModule } from '../../common/common.module'

describe('ParticipantContentValidationService', () => {
  let participantContentValidationService: ParticipantContentValidationService

  const expectedErrorResult = expect.objectContaining({
    conforms: false,
    results: expect.arrayContaining([expect.any(String)])
  })

  const expectedValidResult = expect.objectContaining({
    conforms: true
  })

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [CommonModule, HttpModule],
      providers: [ParticipantContentValidationService]
    }).compile()

    participantContentValidationService = moduleRef.get<ParticipantContentValidationService>(ParticipantContentValidationService)
  })

  describe.skip(`Content validation`, () => {
    describe(`Check termsAndConditions`, () => {
      it.skip('returns true for SD with valid hash of termsAndConditions', async () => {
        const termsAndConditionsHash = '70c1d713215f95191a11d38fe2341faed27d19e083917bc8732ca4fea4976700'

        const checkTerms = await participantContentValidationService.checkTermsAndConditions(termsAndConditionsHash)

        expect(checkTerms).toEqual(expectedValidResult)
      })

      it('returns false for SD with invalid hash of termsAndConditions', async () => {
        const termsAndConditions =
          'The signing PARTICIPANT confirms that all indicated SERVICE OFFERINGS to be Gaia-X compliant, as defined in the applicable documents and as explicitly referenced and selected during the submission process.\nAlongside, the signing PARTICIPANT agrees as follows:\n-  signing PARTICIPANT will update its Gaia-X Self-Descriptions about any changes, be it technical, organisational, or legal - especially but not limited to contractual in regards of the indicated Service Offerings.\n-  signing PARTICIPANT in regards of the SERVICE OFFERING will maintain compliance with the applicable documents. \n-  signing PARTICIPANT is aware and accepts that wrongful statements will reflect a breach of contract and may cumulate to unfair competitive behaviour. \n-  signing PARTICIPANT is aware and accepts that the SERVICE OFFERING will be delisted where Gaia-X Association becomes aware of any inaccurate statements in regards of the SERVICE OFFERING which result in a non-compliance with the Trust Framework and Policy Rules document. \n-  signing PARTICIPANT is aware and accepts that in cases of systematic and deliberate misrepresentations Gaia-X Association is, without prejudice to claims and rights under the applicable law, is entitled to take actions as defined in the Architecture document - Operation model chapter - Self-Description Remediation section.'

        const checkTerms = await participantContentValidationService.checkTermsAndConditions(termsAndConditions)

        expect(checkTerms).toEqual(expectedErrorResult)
      })
    })

    describe.skip(`Check registrationNumber`, () => {
      const participantSDMock2206 = {
        legalAddress: {
          country_code: 'DE',
          code: 'DE-HH'
        },
        headquarterAddress: {
          country_code: 'DE',
          code: 'DE-HH'
        }
      } as unknown as ParticipantSelfDescriptionDto

      const registrationNumbers: { [key in RegistrationNumberTypes]: RegistrationNumberDto } = {
        //TODO: find valid EORI and add it here
        EORI: {
          type: 'EORI',
          number: 'DEHJFUGHT'
        },
        vatID: {
          type: 'vatID',
          number: 'DE346013532'
        },
        leiCode: {
          type: 'leiCode',
          number: '391200FJBNU0YW987L26'
        },
        local: {
          type: 'local',
          number: 'K1101R_HRB170364'
        },
        //TODO: add EUID check
        EUID: {
          type: 'EUID',
          number: 'NO_EUID_NUMBER'
        }
      }

      const invalidRegistrationNumber = 'INVALID_NUMBER'

      //TODO: enable with valid EORI
      it.skip('returns true for SD with valid registrationNumber of type eori', async () => {
        const checkEORIRegistrationNumber = await participantContentValidationService.checkRegistrationNumber(
          registrationNumbers.EORI,
          participantSDMock2206
        )

        expect(checkEORIRegistrationNumber).toEqual(expectedValidResult)
      })

      it.skip('returns false for SD with invalid registrationNumber of type eori', async () => {
        const checkEORIRegistrationNumber = await participantContentValidationService.checkRegistrationNumber(
          { ...registrationNumbers.EORI, number: invalidRegistrationNumber },
          participantSDMock2206
        )

        expect(checkEORIRegistrationNumber).toEqual(expectedErrorResult)
      })

      //TODO: enable once API works as expected
      it.skip('returns true for SD with valid registrationNumber of type vatID', async () => {
        const checkVatIDRegistrationNumber = await participantContentValidationService.checkRegistrationNumber(
          registrationNumbers.vatID,
          participantSDMock2206
        )

        expect(checkVatIDRegistrationNumber).toEqual(expectedValidResult)
      })

      it.skip('returns false for SD with invalid registrationNumber of type vatID', async () => {
        const checkVatIDRegistrationNumber = await participantContentValidationService.checkRegistrationNumber(
          { ...registrationNumbers.vatID, number: invalidRegistrationNumber },
          participantSDMock2206
        )

        expect(checkVatIDRegistrationNumber).toEqual(expectedErrorResult)
      })

      it('returns true for SD with valid registrationNumber of type leiCode', async () => {
        const checkLeiCodeRegistrationNumber = await participantContentValidationService.checkRegistrationNumber(
          registrationNumbers.leiCode,
          participantSDMock2206
        )

        expect(checkLeiCodeRegistrationNumber).toEqual(expectedValidResult)
      })

      it('returns false for SD with invalid registrationNumber of type leiCode', async () => {
        const checkLeiCodeRegistrationNumber = await participantContentValidationService.checkRegistrationNumber(
          { ...registrationNumbers.leiCode, number: invalidRegistrationNumber },
          participantSDMock2206
        )

        expect(checkLeiCodeRegistrationNumber).toEqual(expectedErrorResult)
      })

      it.skip('returns true for SD with valid registrationNumber of type local', async () => {
        const checkLeiCodeRegistrationNumber = await participantContentValidationService.checkRegistrationNumber(
          registrationNumbers.local,
          participantSDMock2206
        )

        expect(checkLeiCodeRegistrationNumber).toEqual(expectedValidResult)
      })

      it.skip('returns false for SD with invalid registrationNumber of type local', async () => {
        const checkLeiCodeRegistrationNumber = await participantContentValidationService.checkRegistrationNumber(
          { ...registrationNumbers.local, number: invalidRegistrationNumber },
          participantSDMock2206
        )

        expect(checkLeiCodeRegistrationNumber).toEqual(expectedErrorResult)
      })

      it.skip('returns true for SD with multiple valid registrationNumbers', async () => {
        const numbers: RegistrationNumberDto[] = Object.values(registrationNumbers)
          //TODO: add types back once working (see TODOs above)
          .filter(number => !['EORI', 'vatID'].includes(number.type))
          .map(number => number)

        const checkLeiCodeRegistrationNumber = await participantContentValidationService.checkRegistrationNumbers(numbers, participantSDMock2206)

        expect(checkLeiCodeRegistrationNumber).toEqual(expectedValidResult)
      })

      it('returns false for SD with multiple registrationNumbers including at least one invalid', async () => {
        const numbers: RegistrationNumberDto[] = Object.values(registrationNumbers).map(number => number)
        numbers.push({ type: 'local', number: invalidRegistrationNumber })

        const checkLeiCodeRegistrationNumber = await participantContentValidationService.checkRegistrationNumbers(numbers, participantSDMock2206)

        expect(checkLeiCodeRegistrationNumber).toEqual(expectedErrorResult)
      })
    })

    describe(`Check legalAddress.state to be two-letter state abbreviation if legalAddress.country is located in USA`, () => {
      const legalAddress: AddressDto = {
        code: 'US-CA'
      }
      const legalAddressFaulty: AddressDto = {
        code: 'USA-California'
      }

      it('returns true for SD with valid legalAddress.state', () => {
        const check = participantContentValidationService.checkUSAAndValidStateAbbreviation(legalAddress)

        expect(check).toEqual(expectedValidResult)
      })
      it('returns false and error description for SD with invalid legalAddress.state', () => {
        const check = participantContentValidationService.checkUSAAndValidStateAbbreviation(legalAddressFaulty)

        expect(check).toEqual(expectedErrorResult)
      })
    })

    describe(`Check gleif.org API for leiCode`, () => {
      const countryMock = {
        code: 'DE-HH'
      }
      const participantMock = {
        legalAddress: countryMock,
        headquarterAddress: countryMock
      }

      it('returns true for a valid LeiCode that exists', async () => {
        const validLeiCode = '391200FJBNU0YW987L26'
        const validationResult = await participantContentValidationService.checkValidLeiCode(
          validLeiCode,
          participantMock as unknown as ParticipantSelfDescriptionDto
        )

        expect(validationResult).toEqual(expectedValidResult)
      })

      it('returns false for an invalid LeiCode that does not exist', async () => {
        const invalidLeiCode = 'FFF'
        const validationResult = await participantContentValidationService.checkValidLeiCode(
          invalidLeiCode,
          participantMock as unknown as ParticipantSelfDescriptionDto
        )
        expect(validationResult).toEqual(expectedErrorResult)
      })

      it('returns true for SD with equal values for leiCode.headquarter.country and headquarterAddress.code', () => {
        const headquarterCountry = 'DEU'
        const headquarterAddresCountry = 'DE-HH'
        expect(participantContentValidationService.checkValidLeiCountry(headquarterCountry, headquarterAddresCountry, 'headquarterAddress')).toEqual(
          expectedValidResult
        )
      })

      it('returns false and error description for SD with different values for leiCode.headquarter.country and headquarterAddress.country', () => {
        const headquarterCountry = 'DE'
        const headquarterAddresCountry = 'IT'
        expect(participantContentValidationService.checkValidLeiCountry(headquarterCountry, headquarterAddresCountry, 'headquarterAddress')).toEqual(
          expectedErrorResult
        )
      })

      it('returns true for SD with equal values leiCode.legal.country and legalAddress.country', () => {
        const legalCountry = 'DE'
        const legalAddressCountry = 'DE-HH'
        expect(participantContentValidationService.checkValidLeiCountry(legalCountry, legalAddressCountry, 'legalAddress')).toEqual(
          expectedValidResult
        )
      })

      it('returns false and error description for SD with different values for leiCode.legal.country and legalAddress.country', () => {
        const legalCountry = 'DEU'
        const legalAddressCountry = 'IT'
        expect(participantContentValidationService.checkValidLeiCountry(legalCountry, legalAddressCountry, 'legalAddress')).toEqual(
          expectedErrorResult
        )
      })
    })
  })
})
