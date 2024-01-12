const conf = require('../../conf');
const referenceService = require('./referenceService');
const schemaDao = require('../data/schemaDao');
const { APPROVED, AVAILABLE, DELETED, PENDING, PENDING_DELETE, REJECTED, isApproved, isPending, isPendingDelete,
  isRejected, isDeleted, isAvailable} = require('./statusService');
const viewService = require('../services/viewService');
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  referenceService.setLogger(logger);
  schemaDao.setLogger(logger);
  viewService.setLogger(logger);
};

const secondsInDay = 24 * 60 * 60;

function getIsoDatetime() {
  return new Date().toISOString();
}

function getEdlApprovals(record) {
  return record.approvals.filter(approval => approval.system === 'EDL');
}

function hasEdlApproval(record) {
  return getEdlApprovals(record).length > 0;
}

function getApproverByType(approval) {
  if (approval.custodian) return approval.custodian
  else if (approval.subCommunity) return approval.subCommunity.approver
  else if (approval.community) return approval.community.approver
  else if (approval.owner) return approval.owner;
}

function getLatestPendingUserApprovals(latestRelevantRecords, user, type) {
  return latestRelevantRecords.reduce((acc, record) => {
    const pendingApprovals =  record.approvals.filter(approval => isPending(approval) && !approval.system);
    const approvers = pendingApprovals.map(getApproverByType);

    const owner = pendingApprovals.find(approval => approval.owner);
    const caseInsensativeGroups = user.groups.map(group => group.toLowerCase());

    const loggedInUserIsPendingApprover = !!approvers.find(approver => !!approver && caseInsensativeGroups.includes(approver.toLowerCase()));
    const loggedInUserIsCreator = record.createdBy === user.username;
    const loggedInUserIsOwner = owner && owner.approverEmail && owner.approverEmail.toLowerCase().includes(user.username.toLowerCase());
    const isUserApproval = (loggedInUserIsPendingApprover && isPending(record)) || loggedInUserIsCreator || loggedInUserIsOwner;
    const newRecord = { ...record, type, loggedInUserIsCreator, loggedInUserIsPendingApprover, loggedInUserIsOwner };
    return isUserApproval ? [ ...acc, newRecord] : acc;
  }, []);
}

function compareCreationTime(a,b) {
  const createdA = new Date(a.createdAt);
  const createdB = new Date(b.createdAt);
  if (createdA < createdB) return -1;
  if (createdA > createdB) return 1;
  return 0;
}

async function getUserApprovals(latestRelevantRecords, user, type) {
  try {
    const referenceCache = await conf.getRedisCacheManager(secondsInDay);
    const cachedApprovals = await referenceCache.get(`${user.username+type}approvals`);
    if(cachedApprovals) return cachedApprovals;
    if(!user.groups) return [];

    const approvals = getLatestPendingUserApprovals(latestRelevantRecords, user, type);
    const sortedApprovals = approvals.sort(compareCreationTime);
    await referenceCache.set(`${user.username}approvals`, sortedApprovals);
    return sortedApprovals;
  } catch (e) {
    log.error(e.stack);
    throw new Error('Failed to get user approvals');
  }
}

function getUserApprovalObjects(user, approvals, communities, subCommunities) {
  const { groups: userGroups, username } = user
  return approvals.filter(approval => {
    const { subCommunity = '', community = '', custodian = '', owner = '', approverEmail = '' } = approval;
    let steward = { approver: '' };
    if(subCommunity) {
      steward = subCommunities.find(subCommunity => subCommunity.id === approval.subCommunity.id);
    } else if (community) {
      steward = communities.find(community => community.id === approval.community.id);
    } else if (custodian) {
      steward.approver = custodian;
    } else if (owner) {
      steward.approver = approverEmail;
    }
    return (!!steward.approver && userGroups.map(group => group.toLowerCase()).includes(steward.approver.toLowerCase())) || (owner && steward.approver.includes(username));
  });
}

