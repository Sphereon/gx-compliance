import Joi from 'joi'

export default Joi.object({
  PORT: Joi.alternatives().try(Joi.string(), Joi.number()).default(3000),
  REGISTRY_URL: Joi.string().required(),
  SD_STORAGE_BASE_URL: Joi.string(),
  SD_STORAGE_API_KEY: Joi.string(),
  privateKey: Joi.string().required(),
  X509_CERTIFICATE: Joi.string().optional()
})
