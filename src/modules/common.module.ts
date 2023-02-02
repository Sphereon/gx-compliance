import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { SignatureService, ShaclService, SelfDescriptionService, RegistryService, ProofService } from '../methods/common'
import { CommonController } from '../controller/common/common.controller'

@Module({
  imports: [HttpModule],
  controllers: [CommonController],
  providers: [ProofService, ShaclService, SelfDescriptionService, SignatureService, RegistryService],
  exports: [ProofService, ShaclService, SelfDescriptionService, SignatureService, RegistryService]
})
export class CommonModule {}