function setApprovalsStatus(status, userApprovals, username, reason) {
  const updatedAt =  getIsoDatetime();
  userApprovals.forEach(approval => {
    approval.approvedBy = username;
    approval.status = status;
    approval.updatedAt = updatedAt;
    if (reason) approval.reason = reason;

    const comment =  { status,  updatedBy: username,  updatedAt, ...(reason && { comment: reason }) };
    approval.commentHistory = [...(approval.commentHistory || []), comment];
  });
}

function allCommunitiesApproved(record) {
  return record.approvals.filter(approval => !approval.system).every(isApproved);
}

function anyCommunitiesRejected(record) {
  return record.approvals.filter(approval => !approval.system ).some(isRejected);
}

function createSystemApproval() {
  return {
    "system": "EDL",
    "status": PENDING,
    "details": null,
    "approvedBy": null,
    "updatedAt": null,
    "commentHistory": []
  };
}

function createAutoApproval() {
  const commentHistory = [{
    status: APPROVED,
    updatedBy: 'catalog',
    updatedAt: getIsoDatetime(),
    comment: 'auto approved'
  }];
  return { ...createSystemApproval(), status: PENDING, commentHistory };
}

function addEDLApproval(record) {
  if(isApproved(record) && !hasEdlApproval(record)) {
    record.approvals.push(createSystemApproval());
  }
  return record;
}

const pendingApprove = () => ({ approvedBy: null, status: PENDING, comment: null, updatedAt: null});
const deerEmail = approver => `${approver.replace(/\s/g, '')}@JohnDeere.com`;

function createCustodianApproval(record) {
  const custodian = record.group ? record.group: record.custodian;
  const previousApproval = findPreviousApproval(record, 'custodian');
  const commentHistory = previousApproval && previousApproval.commentHistory ? previousApproval.commentHistory : [];
  return { ...pendingApprove(), custodian, approverEmail: deerEmail(custodian), commentHistory };
}

function getCatalogApproval(record) {
  const catalogApproval = record.approvals.find(approval => approval.system === 'Catalog');
  return !!catalogApproval ? catalogApproval : {status: ''};
}

async function setEdlApprovalStatus(record, details, user, status, reason, approvedState) {
  const catalogStatus = getCatalogApproval(record).status;
  const edlApprovals = getEdlApprovals(record);
  edlApprovals.map(approval => {
    approval.status = status;
    isRejected(status) ? approval.reason = reason : approval.details = details;
    approval.approvedBy = user.username;
    approval.updatedAt = getIsoDatetime();
  });

  if(isPendingDelete(catalogStatus) && approvedState && isApproved(status)) {
    record.status = DELETED;
  } else {
    record.status = isRejected(status) ? status : AVAILABLE;
  }
  if (isAvailable(record) && (details || {}).dataset) {
    const { dataset, schemas } = details;
    setDatasetProperties(record, dataset);
    setTableProperties(record, schemas);
    await setSchemaEnvironmentName(schemas);
  }
}

function setDatasetProperties(record, dataset) {
  const { name, values } = dataset;
  record.environmentName = name;
  values.forEach(item => {
    const { name, value } = item;
    if (name === 'S3 Bucket Name') {
      record.storageLocation = value;
    } else if (name === 'Account') {
      record.storageAccount = value;
    }
  });
}

function setTableProperties(record, schemas) {
  schemas.forEach(schema => {
    const { id, name, values } = schema;
    const schemaId = id.split('--')[0];
    const tableForSchema = record.tables.find(table => table.schemaId.startsWith(schemaId));
    if (tableForSchema) {
      tableForSchema.schemaEnvironmentName = name;
      tableForSchema.versionless = false;
      const databricksTables = values.filter(item => item.name === 'Databricks Table');
      if (databricksTables.length > 1) {
        tableForSchema.versionless = true;
      }
    }
  });
}

