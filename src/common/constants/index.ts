export const METHOD_IDS = [
  'did:web:compliance.gaia-x.eu#JWK2020-RSA',
  'did:web:compliance.gaia-x.eu#X509-JWK2020',
  'did:web:compliance.lab.gaia-x.eu#JWK2020-RSA',
  'did:web:compliance.lab.gaia-x.eu#X509-JWK2020'
]

export const SUPPORTED_TYPES = ['LegalPerson', 'ServiceOfferingExperimental']

export const DID_WEB_PATTERN = /^did:web:([a-zA-Z0-9%?#._-]+:?)*[a-zA-Z0-9%?#._-]+/

export function getSdContext() {
  if (!process.env.SHACL_SHAPE_BASE_PATH) throw new Error('Missing SHACL_SHAPE_BASE_PATH environment variable')
  const registryUrl = process.env.REGISTRY_URL || 'https://registry.gaia-x.eu'

  return {
    cc: 'http://creativecommons.org/ns#',
    cred: 'https://www.w3.org/TR/vc-data-model/',
    dcat: 'http://www.w3.org/ns/dcat#',
    dct: 'http://purl.org/dc/terms/',
    foaf: 'http://xmlns.com/foaf/0.1/',
    'gax-core': `${registryUrl}${process.env.SHACL_SHAPE_BASE_PATH}/core#`,
    'gax-trust-framework': `${registryUrl}${process.env.SHACL_SHAPE_BASE_PATH}/gax-trust-framework#`,
    'gax-validation': `${registryUrl}${process.env.SHACL_SHAPE_BASE_PATH}/validation#`,
    owl: 'http://www.w3.org/2002/07/owl#',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    sh: 'http://www.w3.org/ns/shacl#',
    vann: 'http://purl.org/vocab/vann/',
    vcard: 'http://www.w3.org/2006/vcard/ns#',
    voaf: 'http://purl.org/vocommons/voaf#',
    void: 'http://rdfs.org/ns/void#',
    xsd: 'http://www.w3.org/2001/XMLSchema#'
  }
}

export const EXPECTED_PARTICIPANT_CONTEXT_TYPE = {
  '@type': 'gax-trust-framework:LegalPerson' // @type instead of type is right, it's used for the data graph ('sh:targetClass gax-trust-framework:LegalPerson' in the legal-personShape.ttl )
}

export const EXPECTED_SERVICE_OFFERING_CONTEXT_TYPE = {
  '@type': 'gax-trust-framework:ServiceOffering' // @type instead of type is right, it's used for the data graph
}
