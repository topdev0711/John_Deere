const activeDirectoryDao = require('../data/ldap/activeDirectoryDao');
const approvalService = require('./approvalService');
const conf = require('../../conf');
const { APPROVED } = require('./statusService');
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  activeDirectoryDao.setLogger(logger);
  approvalService.setLogger(logger);
}

const autoApproveOwner = approvedBy => (
  {
    approvedBy,
    status: APPROVED,
    comment: 'Auto approved by group owner submission.',
    reason: 'Auto approved by group owner submission.',
    updatedAt: new Date().toISOString()
  }
);

const autoComment = ({ approvedBy: updatedBy, status, reason, updatedAt }) => ({ status, updatedBy, updatedAt, comment: reason });

function parseOwnerInfo(owners, attr, delimiter) {
  const parseItem = Object.keys(owners).reduce((aggregate, owner) => aggregate + owners[owner][attr] + delimiter, '');
  return parseItem.substr(0, parseItem.length - 1);
}

async function addOwnerAndBackupOwnerApproval(record) {
  try {
    const { group, updatedBy } = record;
    const owners = await activeDirectoryDao.findOwners(group);
    const owner = parseOwnerInfo(owners, 'name', '/');
    const approverEmail = parseOwnerInfo(owners, 'email', ',');
    const isOwner = Object.keys(owners).some(owner => owners[owner].username === updatedBy);
    const isAutoApproved = isOwner || conf.getEnv() !== 'prod';
    if (isAutoApproved) log.info(`record ${record.id} has been auto approved`);
    const updatedFields = isAutoApproved ? autoApproveOwner(updatedBy) : approvalService.pendingApprove();

    const previousApproval = approvalService.findPreviousApproval(record, 'owner');
    const previousComments = previousApproval && previousApproval.commentHistory ? previousApproval.commentHistory : [];
    const commentHistory = isAutoApproved ? [...previousComments, autoComment(updatedFields)] : previousComments;

    return { ...updatedFields, owner, approverEmail, commentHistory };
  } catch (error) {
    log.error('LDAP Error:', error);
    throw error;
  }
}

const autoApprove = (permission, nonCustodianApprovals) => {
  const approvals = [...nonCustodianApprovals, autoApproveEDL()];
  const permissionStatus = APPROVED;
  return { ...permission, approvals, status: permissionStatus };
}

const autoApproveEDL = () => (
  {
    approvedBy: 'EDL',
    system: "EDL",
    status: "APPROVED",
    details: 'Auto approved permission expiration because group no longer exists',
    commentHistory: [{
      status: "APPROVED",
      updatedBy: "EDL",
      comment: 'Auto approved permission expiration because group no longer exists.',
      updatedAt: new Date().toISOString()
    }],
    updatedAt: new Date().toISOString()
  }
);

const isAutoApproved = permission => {
  const { requestComments, updatedBy } = permission;
  const bypassComment = 'EDL Auto Approved - Invalid Permission';
  const devClient = '0oay8xbj7krMjUFds0h7';
  const prodCleint = '0oahvcmmsoqBLlVXh1t7';
  return requestComments === bypassComment && (updatedBy === devClient || updatedBy === prodCleint);
}

async function addApprovals(record, latestAvailable, getGovernanceTags) {
  const updatedRecord = await approvalService.addApprovals(record, latestAvailable, getGovernanceTags);
  const nonCustodianApprovals = updatedRecord.approvals.filter(approval => !approval.custodian);
  if (isAutoApproved(updatedRecord)) return autoApprove(updatedRecord, nonCustodianApprovals);
  else {
    const ownerApproval = await addOwnerAndBackupOwnerApproval(record);
    const approvals = [...nonCustodianApprovals, ownerApproval];
    return { ...updatedRecord, approvals };
  }
}

function approve(record, user, details) {
  return approvalService.approve(record, user, details);
}

function reject(record, reason, user) {
  return approvalService.reject(record, reason, user);
}

function getUserApprovals(latestRelevantRecords, user, type) {
  return approvalService.getUserApprovals(latestRelevantRecords, user, type);
}

module.exports = { setLogger, approve, reject, getUserApprovals, addApprovals }
