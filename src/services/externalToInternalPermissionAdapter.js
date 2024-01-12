const catalogReferenceService = require('./catalogReferenceService');
const externalAdapterCommon = require('./externalAdapterCommon');
const permissionModel = require('../model/permissionModel');
const permissionService = require('./permissionService');
let log = require('edl-node-log-wrapper');

const {cleanNewExternal, cleanUpdatedExternal, getCreationInfo} = externalAdapterCommon;
const setLogger = logger => {
  log = logger;
  catalogReferenceService.setLogger(logger);
  externalAdapterCommon.setLogger(logger);
  permissionService.setLogger(logger);
}

function validatePermission(permission) {
  const error = permissionModel.validate(permission);
  if (error) throw error;
}

async function createReferencedPermission(permission) {
  validatePermission(permission);
  log.info('getting entitlement references');
  const entitlements =  permission.entitlements.map(catalogReferenceService.getReferencedPermissionEntitlement);
  log.info('received entitlement references');
  return {...permission, entitlements};
}

async function adaptNewPermission(permission) {
  const cleanedPermission = cleanNewExternal(permission);
  return createReferencedPermission(cleanedPermission);
}

async function adaptExistingPermission(id, permission, user) {
  const cleanedPermission = cleanUpdatedExternal(permission);
  const latest = await permissionService.getLatestPermission(id, ['AVAILABLE', 'PENDING', 'APPROVED', 'REJECTED']);
  const creationInfo = await getCreationInfo(latest, id, user, 'permission that can be updated');
  const versionedPermission = { ...cleanedPermission, id, ...creationInfo};
  return createReferencedPermission(versionedPermission);
}

module.exports = { setLogger, adaptNewPermission, adaptExistingPermission };
