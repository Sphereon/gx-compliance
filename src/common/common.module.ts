import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { SignatureService, ShaclService, RegistryService, ProofService } from './services'
import { CommonController } from './common.controller'
import { VerifiablePresentationValidationService } from './services/verifiable-presentation-validation.service'
import { TrustFramework2210ValidationService } from './services/tf2210/trust-framework-2210-validation.service'
import { ParticipantContentValidationService } from '../participant/services/content-validation.service'
import { ServiceOfferingContentValidationService } from '../service-offering/services/content-validation.service'

@Module({
  imports: [HttpModule],
  controllers: [CommonController],
  providers: [
    ShaclService,
    SignatureService,
    ParticipantContentValidationService,
    ProofService,
    RegistryService,
    ServiceOfferingContentValidationService,
    TrustFramework2210ValidationService,
    VerifiablePresentationValidationService
  ],
  exports: [ProofService, RegistryService, ShaclService, SignatureService]
})
export class CommonModule {}
