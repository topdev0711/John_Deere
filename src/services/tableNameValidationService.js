const datasetDao = require('../data/datasetDao');
const referenceService = require('./referenceService');
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  datasetDao.setLogger(datasetDao);
  referenceService.setLogger(logger);
}

function createTableWithVersion(table) {
  return `${table.tableName}_${table.schemaVersion.replace(/\./g, '_')}`;
}

async function getAllOtherTables(datasetId, nonDeletedDatasets) {
  const status = ['PENDING', 'REJECTED', 'APPROVED', 'AVAILABLE'];
  const datasets = nonDeletedDatasets || await datasetDao.getDatasets(status);
  const otherDatasets = datasets.filter(({ id }) => datasetId !== id);
  return otherDatasets
      .map(dataset => (dataset.tables || []))
      .reduce((acc, tableNames) => acc.concat(tableNames), []);
}

function hasMismatchingSchemaVersions(schemas, tables) {
  const schemasMap = new Map();
  const collectTablesBySchemaName = schema => {
    const matchingTableNames = tables.filter(table => table.schemaName === schema.name).map(table => table.tableName);
    const existing = schemasMap.get(schema.name);
    const schemaValue = existing ? [ ...existing, ...matchingTableNames] : matchingTableNames;
    schemasMap.set(schema.name, schemaValue);
  };
  schemas.forEach(collectTablesBySchemaName);

  const mismatchingSchemaNames = [];
  schemasMap.forEach((tableNames, schemaName) => {
    const mismatchingTableNames = new Set(tableNames).size > 1;
    if(mismatchingTableNames) {
      mismatchingSchemaNames.push(schemaName);
    }
  });
  if (mismatchingSchemaNames.length > 0) {
    return `Schemas ${mismatchingSchemaNames.join(',')} cannot have different table names across versions.`;
  }
}

function packageErrors(errors) {
  const packagedError = new Error('Table names are invalid');
  packagedError.details = errors.map(error => ({ name: 'Invalid table names:', message: error }));
  return packagedError;
}

function hasDuplicateTableNames(allOtherTables, pendingTables) {
  const schemaBaseId = schemaId => schemaId.split('--')[0];
  const errors = [];

  for(let i = 0; i < pendingTables.length; i++) {
    const pendingTable = pendingTables[i];
    const pendingTableWithVersion = createTableWithVersion(pendingTable);
    const notSelf = table => schemaBaseId(table.schemaId) !== schemaBaseId(pendingTable.schemaId);
    const duplicateTableWithinDataset = pendingTables.find(table => notSelf(table) && createTableWithVersion(table) === pendingTableWithVersion);
    const duplicateTableOtherDataset = allOtherTables.find(table => table.tableName === pendingTable.tableName);

    if (duplicateTableWithinDataset) {
      errors.push(`The table name "${pendingTableWithVersion}" is already being used.`);
      break;
    }
    if (duplicateTableOtherDataset) {
      errors.push(`The table name "${pendingTable.tableName}" is already being used in another dataset.`);
      break;
    }
  }

  return errors;
}

async function hasNonEnhanceTableName(dataset) {
  const isPhaseNotEnhance = async phaseId => {
    const phaseName = await referenceService.getName(phaseId);
    return (phaseName || '').toLowerCase() !== 'enhance';
  };
  const notEnahncePhase = await isPhaseNotEnhance(dataset.phase);
  const hasTables = dataset.tables.length > 0;
  if (hasTables && notEnahncePhase) {
    return `Dataset ${dataset.name} cannot have table names since the phase is not enhance`;
  }
}

async function validateTables(dataset, nonDeletedDatasets) {
  const nonEnhanceTableName = await hasNonEnhanceTableName(dataset);
  if (nonEnhanceTableName) {
    return packageErrors([nonEnhanceTableName]);
  }

  const mismatchingSchemaVersions = hasMismatchingSchemaVersions(dataset.schemas, dataset.tables);
  if (mismatchingSchemaVersions) {
    return packageErrors([mismatchingSchemaVersions]);
  }

  const allOtherTables = await getAllOtherTables(dataset.id, nonDeletedDatasets);
  const duplicateTableNames = hasDuplicateTableNames(allOtherTables, dataset.tables);
  if (duplicateTableNames.length) {
    return packageErrors(duplicateTableNames);
  }
}

module.exports = { setLogger, validateTables };
