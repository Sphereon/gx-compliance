import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'
const ACCEPTED_STORE_PARAMETERS = ['true', 'false']

@Injectable()
export class BooleanQueryValidationPipe implements PipeTransform {
  defaultValue: boolean
  constructor(defaultValue = false) {
    this.defaultValue = defaultValue
  }
  transform(value: string): boolean {
    if (value === undefined) return this.defaultValue
    if (!ACCEPTED_STORE_PARAMETERS.includes(value)) throw new BadRequestException('Query parameter of type boolean must be either "true" or "false"')
    return value === 'true'
  }
}
