const _ = require('lodash');
const uuid = require('uuid');
const changeCase = require('change-case');
const accessUtility = require('../utilities/accessUtility');
const emailService = require('./emailService');
const notificationService = require('./notificationService');
const permissionApprovalService = require('./permissionApprovalService');
const permissionDao = require('../data/permissionDao');
const permissionModel = require('../model/permissionModel');
const referenceService = require('./referenceService');
const recordService = require('./recordService');
const remediationService = require('./remediationService');
const versionService = require('./versionService');
const { APPROVED, AVAILABLE, DELETED, PENDING, isApproved, isAvailable, NONDELETE_STATUSES, PROCESSING_STATUSES } = require('./statusService');
const viewService = require('./viewService');
let log = require('edl-node-log-wrapper');

function setLogger(logger) {
  log = logger;
  emailService.setLogger(logger);
  notificationService.setLogger(logger);
  permissionApprovalService.setLogger(logger);
  permissionDao.setLogger(logger);
  referenceService.setLogger(logger);
  remediationService.setLogger(logger);
  versionService.setLogger(logger);
  viewService.setLogger(logger);
}

function getIsoTime(time) { return new Date(time || Date.now()).toISOString(); }

function validateAndAddEntitlementIds(entitlements) {
  const uniqueEntitlements = accessUtility.getUniqueGovernance(entitlements);
  const withIds = uniqueEntitlements.map(entitlement => {
    return { ...entitlement, id: entitlement.id || uuid.v4() };
  }).filter(x => !!x.id);
  const ids = withIds.map(({ id }) => id);
  const unique = [...new Set(ids)];
  if (unique.length < withIds.length) {
    throw Error('Each entitlement must have a unique ID');
  }

  return withIds.map(entitlement => {
    if (!entitlement.additionalTags) return entitlement;
    const additionalTags = entitlement.additionalTags.map(tag => tag.trim()).filter(tag => tag.length);
    return { ...entitlement, additionalTags: [...new Set(additionalTags)] };
  });
}

function validateModel(permission) {
  const error = permissionModel.validate(permission);
  if (error) throw error;
}

const trimWhitespace = (name) => name.trim();

async function validateClientIdIsInOneGroup(newPermission) {
  const { clientId, id } = newPermission;
  const permissions = await permissionDao.getPermissions([AVAILABLE], undefined, [clientId]);

  const latestPermissions = [
    ...getActivePermissions(permissions).filter(permission => permission.id !== id),
    newPermission
  ];
  const groups = [...new Set(latestPermissions.map(permission => permission.group))];
  if (groups.length > 1) {
    const existingGroups = groups.filter(group => group !== newPermission.group);
    throw new Error(`Client id cannot be in multiple groups, ${clientId} is already a member of groups: ${existingGroups}`)
  }
}

async function validatePermission(permission) {
  validateModel(permission);
  if (permission.roleType === 'system') await validateClientIdIsInOneGroup(permission);
}

async function createCommentHistory(id, version, user, time, requestComments) {
  const currentPermission = await permissionDao.getPermission(id, version);
  const history = (currentPermission && currentPermission.commentHistory) ? currentPermission.commentHistory : [];
  const requestComment = { updatedBy: user, updatedAt: time || getIsoTime(), comment: requestComments || "No comments" };
  return [...history, requestComment];
}

async function savePermission(permission, user, time) {
  await validatePermission(permission);
  permission.name = trimWhitespace(permission.name);
  permission = recordService.addAuditFields(permission, user, time);
  permission.entitlements = validateAndAddEntitlementIds(permission.entitlements);
  const latest = await getLatestAvailablePermission(permission.id);
  if (!!latest && !!latest.lockedBy && latest.lockedBy !== user) throw Error(`Cannot save a permission that is locked by another user. Locked by ${permission.lockedBy}`);

  permission = await permissionApprovalService.addApprovals(permission, latest, (record) => record.entitlements || []);
  const { id, name, version, requestComments } = permission;
  permission.commentHistory = await createCommentHistory(id, version, user, time, requestComments);

  log.info(`saving permission id:${id} name: ${name} version:${version}`);

  permission = dereferenceValues({ ...permission });

  await save(permission);
  log.info(`saved permission id:${id}`);
  await emailService.sendEmails(
    [...new Set((permission.approvals || []).map(approval => approval.approverEmail))],
    'Permission Pending',
    permission,
    'approver',
    'permission'
  );
  if (isApproved(permission)) await notificationService.sendPermissionNotification(id, version, time);
  return { id, version };
}

function deferenceEntitlements(entitlements) {
  return entitlements ? entitlements.map(entitlement => referenceService.dereferenceIds(entitlement, ['community', 'subCommunity', 'gicp', 'countriesRepresented'])) : [];
}

function dereferenceApprovals(approvals = []) {
  return approvals.map(approval => {
    const refId = approval.subCommunity ? approval.subCommunity : approval.community
    const { id, name, approver } = refId ? referenceService.getValue(refId) : {};
    return {
      ...approval,
      ...(!approval.custodian && approval.subCommunity) ? { subCommunity: { id, name, approver } } : null,
      ...(!approval.custodian && approval.community) ? { community: { id, name, approver } } : null
    }
  });
}

