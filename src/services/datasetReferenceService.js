const datasetService = require('./datasetService');
const tableService = require('./tableService');
const viewService = require('./viewService');
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  datasetService.setLogger(logger);
  tableService.setLogger(logger);
  viewService.setLogger(logger);
};

function referencedDatasets(item, datasets) {
  return { name: item, datasets };
}

function datasetDetails(dataset) {
  const { id, environmentName } = dataset;
  return { datasetId: id, datasetEnvironmentName: environmentName };
}

async function getDatasetsForTable(table, allDatasets) {
  const edlEnhanceDatabases = ['edl', 'edl_current', 'edl_dev', 'edl_current_dev'];
  const database = table.split('.')[0];
  const edlEnhanceDatabase = edlEnhanceDatabases.includes(database);
  const datasets = [];
  if (edlEnhanceDatabase) {
    const enhanceTable = table.split('.')[1];
    const enhanceDatasetDetails = tableService.getDatasetForEnhanceTable(enhanceTable, allDatasets);
    if (enhanceDatasetDetails.datasetId) datasets.push(enhanceDatasetDetails);
  } else {
    const tableDatasetIds = await tableService.getDatasetsForTable(table);
    const availableDatasetIds = await datasetService.availableDatasetIds(tableDatasetIds);
    availableDatasetIds.forEach(datasetId => {
      const dataset = allDatasets.find(dataset => dataset.id === datasetId);
      datasets.push(datasetDetails(dataset));
    });
  }
  return referencedDatasets(table, datasets);
}

async function getDatasetsForView(view, allDatasets) {
  const viewDatasetIds = await viewService.getDatasetsForView(view);
  const availableDatasetIds = await datasetService.availableDatasetIds(viewDatasetIds);
  const datasets = availableDatasetIds.map(datasetId => {
    const dataset = allDatasets.find(dataset => dataset.id === datasetId);
    return datasetDetails(dataset);
  });
  return referencedDatasets(view, datasets);
}

function getDatasetsForPath(path, allDatasets) {
  const datasets = [];
  const datasetHasPath = allDatasets.find(dataset => path.startsWith(dataset.storageLocation));
  if (datasetHasPath) datasets.push(datasetDetails(datasetHasPath));
  return referencedDatasets(path, datasets);
}

async function getReferencedDatasets(metadata) {
  const { tables, views, paths } = metadata;
  const allDatasets = await datasetService.getLatestDatasets({ statuses: ['AVAILABLE'] });
  const referencedDatasets = { tables: [], views: [], paths: [] };

  if (tables) referencedDatasets.tables = await Promise.all(tables.map(async table => await getDatasetsForTable(table, allDatasets)));
  if (views) referencedDatasets.views = await Promise.all(views.map(async view => await getDatasetsForView(view, allDatasets)));
  if (paths) referencedDatasets.paths = paths.map(path => getDatasetsForPath(path, allDatasets));
  return referencedDatasets;
}

module.exports = { setLogger, getReferencedDatasets }
