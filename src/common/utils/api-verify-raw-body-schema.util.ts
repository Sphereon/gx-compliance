import { getSchemaPath } from '@nestjs/swagger'
import { ExamplesObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface'
import { ParticipantSelfDescriptionDto } from '../../participant/dto'
import { ServiceOfferingSelfDescriptionDto } from '../../service-offering/dto/service-offering-sd.dto'
import { VerifiableSelfDescriptionDto } from '../dto'

type CredentialSubjectSchema = 'Participant' | 'ServiceOfferingExperimental'

function getSDCredentialSubjectSchema(credentialSubjectSchema: CredentialSubjectSchema) {
  const schemas: {
    [key in CredentialSubjectSchema]: any
  } = {
    Participant: ParticipantSelfDescriptionDto,
    ServiceOfferingExperimental: ServiceOfferingSelfDescriptionDto
  }

  return {
    type: 'array',
    items: { $ref: getSchemaPath(schemas[credentialSubjectSchema]) }
  }
}

export function getApiVerifyBodySchema(credentialSubjectSchema: CredentialSubjectSchema, examples: ExamplesObject) {
  const credSubSchema = getSDCredentialSubjectSchema(credentialSubjectSchema)
  return {
    schema: {
      allOf: [
        { $ref: getSchemaPath(VerifiableSelfDescriptionDto) },
        {
          properties: {
            selfDescriptionCredential: {
              properties: {
                credentialSubject: {
                  type: credSubSchema.type,
                  items:
                    credentialSubjectSchema === 'Participant'
                      ? {
                          allOf: [
                            credSubSchema.items,
                            {
                              properties: {
                                parentOrganisation: credSubSchema,
                                subOrganisation: credSubSchema
                              }
                            }
                          ]
                        }
                      : credSubSchema.items
                }
              }
            }
          }
        }
      ]
    },
    examples
  }
}
