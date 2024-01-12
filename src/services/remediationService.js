const _ = require('lodash');
const approvalService = require('./approvalService');
const datasetDao = require('../data/datasetDao');
const datasetService = require('./datasetService');
const emailService = require('./emailService');
const metastoreDao = require('../data/metastoreDao');
const referenceService = require('./referenceService');
const remediationDao = require('../data/remediationDao');
const viewService = require('./viewService');
const { getConfig } = require('../../conf');
const changeCase = require('change-case');
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  approvalService.setLogger(logger);
  datasetDao.setLogger(logger);
  datasetService.setLogger(logger);
  emailService.setLogger(logger);
  metastoreDao.setLogger(logger);
  referenceService.setLogger(logger);
  remediationDao.setLogger(logger);
  viewService.setLogger(logger);
}

const nonDeletedStatuses = ['AVAILABLE', 'PENDING', 'APPROVED', 'REJECTED'];

function getIsoDate() {
  return new Date().toISOString();
}

function getCommunityIds(approvals) {
  return  approvals.map( approval => approval.community ? approval.community : referenceService.getValue(approval.subCommunity).communityId);
}

function isToggledCommunities(communityIds) {
  log.debug('Checking toggle for communities IDs : ', communityIds);
  const toggledCommunityIds = getConfig().viewRemediationCommunitiesToggle;
  log.debug('Toggle communities IDs : ', toggledCommunityIds);
  return communityIds.every( communityId => toggledCommunityIds.includes(communityId));
}

async function getCommunitiesChanges(approvals, nonCustodianApprovals) {
    const currentCommunityIds = approvals.map( approval => approval.community ? approval.community.id : referenceService.getValue(approval.subCommunity.id).communityId);
    const newCommunityIds = nonCustodianApprovals.map(approval => approval.community);
    const addedCommunityIds = _.difference(newCommunityIds, currentCommunityIds);
    const removedCommunityIds = _.difference(currentCommunityIds, newCommunityIds);
    const hasChange = addedCommunityIds.length || removedCommunityIds.length;
    return {hasChange, addedCommunityIds, removedCommunityIds};
}

async function saveNewRemediation(driftedViewName, nonCustodianApprovals) {

  const remediation = {
    name: driftedViewName,
    createdBy: 'a900450',
    createdAt: getIsoDate(),
    approvals: referenceService.dereferenceApprovals(nonCustodianApprovals),
    status: 'PENDING',
    updatedAt: getIsoDate(),
    updatedBy: 'a900450',
    emailSent: true
  };
  await remediationDao.saveRemediation(remediation);
  return remediation;
}

function createRemainingPendingApprovals(remediation, removedCommunityIds) {
  const remainingApprovals = remediation.approvals.filter( approval => {
    const communityId = approval.community ? approval.community.id : referenceService.getValue(approval.subCommunity.id).communityId;
    return !removedCommunityIds.includes(communityId);
  });
  return remainingApprovals.map( approval => {
    if(approval.status === 'REJECTED') {
      return {...approval, status: 'PENDING'};
    } else {
      return approval;
    }
  });
}

async function updateRemediation(remediation, nonCustodianApprovals, communitiesChanges) {
  log.debug('Remediation before update... ', JSON.stringify(remediation, null, 2));
  const {addedCommunityIds, removedCommunityIds} = communitiesChanges;
  log.debug('Newly added communities...', addedCommunityIds);
  log.debug('Removed communities...', removedCommunityIds);
  const approvalsToBeAdded = nonCustodianApprovals.filter( approval => addedCommunityIds.includes(approval.community));
  const remainingPendingApprovals = createRemainingPendingApprovals(remediation, removedCommunityIds);
  const newlyAddedApprovals = referenceService.dereferenceApprovals(approvalsToBeAdded);
  const updatedApprovals = [...remainingPendingApprovals, ...newlyAddedApprovals];
  const status = updatedApprovals.every(({status}) => status === 'APPROVED') ? 'APPROVED' : 'PENDING';
  const updatedRemediation = {
    ...remediation,
    approvals: updatedApprovals,
    updatedAt: getIsoDate(),
    status
  };

  log.debug('Saving updated remediation...', JSON.stringify(updatedRemediation, null, 2));
  await remediationDao.saveRemediation(updatedRemediation);
  if(status === 'APPROVED') await processApprovedViewDrift(updatedRemediation.name);

  // Didn't remove the send email logic from update because we want to control the capability to send emails in the future
  // based in emailSent flag
  if (typeof remediation?.emailSent !== 'undefined' && remediation?.emailSent !== true) {
    await sendRemediationEmails(approvalsToBeAdded, remediation);
  }

  return updatedRemediation;
}

async function sendRemediationEmails(approvals, remediation) {
  await emailService.sendEmails(
    [...new Set((approvals || []).map(approval => approval.approverEmail))],
    'Remediation Pending For View Drift',
    remediation,
    'approver',
    'view'
  );
}

