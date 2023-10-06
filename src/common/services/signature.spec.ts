import { Test } from '@nestjs/testing'
import { SignatureService } from './signature.service'
import { AppModule } from '../../app.module'
import participantSd from '../../tests/fixtures/participant-sd.json'
import participantMinimalSd from '../../tests/fixtures/participant-sd.json'
import serviceOfferingSd from '../../tests/fixtures/service-offering-sd.json'
import * as jose from 'jose'

describe.skip('SignatureService', () => {
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

  describe.skip('Validation of a Signature', () => {
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
})
