// Unpublished Work © 2022 Deere & Company.
import {useRouter, withRouter} from 'next/router';
import React, {useEffect, useState} from 'react';
import {getVersionedDataset} from '../../../apis/datasets';
import {useFetch} from '../../../apis/apiHelper';
import {AVAILABLE} from '../../../src/services/statusService'
import Edit from '../../../components/datasets/edit/Edit';
import {AppStateConsumer} from "../../../components/AppState";

const ErrorDisplay = ({error}) => <div>{error}</div>;

export const DatasetEdit = ({loggedInUser}) => {
  const router = useRouter();
  const [latest, setLatest] = useState(undefined);
  const [latestError, setLatestError] = useState(undefined);
  const [latestAvailable, setLatestAvailable] = useState(undefined);
  const [latestAvailableError, setLatestAvailableError] = useState(undefined);

  const loadDatasets = async () => {
    const {id} = router.query;

    const latestCall = getVersionedDataset(id, 'latest');
    const { data: latestDataset, error: latestDatasetError } = await useFetch(latestCall);
    setLatest(latestDataset);
    setLatestError(latestDatasetError);

    const latestAvailableCall = getVersionedDataset(id, 'latest', AVAILABLE);
    const { data: latestAvailableDataset, error: latestAvailableDatasetError } = await useFetch(latestAvailableCall);
    setLatestAvailable(latestAvailableDataset);
    setLatestAvailableError(latestAvailableDatasetError);
  };

  useEffect(() => {loadDatasets()}, []);

  if (latestError) return <ErrorDisplay error={latestError}></ErrorDisplay>

  return <Edit router={router} loggedInUser={loggedInUser} latestAvailable={latestAvailable} latestAvailableError={latestAvailableError} latest={latest}/>
};

export default withRouter(() => (<AppStateConsumer>{({loggedInUser}) => (<DatasetEdit loggedInUser={loggedInUser}/>)}</AppStateConsumer>));
