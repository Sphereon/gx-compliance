import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { SignatureService, ShaclService, SelfDescriptionService, RegistryService, ProofService } from './services'
import { CommonController } from './common.controller'
import { SoapService } from './services'
import { GxSignatureSuite } from './services/suits/gx-signature-suite'

@Module({
  imports: [HttpModule],
  controllers: [CommonController],
  providers: [GxSignatureSuite, ProofService, ShaclService, SelfDescriptionService, SignatureService, RegistryService, SoapService],
  exports: [GxSignatureSuite, ProofService, ShaclService, SelfDescriptionService, SignatureService, RegistryService, SoapService]
})
export class CommonModule {}
