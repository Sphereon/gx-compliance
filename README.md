<h1 align="center">Gaia-X Lab Compliance Service</h1>

- [Gaia-X Trust Framework](#gaia-x-trust-framework)
  - [Gaia-X Lab Compliance Service](#gaia-x-lab-compliance-service)
- [Get Started Using the API](#get-started-using-the-api)
  - [How to create Self Descriptions](#how-to-create-self-descriptions)
    - [Step 1 - Create your Participant Self Description](#step-1---create-your-participant-self-description)
    - [Step 2 - Sign your Participant Self Description](#step-2---sign-your-participant-self-description)
    - [Step 3 - Use the Compliance Service to verify and sign your Self Description](#step-3---use-the-compliance-service-to-verify-and-sign-your-self-description)
    - [Step 4 - Finalize your signed Self Description](#step-4---finalize-your-signed-self-description)
  - [Verify Self Descriptions](#verify-self-descriptions)
- [Get Started With Development](#get-started-with-development)
  - [Installation](#installation)
  - [Running the app](#running-the-app)
  - [Test](#test)

## Gaia-X Trust Framework

For Gaia-X to ensure a higher and unprecedented level of trust in digital platforms, we need to make trust an easy to understand and adopted principle. For this reason, Gaia-X developed a [Trust Framework](https://gaia-x.gitlab.io/policy-rules-committee/trust-framework/) – formerly known as Gaia-X Compliance and Labelling Framework that safeguards data protection, transparency, security, portability, and flexibility for the ecosystem as well as sovereignty and European Control.

The Trust Framework is the set of rules that define the minimum baseline to be part of the Gaia-X Ecosystem. Those rules ensure a common governance and the basic levels of interoperability across individual ecosystems while letting the users in full control of their choices.

In other words, the Gaia-X Ecosystem is the virtual set of participants and service offerings following the requirements from the Gaia-X Trust Framework.

### Gaia-X Lab Compliance Service

The Compliance Service validates the shape, content and credentials of Self Descriptions and signs valid Self Descriptions. Required fields and consistency rules are defined in the [Trust Framework](https://gaia-x.gitlab.io/policy-rules-committee/trust-framework/).

## Get Started Using the API

- You can find the Swagger API documentation at `localhost:3000/docs/` or https://compliance.gaia-x.eu/docs/
- The API routes are versioned to prevent breaking changes. The version is always included in the urls: `/api/v{versionNumber}/` (example: `/api/v2204/participant/verify`)

### How to create Self Descriptions

#### Step 1 - Create your Participant Self Description

You can use the Self Descriptions in the [test folder](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/-/tree/main/src/tests/fixtures) as a starting point. See details in the [Architecture Document](https://gaia-x.gitlab.io/policy-rules-committee/trust-framework/participant/).

> hint: You can use the same guide to create a Service Offering Self Description

**Example Participant Self Description**

```json
{
  "@context": ["http://www.w3.org/ns/shacl#", "http://www.w3.org/2001/XMLSchema#", "http://w3id.org/gaia-x/participant#"],
  "@id": "http://example.org/participant-dp6gtq7i75lmk9p4j2tfg",
  "@type": ["VerifiableCredential", "LegalPerson"],
  "credentialSubject": {
    "id": "did:web:example.com",
    "gx-participant:registrationNumber": {
      "@type": "xsd:string",
      "@value": "DEANY1234NUMBER"
    },
    "gx-participant:headquarterAddress": {
      "@type": "gx-participant:Address",
      "gx-participant:country": {
        "@type": "xsd:string",
        "@value": "DEU"
      }
    },
    "gx-participant:legalAddress": {
      "@type": "gx-participant:Address",
      "gx-participant:country": {
        "@type": "xsd:string",
        "@value": "DEU"
      }
    }
  }
}
```

#### Step 2 - Sign your Participant Self Description

For this step you can use the signing tool to perform all steps automatically: https://github.com/deltaDAO/self-description-signer

Self Descriptions need to be signed by a resolvable key registered in a Trust Anchor endorsed by Gaia-X. The validity of keys is checked via the [Gaia-X Registry](https://gitlab.com/gaia-x/lab/compliance/gx-registry/).

To normalize your Self Description you can use the `/normalize` route of the API. [URDNA2015](https://json-ld.github.io/rdf-dataset-canonicalization/spec/) is used for normalization. This will ensure consistency of the hashing process.

```bash
curl -X POST 'https://compliance.gaia-x.eu/api/v2204/normalize' -H "Content-Type: application/json" --data-raw  -d "@self-description.json"
```

The normalized Self Description should then be hashed with `sha256(normalizeSd)`. This hash can now be signed with your key resulting in a `jws`. Create a `proof` property with your signature and signing method.

**Example proof object (signature of the Self Description creator)**

```json
{
  "proof": {
    "type": "JsonWebKey2020",
    "created": "2022-06-17T07:44:28.488Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:web:compliance.gaia-x.eu",
    "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..t_UEs8yG-XXXXXXXXXXX"
  }
}
```

Add the `proof` object with your signature to your json.

**Example SD with added proof object**

```json
{
  "@context": ["http://www.w3.org/ns/shacl#", "http://www.w3.org/2001/XMLSchema#", "http://w3id.org/gaia-x/participant#"],
  "@id": "http://example.org/participant-dp6gtq7i75lmk9p4j2tfg",
  "@type": ["VerifiableCredential", "LegalPerson"],
  "credentialSubject": {
    "id": "did:web:example.com",
    "gx-participant:registrationNumber": {
      "@type": "xsd:string",
      "@value": "DEANY1234NUMBER"
    },
    "gx-participant:headquarterAddress": {
      "@type": "gx-participant:Address",
      "gx-participant:country": {
        "@type": "xsd:string",
        "@value": "DEU"
      }
    },
    "gx-participant:legalAddress": {
      "@type": "gx-participant:Address",
      "gx-participant:country": {
        "@type": "xsd:string",
        "@value": "DEU"
      }
    }
  },
  "proof": {
    "type": "JsonWebKey2020",
    "created": "2022-06-17T07:44:28.488Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:web:compliance.gaia-x.eu",
    "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..t_UEs8yG-XXXXXXXXXXX"
  }
}
```

#### Step 3 - Use the Compliance Service to verify and sign your Self Description

Head over to https://compliance.gaia-x.eu/docs/ and use the `/sign` route to sign your Self Description. The Compliance Service will sign the Self Description if it complies with the rules from the Trust Framework and if your provided proof is valid and return a Self Description including a new `complianceCredential` object.

**Request:**

```bash
curl -X POST 'https://compliance.gaia-x.eu/api/v2204/sign' -H "Content-Type: application/json" --data-raw  -d "@participant-sd-minimal.json"
```

**participant-sd-minimal.json**

```json
{
  "@context": ["http://www.w3.org/ns/shacl#", "http://www.w3.org/2001/XMLSchema#", "http://w3id.org/gaia-x/participant#"],
  "@id": "http://example.org/participant-dp6gtq7i75lmk9p4j2tfg",
  "@type": ["VerifiableCredential", "LegalPerson"],
  "credentialSubject": {
    "id": "did:web:example.com",
    "gx-participant:registrationNumber": {
      "@type": "xsd:string",
      "@value": "DEANY1234NUMBER"
    },
    "gx-participant:headquarterAddress": {
      "@type": "gx-participant:Address",
      "gx-participant:country": {
        "@type": "xsd:string",
        "@value": "DEU"
      }
    },
    "gx-participant:legalAddress": {
      "@type": "gx-participant:Address",
      "gx-participant:country": {
        "@type": "xsd:string",
        "@value": "DEU"
      }
    }
  },
  "proof": {
    "type": "JsonWebKey2020",
    "created": "2022-06-17T07:44:28.488Z",
    "proofPurpose": "assertionMethod",
    "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..t_UEs8yG-XXXXXXXXXXX",
    "verificationMethod": "did:web:compliance.gaia-x.eu"
  }
}
```

**Response Object:**

```json
{
  "complianceCredential": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "@type": ["VerifiableCredential", "ParticipantCredential"],
    "id": "https://catalogue.gaia-x.eu/credentials/ParticipantCredential/1655452007162",
    "issuer": "did:web:compliance.gaia-x.eu",
    "issuanceDate": "2022-06-17T07:46:47.162Z",
    "credentialSubject": {
      "id": "did:compliance.gaia-x.eu",
      "hash": "9ecf754ffdad0c6de238f60728a90511780b2f7dbe2f0ea015115515f3f389cd"
    },
    "proof": {
      "type": "JsonWebKey2020",
      "created": "2022-06-17T07:46:47.162Z",
      "proofPurpose": "assertionMethod",
      "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..eQrh53-XXXXXXXXXXX",
      "verificationMethod": "did:web:compliance.gaia-x.eu"
    }
  }
}
```

#### Step 4 - Finalize your signed Self Description

Add the `complianceCredential` property to your `.json`. The `selfDescription` and your `proof` will be grouped as `selfDescriptionCredential`. Your `.json` file should now have 2 properties:

1. `selfDescriptionCredential` - The Self Description signed by its creator.
2. `complianceCredential` - The signature of the Gaia-X compliance service (its presence means that the Self Description complies with the given rule set by the Trust Framework and the Self Description was signed by a trusted entity)

The final result should look like this:

**Example of complete signed Participant Self Description**

```json
{
  "selfDescriptionCredential": {
    "@context": ["http://www.w3.org/ns/shacl#", "http://www.w3.org/2001/XMLSchema#", "http://w3id.org/gaia-x/participant#"],
    "@id": "http://example.org/participant-dp6gtq7i75lmk9p4j2tfg",
    "@type": ["VerifiableCredential", "LegalPerson"],
    "credentialSubject": {
      "id": "did:web:example.com",
      "gx-participant:registrationNumber": {
        "@type": "xsd:string",
        "@value": "DEANY1234NUMBER"
      },
      "gx-participant:headquarterAddress": {
        "@type": "gx-participant:Address",
        "gx-participant:country": {
          "@type": "xsd:string",
          "@value": "DEU"
        }
      },
      "gx-participant:legalAddress": {
        "@type": "gx-participant:Address",
        "gx-participant:country": {
          "@type": "xsd:string",
          "@value": "DEU"
        }
      }
    },
    "proof": {
      "type": "JsonWebKey2020",
      "created": "2022-06-17T07:44:28.488Z",
      "proofPurpose": "assertionMethod",
      "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..t_UEs8yG-XXXXXXXXXXX",
      "verificationMethod": "did:web:compliance.gaia-x.eu"
    }
  },
  "complianceCredential": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "@type": ["VerifiableCredential", "ParticipantCredential"],
    "id": "https://catalogue.gaia-x.eu/credentials/ParticipantCredential/1655451870008",
    "issuer": "did:web:compliance.gaia-x.eu",
    "issuanceDate": "2022-06-17T07:44:30.008Z",
    "credentialSubject": {
      "id": "did:web:example.com",
      "hash": "2dacbb022440fb435a2d01be323388883c0a1a01bccc71c104b60fda0b7fd923"
    },
    "proof": {
      "type": "JsonWebKey2020",
      "created": "2022-06-17T07:44:30.007Z",
      "proofPurpose": "assertionMethod",
      "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..eQrh53-XXXXXXXXXXX",
      "verificationMethod": "did:web:compliance.gaia-x.eu"
    }
  }
}
```

### Verify Self Descriptions

The Compliance Service also offers a verify endpoint to verify signed Self Descriptions to check if they conform with the Gaia-X Trust Framework. It will check the shape, content of the Self Description and signature. If there is a mistake in the Self Description, the result will contain all errors so that you can fix them appropriately. An empty array of results is returned if the check conforms.

```bash
curl -X POST 'https://compliance.gaia-x.eu/api/v2204/participant/verify/raw' -H "Content-Type: application/json" --data-raw  -d "@signed-participant-sd-minimal.json"
```

```json
{
  "conforms": true,
  "shape": {
    "conforms": true,
    "results": []
  },
  "content": {
    "conforms": true,
    "results": []
  },
  "validSignature": true
}
```

## Get Started With Development

- This application is based on [nest.js](https://nestjs.com/) and TypeScript.
- The nest.js documentation can be found [here](https://docs.nestjs.com/).

### Installation

```bash
$ npm install
```

### Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

### Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
