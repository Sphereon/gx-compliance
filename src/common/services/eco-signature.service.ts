import { credentialSubject, CredentialSubjectDto, VerifiableCredentialDto, VerifiablePresentationDto } from '../dto'
import crypto, { createHash } from 'crypto'
import { getDidWeb } from '../utils'
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common'
import * as jose from 'jose'
import * as jsonld from 'jsonld'
import { DocumentLoader } from './DocumentLoader'

export interface Verification {
  protectedHeader: jose.CompactJWSHeaderParameters | undefined
  content: string | undefined
}

@Injectable()
export class EcoSignatureService {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  async validateComplianceCredentials(
    verifiablePresentation: VerifiablePresentationDto<VerifiableCredentialDto<CredentialSubjectDto>>
  ): Promise<void> {
    const shouldCheckForGXComplianceCredential: boolean = process.env.shouldCheckForGXComplianceCredential
      ? Boolean(process.env.shouldCheckForGXComplianceCredential)
      : true
    if (
      !verifiablePresentation.verifiableCredential.filter(
        vc => !Array.isArray(vc.credentialSubject) && vc.credentialSubject.type === 'gx:LegalParticipant'
      ).length
    ) {
      throw new BadRequestException('Provided input is not a valid Self Description.', 'No LegalParticipantCredential is provided')
    }
    const participantVC = verifiablePresentation.verifiableCredential.filter(
      vc => !Array.isArray(vc.credentialSubject) && vc.credentialSubject.type === 'gx:LegalParticipant'
    )[0]
    const serviceOfferingVC = verifiablePresentation.verifiableCredential.filter(
      vc => !Array.isArray(vc.credentialSubject) && vc.credentialSubject.type === 'gx:ServiceOffering'
    ).length
      ? verifiablePresentation.verifiableCredential.filter(
          vc => !Array.isArray(vc.credentialSubject) && vc.credentialSubject.type === 'gx:ServiceOffering'
        )[0]
      : undefined
    if (shouldCheckForGXComplianceCredential) {
      if (!verifiablePresentation.verifiableCredential.filter(vc => vc.issuer === process.env.gxComplianceDid).length) {
        throw new BadRequestException('Provided input is not a valid Self Description.', 'No gx compliance credential is provided')
      }
      const gxCompliance = verifiablePresentation.verifiableCredential.filter(
        vc => vc.issuer === process.env.gxComplianceDid && Array.isArray(vc.credentialSubject) && vc.credentialSubject[0].type === 'gx:compliance'
      )[0]
      // todo: for now, this type conversion is fine, because I don't want to introduce more changes to the code base with changing the CredentialSubjectDto type
      const subjects = gxCompliance.credentialSubject as unknown as CredentialSubjectDto[]
      if (!subjects.filter(subject => subject.type === 'gx:compliance' && subject.id === participantVC.issuer).length) {
        throw new BadRequestException(
          'Provided input is not a valid Self Description.',
          'gx-compliance credential for LegalParticipant is not available'
        )
      }
    }
    if (!verifiablePresentation.verifiableCredential.filter(vc => vc.issuer === getDidWeb()).length) {
      throw new BadRequestException('Provided input is not a valid Self Description.', 'No ecosystem compliance credential is provided')
    }
    const ecosystemVCs = verifiablePresentation.verifiableCredential.filter(vc => vc.issuer === getDidWeb())
    let foundEcoParticipantCompliance = false
    let foundEcoSOCompliance = false
    for (const ecosystemVC of ecosystemVCs) {
      if (
        Array.isArray(ecosystemVC.credentialSubject) &&
        (ecosystemVC.credentialSubject as unknown as CredentialSubjectDto[]).filter(subject => subject.id === participantVC.issuer).length
      ) {
        foundEcoParticipantCompliance = true
        this.checkComplianceIntegrityAgainstVC(credentialSubject['integrity'], participantVC)
      }
      if (
        serviceOfferingVC &&
        Array.isArray(ecosystemVC.credentialSubject) &&
        (ecosystemVC.credentialSubject as unknown as CredentialSubjectDto[]).filter(
          credentialSubject => credentialSubject.id === serviceOfferingVC.issuer
        ).length
      ) {
        foundEcoSOCompliance = true
        this.checkComplianceIntegrityAgainstVC(credentialSubject['integrity'], serviceOfferingVC)
      }
    }
    if (!foundEcoParticipantCompliance) {
      throw new BadRequestException(
        'Provided input is not a valid Self Description.',
        'No ecosystem compliance credential found for participant credential'
      )
    }
    if (serviceOfferingVC && !foundEcoSOCompliance) {
      throw new BadRequestException(
        'Provided input is not a valid Self Description.',
        'No ecosystem compliance credential found for service offering credential'
      )
    }
  }

  async verify(jws: any, jwk: any): Promise<Verification> {
    try {
      const cleanJwk = {
        kty: jwk.kty,
        n: jwk.n,
        e: jwk.e,
        x5u: jwk.x5u
      }
      const algorithm = jwk.alg || 'PS256'
      const rsaPublicKey = await jose.importJWK(cleanJwk, algorithm)

      const result = await jose.compactVerify(jws, rsaPublicKey)

      return { protectedHeader: result.protectedHeader, content: new TextDecoder().decode(result.payload) }
    } catch (error) {
      throw new ConflictException('Verification for the given jwk and jws failed.')
    }
  }

  async normalize(doc: object): Promise<string> {
    let canonized: string
    try {
      canonized = await jsonld.canonize(doc, {
        algorithm: 'URDNA2015',
        format: 'application/n-quads',
        documentLoader: new DocumentLoader().getLoader()
      })
    } catch (error) {
      console.log(error)
      throw new BadRequestException('Provided input is not a valid Self Description.', error.message)
    }
    if ('' === canonized) {
      throw new BadRequestException('Provided input is not a valid Self Description.', 'Canonized SD is empty')
    }

    return canonized
  }

  sha256(input: string): string {
    return createHash('sha256').update(input).digest('hex')
  }

  sha512(input: string): string {
    return createHash('sha512').update(input).digest('hex')
  }

  async sign(hash: string): Promise<string> {
    const alg = 'PS256'
    let jws
    if (process.env.privateKey.startsWith('-----BEGIN RSA PRIVATE KEY-----')) {
      const rsaPrivateKey = crypto.createPrivateKey(process.env.privateKey)
      jws = await new jose.CompactSign(new TextEncoder().encode(hash))
        .setProtectedHeader({
          alg,
          b64: false,
          crit: ['b64']
        })
        .sign(rsaPrivateKey)
    } else {
      const rsaPrivateKey = await jose.importPKCS8(process.env.privateKey, alg)
      jws = await new jose.CompactSign(new TextEncoder().encode(hash))
        .setProtectedHeader({
          alg,
          b64: false,
          crit: ['b64']
        })
        .sign(rsaPrivateKey)
    }

    return jws
  }

  private checkComplianceIntegrityAgainstVC(credentialIntegrity: string, vc: VerifiableCredentialDto<CredentialSubjectDto>): boolean {
    const hash: string = this.sha256(JSON.stringify(vc))
    return `sha256-${hash}` === credentialIntegrity
  }
}
