import { Test, TestingModule } from '@nestjs/testing'
import { SelfDescriptionService } from './selfDescription.service'
import { SDParserPipe } from '../pipes/sd-parser.pipe'

// Fixtures
import ParticipantSDFixture from '../../tests/fixtures/participant-sd.json'
import ParticipantSDFaultyFixture from '../../tests/fixtures/participant-sd-faulty.json'
import ParticipantSDMissingProofFixture from '../../tests/fixtures/participant-sd-faulty-missing-proof.json'
import ServiceOfferingSDFixture from '../../tests/fixtures/service-offering-sd.json'
import ServiceOfferingSDFaultyFixture from '../../tests/fixtures/service-offering-sd-faulty.json'

import { expectedErrorResult, expectedValidResult } from '../../common/services/shacl.spec'
import { ParticipantModule } from '../../participant/participant.module'
import { AppModule } from '../../app.module'

describe('ParticipantService', () => {
  let selfDescriptionService: SelfDescriptionService

  const transformPipeLegalPerson = new SDParserPipe('LegalPerson')
  const transformPipeServiceOffering = new SDParserPipe('ServiceOfferingExperimental')

  const expectedValidSDResult = expect.objectContaining({
    conforms: true,
    shape: expectedValidResult,
    content: expectedValidResult,
    isValidSignature: true
  })

  const expectedErrorSDResult = expect.objectContaining({
    conforms: false,
    shape: expectedErrorResult,
    content: expectedErrorResult,
    isValidSignature: false
  })

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule, ParticipantModule]
    }).compile()

    selfDescriptionService = moduleRef.get<SelfDescriptionService>(SelfDescriptionService)
  })

  describe(`Validation of Participant Self Descriptions`, () => {
    it('Validates a correct participant self description', async () => {
      const pipedSelfDescription = transformPipeLegalPerson.transform(ParticipantSDFixture as any)
      const result = await selfDescriptionService.validate(pipedSelfDescription)

      expect(result).toEqual(expectedValidSDResult)
    })
    it('Fails validation for a faulty participant self description', async () => {
      const pipedSelfDescription = transformPipeLegalPerson.transform(ParticipantSDFaultyFixture as any)
      const resultFaulty = await selfDescriptionService.validate(pipedSelfDescription)

      expect(resultFaulty).toEqual(expectedErrorSDResult)
    })

    // TODO implement right reponse - should not be 200
    it.skip('Fails validation for a participant self description without a proof object', async () => {
      const pipedSelfDescription = transformPipeLegalPerson.transform(ParticipantSDMissingProofFixture as any)
      const resultFaulty = await selfDescriptionService.validate(pipedSelfDescription)

      expect(resultFaulty).toEqual(expectedErrorSDResult)
    })
  })

  describe.skip(`Validation of Service Offering Self Descriptions`, () => {
    it.skip('Validates a correct Service Offering self description', async () => {
      const pipedSelfDescription = transformPipeServiceOffering.transform(ServiceOfferingSDFixture as any)
      const result = await selfDescriptionService.validate(pipedSelfDescription)

      expect(result).toEqual(expectedValidSDResult)
    })
    it.skip('Failes validation for a faulty Service Offering self description', async () => {
      const pipedSelfDescription = transformPipeServiceOffering.transform(ServiceOfferingSDFaultyFixture as any)
      const resultFaulty = await selfDescriptionService.validate(pipedSelfDescription)

      expect(resultFaulty).toEqual(expectedErrorSDResult)
    })
  })
})
