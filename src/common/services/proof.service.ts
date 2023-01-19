import { ConflictException, Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ParticipantSelfDescriptionDto } from '../../participant/dto/participant-sd.dto'
import { RegistryService } from './registry.service'
import { ServiceOfferingSelfDescriptionDto } from '../../service-offering/dto/service-offering-sd.dto'
import { SignatureService, Verification } from './signature.service'
import { VerifiableCredentialDto } from '../dto/credential-meta.dto'
import * as jose from 'jose'
import { METHOD_IDS } from '../constants'
import { DIDDocument, Resolver } from 'did-resolver'
import web from 'web-did-resolver'
import { IVerifiablePresentation } from '../@types'
import { CERT_CHAIN } from './suits/mockData'

@Injectable()
export class ProofService {
  constructor(
    private readonly httpService: HttpService,
    private readonly registryService: RegistryService,
    private readonly signatureService: SignatureService
  ) {}

  public async validate(
    selfDescriptionCredential:
      | VerifiableCredentialDto<ParticipantSelfDescriptionDto | ServiceOfferingSelfDescriptionDto>
      | IVerifiablePresentation
      | VerifiableCredentialDto<any>,
    isValidityCheck?: boolean,
    jws?: string
  ): Promise<boolean> {
    const { x5u, publicKeyJwk } = await this.getPublicKeys(selfDescriptionCredential)
    const certificatesRaw: string = await this.loadCertificatesRaw(x5u)

    //TODO: disabled for self signed certificates
    const isValidChain = true //await this.registryService.isValidCertificateChain(certificatesRaw)

    if (!isValidChain) throw new ConflictException(`X509 certificate chain could not be resolved against registry trust anchors.`)
    if (!this.publicKeyMatchesCertificate(publicKeyJwk, certificatesRaw)) throw new ConflictException(`Public Key does not match certificate chain.`)

    const input = (selfDescriptionCredential as any).selfDescription ? (selfDescriptionCredential as any)?.selfDescription : selfDescriptionCredential

    const isValidSignature = await this.checkSignature(input, isValidityCheck, jws, selfDescriptionCredential.proof, publicKeyJwk)

    if (!isValidSignature) throw new ConflictException(`Provided signature does not match Self Description.`)

    return true
  }

  private async getPublicKeys(selfDescriptionCredential) {
    const didEndIdx = (selfDescriptionCredential.proof.verificationMethod as string).indexOf('#')
    const { verificationMethod, id } = await this.loadDDO(selfDescriptionCredential.proof.verificationMethod.substring(0, didEndIdx))

    const jwk = verificationMethod.find(method => METHOD_IDS.includes(method.id) || method.id.startsWith(id))
    if (!jwk) throw new ConflictException(`verificationMethod ${verificationMethod} not found in did document`)

    const { publicKeyJwk } = jwk
    if (!publicKeyJwk) throw new ConflictException(`Could not load JWK for ${verificationMethod}`)

    const { x5u } = publicKeyJwk
    if (!publicKeyJwk.x5u) throw new ConflictException(`The x5u parameter is expected to be set in the JWK for ${verificationMethod}`)

    return { x5u, publicKeyJwk }
  }

  private async checkSignature(selfDescription, isValidityCheck: boolean, jws: string, proof, jwk: any): Promise<boolean> {
    /* /!**
      * These two branches are temporarily disabled. Re-enable them later
      *!/
     if (selfDescription['type'] && (selfDescription['type'] as string[]).lastIndexOf('VerifiableCredential') !== -1) {
       return await this.signatureService.checkVcSignature(selfDescription, jwk)
     } else if (selfDescription['type'] && (selfDescription['type'] as string[]).lastIndexOf('VerifiablePresentation') !== -1) {
       return await this.signatureService.checkVpSignature(selfDescription, jwk)
     }*/
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

  private async loadCertificatesRaw(url: string): Promise<string> {
    //todo: removed this
    if (url === 'https://f825-87-213-241-251.eu.ngrok.io/.well-known/ca-chain.pem') {
      return CERT_CHAIN
    }
    try {
      const response = await this.httpService.get(url).toPromise()
      return response.data.replace(/\n/gm, '') || undefined
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
