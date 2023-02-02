import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ParticipantContentValidationService } from '../methods/participant/content-validation.service'
import { ParticipantController } from '../controller/participant/participant.controller'
import { CommonModule } from './common.module'
import { SignatureService } from '../methods/common'

@Module({
  imports: [HttpModule, CommonModule],
  controllers: [ParticipantController],
  providers: [ParticipantContentValidationService, SignatureService],
  exports: [ParticipantContentValidationService]
})
export class ParticipantModule {}