async function setSchemaEnvironmentName(schemas) {
  await Promise.all(schemas.map(async schema => {
    const s3Schema = await schemaDao.getSchema(schema.id);
    s3Schema.environmentName = schema.name.split('@')[0];
    s3Schema.version = schema.name.split('@')[1];
    await schemaDao.saveSchema(s3Schema);
  }));
}

function isEdl(user) {
  return user.username === 'EDL';
}

async function getDatasetsForViews(views) {
  let datasetsForViews = [];
  await Promise.all(views.map(async view => {
    const datasetsForView = await viewService.getFullDatasetsForView(view);
    datasetsForViews = [...datasetsForViews, ...datasetsForView];
    return;
  }));
  return datasetsForViews;
}

function findApprovalUpdateError(user, userApprovals, recordStatus, updatedStatus) {
  let errorMessage;
  if (userApprovals.length === 0 && !isEdl(user)) {
    errorMessage = `user ${user.username} is not authorized to change approval`;
  } else if (isRejected(recordStatus) || isDeleted(recordStatus)) {
    errorMessage = `Cannot edit when in a ${recordStatus} status.`;
  } else if (!isEdl(user) && isRejected(updatedStatus) && userApprovals.every(isApproved)) {
    errorMessage = 'Cannot reject since this has already been approved.';
  } else if (isEdl(user) && ![APPROVED, AVAILABLE].includes(recordStatus)) {
    errorMessage = 'EDL cannot approve since this record is awaiting approvals.';
  }
  return errorMessage;
}

function getApprovalsForType(record, type) {
  return record.approvals.reduce((acc, approval) => approval[type] ? [ ...acc, approval[type] ] : acc, []);
}

async function updateApprovals(record, status, user, reason, details) {
  record.approvals = record.approvals || [];
  const communities = getApprovalsForType(record, 'community');
  const subCommunities = getApprovalsForType(record, 'subCommunity');
  const dataStewardApprovals = record.approvals.filter(approval => !approval.system);
  const userApprovals = isEdl(user) ? getEdlApprovals(record) : getUserApprovalObjects(user, dataStewardApprovals, communities, subCommunities);
  const errorMessage = findApprovalUpdateError(user, userApprovals, record.status, status);

  if (errorMessage) throw new Error(errorMessage);

  const awaitingApprovals = userApprovals.filter(approval => !isApproved(approval));
  record = { ...record };
  setApprovalsStatus(status, awaitingApprovals, user.username, reason);
  const allApproved = allCommunitiesApproved(record);
  const isRemediation = !record.version;
  const anyRejected = anyCommunitiesRejected(record);
  if ((isRemediation && allApproved) || (allApproved && !isRemediation)) record.status = APPROVED;
  if (anyRejected) record.status = REJECTED;
  if (!isRemediation) addEDLApproval(record);

  if(isEdl(user)) {
    await setEdlApprovalStatus(record, details, user, status, reason, allApproved && !anyRejected);
  }
  return record;
}

async function approve(record, user, details) {
  return updateApprovals(record, APPROVED, user, 'user approved', details);
}

function reject(record, reason, user){
  return updateApprovals(record, REJECTED, user, reason, undefined);
}

function isDereferenced(item) {
  return typeof item !== 'string';
}

function getGovernanceIds(record, getGovernanceTags, type) {
  if(!record) return [];
  const tags = getGovernanceTags(record);
  return tags.map(tag => tag[type] && isDereferenced(tag[type]) ? tag[type].id : tag[type]);
}

async function getCurrentGovernanceIds(record, getGovernanceTags, type) {
  if(!record) return [];
  const hasGovernance = getGovernanceTags(record)?.length;
  const hasCurrent = !record.views || (hasGovernance);
  const currentIds = hasCurrent ? getGovernanceIds(record, getGovernanceTags, type) : [];
  const hasViews = record.views && record.views.length;
  if (!hasViews) return currentIds;
  const datasetsForViews = await getDatasetsForViews(record.views);

  const getClassificationId = dataset => dataset.classifications.map(c => c[type].id);
  const viewIds = datasetsForViews.flatMap(getClassificationId);
  return [...currentIds, ...viewIds];
}

