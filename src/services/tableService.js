const metastoreDao = require('../data/metastoreDao');
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  metastoreDao.setLogger(logger);
}

function findTable(table, datasetTables) {
  return datasetTables.find(datasetTable => {
    const { tableName, schemaVersion, versionless } = datasetTable;
    const versionedTable = `${tableName}_${schemaVersion.replace(/\./g, '_')}`;
    if (versionless) {
      return table === versionedTable || table === tableName;
    } else {
      return table === versionedTable;
    }
  });
}

function getDatasetForEnhanceTable(enhanceTable, allDatasets) {
  for (const dataset of allDatasets) {
    const { id, environmentName, tables } = dataset;
    const datasetHasTable = findTable(enhanceTable, tables);
    if (datasetHasTable) {
      const { schemaId, schemaEnvironmentName } = datasetHasTable;
      return {
        datasetId: id,
        datasetEnvironmentName: environmentName,
        schemaId,
        schemaEnvironmentName
      };
    }
  }
  return { datasetId: null };
}

function temporaryTimeFilter(tableRecords) {
  const oneHourMillisBuffer = 1 * 60 * 60 * 1000;
  const updateTimes = tableRecords.map(table => Date.parse(table.updatedAt));
  const mostRecentUpdate = Math.max(...updateTimes);
  const updateCutoff = mostRecentUpdate - oneHourMillisBuffer;
  return tableRecords.filter(table => Date.parse(table.updatedAt) >= updateCutoff).map(table => table.datasetId);
}

async function getDatasetsForTable(name) {
  const tableRecords = await metastoreDao.getTable(name);
  return temporaryTimeFilter(tableRecords);
}

module.exports = { setLogger, getDatasetForEnhanceTable, getDatasetsForTable }
