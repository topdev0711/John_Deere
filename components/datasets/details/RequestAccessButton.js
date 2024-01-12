import React, {useEffect, useState} from 'react';
import {Button, OverlayTrigger, Spinner, Tooltip} from 'react-bootstrap';
import {MdLockOpen, MdLockOutline} from 'react-icons/md';
import PermissionListModal from './PermissionListModal';
import utils from '../../utils';
import {useRouter} from 'next/router';

const COMPANY_USE_ID = 'e43046c8-2472-43c5-9b63-e0b23ec09399';
const hasPublicAccess = ({gicp}) => 'public' === gicp?.name?.toLowerCase();
const hasCompanyUseAccess = ({community, gicp}, permittedCommunities) => COMPANY_USE_ID === gicp?.id && permittedCommunities.indexOf(community?.id) >= 0;
const hasAccessButton = ({status}, latestAvailableVersion) => {
  return status === 'AVAILABLE' || !latestAvailableVersion;
}

const shouldDisableBasedOnPublicClassification = ({classifications}, {publicDatasetToggle = false} = {}) => {
  if (!publicDatasetToggle) return false;
  return classifications.some(hasPublicAccess);
}

const shouldDisableBasedOnCUClassification = ({classifications}, {companyUseDatasetToggle = {}} = {}) => {
  if (!companyUseDatasetToggle?.companyUseADGroupToggle) return false;
  let communities = companyUseDatasetToggle.validCommunities;
  return classifications.every(classification => hasCompanyUseAccess(classification, communities));
}

const DisabledRequestButton = ({ publicFlag }) => {
  return (
    <OverlayTrigger
      placement='bottom'
      overlay={
        <Tooltip>
          This Dataset is classified as {publicFlag ? 'public' : 'company use'}. No access requests are required
        </Tooltip>
      }
    >
      <span className="d-inline-block" style={{ cursor: 'not-allowed' }}>
        <Button id='request-access-button' size="sm" variant="outline-primary" disabled style={{ pointerEvents: 'none' }}>
          <MdLockOutline /> Request Access
        </Button>
      </span>
    </OverlayTrigger>
  )
}

export const RequestAccessButton = ({ dataset, username, permissions, loadingPermissionsWithAccess}) => {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const showModal = () => {
    if (userPermissions?.length > 0) {
      setShow(true);
    } else {
      router.push(`/catalog/permissions/request?sources=${dataset.id}`);
    }
  }
  useEffect(() => {

    if(loadingPermissionsWithAccess && clicked){
       setDisabled(true)
    }
    if(!loadingPermissionsWithAccess && clicked){
      showModal();
      setDisabled(false);
      setClicked(false);
    }
  }, [loadingPermissionsWithAccess, clicked]);

  const userPermissions = permissions?.filter((perm) => username?.groups?.includes(perm.group) && !utils.isPermExpired(perm));
  const handleAccessClick = () => {
    setClicked(true);
  };
  const handleCancel = () => {
    setShow(false);
  };
  const icon = loadingPermissionsWithAccess&&clicked? <Spinner className="spinner-border uxf-spinner-border-sm"/>: <MdLockOpen/>
  return (
    <>
      <PermissionListModal show={show} onCancel={handleCancel} id={dataset.id} permissions={userPermissions}  />
      <Button id='request-access-button' disabled={disabled} onClick={handleAccessClick} size="sm" variant="outline-primary" key={`requestAccessLoadModal-${loadingPermissionsWithAccess}`} loadingPermissionsWithAccess={loadingPermissionsWithAccess} > {icon} Request Access</Button>
    </>
  );
}

export const getRequestAccessButton = (dataset, latestAvailableVersion, username, permissions, datasetToggles, loadingPermissionsWithAccess) => {

  if (!hasAccessButton(dataset, latestAvailableVersion)) {
    return undefined;
  }
  const isPublicDisabled = shouldDisableBasedOnPublicClassification(dataset, datasetToggles)
  const isCompanyUseDisabled = shouldDisableBasedOnCUClassification(dataset, datasetToggles)
  if (isPublicDisabled || isCompanyUseDisabled) {
    return <DisabledRequestButton publicFlag={isPublicDisabled}/>
  }
  return <RequestAccessButton dataset={dataset} username={username} permissions={permissions}  loadingPermissionsWithAccess={loadingPermissionsWithAccess}/>
};
