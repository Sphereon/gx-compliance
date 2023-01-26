import { readFileSync, writeFileSync } from 'fs'
import * as jose from 'jose'
import { join } from 'path'

export const X509_VERIFICATION_METHOD_NAME = 'X509-JWK2020'
export const DID_DOC_FILE_PATH = join(__dirname, '../../static/.well-known/did.json')
export const X509_CERTIFICATE_CHAIN_FILE_PATH = join(__dirname, '../../static/.well-known/x509CertificateChain.pem')

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
    '@context': ['https://www.w3.org/ns/did/v1'],
    id: getDidWeb(),
    verificationMethod: [
      {
        '@context': 'https://w3c-ccg.github.io/lds-jws2020/contexts/v1/',
        id: x509VerificationMethodIdentifier,
        publicKeyJwk: {
          ...(await jose.exportJWK(spki)),
          alg: 'RS256',
          x5u
        }
      }
    ],
    assertionMethod: [x509VerificationMethodIdentifier]
  }

  writeFileSync(DID_DOC_FILE_PATH, JSON.stringify(DID_DOC))
}
