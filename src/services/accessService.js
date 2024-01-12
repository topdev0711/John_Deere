const datasetService = require('./datasetService');
const userService = require('./userService');
const edlApiHelper = require('../utilities/edlApiHelper');
const permissionService = require('./permissionService');
const util = require('../utilities/accessUtility');
const conf = require('../../conf');
const { edlCatalog } = require('../../conf').getConfig()

const ttlInSeconds = 600;
const DATASETS = 'acl_datasets';

let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  datasetService.setLogger(logger);
  edlApiHelper.setLogger(logger);
  permissionService.setLogger(logger);
}

async function getDatasets() {
  const cache = await conf.getRedisCacheManager(ttlInSeconds);
  const cacheValue = await cache.get(DATASETS);
  if (cacheValue != null) return cacheValue;
  const datasets = await datasetService.getLatestDatasets(log);
  await cache.set(DATASETS, datasets);
  return datasets;
}

const createEntitlements = classifications => classifications?.map(({community, subCommunity}) =>`${community.name},${subCommunity.name}`)


async function getDatasetsForEntitlements(entitlements) {
  const datasets = await getDatasets();
  return datasets.filter(ds => util.canAccess(entitlements, ds.classifications));
}

async function getPermissionsForClassifications(classifications) {
  const entitlements = createEntitlements(classifications);
  const permissions = await permissionService.listAllForStatus({entitlements});
  return permissions.filter(perm => util.canAccess(perm.entitlements, classifications));
}

const latestVersions = (permissions) => permissions.reduce((acc, obj) => {
  if (acc[obj.id]) {
    if (obj.version > acc[obj.id].version) {
      acc[obj.id] = obj;
    }
  } else {
    acc[obj.id] = obj;
  }
  return acc;
}, {});

async function getUserAccessForDataset(typeName, userGroups) {
  if (!typeName) throw new Error('Dataset name is required.');
  try {
    const edlGroups = await edlApiHelper.get(`${edlCatalog}/v1/acls?type=${typeName}`);
    const { roles } = edlGroups.find(({ type }) => type === typeName) || { roles: [] };
    return !!roles.find(({ name }) => userGroups.includes(name));
  } catch (error) {
    log.error(error);
    throw new Error('An unexpected issue occurred when retrieving roles from EDL Data Catalog.')
  }
}
const datasetReportHeader = [
  { label: 'Dataset', key: 'dataset' },
  { label: 'Dataset ID', key: 'datasetID' },
  { label: 'Permission Name', key: 'permissionName' },
  { label: 'Permission ID', key: 'permissionID' },
  { label: 'Permission Start Date', key: 'permissionStartDate' },
  { label: 'Permission End Date', key: 'permissionEndDate' },
  { label: 'AD Group', key: 'adGroup' },
  { label: 'User Name', key: 'displayName' },
  { label: 'Email', key: 'email' }
]

async function generateDatasetReport(dataset, permissions, permissionGroups) {
  let data = []
  await Promise.all(permissionGroups.map(async group => {
    const permissionsForGroup = permissions.filter(permission => permission.group === group);
    const params = { noLimit: true };
    const users = await userService.getUsersForGroup(group, params);
    const groupUsers = users.length ? users : [{displayName: 'No users for policy', email: ''}]
    permissionsForGroup.map(permission => {
      groupUsers.map(user => {
        const csvLine = {
          dataset: dataset.name,
          datasetID: dataset.id,
          permissionName: permission.name,
          permissionID: permission.id,
          permissionStartDate: permission.startDate,
          permissionEndDate: permission.endDate || '',
          adGroup: permission.group,
          displayName: user.displayName,
          email: user.email
        };
        data.push(csvLine);
      })
    })
  }))
  return { datasetReportHeader, data }
}

async function generateUserList(datasetId) {
  try {
    const dataset = await datasetService.getDataset(false, datasetId);
    const { classifications } = dataset;
    const permissions = await getPermissionsForClassifications(classifications);
    let permissionAvailable = util.findLatestAvailableVersions(permissions);
    const permissionGroups = [...new Set(permissionAvailable.map(permission => permission.group))];
    return await generateDatasetReport(dataset, permissionAvailable, permissionGroups)
  }
  catch (error) {
    log.error(error.stack);
    throw new Error('An unexpected issue occurred when generating user access list.');
  }
}

module.exports = { setLogger, getDatasetsForEntitlements, getPermissionsForClassifications, getUserAccessForDataset, generateUserList };
