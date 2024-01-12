const _ = require('lodash');
const getUuid = require('uuid-by-string');
const datasetDao = require('../data/datasetDao');
const metastoreDao = require('../data/metastoreDao');
const permissionDao = require('../data/permissionDao');
const referenceService = require('./referenceService');
const schemaDao = require('../data/schemaDao');
const {getConfig} = require('../../conf');
let log = require('edl-node-log-wrapper');
const {getToggle} = require("./featureToggleService");

const setLogger = logger => {
  log = logger;
  datasetDao.setLogger(logger);
  metastoreDao.setLogger(logger);
  permissionDao.setLogger(logger);
  referenceService.setLogger(logger);
  schemaDao.setLogger(logger);
}

const getIsoDatetime = () => new Date().toISOString();
const nonDeletedStatuses = ['AVAILABLE', 'PENDING', 'APPROVED', 'REJECTED'];

function createDynamoItem(datasetId, name, status, driftDetails) {
  return {
    datasetId,
    name,
    status,
    driftDetails,
    updatedAt: getIsoDatetime(),
    createdAt: getIsoDatetime()
  };
}

function findViewRecord(viewRecords, targetDatasetId) {
  return viewRecords.find(({ datasetId }) => datasetId === targetDatasetId);
}

function determineViewStatuses(name, viewRecords, currentDatasetIds, existingDatasetIds) {
  let viewStatuses = [];
  currentDatasetIds.forEach(currentDatasetId => {
    const existingViewRecord = findViewRecord(viewRecords, currentDatasetId);
    if (existingViewRecord) {
      viewStatuses.push({
        ...existingViewRecord,
        status: 'AVAILABLE',
        driftDetails: {},
        updatedAt: getIsoDatetime()
      });
    } else {
      viewStatuses.push(createDynamoItem(currentDatasetId, name, 'AVAILABLE', {}));
    }
  });
  existingDatasetIds.forEach(existingDatasetId => {
    if (!currentDatasetIds.includes(existingDatasetId)) {
      const existingViewRecord = findViewRecord(viewRecords, existingDatasetId);
      viewStatuses.push({
        ...existingViewRecord,
        status: 'DELETED',
        driftDetails: {},
        updatedAt: getIsoDatetime()
      });
    }
  });
  return viewStatuses;
}

function getDatasetClassifications(datasetIds, allDatasets) {
  let classifications = [];
  datasetIds.forEach(datasetId => {
    const availableDataset = allDatasets.find(({ id, status }) => id === datasetId && status === 'AVAILABLE');
    if (availableDataset) {
      classifications = [...classifications, ...availableDataset.classifications];
    }
  });
  return classifications.map(classification => {
    const { community, subCommunity, gicp, countriesRepresented, additionalTags, personalInformation, development } = classification;
    const classificationValues = [
      community.name,
      subCommunity.name,
      gicp.name,
      countriesRepresented.map(country => country.name).sort(),
      additionalTags.sort(),
      personalInformation,
      development
    ];
    return getUuid(classificationValues.toString().toLowerCase());
  });
}

function findNewClassifications(existingDatasetIds, newDatasetIds, allDatasets) {
  const existingDatasetClassifications = getDatasetClassifications(existingDatasetIds, allDatasets);
  const newDatasetClassifications = getDatasetClassifications(newDatasetIds, allDatasets);
  const newClassifications = _.difference(newDatasetClassifications, existingDatasetClassifications);
  return newClassifications.length;
}

async function getAllViewsWithPermissions() {
  const allPermissions = await permissionDao.getLatestPermissions({ statuses: ['AVAILABLE'] });
  let allViewsWithPermissions = [];
  allPermissions.forEach(permission => {
    const { views } = permission;
    if (views && views.length) {
      allViewsWithPermissions = [...allViewsWithPermissions, ...views];
    }
  });
  return [...new Set(allViewsWithPermissions)];
}