function dereferenceValues(permission) {
  permission.entitlements = deferenceEntitlements(permission.entitlements);
  permission.approvals = dereferenceApprovals(permission.approvals);
  return permission;
}

function getActivePermissions(permissions) {
  return permissions.filter(perm => {
    let now = Date.now();
    let start = new Date(perm.startDate);
    let end = new Date(perm.endDate);
    return start.getTime() < now &&
      (!perm.endDate || (end.getTime() > now));
  });
}


function getAllPermissionVersions(id) {
  return permissionDao.getPermissionVersions(id);
}


async function getAliasedPermissions(id, statuses) {
  const permissions = await permissionDao.getPermissionVersions(id);
  const statusPermissions = permissions.filter(permission => statuses.includes(permission.status));

  if(!statusPermissions.length) throw new Error(`There are no permissions for id: ${id} that have status of ${statuses}`);
  return statusPermissions.sort((a,b)=>a.version-b.version);
}

async function getCurrentPermission(id, statuses) {
  const permissions = await getAliasedPermissions(id, statuses);
  return permissions[permissions.length - 1];
}

async function getPreviousPermission(id, statuses) {
  const permissions = await getAliasedPermissions(id, statuses);
  log.info('getPreviousPermission permissions count: ', permissions.length);
  if(permissions.length === 1) throw new Error(`There are no previous permissions for id: ${id} that have status of ${statuses}`);
  return permissions[permissions.length - 2];
}

function getVersionedPermission(id, version, statuses) {
  console.info('version: ', version);
  const formattedVersion = !Number(version) ? version.toLowerCase() : '';
  if(formattedVersion === 'latest') return getCurrentPermission(id, statuses);
  if(formattedVersion === 'previous') return getPreviousPermission(id, statuses);
  return permissionDao.getPermission(id, version);
}

async function getLatestAvailablePermission(id) {
  return permissionDao.getLatestPermission(id);
}

async function getPermission(id, version, statuses) {
  const permission = await (version ? getVersionedPermission(id, version, statuses) : getLatestAvailablePermission(id));
  const { views } = permission;
  if (views) {
    permission.views = await viewService.getViewsWithStatus(views);
  }
  return decorateWithName(permission);
}

function creatingNewVersion(existingVersion, newVersion) {
  return existingVersion !== newVersion;
}

async function updatePermission(id, version, permission, user, time) {
  log.info(`getting existing permission for ${id}@${version}`);
  const existingPermission = await permissionDao.getPermission(id, version);
  log.info('received existing permission');

  log.info(`getting all versions of permission ${id}`);
  const allVersions = await permissionDao.getPermissionVersions(id);
  log.info('received all versions permission');

  permission = recordService.mergeAuditFields(existingPermission, permission);
  versionService.allowedToUpdate(allVersions, permission, user, 'Permission');
  const newVersion = versionService.calculateVersion(allVersions, permission);

  if (creatingNewVersion(permission.version, newVersion)) {
    permission.createdBy = user;
    permission.createdAt = getIsoTime(time);
    permission.approvals.forEach(approval => approval.commentHistory = []);
    permission.commentHistory = [];
  }
  permission.version = newVersion;
  permission.status = PENDING;

  return savePermission(permission, user, time);
}

function updateReferenceData(updateRequest) {
  return permissionDao.updateReferenceData(updateRequest)
}

async function deletePermission(id, version, user, time) {
  const isoTime = getIsoTime(time);
  const existingPermission = await permissionDao.getPermission(id, version);
  const { createdBy, commentHistory: previousHistory, requestComments, status } = existingPermission;
  const requestComment = { updatedBy: user, updatedAt: isoTime, comment: requestComments };
  const commentHistory = [...(previousHistory || []), requestComment];

  if (user !== createdBy) throw new Error(`${user} is not authorized to delete permission`);

  const statusDoesNotPermitDeleting = [APPROVED, AVAILABLE].includes(status);
  if (statusDoesNotPermitDeleting) throw new Error(`Cannot delete a permission with a status of ${status}.`);

  return save({ ...existingPermission, commentHistory, status: DELETED, updatedAt: isoTime });
}

async function approvePermission(id, version, user, time = null, sendEmail = true) {
  log.info('Going to update permission approval:', id, version, user, sendEmail);
  const permission = await permissionDao.getPermission(id, version);
  const updatedPermission = await permissionApprovalService.approve(permission, user, time);
  await save(updatedPermission);

  if (sendEmail) {
    log.info('sending permission email for id : '+ id + ' and version : ' + version + ' and sendEmail flag is : ' + sendEmail)
    await emailService.sendEmails(
        [updatedPermission.updatedBy + '@deere.com'],
        `Permission ${changeCase.titleCase(updatedPermission.status)}`,
        updatedPermission,
        'requester',
        'Permission'
    );
  }

  if (isApproved(updatedPermission)) return notificationService.sendPermissionNotification(id, version, time, sendEmail);
}

