import { Test } from '@nestjs/testing'
import { SignatureService } from '../../methods/common'
import { AppModule } from '../../modules/app.module'
import participantSd from '../../tests/fixtures/participant-sd.json'
import participantMinimalSd from '../../tests/fixtures/participant-sd.json'
import serviceOfferingSd from '../../tests/fixtures/service-offering-sd.json'
import * as jose from 'jose'

describe('SignatureService', () => {
  const algorithm = 'PS256'
  let signatureService: SignatureService
  let publicKeyJwk: object
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      providers: [SignatureService]
    }).compile()
    const spki = `-----BEGIN CERTIFICATE-----
    MIIFMTCCBBmgAwIBAgISA3UCe5uAj+HkW/72snJ7gcLhMA0GCSqGSIb3DQEBCwUA
    MDIxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQswCQYDVQQD
    EwJSMzAeFw0yMjA5MTQxMzMxMzRaFw0yMjEyMTMxMzMxMzNaMCExHzAdBgNVBAMT
    FmRpZC1jbG91ZC5wb25kYXZlbi5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAw
    ggEKAoIBAQDm3J7fvXOE6LId8oO2r9kUaw/7pf8Y9nnDr4IZ9RSxfR7chNRLQpnH
    colA3FBNV1FQx0umANVhSDSY2ldOvcpbREqJ5Gr99zUBe+RBQCwbgXZJynIVTIok
    mmyeWLz9yowDM4dBMcWUl1IUx1mk1SYpDegeQGheOJqqF8Noz3RBmINNWXU/52SP
    QBBwSdIRc5yKnM0LzM5MAqDcvY//r0civGPBqLVdnF4pLkk3aPzkN/cFr5ujtMSX
    ikKcaD/NIvsP0ovW7fJeL5L5HeAf4I6KsQFsWUX5w+3mdUk6CvsH3Mt5JNiHkn9S
    RWAzh53gX4y82TblKDLelYvvNhqM0cvPAgMBAAGjggJQMIICTDAOBgNVHQ8BAf8E
    BAMCBaAwHQYDVR0lBBYwFAYIKwYBBQUHAwEGCCsGAQUFBwMCMAwGA1UdEwEB/wQC
    MAAwHQYDVR0OBBYEFIZJNmxgobgCdaq/zturWUZ4koGFMB8GA1UdIwQYMBaAFBQu
    sxe3WFbLrlAJQOYfr52LFMLGMFUGCCsGAQUFBwEBBEkwRzAhBggrBgEFBQcwAYYV
    aHR0cDovL3IzLm8ubGVuY3Iub3JnMCIGCCsGAQUFBzAChhZodHRwOi8vcjMuaS5s
    ZW5jci5vcmcvMCEGA1UdEQQaMBiCFmRpZC1jbG91ZC5wb25kYXZlbi5jb20wTAYD
    VR0gBEUwQzAIBgZngQwBAgEwNwYLKwYBBAGC3xMBAQEwKDAmBggrBgEFBQcCARYa
    aHR0cDovL2Nwcy5sZXRzZW5jcnlwdC5vcmcwggEDBgorBgEEAdZ5AgQCBIH0BIHx
    AO8AdQDfpV6raIJPH2yt7rhfTj5a6s2iEqRqXo47EsAgRFwqcwAAAYM8aZEfAAAE
    AwBGMEQCIDBtBU85pYufPTMirNQKta/hKWSgybgiQc6v2k58GMLQAiB/o3Bf0n9r
    YOBc0tAD4PdlAKyrIh8CszSlszG4YFHbfgB2ACl5vvCeOTkh8FZzn2Old+W+V32c
    YAr4+U1dJlwlXceEAAABgzxpkSIAAAQDAEcwRQIhAP3HK7ilZoBYsKWSEFa/muEo
    swib0O7BKCdee+Fih5+oAiA9dkjx5hrORZtq6rr+819MsGOy/mxO1l34YptAa0+F
    DTANBgkqhkiG9w0BAQsFAAOCAQEAs3Mvs4ZW1qIIIpWV5emMvnH1NTrKYyNHXPZu
    YLwJzwzKgau8TFgcNILtcYlreQpyon5e90IiqdBBztQLH+fqcHt56zfeiOQJVmzy
    q8K0dzg264+OFWBFHHoY2JCxwXjFaH78g8/ZmECffuVQxW3k2Y0rC5NufL0I3/zo
    7lvMp8Yi+zoyO9g4nBwnFZP9L2dpYDurZN4VVadAqtIcIhWHzb/G3U6Bxl1W5B5D
    uyM2ncvgPTo+KtT1P0kjtD8P9eTcBf903aVrJFNEKbQGM/eUWLy066qsQ5cRMZ66
    G5hritFAQc0bduNdX1ESPnuvPxcHKEFjQRsEnYiAtmqRwx9Tig==
    -----END CERTIFICATE-----`
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
})
