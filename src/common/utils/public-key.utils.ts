import {writeFileSync} from 'fs'
import {join} from 'path'

function parseCertificate() {
    const certificateData = process.env.X509_CERTIFICATE;

    // Check if the certificate data contains "-----"
    if (certificateData.includes("-----")) {
        return certificateData;
    } else {
        return atob(certificateData);
    }
}

export function importCertChain() {
    if (!!process.env.X509_CERTIFICATE) {
        const X509_CERTIFICATE_CHAIN_FILE_PATH = join(__dirname, '../../static/.well-known/x509CertificateChain.pem')
        writeFileSync(X509_CERTIFICATE_CHAIN_FILE_PATH, parseCertificate())
    }
}
