const { isPending } = require('../services/statusService');
let log = require('edl-node-log-wrapper');

const setLogger = logger => log = logger;

function createRequestCommentHistory({ updatedBy, updatedAt, requestComments: comment = 'No comments' }) {
  return [{ updatedBy, updatedAt, comment }];
}

function createApprovalCommentHistory(approval) {
  if (approval.commentHistory) return approval;
  if(isPending(approval)) return { ...approval, commentHistory: []};
  const { status, approvedBy: updatedBy, updatedAt, reason : comment = 'No comment'} = approval;
  return { ...approval, commentHistory: [{ status, updatedBy, updatedAt, comment }]};
}

function addCommentHistory(record) {
  if (!record.approvals) {
    log.info('Record does not have approvals block: ', JSON.stringify(record));
    return undefined;
  }

  const commentHistory = record.commentHistory ? record.commentHistory : createRequestCommentHistory(record);
  const approvals = record.approvals.map(createApprovalCommentHistory);
  return { ...record, commentHistory, approvals };
}

function addCommentHistories(records) {
  return records.map(addCommentHistory).filter(record => record);
}

function removePendingStateHistory(record) {
  const commentHistory = record.commentHistory.map(({ updatedBy, updatedAt, comment = 'No comments' }) => ({ updatedBy, updatedAt, comment }));
  const approvals = record.approvals.filter(approval => !isPending(approval));
  return { ...record, commentHistory, approvals };
}

function removeApprovalPendingStateHistories(records) {
  return records.map(removePendingStateHistory).filter(record => record);
}

module.exports = { setLogger, addCommentHistories, removeApprovalPendingStateHistories };
