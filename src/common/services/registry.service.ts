import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class RegistryService {
  readonly registryUrl = process.env.REGISTRY_URL || 'https://registry.gaia-x.eu'
  private readonly logger = new Logger(RegistryService.name)

  constructor(private readonly httpService: HttpService) {}

  // TODO: check why this is not called for participants
  async isValidCertificateChain(raw: string): Promise<boolean> {
    try {
      // skip signature check against registry - NEVER ENABLE IN PRODUCTION
      if (process.env.DISABLE_SIGNATURE_CHECK === 'true') return true

      const response = await this.httpService
        .post(`${this.registryUrl}/api/trustAnchor/chain`, {
          certs: raw
        })
        .toPromise()

      return response.status === 200
    } catch (error) {
      this.logger.error(error)
    }
  }

  async getTermsAndConditions(): Promise<{ version: string; hash: string; text: string }> {
    try {
      const response = await this.httpService.get(`${this.registryUrl}/api/termsAndConditions`).toPromise()

      return response.data
    } catch (error) {
      console.log(error)
      this.logger.error(error)
    }
  }
}
