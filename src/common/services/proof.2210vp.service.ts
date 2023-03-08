import { ConflictException, Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { RegistryService } from './registry.service'
import { VerifiableCredentialDto } from '../dto'
import * as jose from 'jose'
import { METHOD_IDS } from '../constants'
import { DIDDocument, Resolver } from 'did-resolver'
import web from 'web-did-resolver'
import { IProof } from '../@types/SSI.types'
import { CERT_CHAIN } from './suits/mockData'
import { Signature2210vpService, Verification } from './signature.2010vp.service'
import { VerifiablePresentationDto } from '../dto/presentation-meta.dto'

@Injectable()
export class Proof2210vpService {
  constructor(
    private readonly httpService: HttpService,
    private readonly registryService: RegistryService,
    private readonly signatureService: Signature2210vpService
  ) {}

  public async validateVC(verifiableCredential: VerifiableCredentialDto<any>, isValidityCheck?: boolean, jws?: string): Promise<boolean> {
    const { x5u, publicKeyJwk } = await this.getPublicKeys(verifiableCredential.proof as IProof)
    const certificatesRaw: string = await this.loadCertificatesRaw(x5u)

    //TODO: disabled for self signed certificates
    const isValidChain = true //await this.registryService.isValidCertificateChain(certificatesRaw)

    if (!isValidChain) {
      throw new ConflictException(`X509 certificate chain could not be resolved against registry trust anchors.`)
    }
    if (!(await this.publicKeyMatchesCertificate(publicKeyJwk, certificatesRaw))) {
      throw new ConflictException(`Public Key does not match certificate chain.`)
    }

    const isValidSignature = await this.checkSignature(verifiableCredential, isValidityCheck, jws, verifiableCredential.proof, publicKeyJwk)

    if (!isValidSignature) throw new ConflictException(`Provided signature does not match Self Description.`)

    return true
  }

  public async validateVP(verifiablePresentation: VerifiablePresentationDto, isValidityCheck?: boolean, jws?: string): Promise<boolean> {
    const { x5u, publicKeyJwk } = await this.getPublicKeys(verifiablePresentation.proof)
    const certificatesRaw: string = await this.loadCertificatesRaw(x5u)

    //TODO: disabled for self signed certificates
    const isValidChain = true //await this.registryService.isValidCertificateChain(certificatesRaw)

    if (!isValidChain) {
      throw new ConflictException(`X509 certificate chain could not be resolved against registry trust anchors.`)
    }
    if (!(await this.publicKeyMatchesCertificate(publicKeyJwk, certificatesRaw))) {
      throw new ConflictException(`Public Key does not match certificate chain.`)
    }

    const isValidSignature = await this.checkSignature(verifiablePresentation, isValidityCheck, jws, verifiablePresentation.proof, publicKeyJwk)

    if (!isValidSignature) throw new ConflictException(`Provided signature does not match Self Description.`)

    return true
  }

  public async getPublicKeys(proof: IProof) {
    const didEndIdx = (proof.verificationMethod as string).indexOf('#')
    const { verificationMethod, id } = await this.loadDDO(proof.verificationMethod.substring(0, didEndIdx))

    const jwk = verificationMethod.find(method => METHOD_IDS.includes(method.id) || method.id.startsWith(id))
    if (!jwk) throw new ConflictException(`verificationMethod ${verificationMethod} not found in did document`)

    const { publicKeyJwk } = jwk
    if (!publicKeyJwk) throw new ConflictException(`Could not load JWK for ${verificationMethod}`)

    const { x5u } = publicKeyJwk
    if (!publicKeyJwk.x5u) throw new ConflictException(`The x5u parameter is expected to be set in the JWK for ${verificationMethod}`)

    return { x5u, publicKeyJwk }
  }

  private async checkSignature(selfDescription, isValidityCheck: boolean, jws: string, proof, jwk: any): Promise<boolean> {
    delete selfDescription.proof

    const normalizedSD: string = await this.signatureService.normalize(selfDescription)
    const hashInput: string = isValidityCheck ? normalizedSD + jws : normalizedSD
    const hash: string = this.signatureService.sha256(hashInput)

    const verificationResult: Verification = await this.signatureService.verify(proof?.jws.replace('..', `.${hash}.`), jwk)
    return verificationResult.content === hash
  }

  private async publicKeyMatchesCertificate(publicKeyJwk: any, certificatePem: string): Promise<boolean> {
    try {
      const pk = await jose.importJWK(publicKeyJwk, 'RS256')
      const spki = await jose.exportSPKI(pk as jose.KeyLike)
      const x509 = await jose.importX509(certificatePem, 'RS256')
      const spkiX509 = await jose.exportSPKI(x509 as jose.KeyLike)

      return spki === spkiX509
    } catch (error) {
      throw new ConflictException('Could not confirm X509 public key with certificate chain.')
    }
  }

  private async loadDDO(did: string): Promise<any> {
    try {
      const didDocument = await this.getDidWebDocument(did)
      if (!didDocument?.verificationMethod || didDocument?.verificationMethod?.constructor !== Array)
        throw new ConflictException(`Could not load verificationMethods in did document at ${didDocument?.verificationMethod}`)

      return didDocument || undefined
    } catch (error) {
      throw new ConflictException(`Could not load document for given did:web: "${did}"`)
    }
  }

  public async loadCertificatesRaw(url: string): Promise<string> {
    try {
      const response = await this.httpService.get(url).toPromise()
      return response.data || undefined
    } catch (error) {
      throw new ConflictException(`Could not load X509 certificate(s) at ${url}`)
    }
  }

  private async getDidWebDocument(did: string): Promise<DIDDocument> {
    const webResolver = web.getResolver()
    const resolver = new Resolver(webResolver)
    const doc = await resolver.resolve(did)

    return doc.didDocument
  }

  private static isVcOrVp(input: unknown): boolean {
    return !(
      !input['type'] ||
      ((input['type'] as string[]).lastIndexOf('VerifiableCredential') === -1 &&
        (input['type'] as string[]).lastIndexOf('VerifiablePresentation') === -1)
    )
  }
}
