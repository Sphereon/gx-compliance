import { HttpService } from '@nestjs/axios'
import { ConflictException, Injectable, NotFoundException, Logger } from '@nestjs/common'
import { Readable } from 'stream'
import DatasetExt from 'rdf-ext/lib/Dataset'
import Parser from '@rdfjs/parser-n3'
import ParserJsonLD from '@rdfjs/parser-jsonld'
import rdf from 'rdf-ext'
import { EXPECTED_PARTICIPANT_CONTEXT_TYPE, EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE } from '../constants'
import SHACLValidator from 'rdf-validate-shacl'
import { SelfDescriptionTypes } from '../enums'
import {
  CredentialSubjectDto,
  Schema_caching,
  ValidationResult,
  VerifiableCredentialDto,
} from '../dto'
import { NotFoundError } from 'rxjs'

const expectedContexts = {
  [SelfDescriptionTypes.PARTICIPANT]: EXPECTED_PARTICIPANT_CONTEXT_TYPE,
  [SelfDescriptionTypes.SERVICE_OFFERING]: EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE
}
const cache: Schema_caching = {
  LegalPerson: {},
  ServiceOfferingExperimental: {}
}

@Injectable()
export class ShaclService {
  constructor(private readonly httpService: HttpService) {}
  private readonly logger = new Logger(ShaclService.name)
  static readonly SHAPE_PATHS = {
    PARTICIPANT: 'participant',
    SERVICE_OFFERING: 'serviceoffering'
  }
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

  async loadFromJsonLD(raw: string): Promise<DatasetExt> {
    try {
      const parser = new ParserJsonLD({ factory: rdf })
      return this.transformToStream(raw, parser)
    } catch (error) {
      console.error(error)
      throw new ConflictException('Cannot load from provided JsonLD.')
    }
  }

  async loadShaclFromUrl(type:string): Promise<DatasetExt> {
    try {
      const url = process.env.REGISTRY_URL || "https://registry.lab.gaia-x.eu"
      const response= await (await this.httpService.get(`${url}/api/trusted-shape-registry/v1/shapes/${type}`).toPromise()).data   
      return this.isJsonString(response.data) ? this.loadFromJsonLD(response.data) : this.loadFromTurtle(response.data)
    } catch (error) {
      this.logger.error(`${error}, Url used to fetch shapes: ${process.env.REGISTRY_URL}/api/trusted-shape-registry/v1/shapes/${type}`)
      throw new ConflictException(error)
      
    }
  }

  async loadFromUrl(url: string): Promise<DatasetExt> {
    try {
      const response = await this.httpService
        .get(url, {
          // avoid JSON parsing and get plain json string as data
          transformResponse: r => r
        })
        .toPromise()
      
      return this.isJsonString(response.data) ? this.loadFromJsonLD(response.data) : this.loadFromTurtle(response.data)
    } catch (error) {
      console.error(error)
      throw new ConflictException("Cannot load TTL file for url ", url)
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

  
  public async getShaclShape(link: string): Promise<DatasetExt> {
    return await this.loadShaclFromUrl(link)
  }

  public async ShapeVerification(
    rawCredentialSubject: string,
    type: string,
  ): Promise<ValidationResult> {
    try {
      const rawPrepared = {
        ...JSON.parse(rawCredentialSubject),
        ...expectedContexts[type]
      }
      const selfDescriptionDataset: DatasetExt = await this.loadFromJsonLD(JSON.stringify(rawPrepared))
      if (this.Cache_check(type) == true) {
        const shape: ValidationResult = await this.validate(cache[type].shape, selfDescriptionDataset)
        return shape
      } else {
        try {
          const schema = await this.getShaclShape(this.getShapePath(type))
          cache[type].shape = schema
          const shape: ValidationResult = await this.validate(schema, selfDescriptionDataset)
          return shape
        }
        catch (e) {
          return {
            conforms:false,
            results:[e]
          }
        }
      }
    } catch (e) {
      throw e
    }
  }

  private Cache_check(type: string): boolean {
    let cached = false
    if (cache[type].shape) {
      cached = true
    }
    return cached
  }

  private getShapePath(type: string): string | undefined {
    const shapePathType = {
      [SelfDescriptionTypes.PARTICIPANT]: 'PARTICIPANT',
      [SelfDescriptionTypes.SERVICE_OFFERING]: 'SERVICE_OFFERING'
    }

    return ShaclService.SHAPE_PATHS[shapePathType[type]] || undefined
  }
}
