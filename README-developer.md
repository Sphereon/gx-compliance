# Gaia-X Lab Compliance Service

README for developement and local deployment

## Local testing

This chapter enables you to validate and sign your self-signed self-descriptions with a locally running Compliance Service instance.

> **IMPORTANT**: Self-issued certificates which don't include a Gaia-X endorsed trust-anchor in their certificate-chain are **NOT** supported for the use with https://compliance.gaia-x.eu. This guide is for local testing ONLY. It can be used to check the conformity of self-descriptions.

> To simplify the local testing setup we will generate one certificate which will be used for both (signing your self-secription and signing in the name of your local compliance service). Usually these are seperated, but this allows you to skip locally hosting your `did.json` since we will use the one of the compliance service.

### Step 1: Generating a certificate

Generate a new key/certificate pair:

```bash
$ openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -sha256 -days 365
```

Convert the private key format to `pkcs8` (that's the needed format for the compliance service):

```bash
$ openssl pkcs8 -in key.pem -topk8 -nocrypt -out pk8key.pem
```

You should have generated 3 files at this point: 

1. `cert.pem` - certificate
2. `key.pem` - private key
3. `pk8key.pem` - private key in `pkcs8` format



### Step 2: Setting up the compliance service

Clone the repository:

```bash
$ git clone https://gitlab.com/gaia-x/lab/compliance/gx-compliance.git
$ cd gx-compliance
$ npm install
```



Setting up key+certificate for local `https ` (this is needed since the `did:web` can only be resolved using `https`):

```bash
$ cd ./src/secrets
$ openssl req -x509 -out dev-only-https-public-certificate.pem -keyout dev-only-https-private-key.pem \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
```

This generates 2 files which should exist in the `secrets` folder:

- `dev-only-https-private-key.pem`
- `dev-only-https-public-certificate.pem`



Setting up the environment variables:
Setup a `.env` file in the root directory of the project. Iclude the following variables:

`gx-compliance/.env`:

```
X509_CERTIFICATE=`-----BEGIN CERTIFICATE-----
copy `cert.pem` content
-----END CERTIFICATE-----`
privateKey=`-----BEGIN PRIVATE KEY-----
copy `pk8key.pem` content
-----END PRIVATE KEY-----`
REGISTRY_URL='https://registry.gaia-x.eu'
BASE_URL='https://localhost:3000'
NODE_TLS_REJECT_UNAUTHORIZED='0'
LOCAL_HTTPS='true'
DISABLE_SIGNATURE_CHECK='true'
```



WARNING: Use these 3 variables for **LOCAL TESTING ONLY**!

```
NODE_TLS_REJECT_UNAUTHORIZED='0'
LOCAL_HTTPS='true'
DISABLE_SIGNATURE_CHECK='true'
```

- `NODE_TLS_REJECT_UNAUTHORIZED` allows the app to call self-signed https-urls.

- `LOCAL_HTTPS` enables the use of https for local development (needed for did:web resolver)

- `DISABLE_SIGNATURE_CHECK` will disable the registry call to check the certificate chain for a valid trust-anchor (all certificates will always be seen as valid in this regard)

  

Copy the certificate from `cert.pem` into `gx-compliance/src/static/.well-known/x509CertificateChain.pem`. Replace the existing certificate chain with the generated `cert.pem`.



Run this after **every** change to `BASE_URL` or `x509CertificateChain.pem`. Static files like the `did.json` or `x509CertificateChain.pem` will be prepared (also the index page).

```bash
$ npm run build
```



Start the compliance service

```bash
$ npm run start

or 

$ npm run start:dev  // for hot reloading after code changes
```



### Step 3: Sign your VerifiableCredentials

If you've already signed your VC, you can skip to the end of this step.

If you have a certificate issued by a certificate authority(CA) which is either a Gaia-X endorsed trust-anchor or owns a certificate signed by one(chain of trust), you can use this certificate. In this case check out the **"How to setup certificates"** section. Make sure to host your `did.json` in a reachable space and adjust your `did:web `(`VERIFICATION_METHOD`) for the `did.json`.



**Sign your VC using the generated** `pk8key.pem` and `cert.pem`

If you know what you are doing you can manually perform the signing process.
> You can also rely on the [Lab wizard](https://wizard.lab.gaia-x.eu) to prepare your VerifiablePresentation and sign the VerifiableCredentials in it

1. The given Verfiaible has to be canonized with [URDNA2015](https://json-ld.github.io/rdf-dataset-canonicalization/spec/).
2. Next the canonized output has to be hashed with [SHA256](https://json-ld.github.io/rdf-dataset-canonicalization/spec/#dfn-hash-algorithm).
3. That hash is then signed with the your `pk8key.pem` private key and you have to create a proof object using [JsonWebKey2020](https://w3c-ccg.github.io/lds-jws2020/#json-web-signature-2020). General info about proofs in verifiable credentials: https://www.w3.org/TR/vc-data-model/#proofs-signatures
4. Then, you have to wrap your VerifiableCredential in a VerifiablePresentation. Examples are available in the [source code](./src/tests/fixtures/participant-vp.json) and on the OpenAPI of the compliance service
 

For this local test setup the creation of the `did.json` can be skipped. Since we are using the `did.json` of the compliance service also for the self-description for simplicity reasons. Usually you would host it under your own domain together with the `x509CertificateChain.pem` in the `.well-known/` directory.


Now you should have your verifiable credential signed by yourself. If you've used the signer-tool, you already have the complete verifiable presentation.

You can head to `https://localhost:3000/docs/#/credential-offer/CommonController_issueVC`
to let the compliance service sign your VerifiablePresentation and return a compliance VerifiableCredential.

### Workflow

<div>

```mermaid
sequenceDiagram
    participant User
    participant GXSigning
    participant Compliance

    alt Create a VC manually
    User->>User: Prepares a VerifiableCredential respecting shapes
    User->>User: Signs the VerifiableCredential and put it in a VerifiablePresentation
    else Use gx-signing to create the VP
    User->>GXSigning: Updates the VerifiableCredential, the DID and the privateKey input
    User->>GXSigning: Hits sign button
    GXSigning-->>User: Returns a valid VerifiablePresentation containing the signed VerifiableCredential
    end
    User->>Compliance: Call credential offering
    Compliance-->>User: Returns a gaiaX compliance credential
```
</div>

## Get Started With Development

---
**NOTE**

For details on how the code is structured and how to create a Merge Request
please check the instructions from CONTRIBUTING.md

---

- This application is based on [nest.js](https://nestjs.com/) and TypeScript.
- The nest.js documentation can be found [here](https://docs.nestjs.com/).

Clone the repository and jump into the newly created directory:

### Setup the environment

Make sure docker and docker-compose are available on your setup. Clone the repository and jump into the newly created directory:

```bash
$ git clone https://gitlab.com/gaia-x/lab/compliance/gx-compliance.git
$ cd gx-compliance
```

Don't forget to set up your `.env` file in the project's root directory. An example file can also be found in the root directory (`example.env`). Copy this file and adjust the values.

```bash
$ cp example.env .env
```

- **X509_CERTIFICATE** - your compliance service certificate
- **privateKey** - your compliance service private key (needed to sign verified Self Descriptions)
- **REGISTRY_URL** - link to your hosted registry or any other trusted registry. E.g. `https://registry.gaia-x.eu`
- **BASE_URL** - the url of the location for the compliance service. This is used to generate the did:web of the complaince service instance. E.g. `http://localhost:3000`
- **APP_PATH** - the path the compliance service is available on. . E.g. `/demo`. Note that you have to modify the `BASE_URL` yourself to match with `APP_PATH`

---
**NOTE**

If you are using a locally deployed registry, make sure it is up and running before starting the compliance service.
Also, make sure the proper adjustments are done in the .env and docker-compose.yaml files (in the compliance repo):
- by default both registy and compliance use http://localhost:3000 as their endpoint, make sure they are different in the local setup
- by default the registry and compliance containers are set up on separate networks; make sure there is connectivity between them or they use the same network
- the value for REGISTRY_URL is properly set in the .env file

---

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

If everything is setup correctly, you can start the development environment with docker-compose. Make sure that the Docker daemon is running on your host operating system.

```sh
docker-compose up
```

---
**NOTE**

You can access the compliance API in your local browser at http://127.0.0.1:3000/docs/
Make sure to adjust the port in the url if you changed the default value in the .env file

---


### Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
