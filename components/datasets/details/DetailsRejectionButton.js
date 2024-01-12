import React from 'react';
import {useRouter} from 'next/router';
import RejectButton from '../../approvals/RejectButton';
import {postRejection} from '../../../apis/datasets';
import {getLatestPendingUserApprovals} from '../../utils/ApprovalsUtil';

const hasRejectionButton = approvalInfo => approvalInfo.loggedInUserIsPendingApprover || approvalInfo.loggedInUserIsOwner;

const showError = (message, error) =>
  ({
    modal: {
      onAccept: () => ({modal: null}),
      showAcceptOnly: true,
      acceptButtonText: 'OK',
      body: (
        <div>
          <div>{message}</div>
          <br/>
          <div>{error}</div>
        </div>
      )
    }
  });

const handleRejection = async ({id, version, comments}, router) => {
  const rejectionReason = comments || 'No comments';
  const rejectResponse = await postRejection(id, version, {reason: rejectionReason});
  if (rejectResponse.ok) {
    router.push('/approvals')
  } else {
    const errorResponse = await rejectResponse.json();
    showError('Failed to submit rejection.', errorResponse.error);
    console.log(errorResponse);
  }
}

const DetailsRejectionButton = ({approvalInfo}) => {
  const router = useRouter();
  return <RejectButton handleRejection={(info) => handleRejection(info, router)} isUpdating={false} item={approvalInfo}/>
}

export const getRejectionButton = (dataset, username) => {
  const approvalInfo = getLatestPendingUserApprovals({...dataset}, username, 'Dataset');
  return hasRejectionButton(approvalInfo) ? <DetailsRejectionButton approvalInfo={approvalInfo}/> : undefined;
};
