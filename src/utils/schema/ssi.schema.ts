import Joi from 'joi'
import { DID_WEB_PATTERN } from '../../@types/constants'

const proofSchema = {
  type: Joi.string().required(),
  created: Joi.date().iso().required(),
  proofPurpose: Joi.string().required(),
  jws: Joi.string().required(),
  verificationMethod: Joi.string().uri().regex(DID_WEB_PATTERN).required(), // TODO: allow general uri https://w3c-ccg.github.io/security-vocab/#JsonWebSignature2020
  domain: Joi.string(),
  nonce: Joi.string(),
  creator: Joi.string(),
  challenge: Joi.string()
}

const verifiablePresentationSchema = {
  '@context': Joi.array().ordered(Joi.string().valid('https://www.w3.org/2018/credentials/v1').required()).items(Joi.string()).required(),
  type: Joi.array().min(1).required(),
  id: Joi.string(),
  verifiableCredential: Joi.array().min(1), // assert type of verifiableCredentials here
  holder: Joi.string().required(),
  proof: Joi.object(proofSchema).required()
}

/* EXPORTS */

export const verifiableCredentialSchema = {
  '@context': Joi.array().ordered(Joi.string().valid('https://www.w3.org/2018/credentials/v1').required()).items(Joi.string()).required(),
  type: Joi.array().min(1).required(),
  id: Joi.string(),
  issuer: Joi.alternatives([
    Joi.string().uri().required(),
    Joi.object({
      id: Joi.string().uri().required(),
      name: Joi.string().required()
    }).required()
  ]).required(),
  issuanceDate: Joi.date().iso().required(),
  issued: Joi.date().iso(),
  expirationDate: Joi.date().iso(),
  validFrom: Joi.date().iso(),
  validUntil: Joi.date().iso(),
  credentialStatus: Joi.object({
    id: Joi.string().uri().required(),
    type: Joi.string().required()
  }),
  credentialSubject: Joi.object().required(),
  proof: Joi.object(proofSchema).required()
}

export const VerifiablePresentationSchema = Joi.object(verifiablePresentationSchema).options({
  abortEarly: false
})

export const vcSchema = Joi.object(verifiableCredentialSchema)
