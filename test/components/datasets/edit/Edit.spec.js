import {shallow} from 'enzyme';
import enableHooks from 'jest-react-hooks-shallow';
import React from 'react';
import {lockDataset} from '../../../../apis/datasets';
import Edit from '../../../../components/datasets/edit/Edit';
import {APPROVED, AVAILABLE, DELETED, PENDING, REJECTED} from '../../../../src/services/statusService';

enableHooks(jest);

jest.mock('../../../../apis/datasets');

describe('dataset edit tests', () => {
  const anyUser = 'anyUser';
  const pendingApproval = {status: PENDING};
  const approvedApproval = {status: APPROVED};
  const createLatest = () => ({
    name: 'anyName',
    id: 'anyId',
    version: 2,
    updatedBy: anyUser,
    status: PENDING,
    approvals: [pendingApproval]
  });
  const createLatestAvailable = () => ({name: 'anyName', id: 'anyId', version: 1, status: AVAILABLE});
  const loggedInUser = {username: anyUser};

  beforeEach(() => lockDataset.mockResolvedValue({}));

  it('should wait for latest dataset to be loaded', () => {
    const editor = shallow(<Edit latestAvailableDataset={createLatest()} loggedInUser={loggedInUser}/>);
    expect(editor.exists('LargeLoadingSpinner')).toEqual(true);
  });

  it('should load page when there is no available dataset exists', () => {
    const {updatedBy, ...latest} = createLatest();
    const editor = shallow(<Edit latest={latest} latestAvailable={createLatestAvailable()} loggedInUser={loggedInUser}/>);
    expect(editor.exists('LargeLoadingSpinner')).toEqual(false);
  });

  // it('should allow editing when latest dataset is deleted but a previous version available dataset', () => {
  //   const editor = shallow(<Edit latest={{...createLatest(), status: DELETED}} latestAvailable={createLatestAvailable()} loggedInUser={loggedInUser}/>);
  //   expect(editor.exists('DatasetFormComponent')).toEqual(true);
  // });

  it('should redirect to details page when another user locked the dataset the latest dataset', () => {
    const latest = {...createLatest(), lockedBy: 'someLock', status: AVAILABLE};
    const editor = shallow(<Edit latest={latest} latestAvailable={createLatestAvailable()} loggedInUser={loggedInUser}/>);
    expect(editor.exists('LoadDetailsPage')).toEqual(true);
  });

  it('should redirect to details page when latest available is locked', () => {
    const latestAvailable = {...createLatestAvailable(), lockedBy: 'someLock'};
    const editor = shallow(<Edit latest={createLatest()} latestAvailable={latestAvailable} loggedInUser={loggedInUser}/>);
    expect(editor.exists('LoadDetailsPage')).toEqual(true);
  });

  it('should redirect to details page when has a pending request that an has an approval approved', () => {
    const latestAvailable = {...createLatestAvailable(), lockedBy: 'someLock', approvals: [approvedApproval, pendingApproval]};
    const editor = shallow(<Edit latest={createLatest()} latestAvailable={latestAvailable} loggedInUser={loggedInUser}/>);
    expect(editor.exists('LoadDetailsPage')).toEqual(true);
  });
});
