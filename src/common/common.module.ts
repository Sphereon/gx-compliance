import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ProofService, RegistryService, SelfDescriptionService, ShaclService, SignatureService, SoapService } from './services'
import { CommonController } from './common.controller'

@Module({
  imports: [HttpModule],
  controllers: [CommonController],
  providers: [ProofService, ShaclService, SelfDescriptionService, SignatureService, RegistryService, SoapService],
  exports: [ProofService, ShaclService, SelfDescriptionService, SignatureService, RegistryService, SoapService]
})
export class CommonModule {}
