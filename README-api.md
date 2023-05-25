
## Get Started Using the API

- You can find the Swagger API documentation at `localhost:3000/docs/` or one of the links above

### How to create Self Descriptions

#### Step 1 - Create your VerifiableCredential

You can use the VerifiablePresentation in the [test folder](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/-/tree/main/src/tests/fixtures) as a starting point. See details in the [Architecture Document](https://gaia-x.gitlab.io/policy-rules-committee/trust-framework/participant/) and just remove the `proof`.


**Example Participant VerifiableCredential**

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1", "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#"],
  "type": ["VerifiableCredential", "gx:LegalParticipant"],
  "id": "did:web:raw.githubusercontent.com:egavard:payload-sign:master",
  "issuer": "did:web:raw.githubusercontent.com:egavard:payload-sign:master",
  "issuanceDate": "2023-03-21T12:00:00.148Z",
  "credentialSubject": {
    "id": "did:web:raw.githubusercontent.com:egavard:payload-sign:master",
    "gx:legalName": "Gaia-X European Association for Data and Cloud AISBL",
    "gx:legalRegistrationNumber": {
      "gx:taxID": "0762747721"
    },
    "gx:headquarterAddress": {
      "gx:countrySubdivisionCode": "BE-BRU"
    },
    "gx:legalAddress": {
      "gx:countrySubdivisionCode": "BE-BRU"
    }
  }
}
```

#### Step 2 - Sign your Participant VerifiableCredential

> **Note:**
> If you need help setting up your certificate, you can refer to the "[How to setup certificates](#how-to-setup-certificates)" section.

For this step you can use the signing tool to perform all steps automatically: https://gx-signing-tool.vercel.app/

Self Descriptions need to be signed by a resolvable key registered in a Trust Anchor endorsed by Gaia-X. The validity of keys is checked via the [Gaia-X Registry](https://gitlab.com/gaia-x/lab/compliance/gx-registry/).

To normalize your Self Description you can use any library that will provide `URDNA2015` normalization eg:`jsonld` .

The normalized Self Description should then be hashed with `sha256(normalizeSd)`. This hash can now be signed with your key resulting in a `jws`. Create a `proof` property with your signature and signing method.

**Example proof object (signature of the Self Description creator)**

```json
{
  "proof": {
    "type": "JsonWebSignature2020",
    "created": "2022-10-01T13:02:09.771Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:web:compliance.gaia-x.eu",
    "jws": "eyJhbGciOiJSUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..XQqRvvuxW1xHUy_eRzOk4LwyjwlRofg0JBiO0nrWGHAjwMA87OVJ37mB6GylgEttEaUjXQV-QmbGfEnE-YQf5S7B-id9Lld-CC-vW8M-2EvXh3oQp3l5W35mvvdVQXBj16LLskQZpfZGRHM0hn7zGEw24fDc_tLaGoNR9LQ6UzmSrHMwFFVWz6XH3RoG-UY0aZDpnAxjpWxUWaa_Jzf65bfNlx2EdSv3kIKKYJLUlQTk0meuFDD23VrkGStQTGQ8GijY3BNo6QWw889tt5YKWtiSZjbDYYHsVCwMzPoKT0hVJ1wy2ve6pJ4MSYfhiMxoDq6YBOm-oYKYfBeN22fjqQ"
  } 
}
```

Add the `proof` object with your signature to your json.

**Example VerifiablePresentation with added proof object**

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1", "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#"],
  "type": ["VerifiablePresentation"],
  "verifiableCredential": [{
    "@context": ["https://www.w3.org/2018/credentials/v1", "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#"],
    "type": ["VerifiableCredential", "gx:LegalParticipant"],
    "id": "did:web:raw.githubusercontent.com:egavard:payload-sign:master",
    "issuer": "did:web:raw.githubusercontent.com:egavard:payload-sign:master",
    "issuanceDate": "2023-03-21T12:00:00.148Z",
    "credentialSubject": {
      "id": "did:web:raw.githubusercontent.com:egavard:payload-sign:master",
      "gx:legalName": "Gaia-X European Association for Data and Cloud AISBL",
      "gx:legalRegistrationNumber": {
        "gx:taxID": "0762747721"
      },
      "gx:headquarterAddress": {
        "gx:countrySubdivisionCode": "BE-BRU"
      },
      "gx:legalAddress": {
        "gx:countrySubdivisionCode": "BE-BRU"
      }
    },
    "proof": {
      "type": "JsonWebSignature2020",
      "created": "2023-02-09T16:00:15.219Z",
      "proofPurpose": "assertionMethod",
      "verificationMethod": "did:web:raw.githubusercontent.com:egavard:payload-sign:master",
      "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..lylU5Iy9hWdUN9jX7mCC1WejBp5QneJYLJ4iswBWiy8z2Yg9-W274anOnhxFK7dtlNPxoQGMPbUpR383aw4pjP0k48Rql_GiaNoTEvqixPaiLBuBng1srO1St440nQ1u9S42cD519cJ_ITdOod9nNapGpbKbD9BuULB85mp9urnH231Ph4godd9QOSHtf3ybA2tb7hgENxBgL433f0hDQ08KJnxJM43ku7ryoew-D_GHSY96AFtyalexaLlmmmIGO-SnpPX0JJgqFlE7ouPnV6DCB9Y8c0DHOCZEdXSYnonVh5qjBM598RUXlmvEJ2REJeJwvU8A3YUUqEREKEmhBQ"
    }
  }]
}
```

