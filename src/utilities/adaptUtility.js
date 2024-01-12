const datasetService = require('../services/datasetService');
const notificationService = require('../services/notificationService');
const permissionService = require('../services/permissionService');
const versionService = require('../services/versionService');
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  datasetService.setLogger(logger);
  notificationService.setLogger(logger);
  permissionService.setLogger(logger);
  versionService.setLogger(logger);
}

async function adaptLatestAvailableRecords() {
  const datasets = await datasetService.getLatestDatasets();
  const permissions = await permissionService.listAllForStatus(['AVAILABLE']);
  const latestAvailableDatasets = versionService.getLatestVersions(datasets);
  const latestAvailablePermissions = versionService.getLatestVersions(permissions);

  const datasetResponses = await Promise.all(latestAvailableDatasets.map(createDatasetResponse));
  const permissionResponses = await Promise.all(latestAvailablePermissions.map(createPermissionResponse));
  return [...datasetResponses, ...permissionResponses];
}

async function createDatasetResponse({id, name, version, updatedAt}) {
  return {
    dataset: id,
    version,
    notification: await notificationService.sendDatasetNotification(id, name, version, updatedAt)
  };
}

async function createPermissionResponse({id, version, updatedAt}) {
  return {
    permission: id,
    version,
    notification: await notificationService.sendPermissionNotification(id, version, updatedAt)
  };
}
module.exports = { setLogger, adaptLatestAvailableRecords }
