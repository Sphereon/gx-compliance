import { ComplianceCredentialDto } from '../../@types/dto/common'
import { createHash } from 'crypto'
import { getDidWeb } from '../../utils/methods'
import { Injectable, BadRequestException, ConflictException } from '@nestjs/common'
import { CredentialSubjectDto, VerifiableCredentialDto } from '../../@types/dto/common'
import * as jose from 'jose'
import * as jsonld from 'jsonld'
import { SelfDescriptionTypes } from '../../@types/enums'
export interface Verification {
  protectedHeader: jose.CompactJWSHeaderParameters | undefined
  content: string | undefined
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
      const algorithm = jwk.alg || 'PS256'
      const rsaPublicKey = await jose.importJWK(cleanJwk, algorithm)

      const result = await jose.compactVerify(jws, rsaPublicKey)

      return { protectedHeader: result.protectedHeader, content: new TextDecoder().decode(result.payload) }
    } catch (error) {
      throw new ConflictException('Verification for the given jwk and jws failed.')
    }
  }

  async normalize(doc: object): Promise<string> {
    try {
      const canonized: string = await jsonld.canonize(doc, {
        algorithm: 'URDNA2015',
        format: 'application/n-quads'
      })

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
    const rsaPrivateKey = await jose.importPKCS8(`-----BEGIN PRIVATE KEY-----
    MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDm3J7fvXOE6LId
    8oO2r9kUaw/7pf8Y9nnDr4IZ9RSxfR7chNRLQpnHcolA3FBNV1FQx0umANVhSDSY
    2ldOvcpbREqJ5Gr99zUBe+RBQCwbgXZJynIVTIokmmyeWLz9yowDM4dBMcWUl1IU
    x1mk1SYpDegeQGheOJqqF8Noz3RBmINNWXU/52SPQBBwSdIRc5yKnM0LzM5MAqDc
    vY//r0civGPBqLVdnF4pLkk3aPzkN/cFr5ujtMSXikKcaD/NIvsP0ovW7fJeL5L5
    HeAf4I6KsQFsWUX5w+3mdUk6CvsH3Mt5JNiHkn9SRWAzh53gX4y82TblKDLelYvv
    NhqM0cvPAgMBAAECggEAJO13UEyqlMDv9NBc9zTroVN6zAMCagjK8104j1RfigB8
    lkN8/cjadkfA4qobAjQMYsJuPFB30UbOewC55HOBUdX7olDyOEt5pBIgMbvFEmVD
    +Yuzceq7Uh2NcEq7eFEU0lJEuU3vz9Pgokg885vQrdJ2pZgh2ahuPPTuIe7FJtSj
    pyPOPBqA0WDUdsxbGyv3Gc3oPRmGJ+Tj3Gz7SqJ8/7a/5bugHXQwS7FMjf8Z1vW+
    MzFBBXJxQnkTosmZVldmTS5T2iwyAWvy4C6ruIIR+RdzBh6pCI2Wd2d6Lpzx1mJp
    e+UPHd1Tav4UkcIf53sU1OfAaZuHhC2dofvHXN2nEQKBgQD5mkfdulf1jds+t9Yt
    LnzKKLd7GbHaS+xiKq8yk2eY9Wfkc5nP99+gOczXOccPnzL68V6IA58GEoae0NoB
    W13NH9e9+Ea5DtErcjr6cpUmbmn/ooI7LO3ATBiRgRuNrdPo53O4n0qKV6dvmnNK
    52YVYQCkH6VMeo9piReUsz5/FwKBgQDsx2AYOEzdgtS9/3JNpMmvoz6scqkZOztx
    e4EsLRwMxvDrhlWrndkf6bmY4qgC9Bmj+MiiWJIG+izupbK5n3Fmxi5OYe/F1bs+
    bIw08QSG09X8c2xxaOrQHx0Dw/6hT3qdThttP7hVSR3ddMxKumKWvUs+gxbJlOka
    X9VHAA/MCQKBgQDNiZUqaftqkoD7OYkdtY0/L54/uV3yg9jI0Ztpi2ag11zRC7ya
    O+SjXVVn2gUowRDLAh205T57UqAWgaczvNgWROV0YtFiLGhkXXFhsR9PAVc6Eckq
    D4pMcp08nFNjLMQ2ovlxC4LnPtz7EvVjtf8jFbjgbcrBmp8j6adIZP3OywKBgA4k
    /uWTf2wAI8tR1jczL+UxIE5W7ykVs8Bcu2OzMijFPaEkPjvpSw4v/SlX6Od8Q4fb
    Fck090w5Z7O97EZQcwrLrfp6uUMdOHlLLLkA6N9RCkhxcLn5pYVXRnlyHOTwBYge
    IV9OXimiG4meL5ILPlZ46mTKmfLi1WYA8ZGzPD5ZAoGAfKZLVQoxFH/xRR1jxlQL
    oOgSx4v3pPv5Nifhv2v1RR1RsTfV1TaRA652WExFJBEDtCkj3DvJsrdpXV7e6xSX
    +H0pW+5dG+VjcNrql2EcrgzIDZH0u56TzZMKAFud0OK9mZ0OlPUrWdkpuHTpOjiU
    1+uCJDcVD/mibm1RYs9np3k=
    -----END PRIVATE KEY-----`, alg)

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
        verificationMethod: getDidWeb()
      }
    }

    return { complianceCredential }
  }
}
