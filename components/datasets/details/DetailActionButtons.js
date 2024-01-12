// Unpublished Work © 2022 Deere & Company.
import React, {useState} from 'react';
import {withRouter} from 'next/router';
import {AppStateConsumer, useAppContext} from '../../AppState';
import SmallSpinner from '../../SmallSpinner';
import {getUnlockButton} from './CancelAndUnlockButton';
import {getApprovalButton} from './DetailsApprovalButton';
import {getRejectionButton} from './DetailsRejectionButton';
import {getEditButton} from './EditDatasetButton';
import {getRequestAccessButton} from './RequestAccessButton';
import {getWorkflowButton} from './WorkflowButton';
import utils from "../../utils";

const editStyle = { float: 'right', marginTop: '-55px'};

export const DatasetDetailButtons = ({dataset, setDataset, latestAvailableVersion, nonAvailableVersion, username, permissions, loadingPermissionsWithAccess }) => {
  const [updatingLock, setUpdatingLock] = useState(false);
  const globalContext = useAppContext();
  const publicDatasetToggle = utils.hasAdGroupToggleEnabled(globalContext?.toggles['datacatalogui.public_datasets'], globalContext?.loggedInUser?.groups) || false;
  const companyUseADGroupToggle = utils.hasAdGroupToggleEnabled(globalContext?.toggles['jdc.company_use_access_flag'], globalContext?.loggedInUser?.groups) || false;
  const editButtonToggle = globalContext?.toggles['jdc.disable_edit_button_flag']
  const validCommunities = globalContext?.toggles['jdc.company_use_access_flag']?.communities || ['a521b7d4-642c-4524-9c46-e4fa5e836a17']
  const companyUseDatasetToggle = {companyUseADGroupToggle, validCommunities}
  const workflow = getWorkflowButton(dataset);
  const requestAccess = getRequestAccessButton(dataset, latestAvailableVersion, username, permissions, {publicDatasetToggle, companyUseDatasetToggle}, loadingPermissionsWithAccess);
  const unlock = getUnlockButton(dataset, username, setDataset, setUpdatingLock);
  const edit = getEditButton(dataset, nonAvailableVersion, username, editButtonToggle);
  const approval = getApprovalButton(dataset, username);
  const rejection = getRejectionButton(dataset, username);
  const buttons = [workflow, requestAccess, unlock, edit, approval, rejection].filter(b => b);

  const renderButton = (button, index) => index !== (buttons.length-1) ? <>{button}&nbsp;&nbsp;</> : button;
  const key = `detail-action-buttons-${buttons.length}`;
  return updatingLock ? <SmallSpinner /> : <div id='dataset-action-buttons' key={key} style={editStyle}>{buttons.map(renderButton)}</div>;
};

export default withRouter(props => (
  <AppStateConsumer>{({loggedInUser}) => (<DatasetDetailButtons {...props} username={loggedInUser}/>)}</AppStateConsumer>)
);
