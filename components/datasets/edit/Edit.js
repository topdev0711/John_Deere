// Unpublished Work © 2022 Deere & Company.
import {useRouter} from "next/router";
import Spacer from "../../Spacer";
import React, {useEffect, useState} from "react";
import {lockDataset, unlockDataset} from "../../../apis/datasets";
import DatasetForm from "./DatasetForm";
import EnhancedDatasetForm from "./EnhancedDatasetForm";
import {isAvailable, isDeleted, isPending, isRejected} from '../../../src/services/statusService';
import EditBreadcrumb from "./EditBreadcrumb";
import LargeLoadingSpinner from "../../LargeLoadingSpinner";
import utils from "../../utils";
import {useAppContext} from '../../AppState';

const createUrl = ({id, version}) => `/catalog/datasets/detail?id=${id}&version=${version}`;
const LoadDetailsPage = ({detailsURL}) => {
  const router = useRouter();
  useEffect(() => {router.push(detailsURL)}, []);
  return <></>;
}

export const Edit = ({router, loggedInUser, latest, latestAvailable, latestAvailableError}) => {
  const [locked, setLocked] = useState(false);

  const isLocked = dataset => dataset?.lockedBy && dataset?.lockedBy !== null;
  const isLockedByUser = dataset => loggedInUser.username === dataset?.lockedBy?.username;
  const isUserAccessible = dataset => !isLocked(dataset) || isLockedByUser(dataset);
  const isEditableDataset = dataset => dataset && isAvailable(dataset) && isUserAccessible(dataset);
  const hasCanceledDataset = () => latestAvailable && isEditableDataset(latestAvailable) && isDeleted(latest);
  const hasAllDeleted = () => latestAvailableError && isDeleted(latest);
  const isEditable = () => isEditableDataset(latest) || hasCanceledDataset() || hasAllDeleted();

  const updatedByUser = () => loggedInUser.username === latest?.updatedBy;
  const hasAllApprovalsPending = () => isPending(latest) && latest.approvals.every(isPending);
  const isUpdatableRejection = () => isUserAccessible(latestAvailable) && isRejected(latest);
  const isUpdatable = () => updatedByUser() && (hasAllApprovalsPending() || isUpdatableRejection());

  const canEdit = () => isEditable() || isUpdatable();

  const runLockDataset = async () => {
    const editable = latest && (latestAvailable || latestAvailableError) && canEdit();
    if (editable && latestAvailable && !isLocked(latestAvailable)) await lockDataset(latestAvailable);
    setLocked(true);
  };

  useEffect(() => {runLockDataset()}, [latest, latestAvailable, latestAvailableError]);

  const isLoading = () => {
    return !latest || !(latestAvailable || latestAvailableError) || !locked;
  }
  if (isLoading()) return <LargeLoadingSpinner/>;
  if (!canEdit()) return <LoadDetailsPage detailsURL={createUrl(latest)}/>;
  if (!isUserAccessible(latestAvailable || latest)) return <LoadDetailsPage detailsURL={createUrl(latest)}/>;

  const useLatestAvailable = latestAvailable && isDeleted(latest);
  const datasetToEdit = useLatestAvailable ? latestAvailable : latest;

  const handleCancel = async () => {
    if (latestAvailable) await unlockDataset(latestAvailable);
    router.push(createUrl(datasetToEdit));
  };

  const globalContext = useAppContext();
  const publicDatasetToggle = utils.hasAdGroupToggleEnabled(globalContext?.toggles['datacatalogui.public_datasets'], globalContext?.loggedInUser?.groups) || false;

  return (
    <div id="dataset-edit">
      <EditBreadcrumb dataset={datasetToEdit}/>
      {publicDatasetToggle ?
        <EnhancedDatasetForm dataset={datasetToEdit} isEditing={true} onCancel={handleCancel} cancelAndUnlock={handleCancel} title="Edit Dataset"/>
        : <DatasetForm dataset={datasetToEdit} isEditing={true} onCancel={handleCancel} cancelAndUnlock={handleCancel} title="Edit Dataset"/>
      }
      <Spacer/>
    </div>
  );
};

export default Edit;
