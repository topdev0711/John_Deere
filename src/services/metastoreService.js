const _ = require('lodash');
const datasetDao = require('../data/datasetDao');
const datasetService = require('./datasetService');
const metastoreDao = require('../data/metastoreDao');
const remediationService = require('./remediationService');
const s3 = require('../data/s3');
const schemaValidationService = require('./schemaValidationService');
const viewService = require('./viewService');
const { metastoreBucket, metastoreDatabases } = require('../../conf').getConfig();
const getIsoDatetime = () => new Date().toISOString();
const uuid = require('uuid');
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  datasetService.setLogger(logger);
  metastoreDao.setLogger(logger);
  remediationService.setLogger(logger);
  s3.setLogger(logger);
  schemaValidationService.setLogger(logger);
}

async function getDiscoveredMetadata(storageLocation) {
  try {
    return await s3.getFile(metastoreBucket, storageLocation);
  } catch (err) {
    log.error(err);
    throw new Error('An unexpected error occurred retrieving discovered metadata from S3.');
  }
}

async function processViews(storageLocation) {
  const id = uuid.v4();
  const currentViews = (await getDiscoveredMetadata(storageLocation)).views;
  log.info(`[${id}] Number of current views: ${(currentViews || []).length}`);
  const allDatasets = await datasetDao.getLatestDatasets({ statuses: ['AVAILABLE'] });
  log.info(`[${id}] Latest datasets: ${(allDatasets || []).length}`);
  const {
    validStructures,
    validMetaData: validCurrentViews,
    validationErrors
  } = await validateMetadataAndStructures(currentViews, allDatasets);
  log.info(`[${id}] Number of valid views: ${(validCurrentViews || []).length}`);
  const updatedViews = await viewService.createUpdatedViews(validCurrentViews, allDatasets);
  log.info(`[${id}] Number of updated views: ${(updatedViews || []).length}`);
  const updatedDatasets = await viewService.createUpdatedDatasets(allDatasets, updatedViews);
  log.info(`[${id}] Number of updated datasets: ${(updatedDatasets || []).length}`);

  try {
    await Promise.all([
      saveMetaDataInDataset(updatedDatasets),
      metastoreDao.saveViewMetadatas(updatedViews),
      ...saveMetaDataStructures(validStructures)
    ]);
    log.info(`[${id}] Processing remediations...`);
    await remediationService.processRemediations(updatedViews);
    const successfulViews = validCurrentViews.map(({ name }) => ({ id: name, status: 'Successful' }));
    return [...validationErrors, ...successfulViews];
  } catch (error) {
    log.error(uuid, error);
    throw new Error('An unexpected error occurred when saving metadata.');
  }
}

async function addTables(storageLocation) {
  const tables = (await getDiscoveredMetadata(storageLocation)).tables;
  log.info(`Number of tables: ${tables.length}`);
  const allDatasets = await datasetDao.getLatestDatasets({ statuses: ['AVAILABLE'] });
  const {
    validStructures,
    validMetaData,
    validationErrors
  } = await validateMetadataAndStructures(tables, allDatasets);
  const updatedDatasets = addMetaDataToDatasets(validMetaData, allDatasets);
  const metadataDatasetRelations = buildMetaDataDatasetRelation(updatedDatasets);

  try {
    await Promise.all([
      saveMetaDataInDataset(updatedDatasets),
      metastoreDao.saveTableMetadatas(metadataDatasetRelations),
      ...saveMetaDataStructures(validStructures)
    ]);

    const successfulViews = validMetaData.map(({ name }) => ({ id: name, status: 'Successful' }));
    return [...validationErrors, ...successfulViews];
  } catch (error) {
    log.error(error);
    throw new Error('An unexpected error occured when saving metadata.');
  }
}

async function validateMetadataAndStructures(metadatas, allDatasets) {
  const structures = addDefaultValues(metadatas);
  const validationErrors = validateMetadatas(metadatas, allDatasets, structures);
  const invalidMetaData = validationErrors.map(({ id }) => id);
  const validStructures = structures.filter(({ name }) => !!name && !invalidMetaData.includes(name));
  const validMetaData = metadatas.filter(({ name }) => !!name && !invalidMetaData.includes(name));

  return { validStructures, validMetaData, validationErrors };
}


function saveMetaDataInDataset(updatedDatasets) {
  return datasetService.saveDatasets(updatedDatasets);
}

function saveMetaDataStructures(updatedStructures) {
  return updatedStructures.map(structure => metastoreDao.saveMetaDataStructure(structure));
}

