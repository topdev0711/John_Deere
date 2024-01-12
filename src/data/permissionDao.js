const documentDao = require('./documentDao');
let log = require('edl-node-log-wrapper');
const { permissionsCollectionName } = require('../../conf').getConfig();

function setLogger(logger) {
  log = logger;
  documentDao.setLogger(logger);
}

function savePermission(permission) {
  return documentDao.putRecord(permissionsCollectionName, permission);
}

async function getPermissions(statuses, groups, clientIds) {
  const query = {
    ...(statuses && statuses.length && { statuses }),
    ...(groups && groups.length && { groups }),
    ...(clientIds && clientIds.length && { clientIds }),
  };
  const permissions = await documentDao.getLatestRecords(permissionsCollectionName, query);
  return permissions;
}

async function getPermission(id, version) {
  const permission = await documentDao.searchByIdAndVersion(permissionsCollectionName, id, version);
  return permission;
}

async function getPermissionVersions(id) {
  const permissions = await documentDao.getVersions(permissionsCollectionName, id);
  return permissions;
}

function lockPermission(id, version, username) {
  return documentDao.updatePropertyForId(permissionsCollectionName, id, 'lockedBy', username, version);
}

function unlockPermission(id, version) {
  return documentDao.updatePropertyForId(permissionsCollectionName, id, 'lockedBy', null, version);
}

function getLatestPermissions(params) {
  return documentDao.getLatestRecords(permissionsCollectionName, params);
}

async function getLatestPermission(id, statuses) {
  return await documentDao.getLatestRecord(permissionsCollectionName, id, statuses);
}

async function getPermissionsForDatasetViews(views) {
  const permissions = await documentDao.getPermissionsForViews(permissionsCollectionName, views);
  return permissions;
}

function updateReferenceData(updateRequest){
  return documentDao.updateReferenceData(permissionsCollectionName, updateRequest)
}

function getPermissionsForEntitlements(communityName, subCommunityName){
  return documentDao.getPermissionsForEntitlements(permissionsCollectionName, communityName, subCommunityName);
}

module.exports = {
  setLogger,
  getLatestPermission,
  getLatestPermissions,
  getPermissions,
  getPermission,
  getPermissionVersions,
  lockPermission,
  savePermission,
  unlockPermission,
  getPermissionsForDatasetViews,
  getPermissionsForEntitlements,
  updateReferenceData
};
