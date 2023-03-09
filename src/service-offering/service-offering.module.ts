import { CommonModule } from '../common/common.module'
import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ServiceOfferingContentValidationService } from './services/content-validation.service'
import { ServiceOfferingController } from './service-offering.controller'
import { SignatureService } from '../common/services/signature.service'
import {ServiceOfferingV2210vpController} from "./service-offering-v2210vp.controller";
import {ServiceOfferingContentValidation2210vpService} from "./services/content-validation.2210vp.service";

@Module({
  imports: [HttpModule, CommonModule],
  controllers: [ServiceOfferingController, ServiceOfferingV2210vpController],
  providers: [ServiceOfferingContentValidationService, ServiceOfferingContentValidation2210vpService, SignatureService],
  exports: [ServiceOfferingContentValidationService, ServiceOfferingContentValidation2210vpService]
})
export class ServiceOfferingModule {}
