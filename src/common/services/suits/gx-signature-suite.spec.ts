import { Test, TestingModule } from '@nestjs/testing'
import nock from 'nock'
import { GxSignatureSuite } from './gx-signature-suite'
import { ICredential, IVerifiableCredential } from '../../@types'

describe('ProofService', () => {
  let gxSignatureSuite: GxSignatureSuite

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [GxSignatureSuite],
      providers: [GxSignatureSuite]
    }).compile()

    gxSignatureSuite = moduleFixture.get<GxSignatureSuite>(GxSignatureSuite)
  })

  beforeEach(() => {
    nock.cleanAll()
  })

  it('should be defined', () => {
    expect(gxSignatureSuite).toBeDefined()
  })

  it('returns true if creates a VC successfully', async () => {
    const credential: ICredential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://registry.gaia-x.eu/v2206/api/shape',
        'https://w3id.org/security/suites/jws-2020/v1'
      ],
      issuer: 'did:web:f825-87-213-241-251.eu.ngrok.io',
      id: '4a4a17c5-9446-41cb-8397-1a4adc68101e',
      credentialSubject: {
        id: 'did:web:f825-87-213-241-251.eu.ngrok.io',
        'gx-participant:name': 'Sphereon',
        'gx-participant:legalName': 'Sphereon BV',
        'gx-participant:website': 'https://participant',
        'gx-participant:registrationNumber': [
          {
            'gx-participant:registrationNumberType': 'localCode',
            'gx-participant:registrationNumberNumber': 'NL001234567B01'
          },
          {
            'gx-participant:registrationNumberType': 'leiCode',
            'gx-participant:registrationNumberNumber': '9695007586GCAKPYJ703'
          },
          {
            'gx-participant:registrationNumberType': 'EUID',
            'gx-participant:registrationNumberNumber': 'FR5910.424761419'
          }
        ],
        'gx-participant:headquarterAddress': {
          'gx-participant:addressCountryCode': 'FR',
          'gx-participant:addressCode': 'FR-HDF',
          'gx-participant:streetAddress': '2 rue Kellermann',
          'gx-participant:postalCode': '59100',
          'gx-participant:locality': 'Roubaix'
        },
        'gx-participant:legalAddress': {
          'gx-participant:addressCountryCode': 'FR',
          'gx-participant:addressCode': 'FR-HDF',
          'gx-participant:streetAddress': '2 rue Kellermann',
          'gx-participant:postalCode': '59100',
          'gx-participant:locality': 'Roubaix'
        },
        'gx-participant:termsAndConditions': '70c1d713215f95191a11d38fe2341faed27d19e083917bc8732ca4fea4976700'
      },
      type: ['VerifiableCredential', 'LegalPerson'],
      issuanceDate: '2023-01-16T09:50:21.773Z'
    }
    const vc: IVerifiableCredential = await gxSignatureSuite.signCredential(credential)
    expect(vc.proof).toBeDefined()
  }, 30000)

  // @nklomp
  it('returns true if VC successfully verifies', async () => {
    const credential: ICredential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://registry.gaia-x.eu/v2206/api/shape',
        'https://w3id.org/security/suites/jws-2020/v1'
      ],
      issuer: 'did:web:f825-87-213-241-251.eu.ngrok.io',
      id: '4a4a17c5-9446-41cb-8397-1a4adc68101e',
      credentialSubject: {
        id: 'did:web:f825-87-213-241-251.eu.ngrok.io',
        'gx-participant:name': 'Sphereon',
        'gx-participant:legalName': 'Sphereon BV',
        'gx-participant:website': 'https://participant',
        'gx-participant:registrationNumber': [
          {
            'gx-participant:registrationNumberType': 'localCode',
            'gx-participant:registrationNumberNumber': 'NL001234567B01'
          },
          {
            'gx-participant:registrationNumberType': 'leiCode',
            'gx-participant:registrationNumberNumber': '9695007586GCAKPYJ703'
          },
          {
            'gx-participant:registrationNumberType': 'EUID',
            'gx-participant:registrationNumberNumber': 'FR5910.424761419'
          }
        ],
        'gx-participant:headquarterAddress': {
          'gx-participant:addressCountryCode': 'FR',
          'gx-participant:addressCode': 'FR-HDF',
          'gx-participant:streetAddress': '2 rue Kellermann',
          'gx-participant:postalCode': '59100',
          'gx-participant:locality': 'Roubaix'
        },
        'gx-participant:legalAddress': {
          'gx-participant:addressCountryCode': 'FR',
          'gx-participant:addressCode': 'FR-HDF',
          'gx-participant:streetAddress': '2 rue Kellermann',
          'gx-participant:postalCode': '59100',
          'gx-participant:locality': 'Roubaix'
        },
        'gx-participant:termsAndConditions': '70c1d713215f95191a11d38fe2341faed27d19e083917bc8732ca4fea4976700'
      },
      type: ['VerifiableCredential', 'LegalPerson'],
      issuanceDate: '2023-01-16T09:50:21.773Z'
    }
    const vc: IVerifiableCredential = await gxSignatureSuite.signCredential(credential)
    /**
     * {
     *   "code": "ERR_JWS_SIGNATURE_VERIFICATION_FAILED",
     *   "name": "JWSSignatureVerificationFailed",
     *   "message": "signature verification failed"
     * }
     */
    const verificationResult = await gxSignatureSuite.checkVerifiableDataProof(vc)
    expect(verificationResult).toBe(true)
  }, 30000)
})
