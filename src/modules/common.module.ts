import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { SignatureService, ShaclService, SelfDescriptionService, RegistryService, ProofService } from '../methods/common'
import { CommonController } from '../controller/common/common.controller'
import { Common2010VPController } from '../controller/common/common-2210vp.controller'
import { Proof2210vpService } from '../methods/common/proof.2210vp.service'
import { SelfDescription2210vpService } from '../methods/common/selfDescription.2210vp.service'
import { Signature2210vpService } from '../methods/common/signature.2010vp.service'

@Module({
  imports: [HttpModule],
  controllers: [CommonController, Common2010VPController],
  providers: [
    ProofService,
    ShaclService,
    SelfDescriptionService,
    SignatureService,
    RegistryService,
    Proof2210vpService,
    SelfDescription2210vpService,
    Signature2210vpService
  ],
  exports: [
    ProofService,
    ShaclService,
    SelfDescriptionService,
    SignatureService,
    RegistryService,
    Proof2210vpService,
    SelfDescription2210vpService,
    Signature2210vpService
  ]
})
export class CommonModule {}
