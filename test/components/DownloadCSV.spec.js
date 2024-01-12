
import DownloadCSV from '../../components/DownloadCSV';
import React from 'react';
import { Button } from 'react-bootstrap';
import { getUserListForDataset } from '../../apis/access';
import Adapter from 'enzyme-adapter-react-16';
import { configure, mount } from 'enzyme';
import ConfirmationModal from '../../components/ConfirmationModal';
import { waitFor } from "@testing-library/react";

configure({ adapter: new Adapter() });
jest.mock('../../apis/access');

const testData = {
    dataset: 'ABC Connor Dataset Test - Adding Views',
    datasetID: 'af418aba-0db1-4514-a9c9-eb39e7dd59e8',
    permissionName: 'test-prevent-clientid-reuse-new-system-permission3-expired',
    permissionID: '036f305c-736b-4d14-881b-927f76cfb4de',
    permissionStartDate: '2020-07-15T05:00:00.000Z',
    permissionEndDate: '2020-07-15T05:00:00.000Z',
    adGroup: 'AWS-GIT-DWIS-ADMIN',
    displayName: 'Abood Fred',
    email: 'AboodFred@JohnDeere.com'
}
describe('DownloadCSV test suite', () => {

    it('should generate CSV data', async () => {
        getUserListForDataset.mockResolvedValue(testData);
        const wrapper = mount(<DownloadCSV datasetId={'12345'} />);
        const exportButton = wrapper.find(Button).at(0);
        exportButton.simulate('click');
        await waitFor(() => expect(getUserListForDataset).toHaveBeenCalledTimes(1));
    });

    it('should have confirmation modal if download fails', async () => {
        const wrapper = mount(<DownloadCSV datasetId={''} />);
        const exportButton = wrapper.find(Button).at(0);
        exportButton.simulate('click');
        const confirmationModal = wrapper.find(ConfirmationModal);
        await waitFor(() => expect(getUserListForDataset).toHaveBeenCalledTimes(1));
        expect(confirmationModal.props().show).toEqual(false);

    });
});