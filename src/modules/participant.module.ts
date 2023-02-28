import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ParticipantContentValidationService } from '../methods/participant/content-validation.service'
import { ParticipantController } from '../controller/participant/participant.controller'
import { CommonModule } from './common.module'
import { SignatureService } from '../methods/common'
import { Participant2210vpController } from '../controller/participant/participant-2210vp.controller'
import { Signature2210vpService } from '../methods/common/signature.2010vp.service'
import { ParticipantContentValidationV2210vpService } from '../methods/participant/content-validation-v2210vp.service'

@Module({
  imports: [HttpModule, CommonModule],
  controllers: [ParticipantController, Participant2210vpController],
  providers: [
    ParticipantContentValidationService,
    ParticipantContentValidationV2210vpService,
    SignatureService,
    Signature2210vpService,
    ParticipantController
  ],
  exports: [ParticipantContentValidationService, ParticipantContentValidationV2210vpService, ParticipantController]
})
export class ParticipantModule {}