function createViewsWithPermissions(existingCurrentViewsWithPermissions, allViewsByName, environmentIds, allDatasets) {
  let viewsWithPermissions = [];
  let newClassifications = 0;
  existingCurrentViewsWithPermissions.forEach(existingCurrentViewWithPermissions => {
    const { name, environmentNames } = existingCurrentViewWithPermissions;
    const viewRecords = allViewsByName[name];
    const existingDatasetIds = viewRecords.map(view => view.datasetId);
    const currentDatasetIds = environmentNames.map(environmentName => environmentIds[environmentName]);
    const newDatasetIds = currentDatasetIds.filter(currentDatasetId => !existingDatasetIds.includes(currentDatasetId));
    if (newDatasetIds.length) {
      newClassifications = findNewClassifications(existingDatasetIds, newDatasetIds, allDatasets);
    }
    const driftedDatasets = (newDatasetIds.length && newClassifications);
    if (driftedDatasets) {
      const driftDetails = {
        type: 'dataset',
        items: newDatasetIds
      };
      existingDatasetIds.forEach(existingDatasetId => {
        const existingViewRecord = findViewRecord(viewRecords, existingDatasetId);
        viewsWithPermissions.push({
          ...existingViewRecord,
          status: 'DRIFTED',
          driftDetails,
          updatedAt: getIsoDatetime()
        });
      });
    } else {
      const viewStatuses = determineViewStatuses(name, viewRecords, currentDatasetIds, existingDatasetIds);
      viewsWithPermissions = [...viewsWithPermissions, ...viewStatuses];
    }
  });
  return viewsWithPermissions;
}

function createViewsWithoutPermissions(existingCurrentViewsWithoutPermissions, allViewsByName, environmentIds) {
  let viewsWithoutPermissions = [];
  existingCurrentViewsWithoutPermissions.forEach(existingCurrentViewWithoutPermissions => {
    const { name, environmentNames } = existingCurrentViewWithoutPermissions;
    const viewRecords = allViewsByName[name];
    const existingDatasetIds = viewRecords.map(view => view.datasetId);
    const currentDatasetIds = environmentNames.map(environmentName => environmentIds[environmentName]);
    const viewStatuses = determineViewStatuses(name, viewRecords, currentDatasetIds, existingDatasetIds);
    viewsWithoutPermissions = [...viewsWithoutPermissions, ...viewStatuses];
  });
  return viewsWithoutPermissions;
}

async function createExistingViews(allViews, currentViews, environmentIds, allDatasets) {
  const existingCurrentViews = currentViews.filter(({ name }) => allViews.find(view => view.name === name));
  const allViewsWithPermissions = await getAllViewsWithPermissions();
  const allViewsByName = _.groupBy(allViews, 'name');
  const existingCurrentViewsWithoutPermissions = existingCurrentViews.filter(({ name }) => !allViewsWithPermissions.find(viewName => viewName === name));
  const existingViewsWithoutPermissions = createViewsWithoutPermissions(existingCurrentViewsWithoutPermissions, allViewsByName, environmentIds);
  const existingCurrentViewsWithPermissions = existingCurrentViews.filter(({ name }) => allViewsWithPermissions.find(viewName => viewName === name));
  const existingViewsWithPermissions = createViewsWithPermissions(existingCurrentViewsWithPermissions, allViewsByName, environmentIds, allDatasets);
  return [...existingViewsWithoutPermissions, ...existingViewsWithPermissions];
}

function createNewViews(allViews, currentViews, environmentIds) {
  const newCurrentViews = currentViews.filter(({ name }) => !allViews.find(view => view.name === name));
  let newViews = [];
  newCurrentViews.forEach(newCurrentView => {
    const { name, environmentNames } = newCurrentView;
    const datasetIds = environmentNames.map(environmentName => environmentIds[environmentName]);
    datasetIds.forEach(datasetId => {
      newViews.push(createDynamoItem(datasetId, name, 'AVAILABLE', {}));
    });
  });
  return newViews;
}

