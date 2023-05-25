import { writeFileSync } from 'fs'
import { join } from 'path'

export function importCertChain() {
  if (!!process.env.X509_CERTIFICATE) {
    const X509_CERTIFICATE_CHAIN_FILE_PATH = join(__dirname, '../../static/.well-known/x509CertificateChain.pem')
    writeFileSync(X509_CERTIFICATE_CHAIN_FILE_PATH, process.env.X509_CERTIFICATE)
  }
}
