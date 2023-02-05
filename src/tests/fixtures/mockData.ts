export class MockData {
  static getMockData() {
    return {
      w3credentialSchema: {
        '@context': {
          '@version': 1.1,
          '@protected': true,
          id: '@id',
          type: '@type',
          VerifiableCredential: {
            '@id': 'https://www.w3.org/2018/credentials#VerifiableCredential',
            '@context': {
              '@version': 1.1,
              '@protected': true,
              id: '@id',
              type: '@type',
              cred: 'https://www.w3.org/2018/credentials#',
              sec: 'https://w3id.org/security#',
              xsd: 'http://www.w3.org/2001/XMLSchema#',
              credentialSchema: {
                '@id': 'cred:credentialSchema',
                '@type': '@id',
                '@context': {
                  '@version': 1.1,
                  '@protected': true,
                  id: '@id',
                  type: '@type',
                  cred: 'https://www.w3.org/2018/credentials#',
                  JsonSchemaValidator2018: 'cred:JsonSchemaValidator2018'
                }
              },
              credentialStatus: { '@id': 'cred:credentialStatus', '@type': '@id' },
              credentialSubject: { '@id': 'cred:credentialSubject', '@type': '@id' },
              evidence: { '@id': 'cred:evidence', '@type': '@id' },
              expirationDate: { '@id': 'cred:expirationDate', '@type': 'xsd:dateTime' },
              holder: { '@id': 'cred:holder', '@type': '@id' },
              issued: { '@id': 'cred:issued', '@type': 'xsd:dateTime' },
              issuer: { '@id': 'cred:issuer', '@type': '@id' },
              issuanceDate: { '@id': 'cred:issuanceDate', '@type': 'xsd:dateTime' },
              proof: { '@id': 'sec:proof', '@type': '@id', '@container': '@graph' },
              refreshService: {
                '@id': 'cred:refreshService',
                '@type': '@id',
                '@context': {
                  '@version': 1.1,
                  '@protected': true,
                  id: '@id',
                  type: '@type',
                  cred: 'https://www.w3.org/2018/credentials#',
                  ManualRefreshService2018: 'cred:ManualRefreshService2018'
                }
              },
              termsOfUse: { '@id': 'cred:termsOfUse', '@type': '@id' },
              validFrom: { '@id': 'cred:validFrom', '@type': 'xsd:dateTime' },
              validUntil: { '@id': 'cred:validUntil', '@type': 'xsd:dateTime' }
            }
          },
          VerifiablePresentation: {
            '@id': 'https://www.w3.org/2018/credentials#VerifiablePresentation',
            '@context': {
              '@version': 1.1,
              '@protected': true,
              id: '@id',
              type: '@type',
              cred: 'https://www.w3.org/2018/credentials#',
              sec: 'https://w3id.org/security#',
              holder: { '@id': 'cred:holder', '@type': '@id' },
              proof: { '@id': 'sec:proof', '@type': '@id', '@container': '@graph' },
              verifiableCredential: { '@id': 'cred:verifiableCredential', '@type': '@id', '@container': '@graph' }
            }
          },
          EcdsaSecp256k1Signature2019: {
            '@id': 'https://w3id.org/security#EcdsaSecp256k1Signature2019',
            '@context': {
              '@version': 1.1,
              '@protected': true,
              id: '@id',
              type: '@type',
              sec: 'https://w3id.org/security#',
              xsd: 'http://www.w3.org/2001/XMLSchema#',
              challenge: 'sec:challenge',
              created: { '@id': 'http://purl.org/dc/terms/created', '@type': 'xsd:dateTime' },
              domain: 'sec:domain',
              expires: { '@id': 'sec:expiration', '@type': 'xsd:dateTime' },
              jws: 'sec:jws',
              nonce: 'sec:nonce',
              proofPurpose: {
                '@id': 'sec:proofPurpose',
                '@type': '@vocab',
                '@context': {
                  '@version': 1.1,
                  '@protected': true,
                  id: '@id',
                  type: '@type',
                  sec: 'https://w3id.org/security#',
                  assertionMethod: { '@id': 'sec:assertionMethod', '@type': '@id', '@container': '@set' },
                  authentication: { '@id': 'sec:authenticationMethod', '@type': '@id', '@container': '@set' }
                }
              },
              proofValue: 'sec:proofValue',
              verificationMethod: { '@id': 'sec:verificationMethod', '@type': '@id' }
            }
          },

          EcdsaSecp256r1Signature2019: {
            '@id': 'https://w3id.org/security#EcdsaSecp256r1Signature2019',
            '@context': {
              '@version': 1.1,
              '@protected': true,
              id: '@id',
              type: '@type',
              sec: 'https://w3id.org/security#',
              xsd: 'http://www.w3.org/2001/XMLSchema#',
              challenge: 'sec:challenge',
              created: { '@id': 'http://purl.org/dc/terms/created', '@type': 'xsd:dateTime' },
              domain: 'sec:domain',
              expires: { '@id': 'sec:expiration', '@type': 'xsd:dateTime' },
              jws: 'sec:jws',
              nonce: 'sec:nonce',
              proofPurpose: {
                '@id': 'sec:proofPurpose',
                '@type': '@vocab',
                '@context': {
                  '@version': 1.1,
                  '@protected': true,
                  id: '@id',
                  type: '@type',
                  sec: 'https://w3id.org/security#',
                  assertionMethod: { '@id': 'sec:assertionMethod', '@type': '@id', '@container': '@set' },
                  authentication: { '@id': 'sec:authenticationMethod', '@type': '@id', '@container': '@set' }
                }
              },
              proofValue: 'sec:proofValue',
              verificationMethod: { '@id': 'sec:verificationMethod', '@type': '@id' }
            }
          },
          Ed25519Signature2018: {
            '@id': 'https://w3id.org/security#Ed25519Signature2018',
            '@context': {
              '@version': 1.1,
              '@protected': true,
              id: '@id',
              type: '@type',
              sec: 'https://w3id.org/security#',
              xsd: 'http://www.w3.org/2001/XMLSchema#',
              challenge: 'sec:challenge',
              created: { '@id': 'http://purl.org/dc/terms/created', '@type': 'xsd:dateTime' },
              domain: 'sec:domain',
              expires: { '@id': 'sec:expiration', '@type': 'xsd:dateTime' },
              jws: 'sec:jws',
              nonce: 'sec:nonce',
              proofPurpose: {
                '@id': 'sec:proofPurpose',
                '@type': '@vocab',
                '@context': {
                  '@version': 1.1,
                  '@protected': true,
                  id: '@id',
                  type: '@type',
                  sec: 'https://w3id.org/security#',
                  assertionMethod: { '@id': 'sec:assertionMethod', '@type': '@id', '@container': '@set' },
                  authentication: { '@id': 'sec:authenticationMethod', '@type': '@id', '@container': '@set' }
                }
              },
              proofValue: 'sec:proofValue',
              verificationMethod: { '@id': 'sec:verificationMethod', '@type': '@id' }
            }
          },
          RsaSignature2018: {
            '@id': 'https://w3id.org/security#RsaSignature2018',
            '@context': {
              '@version': 1.1,
              '@protected': true,
              challenge: 'sec:challenge',
              created: { '@id': 'http://purl.org/dc/terms/created', '@type': 'xsd:dateTime' },
              domain: 'sec:domain',
              expires: { '@id': 'sec:expiration', '@type': 'xsd:dateTime' },
              jws: 'sec:jws',
              nonce: 'sec:nonce',
              proofPurpose: {
                '@id': 'sec:proofPurpose',
                '@type': '@vocab',
                '@context': {
                  '@version': 1.1,
                  '@protected': true,
                  id: '@id',
                  type: '@type',
                  sec: 'https://w3id.org/security#',
                  assertionMethod: { '@id': 'sec:assertionMethod', '@type': '@id', '@container': '@set' },
                  authentication: { '@id': 'sec:authenticationMethod', '@type': '@id', '@container': '@set' }
                }
              },
              proofValue: 'sec:proofValue',
              verificationMethod: { '@id': 'sec:verificationMethod', '@type': '@id' }
            }
          },
          proof: { '@id': 'https://w3id.org/security#proof', '@type': '@id', '@container': '@graph' }
        }
      },
      gxRegistryShape: {
        '@version': 2206,
        'gx-participant': {
          '@context': {
            xsd: 'http://www.w3.org/2001/XMLSchema#',
            sh: 'http://www.w3.org/ns/shacl#',
            'gx-participant': 'https://registry.gaia-x.eu/v2206/api/shape/files?file=participant&type=ttl#'
          },
          '@graph': [
            {
              '@id': 'gx-participant:AddressShape',
              '@type': 'sh:NodeShape',
              'sh:property': [
                {
                  'sh:path': { '@id': 'gx-participant:addressCode' },
                  'sh:description': 'Country principal subdivision code in ISO 3166-2 format.',
                  'sh:datatype': { '@id': 'xsd:string' },
                  'sh:minCount': 1,
                  'sh:maxCount': 1,
                  'sh:minLength': 4,
                  'sh:maxLength': 6,
                  'sh:pattern': '^[A-Z]{2}-[A-Z0-9]{1,3}$'
                },
                {
                  'sh:path': { '@id': 'gx-participant:addressCountryCode' },
                  'sh:description': 'Optional country code in ISO 3166-1 alpha2 format.',
                  'sh:datatype': { '@id': 'xsd:string' },
                  'sh:maxCount': 1,
                  'sh:minLength': 2,
                  'sh:pattern': '^[A-Z]{2}$'
                }
              ]
            },
            {
              '@id': 'gx-participant:RegistrationNumberShape',
              '@type': 'sh:NodeShape',
              'sh:property': [
                {
                  'sh:path': { '@id': 'gx-participant:registrationNumberType' },
                  'sh:description': 'The type of the registrationNumber',
                  'sh:datatype': { '@id': 'xsd:string' },
                  'sh:minCount': 1,
                  'sh:maxCount': 1,
                  'sh:minLength': 1
                },
                {
                  'sh:path': { '@id': 'gx-participant:registrationNumberNumber' },
                  'sh:description': 'The registrationNumber itself.',
                  'sh:datatype': { '@id': 'xsd:string' },
                  'sh:minCount': 1,
                  'sh:maxCount': 1,
                  'sh:minLength': 1
                }
              ]
            },
            {
              '@id': 'gx-participant:LegalPersonShape',
              '@type': 'sh:NodeShape',
              'sh:targetClass': { '@id': 'gx-participant:LegalPerson' },
              'sh:property': [
                {
                  'sh:path': { '@id': 'gx-participant:registrationNumber' },
                  'sh:node': { '@id': 'gx-participant:RegistrationNumberShape' },
                  'sh:description': "Country's registration number which identifies one specific company.",
                  'sh:minCount': 1
                },
                {
                  'sh:path': { '@id': 'gx-participant:headquarterAddress' },
                  'sh:node': { '@id': 'gx-participant:AddressShape' },
                  'sh:minCount': 1,
                  'sh:maxCount': 1
                },
                {
                  'sh:path': { '@id': 'gx-participant:legalAddress' },
                  'sh:node': { '@id': 'gx-participant:AddressShape' },
                  'sh:minCount': 1,
                  'sh:maxCount': 1
                },
                {
                  'sh:path': { '@id': 'gx-participant:termsAndConditions' },
                  'sh:description': 'SHA512 of the Generic Terms and Conditions for Gaia-X Ecosystem',
                  'sh:datatype': { '@id': 'xsd:string' },
                  'sh:minCount': 1,
                  'sh:maxCount': 1,
                  'sh:minLength': 1
                },
                {
                  'sh:path': { '@id': 'gx-participant:leiCode' },
                  'sh:description': 'Unique LEI number as defined by https://www.gleif.org.',
                  'sh:datatype': { '@id': 'xsd:string' },
                  'sh:maxCount': 1,
                  'sh:minLength': 20,
                  'sh:maxLength': 20,
                  'sh:pattern': '[0-9A-Z]{18}[0-9]{2}',
                  'sh:flags': 'i'
                },
                {
                  'sh:path': { '@id': 'gx-participant:parentOrganisation' },
                  'sh:description': 'A list of direct participant that this entity is a subOrganization of, if any.',
                  'sh:node': { '@id': 'gx-participant:LegalPersonShape' }
                },
                {
                  'sh:path': { '@id': 'gx-participant:subOrganisation' },
                  'sh:description': 'A list of direct participant with an legal mandate on this entity, e.g., as a subsidiary.',
                  'sh:node': { '@id': 'gx-participant:LegalPersonShape' }
                }
              ]
            }
          ]
        },
        'gx-resource': {
          '@context': {
            rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
            xsd: 'http://www.w3.org/2001/XMLSchema#',
            sh: 'http://www.w3.org/ns/shacl#',
            schema: 'http://schema.org/',
            'gx-participant': 'https://registry.gaia-x.eu/api/v2206/shape/files?file=participant&type=ttl#',
            'gx-resource': 'https://registry.gaia-x.eu/api/v2206/shape/files?file=resource&type=ttl#'
          },
          '@graph': [
            {
              '@id': 'gx-resource:ResourceShape',
              '@type': 'sh:NodeShape',
              'sh:targetClass': { '@id': 'gx-resource:Resource' },
              'sh:property': {
                'sh:path': { '@id': 'gx-resource:aggregationOf' },
                'sh:description': 'resources related to the resource and that can exist independently of it.',
                'sh:class': { '@id': 'gx-resource:Resource' }
              }
            },
            {
              '@id': 'gx-resource:PhysicalResourceShape',
              '@type': 'sh:NodeShape',
              'rdfs:subClassOf': { '@id': 'gx-resource:Resource' },
              'sh:targetClass': { '@id': 'gx-resource:PhysicalResource' },
              'sh:property': [
                {
                  'sh:path': { '@id': 'gx-resource:maintainedBy' },
                  'sh:description': 'a list of participant maintaining the resource in operational condition and thus having physical access to it.',
                  'sh:class': { '@id': 'gx-participant:LegalPerson' },
                  'sh:minCount:': 1
                },
                {
                  'sh:path': { '@id': 'gx-resource:ownedBy' },
                  'sh:description': 'a list of participant owning the resource.',
                  'sh:class': { '@id': 'gx-participant:LegalPerson' }
                },
                {
                  'sh:path': { '@id': 'gx-resource:manufacturedBy' },
                  'sh:description': 'a list of participant manufacturing the resource.',
                  'sh:class': { '@id': 'gx-participant:LegalPerson' }
                },
                {
                  'sh:path': { '@id': 'gx-resource:locationAddress' },
                  'sh:description': 'a list of physical location in ISO 3166-1 alpha2, alpha-3 or numeric format.',
                  'sh:class': { '@id': 'gx-participant:Address' },
                  'sh:minCount': 1
                }
              ]
            },
            {
              '@id': 'gx-resource:VirtualResourceShape',
              '@type': 'sh:NodeShape',
              'rdfs:subClassOf': { '@id': 'gx-resource:Resource' },
              'sh:targetClass': { '@id': 'gx-resource:VirtualResource' },
              'sh:property': [
                {
                  'sh:path': { '@id': 'gx-resource:copyrightOwnedBy' },
                  'sh:description':
                    'A list of copyright owners either as a free form string or participant URIs from which Self-Descriptions can be retrieved. A copyright owner is a person or organization that has the right to exploit the resource. Copyright owner does not necessarily refer to the author of the resource, who is a natural person and may differ from copyright owner.',
                  'sh:class': { '@id': 'gx-participant:LegalPerson' },
                  'sh:minCount:': 1
                },
                {
                  'sh:path': { '@id': 'gx-resource:license' },
                  'sh:description': 'A list of SPDX license identifiers or URL to license document',
                  'sh:datatype': { '@id': 'xsd:string' },
                  'sh:minCount:': 1
                }
              ]
            },
            {
              '@id': 'gx-resource:InstantiatedVirtualResourceShape',
              '@type': 'sh:NodeShape',
              'rdfs:subClassOf': { '@id': 'gx-resource:VirtualResource' },
              'sh:targetClass': { '@id': 'gx-resource:InstantiatedVirtualResource' },
              'sh:property': [
                {
                  'sh:path': { '@id': 'gx-resource:maintainedBy' },
                  'sh:description': 'a list of participant maintaining the resource in operational condition.',
                  'sh:class': { '@id': 'gx-participant:LegalPerson' },
                  'sh:minCount:': 1
                },
                {
                  'sh:path': { '@id': 'gx-resource:hostedOn' },
                  'sh:description': 'A list of SPDX license identifiers or URL to license document',
                  'sh:datatype': { '@id': 'xsd:string' },
                  'sh:minCount:': 1
                },
                {
                  'sh:path': { '@id': 'gx-resource:tenantOwnedBy' },
                  'sh:description': 'a list of participant with contractual relation with the resource.',
                  'sh:class': { '@id': 'gx-participant:LegalPerson' },
                  'sh:minCount:': 1
                }
              ]
            }
          ]
        },
        'gx-service-offering': {
          '@context': {
            xsd: 'http://www.w3.org/2001/XMLSchema#',
            sh: 'http://www.w3.org/ns/shacl#',
            'gx-service-offering': 'https://registry.gaia-x.eu/v2206/api/shape/files?file=service-offering&type=ttl#'
          },
          '@graph': [
            {
              '@id': 'gx-service-offering:TermsAndConditionsShape',
              '@type': 'sh:NodeShape',
              'sh:property': [
                {
                  'sh:path': { '@id': 'gx-service-offering:url' },
                  'sh:description': 'a resolvable link to document',
                  'sh:datatype': { '@id': 'xsd:string' },
                  'sh:minCount': 1,
                  'sh:maxCount': 1
                },
                {
                  'sh:path': { '@id': 'gx-service-offering:hash' },
                  'sh:description': 'sha256 hash of the above document.',
                  'sh:datatype': { '@id': 'xsd:string' },
                  'sh:minCount': 1,
                  'sh:maxCount': 1
                }
              ]
            },
            {
              '@id': 'gx-service-offering:DataExportShape',
              '@type': 'sh:NodeShape',
              'sh:property': [
                {
                  'sh:path': { '@id': 'gx-service-offering:requestType' },
                  'sh:description': 'The mean to request data retrieval',
                  'sh:datatype': { '@id': 'xsd:string' },
                  'sh:minCount': 1,
                  'sh:maxCount': 1,
                  'sh:pattern': '^(API|email|webform|unregisteredLetter|registeredLetter|supportCenter)$'
                },
                {
                  'sh:path': { '@id': 'gx-service-offering:accessType' },
                  'sh:description': 'Type of data support',
                  'sh:datatype': { '@id': 'xsd:string' },
                  'sh:minCount': 1,
                  'sh:maxCount': 1,
                  'sh:pattern': '^(digital|physical)$'
                },
                {
                  'sh:path': { '@id': 'gx-service-offering:formatType' },
                  'sh:description': 'Type of Media Types (formerly known as MIME types) as defined by the IANA.',
                  'sh:datatype': { '@id': 'xsd:string' },
                  'sh:minCount': 1,
                  'sh:maxCount': 1,
                  'sh:minLength': 1
                }
              ]
            },
            {
              '@id': 'gx-service-offering:ServiceOfferingShape',
              '@type': 'sh:NodeShape',
              'sh:targetClass': { '@id': 'gx-service-offering:ServiceOffering' },
              'sh:name': 'Service Offering',
              'sh:property': [
                {
                  'sh:path': { '@id': 'gx-service-offering:providedBy' },
                  'sh:description': 'a resolvable link to the participant Self-Description providing the service',
                  'sh:datatype': { '@id': 'xsd:string' },
                  'sh:minCount:': 1,
                  'sh:maxCount:': 1
                },
                {
                  'sh:path': { '@id': 'gx-service-offering:termsAndConditions' },
                  'sh:description': 'a resolvable link to the Terms and Conditions applying to that service.',
                  'sh:node': { '@id': 'gx-service-offering:TermsAndConditionsShape' },
                  'sh:minCount:': 1
                },
                {
                  'sh:path': { '@id': 'gx-service-offering:dataExport' },
                  'sh:description': 'list of methods to export data out of the service',
                  'sh:node': { '@id': 'gx-service-offering:DataExportShape' },
                  'sh:minCount': 1
                },
                {
                  'sh:path': { '@id': 'gx-service-offering:aggregationOf' },
                  'sh:description':
                    'a resolvable link to the Self-Descriptions of resources related to the service and that can exist independently of it.',
                  'sh:datatype': { '@id': 'xsd:string' }
                },
                {
                  'sh:path': { '@id': 'gx-service-offering:policies' },
                  'sh:description': 'a list of policy expressed using a DSL (e.g., Rego or ODRL)',
                  'sh:datatype': { '@id': 'xsd:string' }
                },
                {
                  'sh:path': { '@id': 'gx-service-offering:dataProtectionRegime' },
                  'sh:description':
                    'a list of data protection regime (see https://gaia-x.gitlab.io/policy-rules-committee/trust-framework/service/#service-offering)',
                  'sh:datatype': { '@id': 'xsd:string' },
                  'sh:minLength': 8,
                  'sh:maxLength': 9,
                  'sh:pattern': '^(GDPR2016|LGPD2019|PDPA2012|CCPA2018|VCDPA2021)$'
                }
              ]
            }
          ]
        }
      },
      wellknownDid: {
        '@context': ['https://www.w3.org/ns/did/v1'],
        id: 'did:web:0c1b-2001-1c04-2b34-bb00-c366-4d7b-3320-824b.eu.ngrok.io',
        verificationMethod: [
          {
            '@context': 'https://w3c-ccg.github.io/lds-jws2020/contexts/v1/',
            id: 'did:web:0c1b-2001-1c04-2b34-bb00-c366-4d7b-3320-824b.eu.ngrok.io#JWK2020-RSA',
            type: 'JsonWebKey2020',
            controller: 'did:web:0c1b-2001-1c04-2b34-bb00-c366-4d7b-3320-824b.eu.ngrok.io',
            publicKeyJwk: {
              kty: 'RSA',
              n: '3Deyqyn5swg9OMwDDskFPIqcQKqvc9BQk65hM6NFzxRSvJQb4HAWQsyhXvdewcxPP3B4C_VJeHuG_EKQtLapVAmKlyz8TsSbUb07hhR_iYQ6Z9vcDdmZK4dWWx7PJ1zAyKiBdjaf7CxB5CQUjjFNJT0Jtb7hIsJrJJsyNwltAXyXZZpeP8YAB1jfh4vzLis5_6Zzq57e776fRalsJZnhXXC5oHXX2yil5KqMxFgX_tLrr302dJNMnhOYLU_gvRhoQVbj7iQhRenWtWZqt3n12oE_ER7KP8bGuy6O3rCb_NgB5kr7UBCjXeO_BIceLmySiDxu7IUwL0AOLEnmPTWCUQ',
              e: 'AQAB',
              alg: 'PS256',
              x5u: 'https://0c1b-2001-1c04-2b34-bb00-c366-4d7b-3320-824b.eu.ngrok.io/.well-known/x509CertificateChain.pem'
            }
          }
        ],
        assertionMethod: ['did:web:0c1b-2001-1c04-2b34-bb00-c366-4d7b-3320-824b.eu.ngrok.io#JWK2020-RSA']
      },
      selfDescription: {
        '@context': ['https://www.w3.org/2018/credentials/v1', 'https://registry.gaia-x.eu/v2206/api/shape'],
        type: ['VerifiableCredential', 'LegalPerson'],
        id: 'https://delta-dao.com/.well-known/participant.json',
        issuer: 'did:web:0c1b-2001-1c04-2b34-bb00-c366-4d7b-3320-824b.eu.ngrok.io',
        issuanceDate: '2022-09-15T20:05:20.997Z',
        credentialSubject: {
          id: 'did:web:0c1b-2001-1c04-2b34-bb00-c366-4d7b-3320-824b.eu.ngrok.io',
          'gx-participant:legalName': 'deltaDAO AG',
          'gx-participant:registrationNumber': {
            'gx-participant:registrationNumberType': 'leiCode',
            'gx-participant:registrationNumberNumber': '391200FJBNU0YW987L26'
          },
          'gx-participant:blockchainAccountId': '0x4C84a36fCDb7Bc750294A7f3B5ad5CA8F74C4A52',
          'gx-participant:headquarterAddress': {
            'gx-participant:addressCountryCode': 'DE',
            'gx-participant:addressCode': 'DE-HH',
            'gx-participant:streetAddress': 'Geibelstraße 46b',
            'gx-participant:postalCode': '22303'
          },
          'gx-participant:legalAddress': {
            'gx-participant:addressCountryCode': 'DE',
            'gx-participant:addressCode': 'DE-HH',
            'gx-participant:streetAddress': 'Geibelstraße 46b',
            'gx-participant:postalCode': '22303'
          },
          'gx-participant:termsAndConditions': '70c1d713215f95191a11d38fe2341faed27d19e083917bc8732ca4fea4976700'
        },
        proof: {
          type: 'JsonWebSignature2020',
          created: '2022-12-02T11:49:11.112Z',
          proofPurpose: 'assertionMethod',
          verificationMethod: 'did:web:0c1b-2001-1c04-2b34-bb00-c366-4d7b-3320-824b.eu.ngrok.io',
          jws: 'eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..SLtW5EW5QGk47QH7IlZ8LcixwIXPVR7JdSkeU9vyibTu9WqyDcaS7bOd5jwtMHCZLHK1lo4-ayjC1WVREJvvdTBnYndwqv4pd1fadyhBeXU08ifHI5QL2sRiye7yL2W2ZpCPpcA3vXXZ9cinHbjSAjQeOhI9_u1qKalB1ji-H1XvyX-lCG7OIyM9EZVgmpYTzsYRNKW_8J8Yaqa0Bln-j8DF93NlH5UNf4djoEIOTjWELAhbRJsBXiNe7X5rGrFtjjR_5LSiAR52OhoFnBJh0ZpvhhzAyHQ3cZ3KUR3fOtqO1YLe0hhYIRMSkJYjU2l-MeVV2nATIUt0_Ng5VaadIQ'
        }
      },
      participantTtl:
        '@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n' +
        '@prefix sh: <http://www.w3.org/ns/shacl#> .\n' +
        '@prefix gx-participant: <https://registry.gaia-x.eu/v2206/api/shape/files?file=participant&type=ttl#> .\n' +
        '\n' +
        'gx-participant:AddressShape\n' +
        '  a sh:NodeShape ;\n' +
        '  sh:property [\n' +
        '    sh:path gx-participant:addressCode ;\n' +
        '    sh:description "Country principal subdivision code in ISO 3166-2 format." ;\n' +
        '    sh:datatype xsd:string ;\n' +
        '\t  sh:minCount 1 ;\n' +
        '    sh:maxCount 1 ;\n' +
        '    sh:minLength 4 ;\n' +
        '    sh:maxLength 6 ;\n' +
        '    sh:pattern "^[A-Z]{2}-[A-Z0-9]{1,3}$" ;\n' +
        '  ] ;\n' +
        '  sh:property [\n' +
        '    sh:path gx-participant:addressCountryCode ;\n' +
        '    sh:description "Optional country code in ISO 3166-1 alpha2 format." ;\n' +
        '    sh:datatype xsd:string ;\n' +
        '    sh:maxCount 1 ;\n' +
        '    sh:minLength 2 ;\n' +
        '\tsh:pattern "^[A-Z]{2}$" ;\n' +
        '  ].\n' +
        '\n' +
        'gx-participant:RegistrationNumberShape\n' +
        '  a sh:NodeShape ;\n' +
        '  sh:property [\n' +
        '    sh:path gx-participant:registrationNumberType ;\n' +
        '    sh:description "The type of the registrationNumber" ;\n' +
        '    sh:datatype xsd:string ;\n' +
        '\t  sh:minCount 1 ;\n' +
        '    sh:maxCount 1 ;\n' +
        '    sh:minLength 1\n' +
        '  ] ;\n' +
        '\tsh:property [\n' +
        '    sh:path gx-participant:registrationNumberNumber ;\n' +
        '    sh:description "The registrationNumber itself." ;\n' +
        '    sh:datatype xsd:string ;\n' +
        '    sh:minCount 1 ;\n' +
        '\tsh:maxCount 1 ;\n' +
        '    sh:minLength 1\n' +
        '  ].\n' +
        '\n' +
        'gx-participant:LegalPersonShape\n' +
        '  a sh:NodeShape ;\n' +
        '  sh:targetClass gx-participant:LegalPerson ;\n' +
        '  sh:property [\n' +
        '    sh:path gx-participant:registrationNumber ;\n' +
        '    sh:node gx-participant:RegistrationNumberShape ;\n' +
        '\tsh:description "Country\'s registration number which identifies one specific company." ;\n' +
        '    sh:minCount 1 ;\n' +
        '  ] ;\n' +
        '\tsh:property [\n' +
        '    sh:path gx-participant:headquarterAddress ;\n' +
        '    sh:node gx-participant:AddressShape ;\n' +
        '    sh:minCount 1 ;\n' +
        '    sh:maxCount 1\n' +
        '  ] ;\n' +
        '\tsh:property [\n' +
        '    sh:path gx-participant:legalAddress ;\n' +
        '    sh:node gx-participant:AddressShape ;\n' +
        '    sh:minCount 1 ;\n' +
        '    sh:maxCount 1\n' +
        '  ];\n' +
        '\tsh:property [\n' +
        '    sh:path gx-participant:termsAndConditions ;\n' +
        '    sh:description "SHA512 of the Generic Terms and Conditions for Gaia-X Ecosystem" ;\n' +
        '    sh:datatype xsd:string ;\n' +
        '    sh:minCount 1 ;\n' +
        '    sh:maxCount 1 ;\n' +
        '    sh:minLength 1\n' +
        '  ];\n' +
        '\tsh:property [\n' +
        '    sh:path gx-participant:leiCode ;\n' +
        '    sh:description "Unique LEI number as defined by https://www.gleif.org." ;\n' +
        '    sh:datatype xsd:string ;\n' +
        '    sh:maxCount 1 ;\n' +
        '    sh:minLength 20 ;\n' +
        '    sh:maxLength 20 ;\n' +
        '    sh:pattern "[0-9A-Z]{18}[0-9]{2}" ;\n' +
        '    sh:flags "i"\n' +
        '  ] ;\n' +
        '\tsh:property[\n' +
        '    sh:path gx-participant:parentOrganisation ;\n' +
        '    sh:description "A list of direct participant that this entity is a subOrganization of, if any." ;\n' +
        '    sh:node gx-participant:LegalPersonShape\n' +
        '  ] ;\n' +
        '\tsh:property [\n' +
        '    sh:path gx-participant:subOrganisation ;\n' +
        '    sh:description "A list of direct participant with an legal mandate on this entity, e.g., as a subsidiary." ;\n' +
        '    sh:node gx-participant:LegalPersonShape\n' +
        '  ].',
      privateKey:
        '-----BEGIN PRIVATE KEY-----\n' +
        'MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDcN7KrKfmzCD04\n' +
        'zAMOyQU8ipxAqq9z0FCTrmEzo0XPFFK8lBvgcBZCzKFe917BzE8/cHgL9Ul4e4b8\n' +
        'QpC0tqlUCYqXLPxOxJtRvTuGFH+JhDpn29wN2Zkrh1ZbHs8nXMDIqIF2Np/sLEHk\n' +
        'JBSOMU0lPQm1vuEiwmskmzI3CW0BfJdlml4/xgAHWN+Hi/MuKzn/pnOrnt7vvp9F\n' +
        'qWwlmeFdcLmgddfbKKXkqozEWBf+0uuvfTZ0k0yeE5gtT+C9GGhBVuPuJCFF6da1\n' +
        'Zmq3efXagT8RHso/xsa7Lo7esJv82AHmSvtQEKNd478Ehx4ubJKIPG7shTAvQA4s\n' +
        'SeY9NYJRAgMBAAECggEAAw+nJSf1N57isvprBHaY4wmOOHvm6nY32IWxBjW7z7AZ\n' +
        'olNwu8LzHESZ7acEoy8C3v/iO1BSkCEvdCw8tLZhTjC/w3A1paan/g/iVu/MAg5b\n' +
        'fXwZ5/thXLCJ68RW3tY0O9XTzt/dgzvuQoyZ2Iwo5V6e1u7rVD9dm+moXgl8gWvC\n' +
        'WK3HYPpkG3wJdksuAld7QNhcmYtxIG/1WE4uH/zLo5qXzw409s2/xmdi6wo1gv9x\n' +
        'aextWew8knxhvj4O6Nb9wFPlG8iCuWQ28YxN8luApZoRtp8GHw1xl91Od9X5uoJr\n' +
        'VjcWC/0VKZ0xnPdPURH+6E/j0CvHg/Ph2M/6zq7VnQKBgQDoCC03Oyx7rdx1AXV3\n' +
        'VHMCzOyKm/ag+K6/Edu68jEyWxyiFSff9ld177b8Sgxmg7XO6b6285CaQzd5Q8+X\n' +
        '/f7eD+DktDmDswQLXzB2KajVYt+3L+j6qZph/G7J/G115ovbbjHbGB7Ouf5BxAO7\n' +
        'Ph0FRIRFp314luYJJi3sA9SXjwKBgQDy9xqE8Y5AqUCTdVPwmqKxEI0a04Jl5wVC\n' +
        'M1/6N12MVSlDMxAkAmddb/0HOaCvLLmE7JF1kfyoCRlRCZeQtrKGK2DMdDFJlFHj\n' +
        'kf8E8pK9zbMlVQ9iiIayf4zQFY/8pHJpK9NcnVpS5h1YrQEzD2pBBjwzXm9/d+x7\n' +
        'ajKQqMJYHwKBgQDkLg5RL1cKdarEQeADrr+/tEi18rRyDrzCV8yPJtesnp8k4csp\n' +
        '2zadW1TG/Ab/1Wy4g3OytQmyOoHWNhJzdSvrsw/FuVqKIkTK7hxZR5Sp7Cb3Hh1u\n' +
        'S9XvoHBPIHeAp21IKDDNNgYt5AifIiVNQMMHSB8P5KtmKHcl7i7g1898DwKBgFJn\n' +
        '5SK6GxlrTm+1F6c/i3aqunEi09NkK7BsZF0lciEqsTgNlafg+NYEKbnNneZMMRAY\n' +
        'fK13uk3z6BZIPpPio2JGTCqMLjtahvu8hNZUv9iIb/51fyZYT/cys7vP1GpIDFYH\n' +
        'e0SqSfxb+BAffYyn6c3sI3b4zLBbKGYjesr9sgzZAoGBALhYYITwN/hKn0s7JFQH\n' +
        'Pluls4ezkGLXKU9W5pT8iLyY46r/zQ53boEXagp2d4WX1IdXXidsBi7Gs4ky9FvE\n' +
        'FwEesVqMoiQ+PA4v4ui0ZmloNDkooYidiRjTpvr2S0D+Nxgubd/kvzsqshnQIn0R\n' +
        '/Q77bZrKK2WzPenVZocAmi87\n' +
        '-----END PRIVATE KEY-----',
      certificateChain:
        '-----BEGIN CERTIFICATE-----\n' +
        'MIIDYzCCAhagAwIBAgIUNnBJbaH6LtTwrelrNaXwGDzoua4wQgYJKoZIhvcNAQEK\n' +
        'MDWgDzANBglghkgBZQMEAgEFAKEcMBoGCSqGSIb3DQEBCDANBglghkgBZQMEAgEF\n' +
        'AKIEAgIA3jANMQswCQYDVQQDDAJDQTAeFw0yMjEyMDExNTIwMDRaFw0yMjEyMzEx\n' +
        'NTIwMDRaMA0xCzAJBgNVBAMMAkNBMIIBIDALBgkqhkiG9w0BAQoDggEPADCCAQoC\n' +
        'ggEBAK1/ztr4yIWeXdevOmguNtT/lIZ+DLQ0M0/sXHTDqamG303LR0+KWCMpZt5u\n' +
        'ufD7QCYzaqiRUSz/+rD9PzACLrMSW1sslf+ZHwbYpmiOkiJByg8on1AiHV3runEO\n' +
        'x2MJC5ebZb3TtMgNqNBM44/vhgZFI9TAdGrM+TQl5+aV4Nbvo5fuQcp2FHjl6EoX\n' +
        'PW3cumJRY7Uod+sk82CCR1ZyO2SUTS/RgzrZglHSVjqTtugzxbXdmwCdU1W9E35Y\n' +
        'PTRB49Vd58eAPfhqfQMleLQUeN7kUtCVM2viSWcyj/T1oh+Ytm2noI4MccrYt+HM\n' +
        'SFa4uBfovhznIGOGCbfr/gn26+MCAwEAAaNTMFEwHQYDVR0OBBYEFFeKfhtbrtMY\n' +
        'vU/T0MPTaxUKQ7rCMB8GA1UdIwQYMBaAFFeKfhtbrtMYvU/T0MPTaxUKQ7rCMA8G\n' +
        'A1UdEwEB/wQFMAMBAf8wQgYJKoZIhvcNAQEKMDWgDzANBglghkgBZQMEAgEFAKEc\n' +
        'MBoGCSqGSIb3DQEBCDANBglghkgBZQMEAgEFAKIEAgIA3gOCAQEAFA5yqLVV4q3q\n' +
        '+WMIIHLBIHBKDiZQNCyJHCMc6CJuRn84n08LFjII3tmIGf7rtxYG++i+3vnZ/QDx\n' +
        'b+ClGD2sNS5nZ7yg71UMzPhZhSXcbjTFPpfgB6Zc45sjYG8rINjkb1iCb87xDwxG\n' +
        'JohUrvOjgQ+3q9kJR61KXHNHjkv72VOkB58mV4wuGCJDlOGmXjJB9tsQmAThoUJt\n' +
        'D7XcPBVFQFIeN7xzIlU//Hrzfp5PlUq7vOsTEkh9aGMKwLjE4sOOamZ59THBd7Oz\n' +
        'A3BtHhBBh6UV1dioiduF39ZWEcQexfKfUzP3I7F0dL/a/rHhVCTcBj/friXl22f/\n' +
        'HGuzQBr2aw==\n' +
        '-----END CERTIFICATE-----'
    }
  }
}
