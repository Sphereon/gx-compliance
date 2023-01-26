import { ComplianceCredentialDto } from '../dto'
import { createHash } from 'crypto'
import { getDidWeb, getDidWebVerificationMethodIdentifier } from '../utils'
import { Injectable, BadRequestException, ConflictException } from '@nestjs/common'
import { VerifiableCredentialDto } from '../dto'
import * as jose from 'jose'
import * as jsonld from 'jsonld'
import { SelfDescriptionTypes } from '../enums'
import { DocumentLoader } from './DocumentLoader'
import { subtle } from '@transmute/web-crypto-key-pair'
import { ICredential, IVerifiableCredential, IVerifiablePresentation } from '../@types'

export interface Verification {
  protectedHeader: jose.CompactJWSHeaderParameters | undefined
  content: string | undefined
}
function expansionMap(info) {
  if (info.unmappedProperty) {
    console.log('The property "' + info.unmappedProperty + '" in the input ' + 'was not defined in the context.')
  }
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
      const algorithm = jwk.alg || 'RS256'
      const rsaPublicKey = await jose.importJWK(cleanJwk, algorithm)

      const result = await jose.compactVerify(jws, rsaPublicKey)

      return { protectedHeader: result.protectedHeader, content: new TextDecoder().decode(result.payload) }
    } catch (error) {
      throw new ConflictException('Verification for the given jwk and jws failed.')
    }
  }

  async normalize(doc: object): Promise<string> {
    try {
      let canonized
      if (doc['type'] === SelfDescriptionTypes.VC) {
        canonized = await jsonld.canonize(doc['selfDescriptionCredential'], {
          algorithm: 'URDNA2015',
          format: 'application/n-quads',
          //TODO FMA-23
          documentLoader: new DocumentLoader().getLoader()
        })
      } else {
        canonized = await jsonld.canonize(doc, {
          algorithm: 'URDNA2015',
          format: 'application/n-quads',
          //TODO FMA-23
          documentLoader: new DocumentLoader().getLoader()
        })
      }

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
        verificationMethod: getDidWebVerificationMethodIdentifier()
      }
    }

    return { complianceCredential }
  }

  async createComplianceCredentialFromSelfDescription(selfDescription: IVerifiablePresentation): Promise<IVerifiableCredential> {
    if (SignatureService.hasGxComplianceCredential(selfDescription)) {
      const ecosystemUrl = process.env.GX_ECOSYSTEM_URL || 'http://20.23.137.224/' //fixme this should be changed to the actual FMA
      return this.issueComplianceCredential(selfDescription, ecosystemUrl)
    }
    return this.issueComplianceCredential(selfDescription, 'https://catalogue.gaia-x.eu/credentials/')
  }

  async verifySignature({ verifyData, jwk, proof }: any): Promise<boolean> {
    const key = await subtle.importKey('jwk', jwk, { hash: 'SHA-256', name: 'RSASSA-PKCS1-V1_5' }, true, ['verify'])
    return await subtle.verify(
      {
        name: key.algorithm?.name ? key.algorithm.name : 'RSASSA-PKCS1-V1_5',
        hash: 'SHA-256'
      },
      key,
      typeof proof.jws === 'string' ? Buffer.from(proof.jws, 'base64url') : proof.jws,
      verifyData
    )
  }

  async checkVcSignature(verifiableCredential: IVerifiableCredential, jwk: JsonWebKey): Promise<boolean> {
    const proof = verifiableCredential.proof
    const document = { ...verifiableCredential }
    delete document.proof
    const verifyData = await this.createVerifyData({ document, proof, documentLoader: new DocumentLoader().getLoader(), expansionMap })
    return await this.verifySignature({ verifyData, jwk, proof })
  }

  async checkVpSignature(verifiablePresentation: IVerifiablePresentation, jwk: JsonWebKey): Promise<boolean> {
    const proof = verifiablePresentation.proof
    const document = { ...verifiablePresentation }
    delete document.proof
    const verifyData = await this.createVerifyData({ document, proof, documentLoader: new DocumentLoader().getLoader(), expansionMap })
    return await this.verifySignature({ verifyData, jwk, proof })
  }

  async createVerifyData({ document, proof, documentLoader, expansionMap }: any) {
    // concatenate hash of c14n proof options and hash of c14n document
    const c14nProofOptions = await this.canonizeProof(proof, {
      documentLoader,
      expansionMap
    })
    const c14nDocument = await this.canonize(document, {
      documentLoader,
      expansionMap
    })
    return Buffer.from(this.sha256(c14nProofOptions) + this.sha256(c14nDocument), 'utf-8')
  }

  async canonize(input: any, { documentLoader, expansionMap, skipExpansion }: any) {
    return jsonld.canonize(input, {
      algorithm: 'URDNA2015',
      format: 'application/n-quads',
      documentLoader,
      expansionMap,
      skipExpansion,
      useNative: false
    })
  }

  async canonizeProof(proof: any, { documentLoader, expansionMap }: any) {
    // `jws`,`signatureValue`,`proofValue` must not be included in the proof
    // options
    proof = { ...proof }
    delete proof.jws
    return this.canonize(proof, {
      documentLoader,
      expansionMap,
      skipExpansion: false
    })
  }

  private static hasGxComplianceCredential(selfDescription: IVerifiablePresentation): boolean {
    const gxComplianceServer = process.env.GX_COMPLIANCE_SERVICE_DID || 'did:web:sphereon-test.ddns.net'
    //fixme remove following line
    // const gxComplianceServer = process.env.GX_COMPLIANCE_SERVICE_DID || 'did:web:555d-87-213-241-251.eu.ngrok.io'
    for (const vc of selfDescription.verifiableCredential) {
      if (vc.issuer === gxComplianceServer && vc.type.includes(SelfDescriptionTypes.PARTICIPANT_CREDENTIAL.valueOf())) {
        return true
      }
    }
    return false
  }

  private async issueComplianceCredential(selfDescription: IVerifiablePresentation, serviceUrl: string): Promise<IVerifiableCredential> {
    const selfDescribedVC = selfDescription.verifiableCredential.filter(vc => vc.type.includes(SelfDescriptionTypes.PARTICIPANT.valueOf()))[0]
    const sd_jws = selfDescribedVC.proof['jws']
    if (!sd_jws) {
      throw new BadRequestException('selfDescription does not contain jws property')
    }
    delete selfDescription.proof
    const normalizedSD: string = await this.normalize(selfDescribedVC)
    const hash: string = this.sha256(normalizedSD + sd_jws)

    const type: string = selfDescribedVC.type.find(t => t !== 'VerifiableCredential')
    const complianceCredentialType: string =
      SelfDescriptionTypes.PARTICIPANT === type ? SelfDescriptionTypes.PARTICIPANT_CREDENTIAL : SelfDescriptionTypes.SERVICE_OFFERING_CREDENTIAL
    const unsignedCredential: ICredential = SignatureService.createUnsignedComplianceCredential(
      complianceCredentialType,
      serviceUrl,
      selfDescribedVC.credentialSubject.id,
      hash
    )
    const normalizedComplianceCredential: string = await this.normalize(unsignedCredential)
    const complianceCredentialHash: string = this.sha256(normalizedComplianceCredential)
    const jws = await this.sign(complianceCredentialHash)
    return {
      ...unsignedCredential,
      proof: {
        type: 'JsonWebSignature2020',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        jws,
        verificationMethod: getDidWebVerificationMethodIdentifier()
      }
    }
  }
  private static createUnsignedComplianceCredential(type: string, url: string, id: string, hash: string): ICredential {
    return {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', type],
      id: `${url}${type}/${new Date().getTime()}`,
      issuer: getDidWeb(),
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: id,
        hash
      }
    }
  }
}
