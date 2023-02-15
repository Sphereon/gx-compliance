import { HttpService } from '@nestjs/axios'
import { ConflictException, Injectable } from '@nestjs/common'
import { Readable } from 'stream'
import { ValidationResult } from '../../@types/dto/common'
import DatasetExt from 'rdf-ext/lib/Dataset'
import Parser from '@rdfjs/parser-n3'
import ParserJsonLD from '@rdfjs/parser-jsonld'
import rdf from 'rdf-ext'
import SHACLValidator from 'rdf-validate-shacl'

@Injectable()
export class ShaclService {
  constructor(private readonly httpService: HttpService) {}

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
      throw new ConflictException('SHACL file cannot be loaded from provided url.')
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
}
