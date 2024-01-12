import React from 'react';
import {Button, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {MdEdit, MdLockOutline} from 'react-icons/md';
import { useRouter } from 'next/router';
import utils from '../../utils';
import communities from '../../../src/data/reference/communities.json'
import subCommunities from '../../../src/data/reference/subcommunities.json'

export const hasEditButton = (dataset, nonAvailableVersion, username) => {
  return !(!dataset || nonAvailableVersion === 0 || utils.hideEditButton(dataset, username, nonAvailableVersion > 0));
}


const DisabledEditDatasetButton = () => {
  return (
      <OverlayTrigger
          placement='bottom'
          overlay={
            <Tooltip>
              Only the custodian or the community/sub-community groups assigned to this dataset are allowed to edit the dataset.
            </Tooltip>
          }
      >
      <span className="d-inline-block" style={{ cursor: 'not-allowed' }}>
        <Button id='hidden-edit-button' size="sm" variant="outline-primary" disabled style={{ pointerEvents: 'none' }}>
          <MdLockOutline /> Edit
        </Button>
      </span>
      </OverlayTrigger>
  )
}

const EditDatasetButton = ({dataset}) => {
  const router = useRouter();
  const handleEdit = async () => router.push(`/datasets/${dataset.id}/edit`);
  return <Button id='edit-button' onClick={handleEdit} size="sm" variant="outline-primary"><MdEdit/> Edit</Button>;
};


function isEditPermissible(adGroupsInDataset =[], permissions=[]) {
    const setOfPermissions = new Set(permissions);
    return adGroupsInDataset.some(value => setOfPermissions.has(value));
}

export const getEditButton = (dataset, nonAvailableVersion, username, editButtonToggle) => {
    if (!hasEditButton(dataset, nonAvailableVersion, username)) {
        return undefined
    }
    let canEdit = true
    if (!!editButtonToggle?.enabled) {
        let permissions = username?.groups
        const adGroupsInDataset = [dataset?.custodian];
        dataset?.classifications?.forEach(classification => {
            const community = communities?.find(comm => comm.id === classification?.community?.id);
            if (community && community.approver) {
                adGroupsInDataset.push(community.approver);
            }
            const subCommunity = subCommunities?.find(subComm => subComm.id === classification?.subCommunity?.id);
            if (subCommunity && subCommunity.approver) {
                adGroupsInDataset.push(subCommunity.approver);
            }
        });
        canEdit = isEditPermissible(adGroupsInDataset, permissions)
    }

    return canEdit ? <EditDatasetButton dataset={dataset}/> : <DisabledEditDatasetButton/>
};
