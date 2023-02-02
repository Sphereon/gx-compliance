import { Test, TestingModule } from '@nestjs/testing'
import { ProofService } from '../methods/common'
import { HttpModule } from '@nestjs/axios'
import { CommonModule } from '../modules/common.module'
import { VerifiableCredentialDto } from '../@types/dto/common'
import { ParticipantSelfDescriptionDto } from '../@types/dto/participant'
import { SDParserPipe } from '../utils/pipes'

import ParticipantSD from './fixtures/participant-sd.json'

describe('ProofService', () => {
  let proofService: ProofService

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CommonModule, HttpModule],
      providers: [ProofService]
    }).compile()

    proofService = moduleFixture.get<ProofService>(ProofService)
  })

  it('should be defined', () => {
    expect(proofService).toBeDefined()
  })

  it.skip('returns true for a valid participantSD with resolvable did.json', async () => {
    const pipe = new SDParserPipe('LegalPerson')
    const pipedSD = pipe.transform(ParticipantSD)
    expect(await proofService.validate(pipedSD.selfDescriptionCredential as VerifiableCredentialDto<ParticipantSelfDescriptionDto>)).toBe(true)
  }, 20000)
})
