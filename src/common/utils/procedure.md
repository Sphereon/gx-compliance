1. Getting a gx-compliance:

    send a VP containing participant vc to the gx-compliance. you will get a compliance vc with this structure:
    
```
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://registry.lab.gaia-x.eu//development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#"
  ],
  "type": [
    "VerifiableCredential"
  ],
  "id": "https://storage.gaia-x.eu/credential-offers/b3e0a068-4bf8-4796-932e-2fa83043e203",
  "issuer": "did:web:compliance",
  "credentialSubject": [
    {
      "type": "gx:compliance",
      "id": "https://gaia-x.eu/.well-known/service1.json",
      "integrity": "sha256-0bb7aff503a47493d4e5faae85417619cfc411f0110163082240dd1c8e8cc1d6"
    }
  ],
  "proof": {
    ...
  }
}

   ```
2. Now if you want to get a compliance credential from your ecosystem, you can go two ways, either send a VP containing just the participant credential, or send your participant credential plus your gx-compliance.
   1. is like the before. you'll get a compliance just like 1 (with a different issuer of course)
   2. you will get a compliance credential from your ecosystem with two subjects. one related to your participant and one for your gx-compliance.
   **be aware that sending your compliance credential to the credential-offering endpoint is not supported in the current development branch of gx-compliance project.**
   
```
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://registry.lab.gaia-x.eu//development/api/trusted-shape-registry/v1/shapes/jsonld/trustframework#"
  ],
  "type": [
    "VerifiableCredential"
  ],
  "id": "https://storage.gaia-x.eu/credential-offers/b3e0a068-4bf8-4796-932e-2fa83043e203",
  "issuer": "did:web:800d-2001-1c04-2b10-ee00-e555-20e6-f873-5edc.ngrok-free.app",
  "issuanceDate": "2023-05-28T19:27:23.710Z",
  "expirationDate": "2023-08-26T19:27:23.710Z",
  "credentialSubject": [
    {
      "type": "gx:compliance",
      "id": "https://gaia-x.eu/.well-known/service1.json",
      "integrity": "sha256-0bb7aff503a47493d4e5faae85417619cfc411f0110163082240dd1c8e8cc1d6"
    },
    {
      "type": "gx:compliance",
      "id": "https://gaia-x.eu/.well-known/participant.json",
      "integrity": "sha256-f49238b98729af2d6aee1b104cd13db4b3a06569ca247770778aedd6707a8bc2"
    }
  ],
  "proof": {
    "type": "JsonWebSignature2020",
    "created": "2023-05-28T19:27:24.335Z",
    "proofPurpose": "assertionMethod",
    "jws": "eyJhbGciOiJQUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..WyTR6Lae7McaYXjFhcJu_dCGG3LzVlfTAnPWBxfIN_BduGm-paMp9Hnb6ywvo2ZRgfKJzV_P0R373bOyikaawsX8ik4TEusCbwZ9YgB4BiPvbggiJ44EUWSB8cO0s1wxc0Cd_89VcBVYSMFytlCxQ8miQzSYFv4gBpLXBb9E06uZn3NhiCN3gxqIcT6nbN6KoYDqrNUC-vRlxkqXVeNYu19pX7Y1Fm9Laiu3roNQovOmJ6XrQ0XQwmytOEsoaPUFzCmMojLeqJsMAxv8-TOicyBOJGdKjcBlEbZ1B2Pln_BipEMH0XRULSHa-dkZT5KhJn8U9JG3q-e13E7rGh87Ew",
    "verificationMethod": "did:web:800d-2001-1c04-2b10-ee00-e555-20e6-f873-5edc.ngrok-free.app#JWK2020-RSA"
  }
}

   ```

3. The previous procedure was: you have your eco-compliance you can get a eco-compliance for every so you want. you will get a compliance credential for your SO.

my question is mostly about this last part. what should I send over for this step? should I do it based on the previous procedure? it's somewhat easy for a verifier to verify these compliacte compliance vcs, because all of the credentialSubjects have an ID and it's mapped to one of the earlier (or in the same VP) vcs.

and this is about your optional point. so we can send participant vc+ so vc + gx-compliance vc to the ecosystem and get a eco-compliance for all the aforementioned credentials (and not get a eco-compliance first for your participant vc)