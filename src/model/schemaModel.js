const Joi = require('joi-browser');

const validFieldTypes = ['string', 'boolean', 'short', 'int', 'long', 'float', 'double', 'bytes', 'timestamp', 'date', 'decimal', 'byte', 'interval', 'array', 'struct', 'map', 'binary', 'integer'];
const validAttribute  = ['None', 'id', 'extract time', 'delete indicator'];
const joiString = Joi.string().regex(/^[A-Za-z0-9_]+$/, 'cannot contain special characters').max(200);

const requiresDecimal = Joi.when('datatype', {
  is: 'decimal',
  then: Joi.number().integer().max(38),
  otherwise: Joi.optional()
});

const scaleObject = Joi.when('datatype', {
  is: 'decimal',
  then: Joi.number().max(Joi.ref('precision')).integer().min(0),
  otherwise: Joi.optional()
});

const joiDatatype = Joi.string().max(20).valid(validFieldTypes);

const fieldObject = Joi.object().keys({
  id: Joi.string().optional(),
  name: joiString,
  description: Joi.string().allow('').optional(),
  datatype: joiDatatype,
  scale: scaleObject,
  precision: requiresDecimal,
  nullable: Joi.boolean().default(false),
  attribute: Joi.string().valid(validAttribute)  
});

const schemaDefinition = Joi.object().keys({
  id: Joi.string(),
  name: Joi.string().required(),
  version: Joi.string().regex(/^([0-9]+)\.([0-9]+)\.([0-9]+)$|^[0-9]+$/i, 'number or semver #.#.#').required(),
  description: Joi.string().max(200),
  documentation: Joi.string().max(3500).allow('').optional(),
  updateFrequency: Joi.string().optional(),
  partitionedBy: Joi.array().items(joiString),
  testing: Joi.boolean().required(),
  fields: Joi.array().min(1).items(fieldObject),
  discovered: Joi.string().optional(),
  glueTables: Joi.array().items(Joi.object()).optional(),
  isDynamic: Joi.boolean().optional().default(false),
  tables: Joi.array().items(Joi.string()).optional()
});

const getSchemaNameVersion = schema => `${schema.name}@${schema.version}`;
const getSchemaError = schema => `Invalid Schema: ${schema.name}@${schema.version}.`;

function validate(schema) {
  const options = {presence: 'required', allowUnknown: false, abortEarly: false};
  const {error} = Joi.validate(schema, schemaDefinition, options);
  if (error) {
    const schemaNameVersion = getSchemaNameVersion(schema);
    const newError = new Error(`${getSchemaError(schema)} ${error.message}`);
    newError.details = error.details;
    newError.details.map(detail => detail.name = schemaNameVersion);
    return newError;
  }
}

module.exports = {
  validate
};
