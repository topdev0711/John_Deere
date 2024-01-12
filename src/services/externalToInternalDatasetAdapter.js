const catalogReferenceService = require('./catalogReferenceService');
const datasetService = require('./datasetService');
const externalAdapterCommon = require('./externalAdapterCommon');
const externalDatasetModel = require('../model/externalDatasetModel');
const schemaDao = require('../data/schemaDao');
let log = require('edl-node-log-wrapper');

const { getCreationInfo, notFoundError } = externalAdapterCommon;

const setLogger = logger => {
  log = logger;
  catalogReferenceService.setLogger(logger);
  datasetService.setLogger(logger);
  externalAdapterCommon.setLogger(logger);
  schemaDao.setLogger(logger);
}

const updateSchemaId = table => {
  const schemaId = table.schemaId ? table.schemaId : null;
  return { ...table, schemaId};
}

const addNullToUpdateDatasetTables = tables => (tables || []).map(updateSchemaId)
const setSchemaIdToNull = table => ({ ...table, schemaId: null});
const addNullToNewDatasetTables = tables => (tables || []).map(setSchemaIdToNull)

function validateModel(dataset) {
  const error = externalDatasetModel.validate(dataset);
  if (error) {
    error.details.map(detail => detail.name = dataset.name ? dataset.name : 'New Dataset')
    log.error('Inside adapter validateModel: ', error);
    throw error;
  }
}

async function getLatestAvailableVersion(id) {
  const latest = await datasetService.getLatestAvailableVersion(id);

  if (!latest) throw notFoundError(id, 'dataset');
  return {id: latest.id, version: latest.version, paths: latest.paths};
}

function getSourceDatasetReferenceIds({sourceDatasets}) {
  return Promise.all(sourceDatasets.map(getLatestAvailableVersion))
}

async function getCurrentPaths(id) {
  let paths = [];
  try {
    const dataset = await getLatestAvailableVersion(id);
    paths = dataset.paths || [];
  } catch (error) {
    log.error(error);
    paths = [];
  }
  return paths;
}

async function createReferencedDataset(dataset) {
  log.info('getting reference ids for dataset attributes');
  const references = catalogReferenceService.getDatasetReferences(dataset);
  log.info('retrieved references');

  log.info('getting source datasets');
  const sourceDatasets = await getSourceDatasetReferenceIds(dataset);
  log.info('received source datasets',);
  return {...dataset, ...references, sourceDatasets};
}

async function adaptNewDataset(rawDataset) {
  const tables = addNullToNewDatasetTables(rawDataset.tables);
  const dataset = { ...rawDataset, tables, paths: []};
  validateModel(dataset);
  if (dataset.schemas) dataset.schemas.map(schema => delete schema.id);
  return createReferencedDataset(dataset);
}

const findSchema = (schemas, schema) => schemas.find(({name, version}) => name === schema.name && version === schema.version);
const setSchemaIds = (existingSchemas, schema) => {
  const cleanedSchema = { ...schema };
  delete cleanedSchema.id;
  const existingSchema = existingSchemas ? findSchema(existingSchemas, cleanedSchema) : undefined;
  return existingSchema ? {...cleanedSchema, id: existingSchema.id}: cleanedSchema;
};

async function setFromLatestAvailableVersionSchemaIds(latestAvailable, schemas) {
  const latestReferencedSchemas = latestAvailable ? (latestAvailable.schemas || []) : [];
  const latestReferencedSchemasIds = latestReferencedSchemas.map(schema => schema.id);
  const fullSchemas = await schemaDao.getSchemas(latestReferencedSchemasIds);
  return schemas.map(schema => setSchemaIds(fullSchemas, schema));
}

async function adaptExistingDataset(id, dataset, user) {
  const tables = addNullToUpdateDatasetTables(dataset.tables);
  const paths = await getCurrentPaths(id);
  const updatedDataset = { ...dataset, tables, paths };
  validateModel(updatedDataset);
  const latest = await datasetService.getLatestDataset(id, ['AVAILABLE', 'PENDING', 'APPROVED', 'REJECTED']);
  const creationInfo = await getCreationInfo(latest, id, user, 'dataset');
  const latestAvailable = await datasetService.getLatestAvailableVersion(id);
  const schemas = await setFromLatestAvailableVersionSchemaIds(latestAvailable, updatedDataset.schemas);
  const versionedDataset = {...updatedDataset, id, schemas, ...creationInfo};
  return createReferencedDataset(versionedDataset);
}

module.exports = { setLogger, adaptNewDataset, adaptExistingDataset };
