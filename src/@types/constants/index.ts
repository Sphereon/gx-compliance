const url = process.env.REGISTRY_URL

export const METHOD_IDS = [
  'did:web:compliance.gaia-x.eu#JWK2020-RSA',
  'did:web:compliance.gaia-x.eu#X509-JWK2020',
  'did:web:compliance.lab.gaia-x.eu#JWK2020-RSA',
  'did:web:compliance.lab.gaia-x.eu#X509-JWK2020'
]

export const SUPPORTED_TYPES = ['LegalPerson', 'ServiceOfferingExperimental']

export const DID_WEB_PATTERN = /^did:web:([a-zA-Z0-9%?#._-]+:?)*[a-zA-Z0-9%?#._-]+/

export const EXPECTED_PARTICIPANT_CONTEXT_TYPE = {
  '@context': {
    'gx-participant': `${{url}}/api/trusted-schemas-registry/schemas/participant`
  },
  '@type': 'gx-participant:LegalPerson' // @type instead of type is right, it's used for the data graph
}

export const EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE = {
  '@context': {
    'gx-service-offering':  `${{url}}/api/trusted-schemas-registry/schemas/serviceoffering`
  },
  '@type': 'gx-service-offering:ServiceOffering' // @type instead of type is right, it's used for the data graph
}
