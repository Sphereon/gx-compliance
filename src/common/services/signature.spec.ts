import { Test } from '@nestjs/testing'
import { SignatureService } from './signature.service'
import { AppModule } from '../../app.module'
import participantSd from '../../tests/fixtures/participant-sd.json'
import participantMinimalSd from '../../tests/fixtures/participant-sd.json'
import serviceOfferingSd from '../../tests/fixtures/service-offering-sd.json'
import * as jose from 'jose'
import { readFileSync } from 'fs'
import { IVerifiableCredential, IVerifiablePresentation } from '@sphereon/ssi-types'
import { getDidWeb } from '../utils'

describe('SignatureService', () => {
  const algorithm = 'PS256'
  let signatureService: SignatureService
  let publicKeyJwk: object
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      providers: [SignatureService]
    }).compile()
    const spki = process.env.X509_CERTIFICATE
    signatureService = moduleRef.get<SignatureService>(SignatureService)
    const x509 = await jose.importX509(spki, algorithm)
    publicKeyJwk = await jose.exportJWK(x509)
  })

  describe('Validation of a Signature', () => {
    let jws: string
    let content: string
    beforeAll(async () => {
      content = 'c39e7623e8528aa405033640bfd186dfe7bcb29c4d77dfbfdd191efa915e280d'
      jws = await signatureService.sign(content)
      jws = jws.replace('..', `.${content}.`)
    })
    it('return a jws', async () => {
      const jws = await signatureService.sign(content)
      expect(jws).toMatch(/^ey[A-Za-z0-9]+..[A-Za-z0-9-_]+/)
    })

    it('returns true for a valid signature (content matches signature)', async () => {
      const { protectedHeader, content: signatureContent } = await signatureService.verify(jws, publicKeyJwk)

      expect(protectedHeader).toEqual({
        alg: 'PS256',
        b64: false,
        crit: ['b64']
      })
      expect(signatureContent).toEqual(content)
    })

    it('returns 409 for an invalid signature', async () => {
      const invalidJws =
        'eyJhbGciOiJQUzI1NiJ9.c2ltcGxlIHRlc3Q.m83AIUtdGBEps106sFDNfcXbL-bQhenPORI7ueuTHgBDY6SpHwRwRTl_Md1RkJz-eono-01g3pKoAe53UuIckwpaweflQq41nYWKXtxoMc_gjLofktQj5_bx0b-iDUuNNlBjamxzsVqYQMpc86372Xz-Hp4HNKSyvMQxyU0xot2l_FR7NMaNVNqDJOCjiURlQ3IKdx6oCjwafFulX7MqKSxsjJdYkTAQ-y-f_8LFxFo7z-Goo6I-V5SEjvoNV-3QOH8VUH1PJSYyDTtMq5ok76LE9CRha9te9lCRHvk0rQ8ZEAPHibBFGuy1w3OknPotX1HqhXaFLlAMAXES_genYQ'
      try {
        await signatureService.verify(invalidJws, publicKeyJwk)
      } catch (error) {
        expect(error.response.statusCode).toEqual(409)
      }
    })
  })

  describe('Validation of a normalized and serialized Self Description', () => {
    let canonizedParticipantSd
    let canonizedParticipantMinimalSd
    let canonizedParticipantSortedSd
    let canonizedServiceOfferingSd

    const sortObject = o =>
      Object.keys(o)
        .sort()
        .reduce((r, k) => ((r[k] = o[k]), r), {})

    beforeAll(async () => {
      delete participantSd.selfDescriptionCredential.proof
      delete participantMinimalSd.selfDescriptionCredential.proof

      const participantSdCopy = JSON.parse(JSON.stringify(participantSd.selfDescriptionCredential))
      const participantMinimalSdCopy = JSON.parse(JSON.stringify(participantMinimalSd.selfDescriptionCredential))
      const serviceOfferingSdCopy = JSON.parse(JSON.stringify(serviceOfferingSd.selfDescriptionCredential))

      participantSdCopy['@context'] = { credentialSubject: '@nest' }
      participantMinimalSdCopy['@context'] = { credentialSubject: '@nest' }
      serviceOfferingSdCopy['@context'] = { credentialSubject: '@nest' }

      const sortedParticipantSd = sortObject(participantSdCopy)

      canonizedParticipantSd = await signatureService.normalize(participantSdCopy)
      canonizedParticipantSortedSd = await signatureService.normalize(sortedParticipantSd)
      canonizedParticipantMinimalSd = await signatureService.normalize(participantMinimalSdCopy)
      canonizedServiceOfferingSd = await signatureService.normalize(serviceOfferingSdCopy)
    })

    it('returns true when the signature can be successfully verified and the decoded hash matches the input', async () => {
      const hash = signatureService.sha256(canonizedParticipantSd)
      const jws = (await signatureService.sign(hash)).replace('..', `.${hash}.`)
      const verifcationResult = await signatureService.verify(jws, publicKeyJwk)

      expect(verifcationResult.content).toEqual(hash)
    })

    it('returns false when the signature cannot be verified', async () => {
      const hash1 = signatureService.sha256(canonizedParticipantSd)
      const hash2 = signatureService.sha256(canonizedServiceOfferingSd)
      const jws = (await signatureService.sign(hash1)).replace('..', `.${hash1}.`)

      const verifcationResult = await signatureService.verify(jws, publicKeyJwk)

      expect(verifcationResult.content).not.toEqual(hash2)
    })

    it('returns true when decoded hashes matches for the same Self Description', async () => {
      const hash1 = signatureService.sha256(canonizedParticipantSd)
      const hash2 = signatureService.sha256(canonizedParticipantSd)

      const jws1 = (await signatureService.sign(hash1)).replace('..', `.${hash1}.`)
      const jws2 = (await signatureService.sign(hash2)).replace('..', `.${hash2}.`)

      const verifcationResult1 = await signatureService.verify(jws1, publicKeyJwk)
      const verifcationResult2 = await signatureService.verify(jws2, publicKeyJwk)

      expect(verifcationResult1.content).toEqual(verifcationResult2.content)
    })

    it('returns true when the different canonized Self Description are not equal', async () => {
      expect(canonizedParticipantSd).not.toEqual(canonizedServiceOfferingSd)
    })

    it('returns true when the same but different sorted Self Descriptions are equal', async () => {
      expect(canonizedParticipantSd).toEqual(canonizedParticipantSortedSd)
    })

    it('returns true when the same simple object with different order return the same hash', async () => {
      const hash1 = signatureService.sha256(canonizedParticipantSd)
      const hash2 = signatureService.sha256(canonizedParticipantSortedSd)

      expect(hash1).toEqual(hash2)
    })
    it('returns true when the same complex object with different order return the same hash', async () => {
      const hash1 = signatureService.sha256(canonizedParticipantMinimalSd)
      const hash2 = signatureService.sha256(canonizedParticipantMinimalSd)

      expect(hash1).toEqual(hash2)
    })
    it('returns true when different object return different hash', async () => {
      const hash1 = signatureService.sha256(canonizedParticipantSd)
      const hash2 = signatureService.sha256(canonizedServiceOfferingSd)

      expect(hash1).not.toEqual(hash2)
    })
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
      console.log(vp)
      const complianceCredential = await signatureService.createComplianceCredentialFromSelfDescription(vp)
      console.log(complianceCredential)
      expect(complianceCredential.proof[jws]).toBeDefined()
    })
  })
})
