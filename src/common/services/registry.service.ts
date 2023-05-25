import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'

@Injectable()
export class RegistryService {
  readonly registryUrl = process.env.REGISTRY_URL || 'https://registry.gaia-x.eu/development'
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
      console.error(error)
      this.logger.error(error)
    }
  }

  async getImplementedTrustFrameworkShapes(): Promise<string[]> {
    return (await firstValueFrom(this.httpService.get(`${this.registryUrl}/api/trusted-shape-registry/v1/shapes/implemented`))).data
  }

  async getShape(shape: string): Promise<any> {
    return (await firstValueFrom(this.httpService.get(`${this.registryUrl}/api/trusted-shape-registry/v1/shapes/${shape}`))).data
  }

  async getBaseUrl(): Promise<string> {
    try {
      return (await firstValueFrom(this.httpService.get(`${this.registryUrl}/base-url`, { timeout: 600 }))).data
    } catch (AxiosError) {
      console.error('unable to retrieve registry base url', AxiosError.message)
      return process.env.REGISTRY_URL
    }
  }
}
