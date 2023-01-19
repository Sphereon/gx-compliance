import { Test, TestingModule } from '@nestjs/testing'
import { CommonModule } from '../../modules/common.module'
import { ShaclService } from '../../methods/common'
import { DatasetCore } from 'rdf-js'
import { readFileSync } from 'fs'
import path from 'path'
import { HttpModule } from '@nestjs/axios'

// Fixtures
import ParticipantSDFixture from '../../tests/fixtures/participant-sd.json'
import ParticipantMinimalSDFixture from '../../tests/fixtures/participant-sd.json'
import ParticipantFaultySDFixture from '../../tests/fixtures/participant-sd-faulty.json'

export const expectedErrorResult = expect.objectContaining({
  conforms: false,
  results: expect.arrayContaining([expect.any(String)])
})

export const expectedValidResult = expect.objectContaining({
  conforms: true
})

describe('ShaclService', () => {
  let shaclService: ShaclService

  const expectedDatasetObject: DatasetCore = {
    size: expect.any(Number),
    has: expect.any(Function),
    delete: expect.any(Function),
    add: expect.any(Function),
    match: expect.any(Function),
    [Symbol.iterator]: expect.any(Object)
  }

  const participantShaclShapeRaw = readFileSync(path.join(__dirname, '../../utils/static/schemas/participant.ttl')).toString()

  const participantSDRaw = JSON.stringify(ParticipantSDFixture)
  const participantMinimalSDRaw = JSON.stringify(ParticipantMinimalSDFixture)
  const participantFaultySDRaw = JSON.stringify(ParticipantFaultySDFixture)

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CommonModule, HttpModule],
      providers: [ShaclService]
    }).compile()

    shaclService = moduleFixture.get<ShaclService>(ShaclService)
  })

  describe('SHACL dataset transformation of raw data', () => {
    it('transforms a dataset correctly from turtle input', async () => {
      const dataset = await shaclService.loadFromTurtle(participantShaclShapeRaw)
      expectDatasetKeysToExist(dataset)
    })

    it('transforms a dataset correctly from JsonLD input', async () => {
      const dataset = await shaclService.loadFromJsonLD(participantSDRaw)
      expectDatasetKeysToExist(dataset)
    })

    it.skip('transforms a dataset correctly from an url with turtle input', async () => {
      const registryUrl = process.env.REGISTRY_URL || 'https://registry.gaia-x.eu/v2206/api'
      const datasetParticipant = await shaclService.loadFromUrl(`${registryUrl}/shape/files?file=participant&type=ttl`)
      const datasetServiceOffering = await shaclService.loadFromUrl(`${registryUrl}/shape/files?file=service-offering&type=ttl`)
      expectDatasetKeysToExist(datasetParticipant)
      expectDatasetKeysToExist(datasetServiceOffering)
    })

    it('transforms a dataset correctly from an url with JsonLD input', async () => {
      const dataset = await shaclService.loadFromUrl('https://raw.githubusercontent.com/deltaDAO/files/main/participant-sd-minimal.json')
      expectDatasetKeysToExist(dataset)
    })
  })

  describe('SHACL Shape Validation of a Self Descriptions', () => {
    it('returns true for a Self Description using the correct shape', async () => {
      const sdDataset = await shaclService.loadFromJsonLD(participantSDRaw)

      const validationResult = await shaclService.validate(await getParticipantShaclShape(), sdDataset)

      expect(validationResult).toEqual(expectedValidResult)
    })

    it('returns true for a minimal Self Description using the correct shape', async () => {
      const sdDatasetMinimal = await shaclService.loadFromJsonLD(participantMinimalSDRaw)
      const validationResult = await shaclService.validate(await getParticipantShaclShape(), sdDatasetMinimal)

      expect(validationResult).toEqual(expectedValidResult)
    })

    // TODO: enale after fix shape always conforms
    it.skip('returns false and errors for a Self Description not conforming to shape', async () => {
      const sdDatasetFaulty = await shaclService.loadFromJsonLD(participantFaultySDRaw)
      const validationResultFaulty = await shaclService.validate(await getParticipantShaclShape(), sdDatasetFaulty)

      expect(validationResultFaulty).toEqual(expectedErrorResult)
    })
  })

  async function getParticipantShaclShape() {
    return await shaclService.loadFromTurtle(participantShaclShapeRaw)
  }

  function expectDatasetKeysToExist(dataset: any) {
    const keys = Object.keys(expectedDatasetObject)
    for (const key of keys) {
      expect(dataset[key]).toBeDefined()
    }
  }
})
