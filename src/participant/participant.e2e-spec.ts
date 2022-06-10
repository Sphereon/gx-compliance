import supertest from 'supertest'
import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { ParticipantModule } from './participant.module'
import * as ParticipantSDFixture from '../tests/fixtures/participant-sd.json'
import * as ParticipantSDMinimalFixture from '../tests/fixtures/participant-sd-minimal.json'
import * as ParticipantSDFaultyFixture from '../tests/fixtures/participant-sd-faulty.json'
import { AppModule } from '../app.module'

describe('Participant (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, ParticipantModule]
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  describe('Participant credential verification', () => {
    describe('Verification of an externally hosted credential', () => {
      const participantVerifyPath = '/participant/verify'
      describe(`${participantVerifyPath} [POST]`, () => {
        it('returns 400 for an invalid request body', done => {
          supertest(app.getHttpServer()).post(participantVerifyPath).send({}).expect(400).end(done)
        })

        it('returns 400 for a datatype other than JSON', done => {
          supertest(app.getHttpServer())
            .post(participantVerifyPath)
            .send({
              url: 'https://delta-dao.com'
            })
            .expect(400)
            .end(done)
        })

        it('returns 400 for a JSON file not able to be transformed to a dataset', done => {
          supertest(app.getHttpServer())
            .post(participantVerifyPath)
            .send({
              url: 'https://raw.githubusercontent.com/deltaDAO/files/main/v4-nft-metadata.json'
            })
            .expect(400)
            .end(done)
        })

        it('returns 409 and errors for a self description not conforming to the participant shape', done => {
          supertest(app.getHttpServer())
            .post(participantVerifyPath)
            .send({
              url: 'https://raw.githubusercontent.com/deltaDAO/files/main/participant-sd-faulty.json'
            })
            .expect(409)
            .end(done)
        })

        it.skip('returns 200 and verifies a valid participant self description', done => {
          supertest(app.getHttpServer())
            .post(participantVerifyPath)
            .send({
              url: 'https://raw.githubusercontent.com/deltaDAO/files/main/participant-sd-minimal.json'
            })
            .expect(200)
            .end(done)
        })
      })
    })

    describe('Verification of a raw credential JSON', () => {
      const participantVerifyRawPath = '/participant/verify/raw'
      describe(`${participantVerifyRawPath} [POST]`, () => {
        it('returns 400 for an invalid request body', done => {
          supertest(app.getHttpServer()).post(participantVerifyRawPath).send({}).expect(400).end(done)
        })

        it('returns 400 for a JSON file with the wrong "@type"', done => {
          const faultyTypeSD = {
            ...ParticipantSDMinimalFixture,
            selfDescription: {
              ...ParticipantSDMinimalFixture.selfDescription,
              '@type': 'gx-participant:NaturalPerson'
            }
          }
          supertest(app.getHttpServer()).post(participantVerifyRawPath).send(faultyTypeSD).expect(400).end(done)
        })

        it('returns 400 for a JSON file with the wrong "@context"', done => {
          const faultyContextSD = {
            ...ParticipantSDMinimalFixture,
            selfDescription: {
              ...ParticipantSDMinimalFixture.selfDescription,
              '@context': {
                ...ParticipantSDMinimalFixture.selfDescription['@context'],
                'gx-participant': 'https://delta-dao.com'
              }
            }
          }

          supertest(app.getHttpServer()).post(participantVerifyRawPath).send(faultyContextSD).expect(400).end(done)
        })

        it('returns 409 for an invalid participant credential', done => {
          supertest(app.getHttpServer()).post(participantVerifyRawPath).send(ParticipantSDFaultyFixture).expect(409).end(done)
        })

        it.skip('returns 200 and verifies a minimal valid participant credential', done => {
          supertest(app.getHttpServer()).post(participantVerifyRawPath).send(ParticipantSDMinimalFixture).expect(200).end(done)
        })

        it.skip('returns 200 and verifies a valid participant credential', done => {
          supertest(app.getHttpServer()).post(participantVerifyRawPath).send(ParticipantSDFixture).expect(200).end(done)
        })
      })
    })
  })
})