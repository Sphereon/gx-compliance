import { Test, TestingModule } from '@nestjs/testing'
import { ProofService } from '.'
import { HttpModule } from '@nestjs/axios'
import { CommonModule } from '../common.module'

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
})