#### Step 3 - Use the Gaia-X Signing tool to verify and sign your verifiableCredential

Head over to https://gx-signing-tool.vercel.app/ and put your participant in the input document (in the verifiableCredential array)
Put your signing private key in the private key field, and set the did where the public key can be found in a did.json file

**Request:**
**participant-vp.json**

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#"
  ],
  "type": [
    "VerifiablePresentation"
  ],
  "verifiableCredential": [
    {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#"
      ],
      "type": [
        "VerifiableCredential",
        "gx:LegalParticipant"
      ],
      "id": "did:web:abc-federation.gaia-x.community",
      "issuer": "did:web:abc-federation.gaia-x.community",
      "issuanceDate": "2023-03-21T12:00:00.148Z",
      "credentialSubject": {
        "id": "did:web:abc-federation.gaia-x.community",
        "gx-participant:legalName": "Gaia-X European Association for Data and Cloud AISBL",
        "gx-participant:registrationNumber": {
          "gx-participant:registrationNumberType": "local",
          "gx-participant:registrationNumber": "0762747721"
        },
        "gx:headquarterAddress": {
          "gx:countrySubdivisionCode": "BE-BRU"
        },
        "gx:legalAddress": {
          "gx:countrySubdivisionCode": "BE-BRU"
        },
        "gx-terms-and-conditions:gaiaxTermsAndConditions": "70c1d713215f95191a11d38fe2341faed27d19e083917bc8732ca4fea4976700"
      }
    }
  ]
}
```

**Response Object:**
The response object is a VerifiablePresentation containing the VerifiableCredential you sent, but with its signature in proof
```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#"
  ],
  "type": [
    "VerifiablePresentation"
  ],
  "verifiableCredential": [
    {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://registry.lab.gaia-x.eu/development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#"
      ],
      "type": [
        "VerifiableCredential",
        "gx:LegalParticipant"
      ],
      "id": "did:web:abc-federation.gaia-x.community",
      "issuer": "did:web:abc-federation.gaia-x.community",
      "issuanceDate": "2023-03-21T12:00:00.148Z",
      "credentialSubject": {
        "id": "did:web:abc-federation.gaia-x.community",
        "gx-participant:legalName": "Gaia-X European Association for Data and Cloud AISBL",
        "gx-participant:registrationNumber": {
          "gx-participant:registrationNumberType": "local",
          "gx-participant:registrationNumber": "0762747721"
        },
        "gx:headquarterAddress": {
          "gx:countrySubdivisionCode": "BE-BRU"
        },
        "gx:legalAddress": {
          "gx:countrySubdivisionCode": "BE-BRU"
        },
        "gx-terms-and-conditions:gaiaxTermsAndConditions": "70c1d713215f95191a11d38fe2341faed27d19e083917bc8732ca4fea4976700"
      },
      "proof": {
        "type": "JsonWebSignature2020",
        "created": "2023-04-06T14:05:43.169Z",
        "proofPurpose": "assertionMethod",
        "verificationMethod": "did:web:abc-federation.gaia-x.community",
        "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..ME2O-0DM9dkHUeQprDLhagGmNVfgxnjHavCr5CbtqndYtVvEy_uuKgcTqOl8PCTN9BPTB136nVil9l8iNRe4_lQe77b7JSq8UUAONnoWuHtjJJuyhXpZbNCmShEvnoZN07PzKetm5pxBhU61ga0hHNnaNt5Id4CUCfgcR9ngAuoOS07P5zydXdM3eU6-FC9uLav5hlexPqYw5xtczQlNua6S5qeW5y_NVX2sl9F7llmO5J3mtz3Oc_a_NaU-IRDKTDzImy8se4imf_EMudQ2gCtl6kqbXpnU9DZgg1riCVkxW-HvrmS7HCMzd2C3fwYtX92jMSX1Rhbow12NweBJJw"
      }
    }
  ]
}
```
