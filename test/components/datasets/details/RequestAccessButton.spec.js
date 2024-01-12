import {getRequestAccessButton, RequestAccessButton} from '../../../../components/datasets/details/RequestAccessButton';
import PermissionListModal from '../../../../components/datasets/details/PermissionListModal';
import { mount } from 'enzyme';
import { Button } from "react-bootstrap";

describe('RequestAccessButton tests', () => {

  const dataset = { status: 'AVAILABLE', classifications: [{ gicp: {name : 'public'} }] };
  const latestAvailableVersion = { status: 'AVAILABLE' };
  const username = 'testUser';
  const permissions = ['read', 'write'];
  const datasetToggles = { publicDatasetToggle: true, companyUseDatasetToggle: false };
  const loadingPermissionsWithAccess = false;

  it('has access button for available datasets', () => {
    const buttonExists = !!getRequestAccessButton({status: 'AVAILABLE', classifications: { gicp: 'Confidential' }}, {status: 'AVAILABLE'});
    expect(buttonExists).toEqual(true);
  });

  it('has access button regardless of state when a dataset has been created but never available', () => {
    const buttonExists = !!getRequestAccessButton({status: 'PENDING'});
    expect(buttonExists).toEqual(true);
  });

  it('does not have access button for non available dataset', () => {
    const buttonExists = !!getRequestAccessButton({status: 'PENDING'}, {status: 'AVAILABLE'});
    expect(buttonExists).toEqual(false);
  });

  it('returns a DisabledRequestButton when dataset is public and public toggle is true', () => {
    const button = getRequestAccessButton(dataset, latestAvailableVersion, username, permissions, datasetToggles, loadingPermissionsWithAccess);
    expect(button?.type?.name).toEqual("DisabledRequestButton");
  });

  it('does not return a DisabledRequestButton when dataset is private and both toggles are true', () => {
    const privateDataset = { status: 'AVAILABLE', classifications: [{ gicp: {name : 'private' }}] };
    const toggles = { publicDatasetToggle: true, companyUseDatasetToggle: true };
    const button = getRequestAccessButton(privateDataset, latestAvailableVersion, username, permissions, toggles, loadingPermissionsWithAccess);
    expect(button?.type?.name).toEqual("RequestAccessButton");
  });

  it('returns a RequestAccessButton when dataset is for company use and both toggles are true but community is invalid', () => {
    const companyUseDataset = {
      status: 'AVAILABLE', classifications: [{
        community: {
          id: "f8365c21-1fbb-4e24-9ee4-98b05c512bd1",
          name: "Sales and Marketing"
        }, gicp: {name: 'company use'}
      }]
    };
    const toggles = {
      publicDatasetToggle: true, companyUseDatasetToggle: {
        companyUseADGroupToggle: true, validCommunities:
            ["a7b76f9e-8ff4-4171-9050-3706f1f12188",
              "2e546443-92a3-4060-9fe7-22c2ec3d51b4",
              "75b382e2-46b8-4fe8-9300-4ed096586629",
              "a521b7d4-642c-4524-9c46-e4fa5e836a17"]
      }
    };
    const button = getRequestAccessButton(companyUseDataset, latestAvailableVersion, username, permissions, toggles, loadingPermissionsWithAccess);
    expect(button?.type?.name).toEqual("RequestAccessButton");
  });

  it('returns a DisabledRequestButton when dataset is for company use and both toggles are true and community is valid', () => {
    const companyUseDataset = {
      status: 'AVAILABLE', classifications: [{
        community: {
          id: "a7b76f9e-8ff4-4171-9050-3706f1f12188",
          name: "Channel"
        }, gicp: {id : 'e43046c8-2472-43c5-9b63-e0b23ec09399', name: 'company use'}
      }]
    };
    const toggles = {
      publicDatasetToggle: true, companyUseDatasetToggle: {
        companyUseADGroupToggle: true, validCommunities:
            ["a7b76f9e-8ff4-4171-9050-3706f1f12188",
              "2e546443-92a3-4060-9fe7-22c2ec3d51b4",
              "75b382e2-46b8-4fe8-9300-4ed096586629",
              "a521b7d4-642c-4524-9c46-e4fa5e836a17"]
      }
    };
    const button = getRequestAccessButton(companyUseDataset, latestAvailableVersion, username, permissions, toggles, loadingPermissionsWithAccess);
    expect(button?.type?.name).toEqual("DisabledRequestButton");
  });

  it('does not return a DisabledRequestButton when dataset has both public and company use classifications and both toggles are true', () => {
    const datasetWithBothClassifications = {
      status: 'AVAILABLE',
      classifications: [{ gicp: {name: 'company use'} }, { gicp: {name:'confidential'} }]
    };
    const toggles = { publicDatasetToggle: true, companyUseDatasetToggle: true };
    const button = getRequestAccessButton(datasetWithBothClassifications, latestAvailableVersion, username, permissions, toggles, loadingPermissionsWithAccess);
    expect(button?.type?.name).toEqual("RequestAccessButton");
  });

  it('returns a RequestAccessButton when dataset is public and public toggle is false', () => {
    const toggles = { publicDatasetToggle: false, companyUseDatasetToggle: false };
    const button = getRequestAccessButton(dataset, latestAvailableVersion, username, permissions, toggles, loadingPermissionsWithAccess);
    expect(button?.type?.name).toEqual("RequestAccessButton");
  });

  it('should have permissionList modal when click access button for access allowed datasets', async () => {
    const props = {
      dataset: {id: 'foo'},
      username: {groups: 'foo'},
      permissions: [{name: 'bar', group: 'foo'}],
      disabled: false,
    };
    const wrapper = mount(<RequestAccessButton {...props} />);
    const exportButton = wrapper.find(Button).at(0);
    exportButton.simulate('click');
    expect(wrapper.find(PermissionListModal).props().show).toEqual(true);

  })

});
