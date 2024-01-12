import React from 'react';
import {MdClear} from 'react-icons/md';
import {Button} from 'react-bootstrap';
import {unlockDataset} from '../../../apis/datasets';
import utils from '../../utils';
import useNotifyModal from "../../../hooks/useNotifyModal";

export const hasUnlockButton = ({custodian, lockedBy}, loggedinUser) => {
  const isCustodian = () => loggedinUser.groups.includes(custodian);
  const isLockedUser = () => {
    const legacyLockCheck = !!lockedBy && typeof lockedBy === 'string' && loggedinUser === lockedBy;
    const lockCheck = !!lockedBy && typeof lockedBy === 'object' && loggedinUser.username === lockedBy.username;
    return legacyLockCheck || lockCheck;
  }

  return lockedBy && (isLockedUser() || isCustodian());
}

export const CancelAndUnlockButton = ({dataset, setDataset, setUpdatingLock}) => {
  const [modal, setModal] = useNotifyModal();
  const cancelAndUnlock = async () => {
    setUpdatingLock(true);
    const response = await unlockDataset(dataset);
    if (response.ok) {
      setDataset(utils.removeAndUnlockRecord(dataset));
    } else {
      const err = await response.json();
      setModal(err.error);
    }
    setUpdatingLock(false);
  }

  return (
    <>
      {modal}
      <Button id='unlock-button' onClick={cancelAndUnlock} size="sm" variant="outline-primary"><MdClear/> Cancel & Unlock</Button>
    </>
  )
}

export const getUnlockButton = (dataset, username, setDataset, setUpdatingLock) => {
  return hasUnlockButton(dataset, username) ? <CancelAndUnlockButton dataset={dataset} setDataset={setDataset} setUpdatingLock={setUpdatingLock} /> : undefined;
}
