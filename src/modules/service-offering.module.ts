import { CommonModule } from './common.module'
import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ServiceOfferingContentValidationService } from '../methods/service-offering/content-validation.service'
import { ServiceOfferingController } from '../controller/service-offering/service-offering.controller'
import { SignatureService } from '../methods/common'
import {ServiceOfferingV2210vpController} from "../controller/service-offering/service-offering-v2210vp.controller";
import {ServiceOfferingContentValidation2210vpService} from "../methods/service-offering/content-validation.2210vp.service";

@Module({
  imports: [HttpModule, CommonModule],
  controllers: [ServiceOfferingController, ServiceOfferingV2210vpController],
  providers: [ServiceOfferingContentValidationService, SignatureService, ServiceOfferingContentValidation2210vpService],
  exports: [ServiceOfferingContentValidationService, ServiceOfferingContentValidation2210vpService]
})
export class ServiceOfferingModule {}