async function rejectPermission(id, version, reason, user, time) {
  const permission = await permissionDao.getPermission(id, version);
  const updatedPermission = await permissionApprovalService.reject(permission, reason, user, time);

  await emailService.sendEmails(
    [updatedPermission.updatedBy + '@deere.com'],
    'Permission Rejected',
    updatedPermission,
    'requester',
    'Permission'
  );
  return save(updatedPermission);
}

const decorateWithName = perm => {
  return perm.name ? perm : {
    ...perm,
    name: ((perm.roleType === 'human' ? perm.group : perm.clientId) || 'Unknown') + ' Permission'
  }
};

const removeLegacyActions = perm => {
  return {
    ...perm,
    entitlements: (perm.entitlements || []).map(entitlement => {
      return {
        ...entitlement,
        actions: undefined
      }
    })
  };
}

async function save(permission) {
  const fullPermission = decorateWithName(permission);
  return permissionDao.savePermission(removeLegacyActions(fullPermission));
}

async function listAllForStatus(queryParams = {}) {
  const {
    name = '',
    onlyEffective = false,
    dateFilter = '',
    start = '',
    end = '',
    status = [AVAILABLE],
    group = [],
    clientId = [],
    roleType = ['human'],
    entitlements = []
  } = queryParams;
  if (entitlements.length) {
    return getPermissionsForEntitlements(entitlements);
  }
  const statuses = status && [].concat(status);
  const groups = group && [].concat(group);
  const clientIds = clientId && [].concat(clientId);
  const roleTypes = roleType && [].concat(roleType);

  const query = {
    roleTypes,
    ...(name && { name }),
    ...(dateFilter && { dateFilter }),
    ...(start && { start }),
    ...(end && { end }),
    ...(statuses.length && { statuses }),
    ...(groups.length && { groups }),
    ...(clientIds.length && { clientIds }),
  };
  const permissions = await getLatestPermissions(query);
  const relevant = onlyEffective === 'true' ? getActivePermissions(permissions) : permissions;
  return relevant.map(decorateWithName);
}

async function findAllForApproval(user, allPermissions) {
  const latest = allPermissions ? versionService.getLatestVersions(allPermissions) : (await getLatestPermissions({ statuses: PROCESSING_STATUSES }));
  const pendingRemediations = await remediationService.getPendingRemediations();
  const remediationPermissions = [...latest, ...pendingRemediations];
  return permissionApprovalService.getUserApprovals(remediationPermissions, user, 'Permission');
}

async function lockPermission(id, version, username) {
  const permission = await getLatestPermission(id, NONDELETE_STATUSES);
  if (version !== permission.version) throw new Error(`You can only lock the most recent non-deleted permission version. The latest version is ${permission.version}.`);
  if (!isAvailable(permission)) throw new Error('Only available permissions are lockable.');
  if (permission.lockedBy === username) return Promise.resolve();
  if (!!permission.lockedBy) throw new Error(`Cannot lock a permission that is already locked. Locked by ${permission.lockedBy}.`);
  log.debug('Going to update permission lock:', id, version, username);
  return await permissionDao.lockPermission(id, version, username);
}

async function unlockPermission(id, version, username) {
  const permission = await permissionDao.getPermission(id, version);
  if (permission.lockedBy !== username) throw new Error(`Cannot unlock another user's locked permission. Locked by ${permission.lockedBy}.`);
  log.debug('Going to update permission unlock:', id, version);
  return await permissionDao.unlockPermission(id, version);
}

function addViewStatusToPermission(permissions) {
  return Promise.all(permissions.map(async permission => {
    const { views } = permission;
    if (views) {
      permission.views = await viewService.getViewsWithStatus(views);
    }
    return permission;
  }));
}

async function searchForPermission(queryParams) {
  if (queryParams.dateFilter && !queryParams.start) throw new Error('Must include a "start" in query parameters along with "dateFilter".');
  const permissions = await listAllForStatus(queryParams);
  return addViewStatusToPermission(permissions);
}

async function getLatestPermissions(params) {
  return permissionDao.getLatestPermissions(params);
}

function getLatestPermission(id, statuses) {
  return permissionDao.getLatestPermission(id, statuses);
}

function getPermissionsForDatasetViews(views) {
  return views && views.length ? permissionDao.getPermissionsForDatasetViews(views) : [];
}

async function getPermissionsForEntitlements(entitlements) {
  const entitlementsPermissions = await Promise.all(entitlements.map(entitlement => {
  const [communityName, subCommunityName] = entitlement.split(',')
    return permissionDao.getPermissionsForEntitlements(communityName, subCommunityName);
  }));
  return _.flatten(entitlementsPermissions);
}


module.exports = {
  setLogger,
  savePermission,
  getAllPermissionVersions,
  getLatestPermissions,
  getLatestPermission,
  getPermission,
  updatePermission,
  updateReferenceData,
  deletePermission,
  approvePermission,
  rejectPermission,
  listAllForStatus,
  findAllForApproval,
  lockPermission,
  unlockPermission,
  searchForPermission,
  removeLegacyActions,
  getPermissionsForDatasetViews
};