function addMetaDataToDatasets(metadatas, allDatasets) {
  replaceMetadatasForDatasets(allDatasets);
  return metadatas.reduce((acc, metadata) => {
    const previouslyUpdatedDatasets = findRelatedDatasets(metadata.environmentNames, acc);
    const previousIds = previouslyUpdatedDatasets.map(({ id }) => id);
    const allRelatedDatasets = findRelatedDatasets(metadata.environmentNames, allDatasets);
    const newRelatedDatasets = allRelatedDatasets.filter(({ id }) => !previousIds.includes(id));
    const relatedDatasets = [...previouslyUpdatedDatasets, ...newRelatedDatasets];
    const updatedDatasets = relatedDatasets.map(dataset => {
      const uniqueTableNames = [...new Set([...dataset.discoveredTables, metadata.name])];
      return {
        ...dataset,
        discoveredTables: uniqueTableNames
      };
    });
    if (previouslyUpdatedDatasets.length) {
      const updatedIds = updatedDatasets.map(({ id }) => id);
      const filteredDatasets = acc.filter(({ id }) => !updatedIds.includes(id));
      return [...filteredDatasets, ...updatedDatasets];
    }
    return [...acc, ...updatedDatasets];
  }, []);

  function replaceMetadatasForDatasets(allDatasets) {
    allDatasets.forEach(ds => {
      ds.discoveredTables = [];
    });
  }
}

function findRelatedDatasets(environmentNames, allDatasets) {
  return environmentNames.reduce((acc, name) => {
    const matchingDatasets = allDatasets.filter(dataset => dataset.environmentName === name);
    return [...acc, ...matchingDatasets];
  }, []);
}

function buildMetaDataDatasetRelation(updatedDatasets) {
  const uniqueDatasets = updatedDatasets.reduce((acc, dataset) => {
    const matchingDataset = acc.find(({ id }) => id === dataset.id);
    if (!!matchingDataset) {
      return acc;
    } else {
      return [...acc, dataset];
    }
  }, []);
  return uniqueDatasets.reduce((acc, { id, discoveredTables }) => {
    const metadatas = discoveredTables.map(discoveredTable => ({ name: discoveredTable, updatedAt: getIsoDatetime(), datasetId: id }));
    return [...acc, ...metadatas];
  }, []);
}

function addDefaultValues(metadatas) {
  return metadatas.map(({ name, structure }) => ({
    ...structure,
    name,
    id: name,
    version: '1.0.0',
    testing: false,
    partitionedBy: []
  }))
}

function validateMetadatas(metadatas, datasets, updatedStructures) {
  const structuralErrors = schemaValidationService.validateDiscoveredSchemas(updatedStructures);

  const metadataErrors = metadatas.reduce((acc, metadata) => {
    const { name = '', structure = '', environmentNames = [] } = metadata;

    if (!name || !structure || !environmentNames.length) {
      const error = {
        id: name,
        status: 'A metadata name, structure, and list of related environment names are required to save.'
      };
      return [...acc, error];
    }

    const relatedDatasets = findRelatedDatasets(environmentNames, datasets);
    if (!relatedDatasets.length) {
      const error = {
        id: name,
        status: `No datasets found for given environment names.`
      };
      return [...acc, error];
    }

    return acc;
  }, []);
  return [...structuralErrors, ...metadataErrors];
}

async function getViews(datasetId) {
  const viewMetadatas = await metastoreDao.getViewsForDataset(datasetId);
  return viewMetadatas.filter(v => v.status !== 'DELETED').map((item) => {
    const view = {};
    view.name = item.name;
    view.status = item.status;
    view.createdAt = item.createdAt;
    return view;
  });
}

async function getAllViews() {
  const viewMetadatas = await metastoreDao.getAllViews();
  const views = viewMetadatas.filter(v => v.status !== 'DELETED').map(({ name }) => name)
  return [...new Set(views)];
}

async function getAllViewsDetails() {
  const viewMetadatas = await metastoreDao.getAllViews();
  return viewMetadatas;
}

async function getTables(datasetId) {
  const tableMetadatas = await metastoreDao.getTablesForDataset(datasetId);
  return tableMetadatas.map(({ name }) => name);
}

async function getAllTables() {
  const tableMetadatas = await metastoreDao.getAllTables();
  return tableMetadatas;
}

async function getMetastore(table) {
  const databaseCalls = metastoreDatabases.map(database => metastoreDao.getMetastore(database, table));
  return (await Promise.all(databaseCalls)).filter(database => !!database);
}

module.exports = {
  setLogger,
  processViews,
  addTables,
  getViews,
  getAllViews,
  getAllViewsDetails,
  getTables,
  getAllTables,
  getMetastore
}
