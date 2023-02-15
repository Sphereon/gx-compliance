import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ParticipantContentValidationService } from '../methods/participant/content-validation.service'
import { ParticipantController } from '../controller/participant/participant.controller'
import { CommonModule } from './common.module'
import { SignatureService } from '../methods/common'
import { Participant2210vpController } from '../controller/participant/participant-2210vp.controller'
import { Signature2210vpService } from '../methods/common/signature.2010vp.service'

@Module({
  imports: [HttpModule, CommonModule],
  controllers: [ParticipantController, Participant2210vpController],
  providers: [ParticipantContentValidationService, SignatureService, Signature2210vpService],
  exports: [ParticipantContentValidationService]
})
export class ParticipantModule {}