async function saveRemediation(driftedViewName) {
  log.info('Saving/Updating remediations for...', driftedViewName);
  const { approvals } = await approvalService.addApprovals( {
    group: 'undefined',
    views: [driftedViewName]
  }, undefined, () => []);
  const nonCustodianApprovals = approvalService.getNonCustodianApprovals(approvals);
  const communityIds = getCommunityIds(nonCustodianApprovals);
  log.info('communityIds...', communityIds);

  if(isToggledCommunities(communityIds)) {
    log.info('Only create/update remediations when belongs toggled communities...');
    const remediation = await remediationDao.getRemediation(driftedViewName);
    const nonApprovedRemediationExists = remediation && remediation.status !== 'APPROVED';
    const isNewRemediation = !nonApprovedRemediationExists;

    if(isNewRemediation) {
      log.debug('Saving new remediation...');
      const newRemediation = await saveNewRemediation(driftedViewName, nonCustodianApprovals)
      return sendRemediationEmails(approvals, newRemediation);
    } else {
      const communitiesChanges = await getCommunitiesChanges(remediation.approvals, nonCustodianApprovals);
      if(communitiesChanges && communitiesChanges.hasChange) {
        log.debug('Updating existing remediation...');
        return updateRemediation(remediation, nonCustodianApprovals, communitiesChanges);
      } else {
        log.debug(`No action required, duplicate pending remediation for ${driftedViewName} view.`);
      }
    }
  }
}

function saveRemediations(driftedViewNames) {
  return Promise.all(driftedViewNames.map( driftedViewName => saveRemediation(driftedViewName)));
}

async function getPendingRemediations() {
  const remediations = await remediationDao.getPendingRemediations();
  return remediations.map( remediation => ({...{id: remediation.name}, ...remediation, ...{ isViewDrifted: true}}));
}

async function getRemediation(name) {
  try {
    return await remediationDao.getRemediation(name);
  } catch(error) {
    log.error(error);
    throw new Error(`An unexpected error occurred when getting view remediation ${name}`);
  }
}

function createUpdatedViews(views) {
  const driftedDatasetIds = views[0].driftDetails.items;
  const name = views[0].name;
  const updatedAt = new Date().toISOString();
  const createdAt = views[0].createdAt ? views[0].createdAt : ''
  const currentAvailableViews =  views?.map( view => {
    return {
      ...view,
      driftDetails: {},
      status: 'AVAILABLE'
    }
  });
  const newAvailableViews = driftedDatasetIds?.map( driftedDatasetId => {
    return {
      datasetId: driftedDatasetId,
      name,
      driftDetails: {},
      status: 'AVAILABLE',
      updatedAt,
      createdAt
    }
  });
  return [...currentAvailableViews, ...newAvailableViews];
}

async function processApprovedViewDrift(name) {
  const views =  await metastoreDao.getView(name);
  const allDatasets = await datasetDao.getLatestDatasets({ statuses: nonDeletedStatuses });
  const updatedViews =  createUpdatedViews(views);
  const updatedDatasets = viewService.addViewToExistingDatasets(allDatasets, updatedViews);
  await metastoreDao.saveViewMetadatas(updatedViews);
  return await datasetService.saveDatasets(updatedDatasets);
}

async function approveRemediation(id, user, time) {
  log.info('Going to update view remediation approval:', id, user);
  const remediation = await getRemediation(id);
  const updatedRemediation = await approvalService.approve(remediation, user, time);
  await remediationDao.saveRemediation(updatedRemediation);

  if(updatedRemediation.status === 'APPROVED') {
     await processApprovedViewDrift(updatedRemediation.name);
  }

  return emailService.sendEmails(
      [...new Set((updatedRemediation?.approvals || []).map(approval => approval.approverEmail))],
      `Remediation ${changeCase.titleCase(updatedRemediation.status)}`,
      updatedRemediation,
      'requester',
      'Permission'
  );
}

async function rejectRemediation(id, reason, user, time) {
  log.info('Going to reject view remediation approval:', id, user);
  const remediation = await getRemediation(id);
  const updatedRemediation = await approvalService.reject(remediation, reason, user, time);
  await remediationDao.saveRemediation(updatedRemediation);
  return emailService.sendEmails(
      [...new Set((updatedRemediation?.approvals || []).map(approval => approval.approverEmail))],
      'Remediation Rejected',
      updatedRemediation,
      'requester',
      'Permission'
  );
}

function deleteRemeditaions(unDriftedViewNames) {
  log.info('Deleting undrifted remediations...', unDriftedViewNames);
  return Promise.all(unDriftedViewNames.map( async viewName => {
    const remediation = await remediationDao.getRemediation(viewName);
    if (remediation && remediation.status !== 'APPROVED') {
      return remediationDao.deleteRemediation(remediation.name, remediation.createdAt);
    }
  }));
}

async function processRemediations(updatedViews) {
  const driftedViews = updatedViews.filter(updatedView => updatedView.status === 'DRIFTED');
  const driftedViewNames = [...new Set(driftedViews.map(view => view.name))];
  await saveRemediations(driftedViewNames);
  const unDriftedViews = updatedViews.filter(updatedView => updatedView.status !== 'DRIFTED');
  const unDriftedViewNames = [...new Set(unDriftedViews.map(view => view.name))];
  return deleteRemeditaions(unDriftedViewNames);
}

module.exports = {
  setLogger,
  saveRemediations,
  saveRemediation,
  getPendingRemediations,
  getRemediation,
  approveRemediation,
  rejectRemediation,
  deleteRemeditaions,
  processRemediations
}
