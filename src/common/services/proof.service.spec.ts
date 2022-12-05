import { Test, TestingModule } from '@nestjs/testing'
import { ProofService } from '.'
import { HttpModule } from '@nestjs/axios'
import { CommonModule } from '../common.module'
import { VerifiableCredentialDto } from '../dto'
import { ParticipantSelfDescriptionDto } from '../../participant/dto'
import { SDParserPipe } from '../pipes'
import nock from 'nock'
import ParticipantSD from '../../tests/fixtures/participant-sd.json'
import { MockData } from './mockData'

describe('ProofService', () => {
  let proofService: ProofService

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CommonModule, HttpModule],
      providers: [ProofService]
    }).compile()

    proofService = moduleFixture.get<ProofService>(ProofService)
  })

  beforeEach(() => {
    nock.cleanAll()
  })

  it('should be defined', () => {
    expect(proofService).toBeDefined()
  })
  it.skip('returns true for a valid participantSD with resolvable did.json', async () => {
    const pipe = new SDParserPipe('LegalPerson')
    const pipedSD = pipe.transform(ParticipantSD)
    expect(await proofService.validate(pipedSD.selfDescriptionCredential as VerifiableCredentialDto<ParticipantSelfDescriptionDto>)).toBe(true)
  }, 20000)

  it('returns true if validate function passes', async () => {
    const mockData = MockData.getMockData()
    nock('https://www.w3.org/2018/credentials/v1').get(/.*/).reply(200, mockData.w3credentialSchema)
    nock('https://registry.gaia-x.eu/v2206/api/shape').get(/.*/).reply(200, mockData.gxRegistryShape)
    nock('https://0c1b-2001-1c04-2b34-bb00-c366-4d7b-3320-824b.eu.ngrok.io')
      .get('/.well-known/x509CertificateChain.pem')
      .reply(200, mockData.certificateChain)
    nock('https://0c1b-2001-1c04-2b34-bb00-c366-4d7b-3320-824b.eu.ngrok.io').get('/.well-known/did.json').times(3).reply(200, mockData.wellknownDid)
    const sd: VerifiableCredentialDto<ParticipantSelfDescriptionDto> =
      mockData.selfDescription as unknown as VerifiableCredentialDto<ParticipantSelfDescriptionDto>
    process.env.privateKey = mockData.privateKey
    expect(await proofService.validate(sd)).toBe(true)
  }, 30000)
})
