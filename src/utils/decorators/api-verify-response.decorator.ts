import { applyDecorators } from '@nestjs/common'
import { ApiBadRequestResponse, ApiConflictResponse, ApiOkResponse } from '@nestjs/swagger'

export function ApiVerifyResponse(credentialType: string) {
  return applyDecorators(
    ApiBadRequestResponse({ description: 'Invalid request payload' }),
    ApiConflictResponse({ description: `${credentialType} credential could not be verified` }),
    ApiOkResponse({ description: `${credentialType} credential successfully verified` })
  )
}
