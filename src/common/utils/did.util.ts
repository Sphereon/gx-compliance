import { readFileSync, writeFileSync } from 'fs'
import * as jose from 'jose'
import { join } from 'path'

export const X509_VERIFICATION_METHOD_NAME = 'X509-JWK2020'
export const DID_DOC_FILE_PATH = join(__dirname, '../../static/did.json')
export const X509_CERTIFICATE_CHAIN_FILE_PATH = join(__dirname, '../../static/.well-known/x509CertificateChain.pem')

export function getDidWeb() {
  return `did:web:${process.env.BASE_URL.replace(/http[s]?:\/\//, '')
    .replace(':', '%3A') // encode port ':' as '%3A' in did:web
    .replace(/\//g, ':')}`
}
export function getCertChainUri() {
  return `${process.env.BASE_URL}/.well-known/x509CertificateChain.pem`
}

export async function createDidDocument() {
  const spki = await jose.importX509(readFileSync(X509_CERTIFICATE_CHAIN_FILE_PATH).toString(), 'PS256')
  const x509VerificationMethodIdentifier = `${getDidWeb()}#${X509_VERIFICATION_METHOD_NAME}`

  const DID_DOC = {
    '@context': ['https://www.w3.org/ns/did/v1'],
    id: getDidWeb(),
    verificationMethod: [
      {
        '@context': 'https://w3c-ccg.github.io/lds-jws2020/contexts/v1/',
        id: x509VerificationMethodIdentifier,
        publicKeyJwk: {
          ...(await jose.exportJWK(spki)),
          alg: 'PS256',
          x5u: getCertChainUri()
        }
      }
    ],
    assertionMethod: [x509VerificationMethodIdentifier]
  }

  writeFileSync(DID_DOC_FILE_PATH, JSON.stringify(DID_DOC))
}
