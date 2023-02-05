import { Test, TestingModule } from '@nestjs/testing'
import { Proof2210vpService } from '../methods/common/proof.2210vp.service'
import { HttpModule } from '@nestjs/axios'
import { CommonModule } from '../modules/common.module'
import { VerifiableCredentialDto } from '../@types/dto/common'
import { ParticipantSelfDescriptionDto } from '../@types/dto/participant/'
import nock from 'nock'
import { MockData } from './fixtures/mockData'
import { IVerifiablePresentation } from '../@types/type/SSI.types'

describe('ProofService', () => {
  let proofService: Proof2210vpService

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CommonModule, HttpModule],
      providers: [Proof2210vpService]
    }).compile()

    proofService = moduleFixture.get<Proof2210vpService>(Proof2210vpService)
  })

  beforeEach(() => {
    nock.cleanAll()
  })

  it('returns true if validate function passes with an SD object', async () => {
    const mockData = MockData.getMockData()
    nock('https://www.w3.org/2018/credentials/v1').get(/.*/).reply(200, mockData.w3credentialSchema)
    nock('https://registry.gaia-x.eu/v2206/api/shape').get(/.*/).reply(200, mockData.gxRegistryShape)
    // This is a mocked url and you don't need ngrok for this
    // TODO: create a VC with a simple issuer url in order to make these two lines easier to understand
    nock('https://0c1b-2001-1c04-2b34-bb00-c366-4d7b-3320-824b.eu.ngrok.io')
      .get('/.well-known/x509CertificateChain.pem')
      .reply(200, mockData.certificateChain)
    nock('https://0c1b-2001-1c04-2b34-bb00-c366-4d7b-3320-824b.eu.ngrok.io').get('/.well-known/did.json').times(3).reply(200, mockData.wellknownDid)
    const sd: VerifiableCredentialDto<ParticipantSelfDescriptionDto> =
      mockData.selfDescription as unknown as VerifiableCredentialDto<ParticipantSelfDescriptionDto>
    process.env.privateKey = mockData.privateKey
    expect(await proofService.validate(sd)).toBe(true)
  }, 30000)

  it('returns true if validate function passes with an VP object', async () => {
    const mockData = MockData.getMockData()
    nock('https://www.w3.org/2018/credentials/v1').get(/.*/).reply(200, mockData.w3credentialSchema)
    nock('https://registry.gaia-x.eu/v2206/api/shape').get(/.*/).reply(200, mockData.gxRegistryShape)
    // This is a mocked url and you don't need ngrok for this
    // TODO: create a VC with a simple issuer url in order to make these two lines easier to understand
    nock('https://0c1b-2001-1c04-2b34-bb00-c366-4d7b-3320-824b.eu.ngrok.io')
      .get('/.well-known/x509CertificateChain.pem')
      .reply(200, mockData.certificateChain)
    nock('https://0c1b-2001-1c04-2b34-bb00-c366-4d7b-3320-824b.eu.ngrok.io').get('/.well-known/did.json').times(3).reply(200, mockData.wellknownDid)
    const vp: IVerifiablePresentation = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
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
    process.env.privateKey = mockData.privateKey
    expect(await proofService.validate(vp)).toBe(true)
  }, 30000)
})
