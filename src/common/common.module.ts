import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { SignatureService, ShaclService, SelfDescriptionService, RegistryService, ProofService } from './services'
import { CommonController } from './common.controller'
import { SoapService } from './services'
import {Common2010VPController} from "./common-2210vp.controller";
import {Proof2210vpService} from "./services/proof.2210vp.service";
import {SelfDescription2210vpService} from "./services/selfDescription.2210vp.service";
import {Signature2210vpService} from "./services/signature.2010vp.service";
@Module({
  imports: [HttpModule],
  controllers: [CommonController, Common2010VPController],
  providers: [ProofService, Proof2210vpService, ShaclService, SelfDescriptionService, SelfDescription2210vpService, SignatureService, Signature2210vpService, RegistryService, SoapService],
  exports: [ProofService, Proof2210vpService, ShaclService, SelfDescriptionService, SelfDescription2210vpService, SignatureService, Signature2210vpService, RegistryService, SoapService]
})
export class CommonModule {}
