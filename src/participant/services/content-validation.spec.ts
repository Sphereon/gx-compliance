import { Test, TestingModule } from '@nestjs/testing'
import { ParticipantContentValidationService } from './content-validation.service'
import { HttpModule } from '@nestjs/axios'
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
    describe(`Check legalAddress.state to be two-letter state abbreviation if legalAddress.country is located in USA`, () => {
      const legalAddress = {
        countrySubdivisionCode: 'US-CA'
      }
      const legalAddressFaulty = {
        countrySubdivisionCode: 'USA-California'
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

    describe('CPR08_CheckDid', () => {
      it('Should return valid result if all URLs are valid', async () => {
        const validUrls = ['did:web:abc-federation.gaia-x.community', 'did:web:compliance.lab.gaia-x.eu::development']

        const result = await participantContentValidationService.CPR08_CheckDid(validUrls)

        expect(result).toEqual({ conforms: true, results: [] })
      }, 5000)

      it('Should return invalid result if there are invalid URLs', async () => {
        const invalidUrls = ['did:web:abc-federation.gaia-x.comm56468unity', 'did:web:abc-federation.gaia-x.community']
        const result = await participantContentValidationService.CPR08_CheckDid(invalidUrls)

        expect(result).toEqual({ conforms: false, results: ['did:web:abc-federation.gaia-x.comm56468unity'] })
      })
    })

    describe('checkDidUrls', () => {
      it('Should return empty array if all URLs are valid', async () => {
        const validUrls = [
          'did:web:abc-federation.gaia-x.community',
          'did:web:compliance.lab.gaia-x.eu::development',
          'did:web:docaposte.provider.gaia-x.community:participant:44abd1d1db9faafcb2f5a5384d491680ae7bd458b4e12dc5be831bb07d4f260f:data.json'
        ]

        const result = await participantContentValidationService.checkDidUrls(validUrls)

        expect(result).toEqual([])
      }, 5000)

      it('Should return array of invalid URLs if there are invalid URLs', async () => {
        const invalidUrls = ['did:web:abc-federation.gaia-x.community', 'did:web:abc-federation.gaia-x.c85ommunity']

        const result = await participantContentValidationService.checkDidUrls(invalidUrls)

        expect(result).toEqual(['did:web:abc-federation.gaia-x.c85ommunity'])
      }, 5000)
    })

    describe('parseDid', () => {
      it('Should return empty array if no DID is present in JSON-LD', () => {
        const jsonLD = { foo: 'bar' }

        const result = participantContentValidationService.parseDid(jsonLD)

        expect(result).toEqual([])
      })

      it('Should return array of unique DIDs present in JSON-LD', () => {
        const jsonLD = {
          '@context': 'https://w3id.org/did/v1',
          id: 'did:web:peer.africastalking.com',
          publicKey: [
            {
              id: 'did:web:peer.africastalking.com#keys-1',
              type: 'Ed25519VerificationKey2018',
              controller: 'did:web:peer.africastalking.com',
              publicKeyBase58: 'H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV'
            }
          ],
          authentication: ['did:web:peer.africastalking.com#keys-1']
        }

        const result = participantContentValidationService.parseDid(jsonLD)

        expect(result).toEqual(['did:web:peer.africastalking.com', 'did:web:peer.africastalking.com#keys-1'])
      })
    })

    describe('parseJSONLD', () => {
      it('should extract values from a JSON-LD object', () => {
        const jsonLD = {
          '@context': 'https://www.w3.org/ns/did/v1',
          id: 'did:web:identity.foundation',
          publicKey: [
            {
              id: 'did:web:identity.foundation#keys-1',
              type: 'Ed25519VerificationKey2018',
              controller: 'did:web:identity.foundation',
              publicKeyBase58: 'H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV'
            }
          ],
          authentication: [
            {
              type: 'Ed25519SignatureAuthentication2018',
              publicKey: 'did:web:identity.foundation#keys-1',
              secret: {
                a: '7x899d8aac'
              }
            }
          ],
          service: [
            {
              type: 'IdentityHub',
              serviceEndpoint: 'https://hub.identity.foundation'
            }
          ]
        }
        const values = participantContentValidationService.parseJSONLD(jsonLD)

        expect(values).toEqual([
          'https://www.w3.org/ns/did/v1',
          'did:web:identity.foundation',
          'did:web:identity.foundation#keys-1',
          'Ed25519VerificationKey2018',
          'did:web:identity.foundation',
          'H3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV',
          'Ed25519SignatureAuthentication2018',
          'did:web:identity.foundation#keys-1',
          '7x899d8aac',
          'IdentityHub',
          'https://hub.identity.foundation'
        ])
      })
    })
  })
})
