import { ValidationResultDto } from '../dto/common'

export type validationResultWithoutContent = Omit<ValidationResultDto, 'content'>
