const conf = require('../../conf');
const dynamo = require('./dynamo');
const s3 = require('./s3');
let log = require('edl-node-log-wrapper');
const originalFetch = require('node-fetch');
const fetch = require('fetch-retry')(originalFetch);
const {viewsTable, tablesTable, edlMetastoreApi} = conf.getConfig();
const {getParams} = require('../utilities/edlApiHelper');
const setLogger = logger => log = logger;

function model() {
  return dynamo.define(viewsTable, {
    hashKey: 'datasetId',
    rangeKey: 'name',
    indexes: [{
      type: 'global',
      hashKey: 'name',
      name: 'view-name-index'
    }]
  });
}

function modelTables() {
  return dynamo.define(tablesTable, {
    hashKey: 'datasetId',
    rangeKey: 'name',
    indexes: [{
      type: 'global',
      hashKey: 'name',
      name: 'table-name-index'
    }]
  });
}

async function saveMetaDataStructure(structure) {
  try {
    log.debug('saving metastore structure: ', structure);
    await s3.save(structure);
    log.debug('saved metastore structure');
    return Promise.resolve('Success');
  } catch (error) {
    log.error('failed to save metastore structure with error: ', error);
    throw new Error('failed to save metastore structure');
  }
}

async function saveViewMetadatas(metadatas) {
  try {
    log.debug('saving view metadata: ', metadatas);
    await model().create(metadatas);
    log.debug('saved view metadata');
    return Promise.resolve('Success');
  } catch (error) {
    log.error('failed to save metadatas with error: ', error);
    throw new Error('failed to save metadatas');
  }
}

async function saveTableMetadatas(metadatas) {
  try {
    log.debug('saving table metadata: ', metadatas);
    await modelTables().create(metadatas);
    log.debug('saved table metadata');
    return Promise.resolve('Success');
  } catch (error) {
    log.error('failed to save table metadatas with error: ', error);
    throw new Error('failed to save table metadatas');
  }
}

async function getViewsForDataset(datasetId) {
  try {
    log.debug('getting views for: ', datasetId);
    const records = await model().query(datasetId).loadAll().exec().promise();
    const results = await records.collectItems();
    log.debug('got views for: ', datasetId);
    return results;
  } catch (error) {
    log.error('failed to get dataset views with error: ', error);
    throw new Error('failed to get dataset views');
  }
}

async function getView(name) {
  try {
    log.debug('getting view for : ', name)
    const query = model().query(name).usingIndex('view-name-index');
    const records = await query.exec().promise();
    log.debug('got view for: ', name);
    return records.collectItems();
  } catch (error) {
    log.error('failed to get view for name with error: ', error);
    throw new Error('failed to get view for name');
  }
}

async function getAllViews() {
  try {
    log.debug('getting all views');
    const records = await model().scan().loadAll().exec().promise();
    const results = await records.collectItems();
    log.debug('got all views');
    return results;
  } catch (error) {
    log.error('failed to get all views with error: ', error);
    throw new Error('failed to get all views');
  }
}

async function getTablesForDataset(datasetId) {
  try {
    log.debug('getting tables for: ', datasetId);
    const records = await modelTables().query(datasetId).loadAll().exec().promise();
    const results = await records.collectItems();
    log.debug('got tables for: ', datasetId);
    return results;
  } catch (error) {
    log.error('failed to get tables for dataset with error: ', error);
    throw new Error('failed to get tables for dataset');
  }
}

async function getTable(name) {
  try {
    log.debug('getting table for: ', name);
    const query = modelTables().query(name).usingIndex('table-name-index');
    const records = await query.exec().promise();
    log.debug('got table for: ', name);
    return records.collectItems();
  } catch (error) {
    log.error(`failed to get table for ${name} with error: `, error);
    throw new Error(`failed to get table for ${name}`);
  }
}

async function getAllTables() {
  try {
    log.debug('getting all tables');
    const records = await modelTables().scan().exec().promise();
    const results = await records.collectItems();
    log.debug('got all tables');
    return results;
  } catch (error) {
    log.error('failed to get all tables with error: ', error);
    throw new Error('failed to get all tables');
  }
}

async function getDatabase(database, table) {
  const endpoint = `${edlMetastoreApi}v1/metastore/${database}/tables/${table}`;
  try {
    const params = await getParams('GET');
    log.info(`Sending request for ${endpoint}`);
    const response = await fetch(endpoint, params);
    log.info(`Received response code ${response.status}`)
    const bodyJson = await response.json();
    if (response.ok)
      return bodyJson;
    if (bodyJson?.errorMessage?.includes("Table not found"))
      return undefined;
    throw new Error(bodyJson?.errorMessage);
  } catch (error) {
    log.error('Failed with error: ', error.stack);
    throw error;
  }
}

async function getMetastore(database, table) {
  try {
    log.debug('getting metastore');
    const response = await getDatabase(database, table);
    log.debug('got the metastore');
    return response ? database : undefined;
  } catch (error) {
    log.error('failed to get the metastore with error: ', error);
  }

}

module.exports = {
  setLogger,
  getViewsForDataset,
  saveMetaDataStructure,
  saveViewMetadatas,
  saveTableMetadatas,
  getAllViews,
  getTablesForDataset,
  getTable,
  getAllTables,
  getView,
  getMetastore
}
