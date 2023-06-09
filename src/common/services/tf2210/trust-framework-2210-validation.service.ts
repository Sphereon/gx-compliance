import { Injectable } from '@nestjs/common'
import { mergeResults, VerifiablePresentation } from '../verifiable-presentation-validation.service'
import {ValidationResult, VerifiableCredentialDto} from '../../dto'
import { ParticipantContentValidationService } from '../../../participant/services/content-validation.service'
import { ServiceOfferingContentValidationService } from '../../../service-offering/services/content-validation.service'
import { ParticipantSelfDescriptionDto } from '../../../participant/dto'
import { getAtomicType } from '../../utils/getAtomicType'

@Injectable()
export class TrustFramework2210ValidationService {
  constructor(
    private participantValidationService: ParticipantContentValidationService,
    private serviceOfferingValidationService: ServiceOfferingContentValidationService
  ) {
    //Empty constructor
  }

  async validateVP(vp: VerifiablePresentation): Promise<ValidationResult> {
    const validationResults: ValidationResult[] = []
    for (const vc of vp.verifiableCredential) {
      const atomicType = getAtomicType(vc)
      if (atomicType === 'LegalParticipant') {
        validationResults.push(await this.participantValidationService.validate(<ParticipantSelfDescriptionDto>(<unknown>vc.credentialSubject)))
      }
    }
    return mergeResults(...validationResults)
  }

  async validateVC(vc: VerifiableCredentialDto<any>): Promise<ValidationResult> {
    const atomicType = getAtomicType(vc)
    if (atomicType === 'LegalParticipant') {
      return await this.participantValidationService.validate(<ParticipantSelfDescriptionDto>(<unknown>vc.credentialSubject))
    } else if (atomicType === 'ServiceOffering') {
      // gaia-x hasn't a validation for this type yet
      return {
        conforms: true,
        results: []
      }
    }
  }
}