async function getApprovalIds(record, latestAvailable, getGovernanceTags, type) {
  const previousIds = getGovernanceIds(latestAvailable, getGovernanceTags, type);
  const currentIds = await getCurrentGovernanceIds(record, getGovernanceTags, type);
  return [...new Set([...previousIds, ...currentIds])];
}

async function addApprovals(record, latestAvailable, getGovernanceTags) {
  const communityIds = await getApprovalIds(record, latestAvailable, getGovernanceTags, 'community');
  const subCommunityIds = await getApprovalIds(record, latestAvailable, getGovernanceTags, 'subCommunity');
  const approvals = await buildApprovals(record, communityIds, subCommunityIds);
  return { ...record, approvals };
}

const pendingDelete = () => ({
  system: 'Catalog',
  status: PENDING_DELETE,
  updatedAt: getIsoDatetime()
});

async function addApprovalsForDelete(record, getGovernanceTags = record => record.classifications) {
  const baseApprovals = await addApprovals(record, undefined, getGovernanceTags);
  const approvals =  [...baseApprovals.approvals, pendingDelete() ];
  return {...record, ...{approvals} };
}

const isDatasetCommunityApproval = (approval, communityType, id) => (approval[communityType] === id);
const isPermissionCommunityApproval = (approval, communityType, id) => (approval[communityType].id === id);
const isCommunityApproval = (approval, communityType, id) => (isDatasetCommunityApproval(approval, communityType, id) || isPermissionCommunityApproval(approval, communityType, id));

function createCommunityApproval(previousApprovals, communityType, id) {
  const approver = referenceService.getValue(id).approver;
  const previousApproval = previousApprovals && previousApprovals.find(approval => isCommunityApproval(approval, communityType, id));
  const commentHistory = previousApproval && previousApproval.commentHistory ? previousApproval.commentHistory : []
  return {...pendingApprove(), approverEmail: deerEmail(approver), [communityType]: id, commentHistory};
}

function createCommunityApprovals(communityId, subCommunityIds, record) {
  const prevCommunityApprovals = record && record.approvals ? record.approvals.filter(({ community }) => community): [];
  const prevSubCommunityApprovals = record && record.approvals ? record.approvals.filter(({ subCommunity }) => subCommunity): [];

  const subCommunityList = referenceService.getValue(communityId).subCommunities;
  const subCommunities = subCommunityList ? subCommunityList.filter(({ id }) => subCommunityIds.includes(id)) : [];
  const subCommunitiesWithApprove = subCommunities.filter(({ approver }) => approver)
  const isCommunityApproval = !subCommunitiesWithApprove.length;
  const communityApproval = isCommunityApproval ? [createCommunityApproval(prevCommunityApprovals, 'community', communityId)] : [];
  const subCommunityApprovals = subCommunitiesWithApprove.map(({ id }) => createCommunityApproval(prevSubCommunityApprovals, 'subCommunity', id));
  return [ ...communityApproval, ...subCommunityApprovals];
}

function findPreviousApproval(record, searchKey) {
  return record && record.approvals && record.approvals.find(prevApproval => prevApproval[searchKey]);
}

async function buildApprovals(record, communityIds, subCommunityIds) {
  const communityApprovals = communityIds.flatMap(id => createCommunityApprovals(id, subCommunityIds, record));
  const custodianApproval = createCustodianApproval(record);
  return [...communityApprovals, custodianApproval].filter(approval => approval);
}

const isValidEmail = approval => approval.approverEmail !== 'undefined@JohnDeere.com';
const getNonCustodianApprovals = approvals => approvals.filter(isValidEmail);

module.exports = {
  setLogger,
  addApprovals,
  addApprovalsForDelete,
  createAutoApproval,
  addEDLApproval,
  approve,
  reject,
  findPreviousApproval,
  getUserApprovals,
  pendingApprove,
  getNonCustodianApprovals
};
