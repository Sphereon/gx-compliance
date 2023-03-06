import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common'
import { ObjectSchema } from 'joi'

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private schema: ObjectSchema) {}

  transform(value: any) {
    const { error } = this.schema.validate(value) // fails for null and undefined
    if (error) {
      throw new BadRequestException(error.message || 'Input validation failed')
    }
    return value
  }
}
