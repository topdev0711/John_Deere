const Joi = require('joi-browser');

const options = {presence: 'required', allowUnknown: false, abortEarly: false};
const stringArray = () => Joi.array().items(Joi.string());
const schemaDefinition = () => Joi.object().keys({
  id: Joi.string().required(),
  name: Joi.string().regex(/[a-z]{3}/i, 'Name should contain at least three consecutive letters').required(),
  version: Joi.string().required()
});
const schema = Joi.object().keys({
  name: Joi.string().regex(/[a-z]{3}/i, 'Name should contain at least three consecutive letters').required(),
  description: Joi.string().max(200),
  documentation: Joi.string().max(1500).allow('').optional(),
  requestComments: Joi.string().optional(),
  application: Joi.string().allow('').optional(),
  owner: Joi.string().alphanum().min(7).max(7).optional(),
  custodian: Joi.string().max(200),
  sourceDatasets: stringArray(),
  category: Joi.string(),
  phase: Joi.string(),
  technology: Joi.string(),
  dataRecovery: Joi.boolean(),
  physicalLocation: Joi.string(),
  deletedSchemas: Joi.array().items(Joi.string()).optional(),
  schemas: Joi.array().items(Joi.object()),
  linkedSchemas: Joi.array().items(schemaDefinition()),
  tables: Joi.array().items(Joi.object({
    schemaId: Joi.string().allow(null).default(null),
    schemaVersion: Joi.string(),
    schemaName: Joi.string(),
    tableName: Joi.string().regex(/^\w+$/).allow('').max(100)
  })),
  paths: Joi.array().items(Joi.string()),
  classifications: Joi.array().min(1).items(Joi.object({
    id: Joi.string().min(10).optional(),
    community: Joi.string(),
    subCommunity: Joi.string(),
    countriesRepresented: stringArray(),
    gicp: Joi.string(),
    personalInformation: Joi.boolean(),
    development: Joi.boolean(),
    additionalTags: stringArray()
  })),
  commentHistory: Joi.array().items(Joi.object()).optional()
});

function validate(dataset) {
  const {error} = Joi.validate(dataset, schema, options);

  if (error) {
    error.details.forEach(detail => detail.name = dataset.name ? dataset.name : 'New Dataset');
  }
  return error;
}

module.exports = {
  validate
};
