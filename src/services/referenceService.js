const collibraDao = require('../data/collibraDao');
const datasetDao = require('../data/datasetDao');
const referenceDao = require('../data/referenceDao');
const notificationService = require('./notificationService');
const permissionDao = require('../data/permissionDao');
const versionService = require('./versionService');
const { datasetsCollectionName, permissionsCollectionName } = require('../../conf').getConfig();
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  datasetDao.setLogger(logger);
  notificationService.setLogger(logger);
  permissionDao.setLogger(logger);
  referenceDao.setLogger(logger);
  versionService.setLogger(logger);
}
const getNameValue = ({ name, id, label }) => (label ? { name, id, label } : { name, id });
const getReferencesRequiredInfo = references => references.map(getNameValue)

function createCommunity(community) {
  return {
    ...community,
    subCommunities: collibraDao.getSubCommunities(community.id),
    approver: collibraDao.getApprover(community.id)
  }
}

function createSubCommunity(subCommunity) {
  return {
    ...subCommunity
    }
  }

function getAllReferenceData() {
  return {
    communities: getReferencesRequiredInfo(collibraDao.getCommunityNames()).map(createCommunity),
    countries: getReferencesRequiredInfo(collibraDao.getCountryCodes()),
    businessValues: getReferencesRequiredInfo(collibraDao.getBusinessValues()),
    categories: getReferencesRequiredInfo(collibraDao.getCategories()),
    phases: getReferencesRequiredInfo(collibraDao.getPhases()).filter(phase => ['raw', 'enhance', 'model'].includes(phase.name.toLowerCase())),
    technologies: getReferencesRequiredInfo(collibraDao.getTechnologies()),
    physicalLocations: getReferencesRequiredInfo(collibraDao.getPhysicalLocations()),
    gicp: getReferencesRequiredInfo(collibraDao.getGicp())
  };
}

async function sendDatasetNotifications(referenceId) {
  const latestAvailableDatasets = versionService.getLatestVersions(await datasetDao.getDatasets());
  const datasets = latestAvailableDatasets.filter(dataset => JSON.stringify(dataset).includes(referenceId));
  if (!datasets.length) return [];
  return Promise.all(datasets.map(({ id, name, version }) => notificationService.sendDatasetNotification(id, name, version, getIsoDatetime(), false)));
}

async function sendPermissionNotifications(referenceId) {
  const latestAvailablePermissions = versionService.getLatestVersions(await permissionDao.getPermissions());
  const permissions = latestAvailablePermissions.filter(permission => JSON.stringify(permission).includes(referenceId));
  if (!permissions.length) return [];
  return Promise.all(permissions.map(({ id, version }) => notificationService.sendPermissionNotification(id, version, getIsoDatetime(), false)));
}

async function updateReferences(referenceId) {
  const permissionNotifications = await sendPermissionNotifications(referenceId);
  const datasetNotifications = await sendDatasetNotifications(referenceId);
  return permissionNotifications.length || datasetNotifications.length ? [...permissionNotifications, ...datasetNotifications] : '';
}

function getIsoDatetime() {
  return new Date().toISOString();
}

function flattenedAllReferenceData() {
  const referenceData = getAllReferenceData();
  const referenceEntries = Object.entries(referenceData).map(e => e[1]);
  let flattened = referenceEntries.reduce((acc, e) => acc.concat(e), []);
  const flattenedSubComms = flattened
    .filter(f => !!f.subCommunities)
    .map(f => f.subCommunities.map(createSubCommunity))
    .reduce((a, b) => a.concat(b), []);
  return flattened.concat(flattenedSubComms);
}

function getValueFromReferences(id, referenceData) {
  const reference = referenceData.find(r => r.id === id);
  return reference ? reference : { id, name: 'Not Found', label: 'Not Found', approver: null };
}

function isId(id) {
  return typeof id === 'string'
}

function getValue(id) {
  if (isId(id)) {
    const referenceData = flattenedAllReferenceData();
    return getValueFromReferences(id, referenceData);
  }
  return id ? id : { id, name: 'Not Found', label: 'Not Found', approver: null };
}

function getName(id) {
  if (isId(id)) {
    return (getValue(id)).name;
  }
  return id ? id : { id, name: 'Not Found', label: 'Not Found', approver: null };
}

function getNameFromReferences(id, referenceData) {
  return getValueFromReferences(id, referenceData).name;
}

function getLabelFromReferences(id, referenceData) {
  return getValueFromReferences(id, referenceData).label;
}

