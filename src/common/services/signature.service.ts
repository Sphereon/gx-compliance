import { ComplianceCredentialDto } from '../dto/compliance-credential.dto'
import { createHash } from 'crypto'
import { getDidWeb } from '../utils/did.util'
import { Injectable, BadRequestException, ConflictException } from '@nestjs/common'
import { CredentialSubjectDto, VerifiableCredentialDto } from '../dto/credential-meta.dto'
import * as jose from 'jose'
import * as jsonld from 'jsonld'
import { SelfDescriptionTypes } from '../enums'
export interface Verification {
  protectedHeader: jose.CompactJWSHeaderParameters | undefined
  content: string | undefined
}

@Injectable()
export class SignatureService {
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
    try {
      const canonized: string = await jsonld.canonize(doc, {
        algorithm: 'URDNA2015',
        format: 'application/n-quads'
      })

      if (canonized === '') throw new Error()

      return canonized
    } catch (error) {
      throw new BadRequestException('Provided input is not a valid Self Description.')
    }
  }

  sha256(input: string): string {
    return createHash('sha256').update(input).digest('hex')
  }

  sha512(input: string): string {
    return createHash('sha512').update(input).digest('hex')
  }

  async sign(hash: string): Promise<string> {
    const alg = 'PS256'
    const rsaPrivateKey = await jose.importPKCS8(process.env.privateKey, alg)

    const jws = await new jose.CompactSign(new TextEncoder().encode(hash)).setProtectedHeader({ alg, b64: false, crit: ['b64'] }).sign(rsaPrivateKey)

    return jws
  }

  async createComplianceCredential(selfDescription: any): Promise<{ complianceCredential: VerifiableCredentialDto<ComplianceCredentialDto> }> {
    const sd_jws = selfDescription.proof.jws
    delete selfDescription.proof
    const normalizedSD: string = await this.normalize(selfDescription)
    const hash: string = this.sha256(normalizedSD + sd_jws)
    const jws = await this.sign(hash)

    const type: string = selfDescription.type.find(t => t !== 'VerifiableCredential')
    const complianceCredentialType: string =
      SelfDescriptionTypes.PARTICIPANT === type ? SelfDescriptionTypes.PARTICIPANT_CREDENTIAL : SelfDescriptionTypes.SERVICE_OFFERING_CREDENTIAL

    const complianceCredential: VerifiableCredentialDto<ComplianceCredentialDto> = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', complianceCredentialType],
      id: `https://catalogue.gaia-x.eu/credentials/${complianceCredentialType}/${new Date().getTime()}`,
      issuer: getDidWeb(),
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: selfDescription.credentialSubject.id,
        hash
      },
      proof: {
        type: 'JsonWebSignature2020',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        jws,
        verificationMethod: getDidWeb()
      }
    }

    return { complianceCredential }
  }
}
