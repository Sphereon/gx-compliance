import { Test, TestingModule } from '@nestjs/testing'
import { CommonModule } from '../modules/common.module'
import { ServiceOfferingContentValidationService } from '../methods/service-offering/content-validation.service'
import { HttpModule } from '@nestjs/axios'
import { NotImplementedException } from '@nestjs/common'

describe('ParticipantContentValidationService', () => {
  let serviceOfferingContentValidationService: ServiceOfferingContentValidationService

  // const expectedErrorResult = expect.objectContaining({
  //   conforms: false,
  //   results: expect.arrayContaining([expect.any(String)])
  // })

  // const expectedValidResult = expect.objectContaining({
  //   conforms: true
  // })

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
})
