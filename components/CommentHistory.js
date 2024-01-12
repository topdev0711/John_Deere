import RequestComment from "./RequestComment";
import ApproverComment from "./ApproverComment";
import React from "react";

function getApprover({ community, custodian, owner, subCommunity }) {
  if (community) return ` Community: ${community.name}`;
  else if (subCommunity) return ` SubCommunity: ${subCommunity.name}`;
  else if (custodian) return ` AD Group: ${custodian}`;
  else if (owner) return ` Owner: ${owner}`;
};

const getApprovalComments = approval => {
  const approver = getApprover(approval);
  return (approval.commentHistory || []).map(comments => {
    const commentsInfo = { ...comments, approver };
    return { component: <ApproverComment {...commentsInfo} />, date: new Date(commentsInfo.updatedAt), status: commentsInfo.status };
  });
};

const compareDate = (a, b) => {
  const comparison = b.date - a.date;
  const isAutoApproved = comparison > 0 && comparison < 100 && a.status && !b.status;
  return isAutoApproved ? -1 : comparison;
};

const CommentHistory = ({ commentHistory, approvals }) => {
  const requestComments = (commentHistory || []).map(comments => ({ component: <RequestComment {...comments} />, date: new Date(comments.updatedAt) }));
  const approverComments = (approvals || []).flatMap(getApprovalComments);
  return [...approverComments, ...requestComments].sort(compareDate).map(({ component }) => component);
};

export default CommentHistory;