function createDeletedViews(allViews, currentViews) {
  const activeViews = allViews.filter(({ status }) => status !== 'DELETED');
  const deletedViews = activeViews.filter(({ name }) => !currentViews.find(currentView => currentView.name === name));
  return deletedViews.map(deletedView => {
    deletedView.updatedAt = getIsoDatetime();
    deletedView.status = 'DELETED';
    deletedView.driftDetails = {};
    return deletedView;
  });
}

function getEnvironmentIds(allDatasets) {
  const environmentIds = {};
  allDatasets.forEach(dataset => {
    const { environmentName, id } = dataset;
    environmentIds[environmentName] = id;
  });
  return environmentIds;
}

async function createUpdatedViews(validCurrentViews, allDatasets) {
  const allViews = await metastoreDao.getAllViews();
  const environmentIds = getEnvironmentIds(allDatasets);
  const deletedViews = createDeletedViews(allViews, validCurrentViews);
  const newViews = createNewViews(allViews, validCurrentViews, environmentIds);
  const existingViews = await createExistingViews(allViews, validCurrentViews, environmentIds, allDatasets);
  return [...deletedViews, ...newViews, ...existingViews];
}

async function getViewStatus(name) {
  const viewItems = await metastoreDao.getView(name);
  const statuses = viewItems.map(view => view.status);
  let status = 'DELETED';
  if (statuses.includes('AVAILABLE')) {
    status = 'AVAILABLE';
  } else if (statuses.includes('DRIFTED')) {
    status = 'DRIFTED';
  }
  return {
    name,
    status
  };
}

function getViewsWithStatus(views) {
  return Promise.all(views.map(view => {
    return getViewStatus(view);
  }));
}

async function getActiveDatasetsForView(name) {
  try {
    const viewItems = await metastoreDao.getView(name);
    return viewItems.filter(view => view.status !== 'DELETED').map(view => view.datasetId);
  } catch(error) {
    log.error(error);
    throw new Error(`An unexpected error occurred when getting dataset for view ${name}`);
  }
}

async function getActiveAndDriftedDatasetsForView(name) {
  if(typeof name === 'object' && name !== null) {
    name = name.name;
  }
  const viewRecords = await metastoreDao.getView(name);
  const datasetIds = viewRecords.filter(view => view.status !== 'DELETED').map(view => view.datasetId);
  const driftedView = viewRecords.find(view => view.driftDetails && view.driftDetails.items);
  if (driftedView) {
    const { items } = driftedView.driftDetails;
    datasetIds.push(...items);
  }
  return datasetIds;
}

function getDatasetsForView(name) {
  return getActiveAndDriftedDatasetsForView(name);
}

async function getLatestNonDeletedDataset(id) {
  return datasetDao.getLatestDataset(id, nonDeletedStatuses);
}

async function getFullDatasetsForView(view) {
  const viewDatasetIds = await getActiveAndDriftedDatasetsForView(view);
  let datasetsForView = [];
  await Promise.all(viewDatasetIds.map(async datasetId => {
    const dataset = await getLatestNonDeletedDataset(datasetId);
    if (dataset) datasetsForView.push(dataset);
    return;
  }));
  return datasetsForView;
}

async function getDatasetsSummary(name) {
  const datasetsForView = await getFullDatasetsForView(name);
  return datasetsForView.map(dataset => {
    const { id, name, phase, version } = dataset;
    return {
      id,
      name,
      phase,
      version
    };
  });
}

async function getDriftedDatasetIds(name) {
  const viewMetadatas = await metastoreDao.getView(name);
  const driftedMetadata = viewMetadatas.find(view => view.driftDetails);
  if(driftedMetadata) {
     return driftedDatasetIds = driftedMetadata.driftDetails.items;
  }
  return [];
}

