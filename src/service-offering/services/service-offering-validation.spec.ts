import { Test, TestingModule } from '@nestjs/testing'
import { CommonModule } from '../../common/common.module'
import { ServiceOfferingContentValidationService } from './content-validation.service'
import { HttpModule } from '@nestjs/axios'
import { NotImplementedException } from '@nestjs/common'
import { SignedSelfDescriptionDto } from 'src/common/dto'
import { ParticipantSelfDescriptionDto } from 'src/participant/dto'

describe('ParticipantContentValidationService', () => {
  let serviceOfferingContentValidationService: ServiceOfferingContentValidationService

  const participantSD = {
    complianceCredential: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'ParticipantCredential'],
      id: 'https://catalogue.gaia-x.eu/credentials/ParticipantCredential/1664629337488',
      issuer: 'did:web:compliance.lab.gaia-x.eu::development',
      issuanceDate: '2022-10-01T13:02:17.489Z',
      credentialSubject: {
        id: 'did:web:compliance.lab.gaia-x.eu::development',
        hash: '3280866b1b8509ce287850fb113dc76d1334959c759f82a57415164d7a3a4026'
      },
      proof: {
        type: 'JsonWebSignature2020',
        created: '2022-10-01T13:02:17.489Z',
        proofPurpose: 'assertionMethod',
        jws: 'eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..YQAIjkqX6OL4U3efV0zumn8-l8c4wQo98SOSlzt53HOR8qlLu5L5lmwZJnAsR7gKW-6jv5GBT0X4ORQ1ozLvihFj6eaxxJNgzLFPoH5w9UEaEIO8mMGyeQ-YQYWBbET3IK1mcHm2VskEsvpLvQGnk6kYJCXJzmaHMRSF3WOjNq_JWN8g-SldiGhgfKsJvIkjCeRm3kCt_UVeHMX6SoLMFDjI8JVxD9d5AG-kbK-xb13mTMdtbcyBtBJ_ahQcbNaxH-CfSDTSN51szLJBG-Ok-OlMagHY_1dqViXAKl4T5ShoS9fjxQItJvFPGA14axkY6s00xKVCUusi31se6rxC9g',
        verificationMethod: 'did:web:compliance.lab.gaia-x.eu::development'
      }
    }
  }

  const serviceOffering = {
    selfDescriptionCredential: {
      '@context': ['https://www.w3.org/2018/credentials/v1', 'https://registry.gaia-x.eu/v2206/api/shape'],
      type: ['VerifiableCredential', 'ServiceOfferingExperimental'],
      id: 'https://compliance.gaia-x.eu/.well-known/serviceComplianceService.json',
      issuer: 'did:web:delta-dao.com',
      issuanceDate: '2022-09-25T23:23:23.235Z',
      credentialSubject: {
        id: 'https://compliance.gaia-x.eu/.well-known/serviceComplianceService.json',
        'gx-service-offering:providedBy': 'https://compliance.gaia-x.eu/.well-known/participant.json',
        'gx-service-offering:name': 'Gaia-X Lab Compliance Service',
        'gx-service-offering:description':
          'The Compliance Service will validate the shape and content of Self Descriptions. Required fields and consistency rules are defined in the Gaia-X Trust Framework.',
        'gx-service-offering:webAddress': 'https://compliance.gaia-x.eu/',
        'gx-service-offering:termsAndConditions': [
          {
            'gx-service-offering:url': 'https://compliance.gaia-x.eu/terms',
            'gx-service-offering:hash': 'myrandomhash'
          }
        ],
        'gx-service-offering:gdpr': [
          {
            'gx-service-offering:imprint': 'https://gaia-x.eu/imprint/'
          },
          {
            'gx-service-offering:privacyPolicy': 'https://gaia-x.eu/privacy-policy/'
          }
        ],
        'gx-service-offering:dataProtectionRegime': ['GDPR2016'],
        'gx-service-offering:dataExport': [
          {
            'gx-service-offering:requestType': 'email',
            'gx-service-offering:accessType': 'digital',
            'gx-service-offering:formatType': 'mime/png'
          }
        ],
        'gx-service-offering:dependsOn': [
          'https://compliance.gaia-x.eu/.well-known/serviceManagedPostgreSQLOVH.json',
          'https://compliance.gaia-x.eu/.well-known/serviceManagedK8sOVH.json'
        ]
      },
      proof: {
        type: 'JsonWebSignature2020',
        created: '2022-09-25T22:36:50.274Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:web:compliance.lab.gaia-x.eu::development',
        jws: 'eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..Chbzpl0-4S3sobkKXyBjfx6pm74xLHInOmruHUmO--3HpMcrfKldeJQPYLrUWsEJ1HIjMUqxE6QymZRxXfuRlAJKy2nwyM3S5sFX9YJ8bepBcf6q-nWGTDX-jh8wuyX3lwrG94aJnTBByKPLCovSiZ9BURR3cwiSHczBlM7iP90ee5roHOtI-eoqSBYrYaynTaK5eQaWfT-2OdXYgqVPSRJAK2KD5AqEM8KU7x6nnP6-shgSNBIEC1fAOTfAEUYkcrK8Tn4BTaH02HnO3B90S1MWyAWwBzrnmS915CFY4BiHsp9Tz7pt016c8HB8HE7gqoXndk7DUhzgNE2mRbHuLg'
      }
    }
  }

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [CommonModule, HttpModule],
      providers: [ServiceOfferingContentValidationService]
    }).compile()

    serviceOfferingContentValidationService = moduleRef.get<ServiceOfferingContentValidationService>(ServiceOfferingContentValidationService)
  })

  describe.skip(`Content validation`, () => {
    it('Validates a correct minimal Service Offering Self Description', async () => {
      throw new NotImplementedException()
    })
  })

  describe('CSR04_CheckHttp', () => {
    it('Should return valid result if all URLs are valid', async () => {
      const validUrls = ['https://abc-federation.gaia-x.community', 'https://compliance.lab.gaia-x.eu/development']

      const result = await serviceOfferingContentValidationService.CSR04_Checkhttp(validUrls)

      expect(result).toEqual({ conforms: true, results: [] })
    })

    it('Should return invalid result if there are invalid URLs', async () => {
      const invalidUrls = ['https://abc-federation.gaia-x.comm56468unity', 'https://abc-federation.gaia-x.community']
      const result = await serviceOfferingContentValidationService.CSR04_Checkhttp(invalidUrls)

      expect(result).toEqual({ conforms: false, results: ['https://abc-federation.gaia-x.comm56468unity'] })
    })
  })

  describe('checkDidUrls', () => {
    it('Should return empty array if all URLs are valid', async () => {
      const validUrls = ['did:web:abc-federation.gaia-x.community', 'did:web:compliance.lab.gaia-x.eu::development']

      const result = await serviceOfferingContentValidationService.checkDidUrls(validUrls)

      expect(result).toEqual([])
    })

    it('Should return array of invalid URLs if there are invalid URLs', async () => {
      const invalidUrls = ['did:web:abc-federation.gaia-x.community', 'did:web:abc-federation.gaia-x.c85ommunity']

      const result = await serviceOfferingContentValidationService.checkDidUrls(invalidUrls)

      expect(result).toEqual(['did:web:abc-federation.gaia-x.c85ommunity'])
    }, 10000)
  })

  describe('CSR06_CheckDid', () => {
    it('Should return valid result if all URLs are valid', async () => {
      const validUrls = ['did:web:abc-federation.gaia-x.community', 'did:web:compliance.lab.gaia-x.eu::development']

      const result = await serviceOfferingContentValidationService.CSR06_CheckDid(validUrls)

      expect(result).toEqual({ conforms: true, results: [] })
    }, 10000)

    it('Should return invalid result if there are invalid URLs', async () => {
      const invalidUrls = ['did:web:abc-federation.gaia-x.comm56468unity', 'did:web:abc-federation.gaia-x.community']
      const result = await serviceOfferingContentValidationService.CSR06_CheckDid(invalidUrls)

      expect(result).toEqual({ conforms: false, results: ['did:web:abc-federation.gaia-x.comm56468unity'] })
    })
  })

  describe('checkVcprovider', () => {
    it('returns false if the participant does not have a Compliance Credential', async () => {
      const Participant_SD = { rawCredentialSubject: '', raw: '', selfDescriptionCredential: undefined }
      const result = serviceOfferingContentValidationService.checkVcprovider(Participant_SD)
      expect(result).toEqual({ conforms: false, results: ['Provider does not have a Compliance Credential'] })
    })

    it('returns true if the participant has a Compliance Credential', async () => {
      const Participant_SD: SignedSelfDescriptionDto<ParticipantSelfDescriptionDto> = {
        rawCredentialSubject: '',
        raw: '',
        selfDescriptionCredential: undefined,
        complianceCredential: {
          '@context': ['https://www.w3.org/2018/credentials/v1'],
          type: ['VerifiableCredential', 'ParticipantCredential'],
          id: 'https://catalogue.gaia-x.eu/credentials/ParticipantCredential/1664629337488',
          issuer: 'did:web:compliance.ga7ia-x.eu',
          issuanceDate: '2022-10-01T13:02:17.489Z',
          credentialSubject: {
            id: 'did:web:compliance.gaia-x.eu',
            hash: '3280866b1b8509ce287850fb113dc76d1334959c759f82a57415164d7a3a4026'
          },
          proof: {
            type: 'JsonWebSignature2020',
            created: '2022-10-01T13:02:17.489Z',
            proofPurpose: 'assertionMethod',
            jws: 'eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..YQAIjkqX6OL4U3efV0zumn8-l8c4wQo98SOSlzt53HOR8qlLu5L5lmwZJnAsR7gKW-6jv5GBT0X4ORQ1ozLvihFj6eaxxJNgzLFPoH5w9UEaEIO8mMGyeQ-YQYWBbET3IK1mcHm2VskEsvpLvQGnk6kYJCXJzmaHMRSF3WOjNq_JWN8g-SldiGhgfKsJvIkjCeRm3kCt_UVeHMX6SoLMFDjI8JVxD9d5AG-kbK-xb13mTMdtbcyBtBJ_ahQcbNaxH-CfSDTSN51szLJBG-Ok-OlMagHY_1dqViXAKl4T5ShoS9fjxQItJvFPGA14axkY6s00xKVCUusi31se6rxC9g',
            verificationMethod: 'did:web:compliance.gaia-x.eu'
          }
        }
      }
      const result = serviceOfferingContentValidationService.checkVcprovider(Participant_SD)
      expect(result).toEqual({ conforms: true, results: [] })
    })
  })

  describe('checkKeyChainProvider', () => {
    it('returns conforms=true and an empty results array if the keys belong to the same keychain', async () => {
      const p_sd = participantSD.complianceCredential
      const so = serviceOffering.selfDescriptionCredential

      const result = await serviceOfferingContentValidationService.checkKeyChainProvider(p_sd, so)
      expect(result).toEqual({ conforms: true, results: [] })
    })
  })

  describe('compare function', () => {
    it('should return true if certchain2 includes certchain1', () => {
      const certchain1 = ['cert1', 'cert2']
      const certchain2 = ['cert2', 'cert3', 'cert1']
      expect(serviceOfferingContentValidationService.compare(certchain1, certchain2)).toBe(true)
    })

    it('should return false if certchain2 does not include certchain1', () => {
      const certchain1 = ['cert1', 'cert2']
      const certchain2 = ['cert3', 'cert4']
      expect(serviceOfferingContentValidationService.compare(certchain1, certchain2)).toBe(false)
    })
  })

  describe('checkDataExport function', () => {
    it('should return an object with conforms set to false and the appropriate error message if dataExport is missing', () => {
      const dataExport = null
      const expectedResult = { conforms: false, results: ['dataExport: types are missing.'] }
      expect(serviceOfferingContentValidationService.checkDataExport(dataExport)).toEqual(expectedResult)
    })

    it('should return an object with conforms set to false and the appropriate error message if requestType is not valid', () => {
      const dataExport = [{ 'gx-service-offering:requestType': 'invalid' }]
      const expectedResult = { conforms: false, results: [`requestType: invalid is not a valid requestType`] }
      expect(serviceOfferingContentValidationService.checkDataExport(dataExport)).toEqual(expectedResult)
    })

    it('should return an object with conforms set to false and the appropriate error message if accessType is not valid', () => {
      const dataExport = [{ 'gx-service-offering:accessType': 'invalid' }]
      const expectedResult = { conforms: false, results: [`accessType: invalid is not a valid accessType`] }
      expect(serviceOfferingContentValidationService.checkDataExport(dataExport)).toEqual(expectedResult)
    })

    it('should return an object with conforms set to false and the appropriate error message if formatType is not valid', () => {
      const dataExport = [{ 'gx-service-offering:formatType': 'invalid' }]
      const expectedResult = { conforms: false, results: [`formatType: invalid is not a valid formatType`] }
      expect(serviceOfferingContentValidationService.checkDataExport(dataExport)).toEqual(expectedResult)
    })
  })
})