function dereferenceId(fieldName, fieldValue, idFields, referenceData = flattenedAllReferenceData()) {
  if (idFields.includes(fieldName)) {
    if (Array.isArray(fieldValue)) {
      return fieldValue.map(value => {
        const label = getLabelFromReferences(value, referenceData);
        return {
          id: value,
          name: getNameFromReferences(value, referenceData),
          ...label && { label }
        };
      });
    } else {
      const label = getLabelFromReferences(fieldValue, referenceData);
      return {
        id: fieldValue,
        name: getNameFromReferences(fieldValue, referenceData),
        ...label && { label }
      };
    }
  } else {
    return fieldValue;
  }
}

function dereferenceIds(obj, idFields) {
  const referenceData = flattenedAllReferenceData();
  const result = {};
  Object.keys(obj).forEach(field => result[field] = dereferenceId(field, obj[field], idFields, referenceData));
  return result;
}

function getId(referenceField, value, subfield, subValue) {
  const references = getAllReferenceData();
  const foundRef = references[referenceField].find(ref => ref.name === value);
  if (!foundRef) throw new Error(`Could not find reference for ${referenceField}`);
  if (!subfield) return foundRef.id;
  const subRef = foundRef[subfield].find(ref => ref.name === subValue);
  if (!subRef) throw new Error(`Could not find reference for ${subfield}`);
  return subRef.id;
}

function getIds(referenceField, array, subfield, subValue) {
  return array.map(value => getId(referenceField, value, subfield, subValue));
}

function dereferenceApprovals(approvals = []) {
  return approvals.map(approval => {
    const { subCommunity = '', community = '', custodian = '' } = approval;
    const { id, name, approver } = getValue(subCommunity || community);
    return {
      ...approval,
      ...(!custodian && subCommunity) && { subCommunity: { id, name, approver } },
      ...(!custodian && community) && { community: { id, name, approver } }
    }
  });
}

async function updateCommunity(updateRequest) {
  const { id } = updateRequest;
  const community = collibraDao.getCommunity(id);
  if (!community) throw new Error(`community does not exist: ${id}`);

  const daoRequest = { ...updateRequest, name: community.name };
  const permissionUpdates = referenceDao.updateCommunity(permissionsCollectionName, daoRequest);
  const datasetUpdates = referenceDao.updateCommunity(datasetsCollectionName, daoRequest);
  await Promise.all([permissionUpdates, datasetUpdates]);

  return updateReferences(id);
}

function validateUpdateSubCommunityRequest({ currentSubCommunityId, newSubCommunityId }) {
  if (!collibraDao.hasSubCommunity(currentSubCommunityId)) throw new Error(`subCommunity does not exist: ${currentSubCommunityId}`);
  if (!collibraDao.hasSubCommunity(newSubCommunityId)) throw new Error(`subCommunity does not exist: ${newSubCommunityId}`);
}

function createDaoMoveRequest({ currentSubCommunityId, newSubCommunityId }) {
  const { name: newSubCommunityName, communityId: newCommunityId } = collibraDao.getSubCommunityFromId(newSubCommunityId);
  const newCommunity = collibraDao.getCommunity(newCommunityId);
  if (!newCommunity) throw new Error(`community does not exist: ${newCommunityId}`);
  const { name: newCommunityName } = newCommunity;

  return { currentSubCommunityId, newCommunityId, newCommunityName, newSubCommunityId, newSubCommunityName };
}

async function updateSubCommunity(moveRequest) {
  const updateRequest = moveRequest.newSubCommunityId ? moveRequest : { ...moveRequest, newSubCommunityId: moveRequest.currentSubCommunityId };
  validateUpdateSubCommunityRequest(updateRequest);

  const daoMoveRequest = createDaoMoveRequest(updateRequest);
  const permissionMove = referenceDao.updateSubCommunity(permissionsCollectionName, daoMoveRequest);
  const datasetMove = referenceDao.updateSubCommunity(datasetsCollectionName, daoMoveRequest);
  await Promise.all([permissionMove, datasetMove]);

  return updateReferences(moveRequest.newSubCommunityId || moveRequest.currentSubCommunityId);
}

module.exports = {
  setLogger,
  getAllReferenceData,
  updateReferences,
  getName,
  getValue,
  dereferenceId,
  dereferenceIds,
  getId,
  getIds,
  dereferenceApprovals,
  updateCommunity,
  updateSubCommunity
};
