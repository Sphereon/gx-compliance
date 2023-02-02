import { CommonModule } from './common.module'
import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ServiceOfferingContentValidationService } from '../methods/service-offering/content-validation.service'
import { ServiceOfferingController } from '../controller/service-offering/service-offering.controller'
import { SignatureService } from '../methods/common'

@Module({
  imports: [HttpModule, CommonModule],
  controllers: [ServiceOfferingController],
  providers: [ServiceOfferingContentValidationService, SignatureService],
  exports: [ServiceOfferingContentValidationService]
})
export class ServiceOfferingModule {}
