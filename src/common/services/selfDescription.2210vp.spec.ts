import { Test, TestingModule } from '@nestjs/testing'

import { ParticipantModule } from '../../participant/participant.module'
import { AppModule } from '../../app.module'
import { IVerifiablePresentation } from '../@types/SSI.types'
import { SelfDescription2210vpService } from './selfDescription.2210vp.service'

describe('ParticipantService', () => {
  let selfDescriptionService: SelfDescription2210vpService

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule, ParticipantModule]
    }).compile()

    selfDescriptionService = moduleRef.get<SelfDescription2210vpService>(SelfDescription2210vpService)
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
