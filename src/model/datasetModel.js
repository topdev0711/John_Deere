const Joi = require('joi-browser');
const subcommunities = require('../data/reference/subcommunities.json');
const {VISIBILITY} = require("../utilities/constants");

const validSubcommunitiesIds = subcommunities
                              .filter((subCommunity) => subCommunity.enabled)
                              .map((sc) => sc.id);

const schemaDefinition = () => Joi.object().keys({
  id: Joi.string().required(),
  name: Joi.string().regex(/[a-z]{3}/i, 'Name should contain at least three consecutive letters').required(),
  version: Joi.string().required()
});

const owner = Joi.object().keys({
  racfId: Joi.string().required(),
  name: Joi.string().required(),
  mail: Joi.string().required()
}).optional();

const datasetSchema = Joi.object().keys({
  id: Joi.string().optional(),
  createdAt: Joi.string().optional(),
  createdBy: Joi.string().optional(),
  updatedAt: Joi.string().optional(),
  updatedBy: Joi.string().optional(),
  version: Joi.number().optional(),
  name: Joi.string().regex(/[a-z]{3}/i, 'Name should contain at least three consecutive letters'),
  description: Joi.string().max(200),
  application: Joi.string().allow('').optional(),
  documentation: Joi.string().max(1500).allow('').optional(),
  requestComments: Joi.string().optional(),
  owner: Joi.object().optional(),
  custodian: Joi.string().max(200),
  sourceDatasets: Joi.array().items(Joi.object().keys({
    id: Joi.string(),
    version: Joi.number(),
    name: Joi.string()
  })),
  sources: Joi.array().items(Joi.object().keys({type: Joi.string(), namespace: Joi.string()}).unknown()).optional(),
  category: Joi.string(),
  dataRecovery: Joi.boolean(),
  environmentName: Joi.string().optional(),
  phase: Joi.string(),
  technology: Joi.string(),
  physicalLocation: Joi.string(),
  deletedSchemas: Joi.array().items(Joi.string()).optional(),
  schemas: Joi.array().items(Joi.object()),
  linkedSchemas: Joi.array().items(schemaDefinition()),
  tables: Joi.array().items(Joi.object({
      schemaId: Joi.string(),
      schemaVersion: Joi.string(),
      schemaName: Joi.string(),
      tableName: Joi.string().regex(/^\w+$/).allow('').max(100)
  })),
  paths: Joi.array().items(Joi.string()),
  status: Joi.string().optional(),
  classifications: Joi.array().min(1).items(Joi.object({
    id: Joi.string().min(10).optional(),
    community: Joi.string(),
    subCommunity: Joi.string().valid(validSubcommunitiesIds),
    countriesRepresented: Joi.array().items(Joi.string()),
    gicp: Joi.string(),
    personalInformation: Joi.boolean(),
    development: Joi.boolean(),
    additionalTags: Joi.array().items(Joi.string())
  })),
  approvals: Joi.array().optional().items(Joi.object()),
  commentHistory: Joi.array().items(Joi.object()).optional(),
  usability: Joi.number().optional(),
  visibility: Joi.string().valid(...Object.values(VISIBILITY)).optional()
});

function validate(dataset, options) {
  const {error} = Joi.validate(dataset, datasetSchema, options);
  if (error) {
    error.details.forEach(detail => detail.name = dataset.name ? dataset.name : 'New Dataset');
  }
  return error;
}

function validateAllFields(dataset) {
  const options = {presence: 'required', allowUnknown: true, abortEarly: false};
  return validate(dataset, options)
}

function validateFieldsExist(dataset) {
  const options = {presence: 'optional', allowUnknown: false, abortEarly: false};
  return validate(dataset, options)
}

module.exports = {
  validateAllFields,
  validateFieldsExist
};
