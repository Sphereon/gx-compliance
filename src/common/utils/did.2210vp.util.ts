import { readFileSync, writeFileSync } from 'fs'
import * as jose from 'jose'
import { join } from 'path'

export const X509_VERIFICATION_METHOD_NAME = 'JWK2020-RSA'
export const DID_DOC_FILE_PATH = join(__dirname, '../static/.well-known/did.json')
export const X509_CERTIFICATE_CHAIN_FILE_PATH = join(__dirname, '../static/.well-known/x509CertificateChain.pem')

export function getDidWeb() {
  return `did:web:${getBaseUrl()
    .replace(/https?:\/\//, '')
    .replace('/', ':')}`
}

export function getBaseUrl() {
  return process.env.BASE_URL
}
export function getDidWebVerificationMethodIdentifier(): string {
  return `${getDidWeb()}#${X509_VERIFICATION_METHOD_NAME}`
}

export async function createDidDocument() {
  const spki = await jose.importX509(readFileSync(X509_CERTIFICATE_CHAIN_FILE_PATH).toString(), 'RS256')
  const x509VerificationMethodIdentifier = `${getDidWeb()}#${X509_VERIFICATION_METHOD_NAME}`
  const x5u = `${getBaseUrl()}/.well-known/x509CertificateChain.pem`

  const DID_DOC = {
    '@context': 'https://w3id.org/did/v1',
    id: getDidWeb(),
    verificationMethod: [
      {
        id: x509VerificationMethodIdentifier,
        type: 'JsonWebKey2020',
        controller: getDidWeb(),
        publicKeyJwk: {
          ...(await jose.exportJWK(spki)),
          // alg: 'RS256',
          x5u
        }
      }
    ],
    authentication: [x509VerificationMethodIdentifier],
    assertionMethod: [x509VerificationMethodIdentifier],
    service: []
  }

  writeFileSync(DID_DOC_FILE_PATH, JSON.stringify(DID_DOC))
}
