import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import {
  Proof2210vpService,
  ProofService,
  RegistryService,
  SelfDescription2210vpService,
  SelfDescriptionService,
  ShaclService,
  SignatureService,
  SoapService
} from './services'
import { CommonController } from './common.controller'
import { Common2010VPController } from './common-2210vp.controller'
import {Signature2210vpService} from "./services/signature.2010vp.service";

@Module({
  imports: [HttpModule],
  controllers: [CommonController, Common2010VPController],
  providers: [
    ProofService,
    ShaclService,
    SelfDescriptionService,
    SignatureService,
    RegistryService,
    SoapService,
    SelfDescription2210vpService,
    Proof2210vpService,
    Signature2210vpService
  ],
  exports: [
    ProofService,
    ShaclService,
    SelfDescriptionService,
    SignatureService,
    RegistryService,
    SoapService,
    SelfDescription2210vpService,
    Proof2210vpService,
    Signature2210vpService
  ]
})
export class CommonModule {}
