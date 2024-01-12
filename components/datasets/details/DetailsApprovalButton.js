import React from 'react';
import { useRouter } from 'next/router';
import {postApproval} from '../../../apis/datasets';
import ApproveButton from '../../approvals/ApproveButton';
import {getLatestPendingUserApprovals} from '../../utils/ApprovalsUtil';

export const hasApprovalButton = approvalInfo => approvalInfo.loggedInUserIsPendingApprover || approvalInfo.loggedInUserIsOwner;

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

const DetailsApprovalButton = ({approvalInfo}) => {
  const {id, version} = approvalInfo;
  const router = useRouter();

  const handleApproval = async () => {
    const approveResponse = await postApproval(id, version);
    if (approveResponse.ok) {
      router.push('/approvals');
    } else {
      const errorResponse = await approveResponse.json();
      showError('Failed to submit approval.', errorResponse.error);
      console.log(errorResponse);
    }
  }

  return <ApproveButton handleApproval={handleApproval} isUpdating={false} item={approvalInfo}/>
};

export const getApprovalButton = (dataset, username) => {
  const approvalInfo = getLatestPendingUserApprovals({...dataset}, username, 'Dataset');
  return hasApprovalButton(approvalInfo) ? <DetailsApprovalButton approvalInfo={approvalInfo}/> : undefined
};
