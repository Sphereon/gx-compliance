import { ValidationResultDto } from '../dto'

export type validationResultWithoutContent = Omit<ValidationResultDto, 'content'>
