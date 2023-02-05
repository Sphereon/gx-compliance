import { Test } from '@nestjs/testing'
import { AppModule } from '../app.module'
import * as jose from 'jose'
import { Signature2210vpService } from '../methods/common/signature.2010vp.service'
import { IVerifiableCredential, IVerifiablePresentation } from '../@types/type/SSI.types'

describe('SignatureService', () => {
  const algorithm = 'PS256'
  let signatureService: Signature2210vpService
  let publicKeyJwk: object
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      providers: [Signature2210vpService]
    }).compile()
    const spki = process.env.X509_CERTIFICATE
    signatureService = moduleRef.get<Signature2210vpService>(Signature2210vpService)
    const x509 = await jose.importX509(spki, algorithm)
    publicKeyJwk = await jose.exportJWK(x509)
  })

  describe('sphereon tests', () => {
    it('should create a new VP and return a compliance credential', async () => {
      const vc: IVerifiableCredential = {
        '@context': ['https://www.w3.org/2018/credentials/v1', 'https://registry.gaia-x.eu/v2206/api/shape'],
        type: ['VerifiableCredential', 'LegalPerson'],
        id: 'ccdc3c22-0e4c-486a-ae8a-e7e12260272d',
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
      const normalizedSD: string = await signatureService.normalize(vc)
      const hash: string = signatureService.sha256(normalizedSD)
      const jws = await signatureService.sign(hash)
      const vp: IVerifiablePresentation = {
        type: ['VerifiablePresentation'],
        '@context': ['https://www.w3.org/2018/credentials/v1', 'https://www.w3.org/2018/credentials/examples/v1'],
        verifiableCredential: [vc],
        proof: {
          type: 'JsonWebSignature2020',
          created: new Date().toISOString(),
          proofPurpose: 'assertionMethod',
          challenge: '' + new Date().getFullYear() + new Date().getUTCMonth() + new Date().getUTCDay(),
          jws,
          verificationMethod: vc.issuer + '#JWK2020-RSA'
        }
      }
      const complianceCredential = await signatureService.createComplianceCredentialFromSelfDescription(vp)
      expect(complianceCredential.proof[jws]).toBeDefined()
    })
  })
})