function addDriftFlag(datasets, driftedDatasetIds) {
  return datasets.map( ds => {
    if(driftedDatasetIds.includes(ds.id)) {
          return {
            ...ds,
            isDrifted: true
          }
        }
        return ds;
  });
}

async function getViewDetails(name){
  try {
    const {fields, description, isDynamic} = await schemaDao.getSchema(name);
    const datasets =  await getDatasetsSummary(name);
    const driftedDatasetIds =  await getDriftedDatasetIds(name);
    const datasetsWithDriftFlag = addDriftFlag(datasets, driftedDatasetIds);
    return {
      name,
      description,
      isDynamic,
      fields,
      datasets: datasetsWithDriftFlag
    };
  } catch(error) {
    log.error(error);
    throw new Error(`An unexpected error occurred when getting details for view ${name}`);
  }
}

function deriveCommunityIds(datasets) {
  return datasets.map(dataset => dataset.classifications.map(c => {
    if(c.community) {
      return c.community.id
    } else {
      return referenceService.getValue(c.subCommunity.id).communityId
    }
  })).reduce((accum, item) => accum.concat(item), []);
}

async function getViewAvailability(name) {
  try {
    const views = await metastoreDao.getView(name);
    if (!views.length) {
      log.info(`View ${name} doesn't exist.`);
      return false;
    }
    const datasets = await getFullDatasetsForView(name);
    const communityIds = deriveCommunityIds(datasets);
    const toggledCommunityIds = getConfig().viewRemediationCommunitiesToggle;
    const hasToggledCommunities = communityIds.every( communityId => toggledCommunityIds.includes(communityId));

    if(hasToggledCommunities) {
      const { status } = views[0];
      return status !== 'DRIFTED';
    } else {
      return true;
    }
  } catch (err) {
    log.error(err);
    throw new Error(`An unexpected error occurred when getting details for view ${name}.`);
  }
}

const showDriftedViewsToggle = async () => {
  try {
    const showDriftedViews = await getToggle("jdc.visible_drifted_views");
    return showDriftedViews.enabled;
  } catch {
    log.error("getToggle failed for jdc.visible_drifted_views");
    return false;
  }
}

async function createUpdatedDatasets(allDatasets, updatedViews) {

  const showViews = (view) =>
    showDriftedViewsToggle() ? view.status !== 'DELETED' : view.status === 'AVAILABLE';

  const updatedViewsByDatasetId = _.groupBy(updatedViews, 'datasetId');
  let updatedDatasets = [];
  allDatasets.forEach(dataset => {
    const { id } = dataset;
    if (updatedViewsByDatasetId[id]) {
      dataset.views = [];
      updatedViewsByDatasetId[id].forEach(view => {
        if (showViews(view)) {
          const viewForDataset = {
            name: view.name,
            status: view.status,
            createdAt: view.createdAt ? view.createdAt : ''
          }
          dataset.views.push(viewForDataset);
        }
      });
      updatedDatasets.push(dataset);
    }
  });
  return updatedDatasets;
}

function addViewToExistingDatasets(allDatasets, updatedViews) {
  const datasetIds = updatedViews.map( updatedView => updatedView.datasetId);
  const filteredDatasets = allDatasets.filter( dataset => datasetIds.includes(dataset.id));
  const updatedDatasets = [];
  filteredDatasets.forEach( dataset => {
    updatedViews.forEach( view => {
      if(dataset.id === view.datasetId) {
        const viewForDataset = {
          name: view.name,
          status: view.status,
          createdAt: view.createdAt ? view.createdAt : ''
        }
        dataset.views.push(viewForDataset);

      }
    })
    updatedDatasets.push(dataset);
  });
  return updatedDatasets;
}

module.exports = {
  setLogger,
  createUpdatedViews,
  createUpdatedDatasets,
  getActiveDatasetsForView,
  getFullDatasetsForView,
  getDatasetsForView,
  getViewStatus,
  getViewDetails,
  getViewsWithStatus,
  getViewAvailability,
  addViewToExistingDatasets
}
