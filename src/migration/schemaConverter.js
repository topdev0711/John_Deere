const schemaDao = require('../../src/data/schemaDao');
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  schemaDao.setLogger(logger);
}

async function stringToJson(id) {
  try {
    const { name, version } = await schemaDao.getSchema(id);
    return { id, name, version };
  } catch (error) {
    log.error(`failed to get schema with ${id} with error message: ${error.message}`);
    log.error(error);
    if (error.message.includes('The specified key does not exist')) return undefined;
    throw new Error(error.message);
  }
}

function jsonToString(json) {
  return json.id;
}

function reportMissingSchemas(validSchemas, datasetSchemaIds, id, message) {
  const validSchemaIds = validSchemas.map(schema => schema.id);
  const missingSchemas = datasetSchemaIds.filter(datasetSchemaId => !validSchemaIds.includes(datasetSchemaId));
  log.info(`dataset: ${id} is missing ${message}: `, missingSchemas);
}

async function getSchemas(datasetSchemaIds, id, message) {
  const schemas = await Promise.all((datasetSchemaIds).map(stringToJson));
  const validSchemas = schemas.filter(schema => schema);
  if (schemas.length !== validSchemas.length) reportMissingSchemas(validSchemas, datasetSchemaIds, id, message);
  return validSchemas;
}

async function convertDatasetSchemasToJson(dataset) {
  if (dataset.schemas)  dataset.schemas = await getSchemas(dataset.schemas, dataset.id, 'schemas');
  if (dataset.linkedSchemas)  dataset.linkedSchemas = await getSchemas(dataset.linkedSchemas, dataset.id, 'linkedSchemas');
  return dataset;
}

async function convertDatasetsSchemasToJson(datasets) {
  log.info('Converting datasets from to strings to objects');
  const newDatasets = await Promise.all(datasets.map(convertDatasetSchemasToJson));
  log.info('Successfully converted datasets');
  return newDatasets;
}

async function getSchemaWithTesting(schemaDetails) {
  const { id } = schemaDetails;
  try {
    const { testing } = await schemaDao.getSchema(id);
    return { ...schemaDetails, testing };
  } catch (error) {
    log.error(`failed to get schema with ${id} with error message: ${error.message}`);
    log.error(error);
    if (error.message.includes('The specified key does not exist')) return undefined;
    log.error('getting here....', error);
    log.error('getting error message: ', error.message);
    throw new Error(error.message);
  }
}

async function getSchemasWithTesting(datasetSchemaIds, id, message) {
  const schemas = await Promise.all((datasetSchemaIds).map(getSchemaWithTesting));
  const validSchemas = schemas.filter(schema => schema);
  if (schemas.length !== validSchemas.length) reportMissingSchemas(validSchemas, datasetSchemaIds, id, message);
  return validSchemas;
}

async function addingTestingToJson(dataset) {
  if (dataset.schemas)  dataset.schemas = await getSchemasWithTesting(dataset.schemas, dataset.id, 'schemas');
  if (dataset.linkedSchemas)  dataset.linkedSchemas = await getSchemasWithTesting(dataset.linkedSchemas, dataset.id, 'linkedSchemas');
  return dataset;
}

async function addingTestingToSchemaDetails(datasets) {
  log.info('Adding testing key to schema details');
  const newDatasets = await Promise.all(datasets.map(addingTestingToJson));
  log.info('Successfully added testing keys');
  return newDatasets;
}

module.exports = { setLogger, stringToJson, jsonToString, convertDatasetsSchemasToJson, addingTestingToSchemaDetails }
