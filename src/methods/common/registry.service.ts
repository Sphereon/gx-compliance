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
      const response = await this.httpService
        .post(`${this.registryUrl}/v2206/api/trustAnchor/chain`, {
          certs: raw
        })
        .toPromise()
      return response.status === 200
    } catch (error) {
      this.logger.error(error)
    }
  }

  async getTermsAndConditions(version: '22.04' | '22.06' = '22.06'): Promise<{ version: string; hash: string; text: string }> {
    try {
      const response = await this.httpService.get(`${this.registryUrl}/v2206/api/termsAndConditions?version=${version}`).toPromise() // TODO: make v2206 dynamic again once 22.06 terms and conditions exist

      return response.data
    } catch (error) {
      this.logger.error(error)
    }
  }
}
