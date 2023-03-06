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

  describe(`Content validation`, () => {
    describe(`Check termsAndConditions`, () => {
      it.skip('returns true for SD with valid hash of termsAndConditions', async () => {
        const termsAndConditionsHash = '1c5367540d27366fb0a02c3bcaf04da905f663daf0fd4e06f6475fe1a0faaf35'

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
      it('returns true for SD with valid registrationNumber of type eori', async () => {
        const checkEORIRegistrationNumber = await participantContentValidationService.checkRegistrationNumber(
          registrationNumbers.EORI,
          participantSDMock2206
        )

        expect(checkEORIRegistrationNumber).toEqual(expectedValidResult)
      })

      it('returns false for SD with invalid registrationNumber of type eori', async () => {
        const checkEORIRegistrationNumber = await participantContentValidationService.checkRegistrationNumber(
          { ...registrationNumbers.EORI, number: invalidRegistrationNumber },
          participantSDMock2206
        )

        expect(checkEORIRegistrationNumber).toEqual(expectedErrorResult)
      })

      //TODO: enable once API works as expected
      it('returns true for SD with valid registrationNumber of type vatID', async () => {
        const checkVatIDRegistrationNumber = await participantContentValidationService.checkRegistrationNumber(
          registrationNumbers.vatID,
          participantSDMock2206
        )

        expect(checkVatIDRegistrationNumber).toEqual(expectedValidResult)
      })

      it('returns false for SD with invalid registrationNumber of type vatID', async () => {
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

      it('returns true for SD with valid registrationNumber of type local', async () => {
        const checkLeiCodeRegistrationNumber = await participantContentValidationService.checkRegistrationNumber(
          registrationNumbers.local,
          participantSDMock2206
        )

        expect(checkLeiCodeRegistrationNumber).toEqual(expectedValidResult)
      })

      it('returns false for SD with invalid registrationNumber of type local', async () => {
        const checkLeiCodeRegistrationNumber = await participantContentValidationService.checkRegistrationNumber(
          { ...registrationNumbers.local, number: invalidRegistrationNumber },
          participantSDMock2206
        )

        expect(checkLeiCodeRegistrationNumber).toEqual(expectedErrorResult)
      })

      it('returns true for SD with multiple valid registrationNumbers', async () => {
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
    describe('CPR08_CheckDid', () => {
      it('Should return valid result if all URLs are valid', async () => {
        const validUrls = ['did:web:abc-federation.gaia-x.community', 'did:web:compliance.gaia-x.eu']
        const mockCheckDidUrls = jest.fn().mockResolvedValue([])
        const instance = { checkDidUrls: mockCheckDidUrls }
    
        const result = await participantContentValidationService.CPR08_CheckDid(validUrls)
    
        expect(result).toEqual({ conforms: true, results: [] })
       // expect(mockCheckDidUrls).toHaveBeenCalledWith(validUrls)
      })
    
      it('Should return invalid result if there are invalid URLs', async () => {
        const invalidUrls = ['did:web:abc-federation.gaia-x.comm56468unity', 'did:web:abc-federation.gaia-x.community']
        const result = await participantContentValidationService.CPR08_CheckDid(invalidUrls)
    
        expect(result).toEqual({ conforms: false, results: ['did:web:abc-federation.gaia-x.comm56468unity'] })
      })
    })

    describe('checkDidUrls', () => {
      it('Should return empty array if all URLs are valid', async () => {
        const validUrls = ['did:web:abc-federation.gaia-x.community', 'did:web:compliance.gaia-x.eu']
        const mockHttpService = { get: jest.fn().mockResolvedValue({}) }
        //const instance = { httpService: mockHttpService }
    
        const result = await participantContentValidationService.checkDidUrls(validUrls)
    
        expect(result).toEqual([])
      })
    
      it('Should return array of invalid URLs if there are invalid URLs', async () => {
        const invalidUrls = ['did:web:abc-federation.gaia-x.community', 'did:web:abc-federation.gaia-x.c85ommunity']
    
        const result = await participantContentValidationService.checkDidUrls(invalidUrls)
    
        expect(result).toEqual(['did:web:abc-federation.gaia-x.c85ommunity'])
      })
    }) 
    
    describe('parseDid', () => {
      it('Should return empty array if no DID is present in JSON-LD', () => {
        const jsonLD = { foo: 'bar' }
    
        const result = participantContentValidationService.parseDid(jsonLD)
    
        expect(result).toEqual([])
      })
    
      it('Should return array of unique DIDs present in JSON-LD', () => {
        const jsonLD = {
          "@context": "https://w3id.org/did/v1",
          "id": "did:web:peer.africastalking.com",
          "publicKey": [
            {
              "id": "did:web:peer.africastalking.com#keys-1",
              "type": "Ed25519VerificationKey2018",
              "controller": "did:web:peer.africastalking.com",
              "publicKeyBase58": "H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV"
            }
          ],
          "authentication": [
            "did:web:peer.africastalking.com#keys-1"
          ]
        }
    
        const result = participantContentValidationService.parseDid(jsonLD)
    
        expect(result).toEqual(['did:web:peer.africastalking.com', 'did:web:peer.africastalking.com#keys-1'])
      })
    })

    describe('parseJSONLD', () => {
      it('should extract values from a JSON-LD object', () => {
        const jsonLD = {
          "@context": "https://www.w3.org/ns/did/v1",
          "id": "did:web:identity.foundation",
          "publicKey": [{
            "id": "did:web:identity.foundation#keys-1",
            "type": "Ed25519VerificationKey2018",
            "controller": "did:web:identity.foundation",
            "publicKeyBase58": "H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV"
          }],
          "authentication": [{
            "type": "Ed25519SignatureAuthentication2018",
            "publicKey": "did:web:identity.foundation#keys-1",
            "secret": {
              "a": "7x899d8aac"
            }
          }],
          "service": [{
            "type": "IdentityHub",
            "serviceEndpoint": "https://hub.identity.foundation"
          }]
        };
        const values = participantContentValidationService.parseJSONLD(jsonLD);
    
        expect(values).toEqual([
          "https://www.w3.org/ns/did/v1",
          "did:web:identity.foundation",
          "did:web:identity.foundation#keys-1",
          "Ed25519VerificationKey2018",
          "did:web:identity.foundation",
          "H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV",
          "Ed25519SignatureAuthentication2018",
          "did:web:identity.foundation#keys-1",
          "7x899d8aac",
          "IdentityHub",
          "https://hub.identity.foundation"
        ]);
      });
    });

  })
})
