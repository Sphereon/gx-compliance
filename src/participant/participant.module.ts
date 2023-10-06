import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ParticipantContentValidationService } from './services/content-validation.service'
import { ParticipantController } from './participant.controller'
import { CommonModule } from '../common/common.module'
import {Signature2210vpService} from "../common/services/signature.2010vp.service";
import {ParticipantContentValidationV2210vpService} from "./services/content-validation-v2210vp.service";
import {Participant2210vpController} from "./participant-2210vp.controller";

@Module({
  imports: [HttpModule, CommonModule],
  controllers: [ParticipantController, Participant2210vpController],
  providers: [ParticipantContentValidationService, ParticipantContentValidationV2210vpService, Signature2210vpService, ParticipantController],
  exports: [ParticipantContentValidationService, ParticipantContentValidationV2210vpService]
})
export class ParticipantModule {}
