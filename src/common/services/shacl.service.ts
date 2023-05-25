import { ConflictException, Injectable, Logger } from '@nestjs/common'
import { Readable } from 'stream'
import DatasetExt from 'rdf-ext/lib/Dataset'
import Parser from '@rdfjs/parser-n3'
import rdf from 'rdf-ext'
import SHACLValidator from 'rdf-validate-shacl'
import { Schema_caching, ValidationResult } from '../dto'
import jsonld from 'jsonld'
import { RegistryService } from './registry.service'
import { getAtomicType } from '../utils/getAtomicType'

const cache: Schema_caching = {
  trustframework: {}
}

@Injectable()
export class ShaclService {
  constructor(private readonly registryService: RegistryService) {}

  private readonly logger = new Logger(ShaclService.name)

  async validate(shapes: DatasetExt, data: DatasetExt): Promise<ValidationResult> {
    const validator = new SHACLValidator(shapes, { factory: rdf as any })
    const report = await validator.validate(data)
    const { conforms, results: reportResults } = report

    const results: string[] = []
    for (const result of reportResults) {
      let errorMessage = `ERROR: ${result.path}: ${result.message || 'does not conform with the given shape'}`

      if (result.detail && result.detail.length > 0) {
        errorMessage = `${errorMessage}; DETAILS:`
        for (const detail of result.detail) {
          errorMessage = `${errorMessage} ${detail.path}: ${detail.message || 'does not conform with the given shape'};`
        }
      }
      results.push(errorMessage)
    }

    return {
      conforms,
      results
    }
  }

  async loadFromTurtle(raw: string): Promise<DatasetExt> {
    try {
      const parser = new Parser({ factory: rdf as any })
      return this.transformToStream(raw, parser)
    } catch (error) {
      throw new ConflictException('Cannot load from provided turtle.')
    }
  }

  async loadShaclFromUrl(type: string): Promise<DatasetExt> {
    try {
      const response = await this.registryService.getShape(type)
      return this.isJsonString(response) ? this.loadFromJSONLDWithQuads(response) : this.loadFromTurtle(response)
    } catch (error) {
      this.logger.error(`${error}, Url used to fetch shapes: ${process.env.REGISTRY_URL}/api/trusted-shape-registry/v1/shapes/${type}`)
      throw new ConflictException(error)
    }
  }

  private async transformToStream(raw: string, parser: any): Promise<DatasetExt> {
    const stream = new Readable()
    stream.push(raw)
    stream.push(null)

    return await rdf.dataset().import(parser.import(stream))
  }

  private isJsonString(str: any): boolean {
    try {
      JSON.parse(str)
    } catch (e) {
      return false
    }

    return true
  }

  public async getShaclShape(shapeName: string): Promise<DatasetExt> {
    return await this.loadShaclFromUrl(shapeName)
  }

  public async verifyShape(verifiablePresentation: any, type: string): Promise<ValidationResult> {
    if (!(await this.shouldCredentialBeValidated(verifiablePresentation))) {
      throw new ConflictException('VerifiableCrdential contains a shape that is not defined in registry shapes')
    }
    try {
      const selfDescriptionDataset: DatasetExt = await this.loadFromJSONLDWithQuads(verifiablePresentation)
      if (this.isCached(type)) {
        return await this.validate(cache[type].shape, selfDescriptionDataset)
      } else {
        try {
          const schema = await this.getShaclShape(type)
          cache[type].shape = schema
          return await this.validate(schema, selfDescriptionDataset)
        } catch (e) {
          console.log(e)
          return {
            conforms: false,
            results: [e]
          }
        }
      }
    } catch (e) {
      console.log(e)
      throw e
    }
  }

  private isCached(type: string): boolean {
    let cached = false
    if (cache[type] && cache[type].shape) {
      cached = true
    }
    return cached
  }

  async loadFromJSONLDWithQuads(data: object) {
    let quads
    try {
      quads = await jsonld.toRDF(data, { format: 'application/n-quads' })
    } catch (Error) {
      console.error('Unable to parse from JSONLD', Error)
    }
    const parser = new Parser({ factory: rdf as any })

    const stream = new Readable()
    stream.push(quads)
    stream.push(null)

    return await rdf.dataset().import(parser.import(stream))
  }

  private async shouldCredentialBeValidated(verifiablePresentation: any) {
    const validTypes = await this.registryService.getImplementedTrustFrameworkShapes()
    const credentialType = this.getVPTypes(verifiablePresentation)
    return credentialType
      .map(type => validTypes.indexOf(type) > -1)
      .reduce((previousValue, currentValue) => {
        return previousValue && currentValue
      })
  }

  private getVPTypes(verifiablePresentation: any): string[] {
    return verifiablePresentation.verifiableCredential.map(vc => {
      return getAtomicType(vc)
    })
  }
}
