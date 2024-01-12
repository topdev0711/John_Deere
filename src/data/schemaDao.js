const conf = require('../../conf');
const dynamo = require('./dynamo');
const s3 = require('./s3');
let log = require('edl-node-log-wrapper');

const setLogger = logger => log = logger;

function model() {
  return dynamo.define(conf.getConfig().discoveredSchemasTable, { hashKey: 'datasetId', rangeKey: 'id'});
}

const getSchema = schemaId => s3.get(schemaId);
const getSchemas = schemaIds => Promise.all(schemaIds.map(getSchema));
const saveSchema = schema => s3.save(schema);

async function saveDiscoveredSchemas(metadatas, schemas) {
  return Promise.all([...schemas.map(saveSchema), model().create(metadatas)]);
}

async function getDiscoveredSchemas() {
  try {
    log.debug('getting discovered schemas');
    const segments = 8;
    const query = model().parallelScan(segments);
    const records = await query.exec().promise();
    log.debug('got discovered schemas');
    return records.collectItems();
  } catch (e) {
    log.error('failed to get discovered schemas with error: ', e.stack);
    throw new Error('failed to get discovered schemas');
  }
}

async function getDiscoveredSchemasForDataset(datasetId) {
  try {
    log.debug(`getting discovered schemas for ${datasetId}`);
    const records =  await model().query(datasetId).loadAll().exec().promise();
    log.debug(`got discovered schemas for ${datasetId}`);
    return records.collectItems();
  } catch (e) {
    log.error('failed to get discovered schemas for dataset with error: ', e.stack);
    throw new Error('failed to get discovered schemas for dataset');
  }
}

async function deleteDiscoveredSchema(datasetId, schemaId) {
  try {
    log.debug(`deleting dataset ${datasetId} schema ${schemaId}`);
    const response = await new Promise((resolve, reject) => {
      model().destroy(datasetId, schemaId, (err) => {
        if (err) reject(err);
        else resolve();
      })
    });
    log.debug(`deleted dataset ${datasetId} schema ${schemaId}`);
    return response;
  } catch (e) {
    log.error('failed to delete discovered schema with error: ', e.stack);
    throw new Error('failed to delete discovered schema');
  }
}

module.exports = {
  setLogger,
  deleteDiscoveredSchema,
  getSchema,
  getSchemas,
  saveSchema,
  saveDiscoveredSchemas,
  getDiscoveredSchemas,
  getDiscoveredSchemasForDataset
};
