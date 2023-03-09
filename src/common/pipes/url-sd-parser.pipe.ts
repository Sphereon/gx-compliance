import { HttpService } from '@nestjs/axios'
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'
import { SDParserPipe } from './sd-parser.pipe'
import { CredentialSubjectDto, SignedSelfDescriptionDto, VerifiableSelfDescriptionDto, VerifySdDto } from '../dto'
import { VerifyParticipantDto } from '../../participant/dto/verify-participant.dto'
@Injectable()
export class UrlSDParserPipe implements PipeTransform<VerifyParticipantDto, Promise<SignedSelfDescriptionDto<CredentialSubjectDto>>> {
  constructor(private readonly sdType: 'LegalPerson' | 'ServiceOfferingExperimental', private readonly httpService: HttpService) {}

  private readonly sdParser = new SDParserPipe(this.sdType)

  async transform(participant: VerifySdDto): Promise<SignedSelfDescriptionDto<CredentialSubjectDto>> {
    const { url } = participant

    try {
      const response = await this.httpService.get(url, { transformResponse: r => r }).toPromise()
      const { data: rawData } = response
      const data: VerifiableSelfDescriptionDto<CredentialSubjectDto> = JSON.parse(rawData)
      return this.sdParser.transform(data as any)
    } catch {
      throw new BadRequestException('URL is expected to reference data in JSON LD format')
    }
  }
}
