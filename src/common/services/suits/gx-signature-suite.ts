import { ICredential, IPresentation, IVerifiableCredential, IVerifiablePresentation } from '../../@types'
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common'
import * as jsonld from 'jsonld'
import * as jose from 'jose'
import { Verification } from '../signature.service'
import { createHash } from 'crypto'
import { DID_DOC, PEM_PRIV_KEY } from './mockData'
import { METHOD_IDS } from '../../constants'
import { DIDDocument, Resolver } from 'did-resolver'
import web from 'web-did-resolver'
import { DocumentLoader } from '../DocumentLoader'

@Injectable()
export class GxSignatureSuite {
  public async signCredential(credential: ICredential): Promise<IVerifiableCredential> {
    const normalized = await this.normalize(credential)
    const hash = this.sha256(normalized)
    const proof = await this.createProof(hash)
    return {
      ...credential,
      proof
    } as IVerifiableCredential
  }

  public async signPresentation(presentation: IPresentation): Promise<IVerifiablePresentation> {
    // first we check if the VCs in the presentation are correct or not
    const publicKeyJwk = await this.getPublicKeys(presentation.holder)
    for (const vc of presentation.verifiableCredential) {
      if (!(await this.checkVcProof(vc, publicKeyJwk))) {
        throw new Error('VC is not verified')
      }
    }
    const normalized = await this.normalize(presentation)
    const hash = this.sha256(normalized)
    const proof = await this.createProof(hash)
    return {
      ...presentation,
      proof
    } as IVerifiablePresentation
  }

  public async checkVerifiableDataProof(verifiableData: IVerifiableCredential | IVerifiablePresentation, publicKeyJwk?: any): Promise<boolean> {
    if (
      !verifiableData['type'] ||
      ((verifiableData['type'] as string[]).lastIndexOf('VerifiableCredential') === -1 &&
        (verifiableData['type'] as string[]).lastIndexOf('VerifiablePresentation') === -1)
    ) {
      throw new Error('You have to provide a VerifiableCredential of VerifiablePresentation')
    }
    if (verifiableData['type'] && (verifiableData['type'] as string[]).lastIndexOf('VerifiableCredential') !== -1) {
      return await this.checkVcProof(verifiableData as IVerifiableCredential, publicKeyJwk)
    } else if (verifiableData['type'] && (verifiableData['type'] as string[]).lastIndexOf('VerifiablePresentation') !== -1) {
      return await this.checkVpProof(verifiableData as IVerifiablePresentation, publicKeyJwk)
    }
  }

  private async checkVcProof(vc: IVerifiableCredential, jwk?: any): Promise<boolean> {
    jwk = await this.getPublicKeys(vc.credentialSubject.id)
    return this.checkSignature(vc, jwk)
  }

  private async checkVpProof(vp: IVerifiablePresentation, jwk): Promise<boolean> {
    const isValidSignature: boolean = await this.checkSignature(vp, jwk)
    if (!isValidSignature) {
      return false
    }
    for (const vc of vp.verifiableCredential) {
      if (!(await this.checkVcProof(vc, jwk))) {
        return false
      }
    }
  }

  private async checkSignature(verifiableData: IVerifiableCredential | IVerifiablePresentation, jwk: any): Promise<boolean> {
    const proof = verifiableData.proof
    delete verifiableData.proof

    const normalizedVerifiableData: string = await this.normalize(verifiableData)
    const hashInput: string = normalizedVerifiableData
    const hash: string = this.sha256(hashInput)
    try {
      const verificationResult: Verification = await this.verify(proof.jws.replace('..', `.${hash}.`), jwk)
      return verificationResult.content === hash
    } catch (error) {
      throw new Error(`signature verification failed: ${error}`)
    }
  }

  private async verify(jws: any, jwk: any): Promise<Verification> {
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

  private async normalize(doc: object): Promise<string> {
    try {
      const canonized: string = await jsonld.canonize(doc, {
        algorithm: 'URDNA2015',
        format: 'application/n-quads',
        documentLoader: new DocumentLoader().getLoader()
      })

      if (canonized === '') throw new Error()

      return canonized
    } catch (error) {
      throw new BadRequestException('Provided input is not a valid Self Description.')
    }
  }

  private sha256(input: string): string {
    return createHash('sha256').update(input).digest('hex')
  }

  private async createProof(hash) {
    try {
      await this.sign(hash)
    } catch (e) {
      console.log(e)
    }
    const proof = {
      type: 'JsonWebSignature2020',
      created: new Date().toISOString(),
      proofPurpose: 'assertionMethod',
      verificationMethod: process.env.VERIFICATION_METHOD ?? 'did:web:compliance.lab.gaia-x.eu',
      jws: await this.sign(hash)
    }

    return proof
  }

  async sign(hash) {
    const algorithm = 'RS256'
    const privateKey = PEM_PRIV_KEY
    if (!privateKey) {
      throw new Error('private key not provided.')
    }
    const rsaPrivateKey = await jose.importPKCS8(privateKey, algorithm)

    try {
      const jws = await new jose.CompactSign(new TextEncoder().encode(hash))
        .setProtectedHeader({ alg: 'RS256', b64: false, crit: ['b64'] })
        .sign(rsaPrivateKey)

      return jws
    } catch (error) {
      console.error(error)
    }
  }

  //todo this is duplicated, should be deleted in refactor
  private async getPublicKeys(did: string) {
    const { verificationMethod, id } = await this.loadDDO(did)

    const jwk = verificationMethod.find(method => METHOD_IDS.includes(method.id) || method.id.startsWith(id))
    if (!jwk) throw new ConflictException(`verificationMethod ${verificationMethod} not found in did document`)

    const { publicKeyJwk } = jwk
    if (!publicKeyJwk) throw new ConflictException(`Could not load JWK for ${verificationMethod}`)

    return publicKeyJwk
  }

  //todo this is duplicated, should be deleted in refactor
  private async loadDDO(did: string): Promise<any> {
    if (did === 'did:web:f825-87-213-241-251.eu.ngrok.io') {
      return DID_DOC
    }
    try {
      const didDocument = await this.getDidWebDocument(did)
      if (!didDocument?.verificationMethod || didDocument?.verificationMethod?.constructor !== Array)
        throw new ConflictException(`Could not load verificationMethods in did document at ${didDocument?.verificationMethod}`)

      return didDocument || undefined
    } catch (error) {
      throw new ConflictException(`Could not load document for given did:web: "${did}"`)
    }
  }

  //todo this is duplicated, should be deleted in refactor
  private async getDidWebDocument(did: string): Promise<DIDDocument> {
    const webResolver = web.getResolver()
    const resolver = new Resolver(webResolver)
    const doc = await resolver.resolve(did)

    return doc.didDocument
  }
}
