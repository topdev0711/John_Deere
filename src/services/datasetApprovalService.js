const approvalService = require('./approvalService');
const DatasetApproval = require('./DatasetApproval');
const { APPROVED, PENDING} = require('./statusService');

let log = require('edl-node-log-wrapper');
const featureToggleService = require("./featureToggleService");
const conf = require("../../conf");

const setLogger = logger => {
  log = logger;
  approvalService.setLogger(logger);
};

const approve = (dataset, user, details) => approvalService.approve(dataset, user, details);
const reject = (dataset, reason, user) => approvalService.reject(dataset, reason, user);
const getUserApprovals = (latest, user) => approvalService.getUserApprovals(latest, user, 'Dataset');
const addApprovalsForDelete = pendingDeletionDataset => approvalService.addApprovalsForDelete(pendingDeletionDataset);

const addAllApprovals = async (record, latestAvailable) => {
  const { views, ...originalDataset} = record;
  const getGovernanceTags = record => record.classifications;
  const dataset = await approvalService.addApprovals(originalDataset, latestAvailable, getGovernanceTags);
  return { ...dataset, views,  status: PENDING };
};

const autoApprove = dataset => {
  const approvals = [approvalService.createAutoApproval()];
  return {...dataset, approvals, status: APPROVED};
}

companyUseToggleValues = async (userGroups) => {
  let companyUseToggle = await featureToggleService.getToggle(conf.getConfig().companyUseAccessFlag)
  let toggleFlag = hasAdGroupToggleEnabled(companyUseToggle, userGroups)
  return {toggle : toggleFlag, communities : companyUseToggle?.communities}
}
const hasAdGroupToggleEnabled = (toggle, groups=[]) => toggle?.enabled && (!toggle.adGroups || toggle.adGroups?.some(adGroup => groups?.includes(adGroup)));

const addApprovals = async (dataset, latestAvailableDataset, fullDataset, fullLatestAvailableDataset, userGroups) => {
  const datasetApproval = new DatasetApproval(fullDataset, fullLatestAvailableDataset, userGroups, log);
  let toggles = await companyUseToggleValues(userGroups)
  return await datasetApproval.requiresApproval(toggles) ? addAllApprovals(dataset, latestAvailableDataset) : autoApprove(dataset);
};

module.exports = { setLogger, approve, reject, getUserApprovals, addApprovalsForDelete, addApprovals };
