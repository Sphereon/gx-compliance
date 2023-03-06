import { fstat, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { BadRequestException } from '@nestjs/common'
import { X509Certificate } from 'crypto'



export async function import_cert_chain() {
    if(process.env.TLS=="true") {
        const X509_CERTIFICATE_CHAIN_FILE_PATH = join(__dirname, '../../static/.well-known/x509CertificateChain.pem')
        let chain = await (await transform(process.env.publicKey + " "))
        await new Promise ((resolve, reject)=> {
            for(let i=0; i< chain.length; i++) {
                chain[i] = chain[i].substring(1,chain[i].length)
                chain[i] = chain[i].replace(/ /g,"\n")
                chain[i] = '-----BEGIN CERTIFICATE-----\n' + chain[i] + '\n-----END CERTIFICATE-----\n'
            }
            resolve(true)
        })
        writeFileSync(X509_CERTIFICATE_CHAIN_FILE_PATH,chain.join(''))
        return true
    }
    else return true
  }
  export function stripPEMInfo(PEMInfo: string): string {
    return PEMInfo.replace(/([']* -----(BEGIN|END) (CERTIFICATE|PKCS7)----- [']*|\n)/gm, '')
  }

     async function transform(body: any) {
    try {
       
      // split string into 1 item per certificate
      const split = body.split('-----BEGIN CERTIFICATE-----')

      // remove BEGIN CERTIFICATE etc. and filter empty leftover strings
      const raw = split.map(c => stripPEMInfo(c)).filter(c => c.length > 1)

      return raw
    } catch (error) {
      this.logger.error(error)
      throw new BadRequestException('Environment variable error, certificate chain could not be transformed.')
    }
  }
