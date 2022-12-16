import { Test, TestingModule } from '@nestjs/testing'
import { SelfDescriptionService } from './selfDescription.service'
import { SDParserPipe } from '../pipes/sd-parser.pipe'

// Fixtures
import ParticipantSDFixture from '../../tests/fixtures/participant-sd.json'
import ParticipantSDFaultyFixture from '../../tests/fixtures/participant-sd-faulty.json'
import ParticipantSDMissingProofFixture from '../../tests/fixtures/participant-sd-faulty-missing-proof.json'
import ServiceOfferingSDFixture from '../../tests/fixtures/service-offering-sd.json'
import ServiceOfferingSDFaultyFixture from '../../tests/fixtures/service-offering-sd-faulty.json'

import { expectedErrorResult, expectedValidResult } from './shacl.spec'
import { ParticipantModule } from '../../participant/participant.module'
import { AppModule } from '../../app.module'
import {IVerifiablePresentation} from "@sphereon/ssi-types";

describe('ParticipantService', () => {
  let selfDescriptionService: SelfDescriptionService

  const transformPipeLegalPerson = new SDParserPipe('LegalPerson')
  const transformPipeServiceOffering = new SDParserPipe('ServiceOfferingExperimental')

  const expectedValidSDResult = expect.objectContaining({
    conforms: true,
    shape: expectedValidResult,
    isValidSignature: true
  })

  const expectedErrorSDResult = expect.objectContaining({
    conforms: false,
    shape: expectedErrorResult,
    isValidSignature: false
  })

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule, ParticipantModule]
    }).compile()

    selfDescriptionService = moduleRef.get<SelfDescriptionService>(SelfDescriptionService)
  })

  describe.skip(`Validation of Participant Self Descriptions`, () => {
    it('Validates a correct participant self description', async () => {
      const pipedSelfDescription = transformPipeLegalPerson.transform(ParticipantSDFixture as any)
      const result = await selfDescriptionService.validate(pipedSelfDescription)

      expect(result).toEqual(expectedValidSDResult)
    }, 15000)

    // TODO: enale after fix shape always conforms
    it.skip('Fails validation for a faulty participant self description', async () => {
      const pipedSelfDescription = transformPipeLegalPerson.transform(ParticipantSDFaultyFixture as any)
      const resultFaulty = await selfDescriptionService.validate(pipedSelfDescription)

      expect(resultFaulty).toEqual(expectedErrorSDResult)
    })

    // TODO implement right reponse - should not be 200 without proof
    it.skip('Fails validation for a participant self description without a proof object', async () => {
      const pipedSelfDescription = transformPipeLegalPerson.transform(ParticipantSDMissingProofFixture as any)
      const resultFaulty = await selfDescriptionService.validate(pipedSelfDescription)

      expect(resultFaulty).toEqual(expectedErrorSDResult)
    })
  })

  describe.skip(`Validation of Service Offering Self Descriptions`, () => {
    it('Validates a correct Service Offering self description', async () => {
      const pipedSelfDescription = transformPipeServiceOffering.transform(ServiceOfferingSDFixture as any)
      const result = await selfDescriptionService.validate(pipedSelfDescription)

      expect(result).toEqual(expectedValidSDResult)
    })

    // TODO: enale after fix shape always conforms
    it.skip('Failes validation for a faulty Service Offering self description', async () => {
      const pipedSelfDescription = transformPipeServiceOffering.transform(ServiceOfferingSDFaultyFixture as any)
      const resultFaulty = await selfDescriptionService.validate(pipedSelfDescription)

      expect(resultFaulty).toEqual(expectedErrorSDResult)
    })
  })
  describe('check self description verifiable presentation', () => {
    it('should pass with correct VP', async () => {
      const vp: IVerifiablePresentation = {
        '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
        type: ['VerifiablePresentation'],
        verifiableCredential: [
          {
            '@context': ['https://www.w3.org/2018/credentials/v1', 'https://registry.gaia-x.eu/v2206/api/shape'],
            type: ['VerifiableCredential', 'LegalPerson'],
            id: 'https://delta-dao.com/.well-known/participant.json',
            issuer: 'did:web:0c1b-2001-1c04-2b34-bb00-c366-4d7b-3320-824b.eu.ngrok.io',
            issuanceDate: '2022-09-15T20:05:20.997Z',
            credentialSubject: {
              id: 'did:web:0c1b-2001-1c04-2b34-bb00-c366-4d7b-3320-824b.eu.ngrok.io',
              'gx-participant:legalName': 'deltaDAO AG',
              'gx-participant:registrationNumber': {
                'gx-participant:registrationNumberType': 'leiCode',
                'gx-participant:registrationNumberNumber': '391200FJBNU0YW987L26'
              },
              'gx-participant:blockchainAccountId': '0x4C84a36fCDb7Bc750294A7f3B5ad5CA8F74C4A52',
              'gx-participant:headquarterAddress': {
                'gx-participant:addressCountryCode': 'DE',
                'gx-participant:addressCode': 'DE-HH',
                'gx-participant:streetAddress': 'Geibelstraße 46b',
                'gx-participant:postalCode': '22303'
              },
              'gx-participant:legalAddress': {
                'gx-participant:addressCountryCode': 'DE',
                'gx-participant:addressCode': 'DE-HH',
                'gx-participant:streetAddress': 'Geibelstraße 46b',
                'gx-participant:postalCode': '22303'
              },
              'gx-participant:termsAndConditions': '70c1d713215f95191a11d38fe2341faed27d19e083917bc8732ca4fea4976700'
            },
            proof: {
              type: 'JsonWebSignature2020',
              created: '2022-12-02T11:49:11.112Z',
              proofPurpose: 'assertionMethod',
              verificationMethod: 'did:web:0c1b-2001-1c04-2b34-bb00-c366-4d7b-3320-824b.eu.ngrok.io',
              jws: 'eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..SLtW5EW5QGk47QH7IlZ8LcixwIXPVR7JdSkeU9vyibTu9WqyDcaS7bOd5jwtMHCZLHK1lo4-ayjC1WVREJvvdTBnYndwqv4pd1fadyhBeXU08ifHI5QL2sRiye7yL2W2ZpCPpcA3vXXZ9cinHbjSAjQeOhI9_u1qKalB1ji-H1XvyX-lCG7OIyM9EZVgmpYTzsYRNKW_8J8Yaqa0Bln-j8DF93NlH5UNf4djoEIOTjWELAhbRJsBXiNe7X5rGrFtjjR_5LSiAR52OhoFnBJh0ZpvhhzAyHQ3cZ3KUR3fOtqO1YLe0hhYIRMSkJYjU2l-MeVV2nATIUt0_Ng5VaadIQ'
            }
          }
        ],
        holder: 'did:web:0c1b-2001-1c04-2b34-bb00-c366-4d7b-3320-824b.eu.ngrok.io',
        proof: {
          type: 'JsonWebSignature2020',
          created: '2022-12-02T11:49:11.112Z',
          proofPurpose: 'assertionMethod',
          verificationMethod: 'did:web:0c1b-2001-1c04-2b34-bb00-c366-4d7b-3320-824b.eu.ngrok.io',
          jws: 'eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..SLtW5EW5QGk47QH7IlZ8LcixwIXPVR7JdSkeU9vyibTu9WqyDcaS7bOd5jwtMHCZLHK1lo4-ayjC1WVREJvvdTBnYndwqv4pd1fadyhBeXU08ifHI5QL2sRiye7yL2W2ZpCPpcA3vXXZ9cinHbjSAjQeOhI9_u1qKalB1ji-H1XvyX-lCG7OIyM9EZVgmpYTzsYRNKW_8J8Yaqa0Bln-j8DF93NlH5UNf4djoEIOTjWELAhbRJsBXiNe7X5rGrFtjjR_5LSiAR52OhoFnBJh0ZpvhhzAyHQ3cZ3KUR3fOtqO1YLe0hhYIRMSkJYjU2l-MeVV2nATIUt0_Ng5VaadIQ'
        }
      }
      const response = await selfDescriptionService.validateSelfDescription(vp, 'LegalPerson')
      console.log(response)
    })
  })
})
