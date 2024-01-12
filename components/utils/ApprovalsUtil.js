const {isPending} = require("../../src/services/statusService");

function getApproverByType(approval) {
    if (approval.custodian) return approval.custodian
    else if (approval.subCommunity) return approval.subCommunity.approver
    else if (approval.community) return approval.community.approver
    else if (approval.owner) return approval.owner;
}

function getLatestPendingUserApprovals(record, user, type) {
        const pendingApprovals =  record.approvals?.filter(approval => isPending(approval) && !approval.system);
        const approvers = pendingApprovals?.map(getApproverByType);

        const owner = pendingApprovals?.find(approval => approval.owner);
        const caseInsensitiveGroups = user.groups.map(group => group.toLowerCase());

        const loggedInUserIsPendingApprover = !!approvers?.find(approver => !!approver && caseInsensitiveGroups.includes(approver.toLowerCase()));
        const loggedInUserIsCreator = record.createdBy === user.username;
        const loggedInUserIsOwner = owner && owner.approverEmail && owner.approverEmail.toLowerCase().includes(user.username.toLowerCase());
        const isUserApproval = (loggedInUserIsPendingApprover && isPending(record)) || loggedInUserIsCreator || loggedInUserIsOwner;
        return { ...record, type, loggedInUserIsCreator, loggedInUserIsPendingApprover, loggedInUserIsOwner };
}

module.exports = {getLatestPendingUserApprovals};
