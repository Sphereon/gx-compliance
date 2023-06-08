import { Injectable } from '@nestjs/common'
import { ProofService } from './proof.service'
import { ValidationResult, VerifiableCredentialDto, VerifiablePresentationDto } from '../dto'
import { EcoShaclService } from './eco-shacl.service'
import { TrustFramework2210ValidationService } from './tf2210/trust-framework-2210-validation.service'
import { isVerifiableCredential, isVerifiablePresentation } from '../utils/getAtomicType'

export type VerifiablePresentation = VerifiablePresentationDto<VerifiableCredentialDto<any>>

export function mergeResults(...results: ValidationResult[]): ValidationResult {
  if (results && results.length > 0) {
    const resultArray = results.map(res => res.results)
    const res = resultArray.reduce((p, c) => c.concat(p))

    return {
      conforms: results.filter(r => !r.conforms).length == 0,
      results: res
    }
  }
  return { conforms: true, results: [] }
}

const trustframework = 'trustframework'

@Injectable()
export class EcoVerifiablePresentationValidationService {
  constructor(
    private proofService: ProofService,
    private shaclService: EcoShaclService,
    private trustFramework2210ValidationService: TrustFramework2210ValidationService
  ) {}

  public async validateVerifiablePresentation(vp: VerifiablePresentation): Promise<ValidationResult> {
    await this.validateSignatureOfVCs(vp)
    const validationResult = await this.validateVPAndVCsStructure(vp)
    if (!validationResult.conforms) {
      return validationResult
    }
    const businessRulesValidationResult = await this.validateBusinessRules(vp)
    if (!businessRulesValidationResult.conforms) {
      return businessRulesValidationResult
    }
    return mergeResults(validationResult, businessRulesValidationResult)
  }

  public async validateSignatureOfVCs(vp: VerifiablePresentation) {
    for (const vc of vp.verifiableCredential) {
      await this.validateSignatureOfVC(vc)
    }
  }

  public async validateVerifiableCredential(vc: VerifiableCredentialDto<any>): Promise<ValidationResult> {
    await this.proofService.validate(vc)
    const validationResult = await this.validateVCStructure(vc)
    if (!validationResult.conforms) {
      return validationResult
    }
    const businessRulesValidationResult = await this.validateBusinessRules(vc)
    if (!businessRulesValidationResult.conforms) {
      return businessRulesValidationResult
    }
    return mergeResults(validationResult, businessRulesValidationResult)
  }

  public async validateSignatureOfVC(vc: VerifiableCredentialDto<any>) {
    await this.proofService.validate(vc)
  }
  public async validateVPAndVCsStructure(vp: VerifiablePresentation): Promise<ValidationResult> {
    return await this.shaclService.verifyShape(vp, trustframework)
  }

  public async validateVCStructure(vc: VerifiableCredentialDto<any>): Promise<ValidationResult> {
    return await this.shaclService.verifyShape(vc, trustframework)
  }

  public async validateBusinessRules(verifiableData: VerifiablePresentation | VerifiableCredentialDto<any>): Promise<ValidationResult> {
    if (isVerifiablePresentation(verifiableData)) {
      return await this.trustFramework2210ValidationService.validateVP(verifiableData as VerifiablePresentation)
    } else if (isVerifiableCredential(verifiableData)) {
      return await this.trustFramework2210ValidationService.validateVC(verifiableData as VerifiableCredentialDto<any>)
    }
  }
}
