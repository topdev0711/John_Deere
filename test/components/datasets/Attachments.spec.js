import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { Modal, Button, Table } from 'react-bootstrap';
import { act, waitFor } from '@testing-library/react';
import Attachments from '../../../components/datasets/Attachments';
import UploadFileModal from '../../../components/datasets/UploadFileModal';

global.fetch = require('jest-fetch-mock');
configure({ adapter: new Adapter() });

const datasetAttachments = [
    {
        key: 'some-key',
        fileName: 'some-fileName',
        bucketName: 'some-bucketName',
        account: 'some-account',
        size: 10
    }
]
const datasetAttachments2 = [
    {
        key: 'some-key2',
        fileName: 'some-fileName2',
        bucketName: 'some-bucketName',
        account: 'some-account',
        size: 10
    }
];

const dataset = {
    id: 'some-id',
    version: 'some-version',
    attachments: {
        currentAttachments: [ ...datasetAttachments ],
        newAttachments: [],
        deletedAttachments: []
    }
};

const maxDatasetAttachments = {
    id: 'some-id',
    version: 'some-version',
    attachments: {
        currentAttachments: [
            {
                key: 'some-key1',
                fileName: 'some-fileName1',
                bucketName: 'some-bucketName',
                account: 'some-account',
                size: 10
            },
            {
                key: 'some-key2',
                fileName: 'some-fileName2',
                bucketName: 'some-bucketName',
                account: 'some-account',
                size: 10
            },
            {
                key: 'some-key3',
                fileName: 'some-fileName3',
                bucketName: 'some-bucketName',
                account: 'some-account',
                size: 10
            },
            {
                key: 'some-key4',
                fileName: 'some-fileName4',
                bucketName: 'some-bucketName',
                account: 'some-account',
                size: 10
            },
            {
                key: 'some-key5',
                fileName: 'some-fileName5',
                bucketName: 'some-bucketName',
                account: 'some-account',
                size: 10
            }
        ]
    }
}

const expectedParams = {
    "credentials": "same-origin",
    "headers": {
        "Content-Type": "application/json",
        "key": "some-key",
        "bucket": "some-bucketName",
        "account": "some-account"
    },
    "method": "POST"
};

function createBlob() {
    return new Blob(['testContent'], { type: 'application/pdf' });
}

async function waitForFetch(wrapper, number) {
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(number));
    wrapper.update();
}

describe('Attachments Test Suite', () => {

    beforeEach(() => {
        global.URL.createObjectURL = jest.fn();
    });

    afterEach(() => {
        fetch.resetMocks();
    });

    describe('Basic rendering tests', () => {
        it('should display dataset attachments if there are attachments', async () => {

            const wrapper = mount(<Attachments dataset={dataset} isEditing={false} hasAccess={true} />);

            const showButton = wrapper.find(Button).at(0);
            showButton.simulate('click');

            const modalBody = wrapper.find(Modal.Body);
            const buttonText = modalBody.find(Button).text();

            expect(buttonText).toMatch('some-fileName');
        });
    });

    describe('Basic interaction tests in dataset detail page', () => {
        it('should handle click', async () => {
            const wrapper = mount(<Attachments dataset={dataset} isEditing={false} hasAccess={true} />);

            const showButton = wrapper.find(Button).at(0);
            showButton.simulate('click');

            const closeButton = wrapper.find('ModalFooter').find(Button)
            closeButton.simulate('click')

            const modal = wrapper.find(Modal).at(0)
            expect(modal.props().show).toEqual(false)
        })

        it('should download dataset attachments if there are attachments', async () => {

            const wrapper = mount(<Attachments dataset={dataset} isEditing={false} hasAccess={true} />);
            const showButton = wrapper.find(Button).at(0);
            showButton.simulate('click');

            const button = wrapper.find(Modal.Body).find(Button);
            const blob = createBlob();

            fetch.mockResponse(blob, { status: '200' });

            await act(async () => button.props().onClick());

            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith(`/api/datasets/download-file`, expectedParams);
        });

        it('should fail to download file if download-file api throws error', async () => {
            fetch.mockResponse(JSON.stringify({ message: 'some error' }), { status: '400' });

            const wrapper = mount(<Attachments dataset={dataset} isEditing={false} hasAccess={true} />);

            const showButton = wrapper.find(Button).at(0);
            showButton.simulate('click');
            const button = wrapper.find(Modal.Body).find(Button);

            const blob = createBlob();
            await act(async () => button.props().onClick());
            wrapper.update()

            const errorMessage = wrapper.find('ModalBody').text();

            expect(errorMessage).toEqual('some error');
        });

        it('should fail to download file if access has been denied', async () => {
            fetch.mockResponse(JSON.stringify({ error: 'some error' }), { status: '403' });

            const wrapper = mount(<Attachments dataset={dataset} isEditing={false} hasAccess={true} />);

            const showButton = wrapper.find(Button).at(0);
            showButton.simulate('click');

            const button = wrapper.find(Modal.Body).find(Button);

            await act(async () => button.props().onClick());
            wrapper.update();

            const errorMessage = wrapper.find('ModalBody').text();

            expect(errorMessage).toEqual('Access Denied');
        });

        it('should show notification if user has no access to the dataset', async () => {
            const wrapper = mount(<Attachments dataset={dataset} isEditing={false} hasAccess={false} />);

            const showButton = wrapper.find(Button).at(0);
            showButton.simulate('click');

            const modal = wrapper.find(Modal).at(0);
            const modalBodyText = modal.find('ModalBody').text();

            expect(modalBodyText).toEqual('You must have access to the dataset to view/download attachments');
        });

        it('should display No attachments if there are no attachments', async () => {
            const wrapper = mount(<Attachments dataset={{}} isEditing={false} hasAccess={true} />);

            const description = wrapper.text();
            expect(description).toContain('No attachments');
        });

        it('should catch error if failed to download attachments', async () => {
            fetch.mockRejectOnce(JSON.stringify({ message: 'some error' }, { status: '400' }));
            const wrapper = mount(<Attachments dataset={dataset} isEditing={false} hasAccess={true} />);

            const showButton = wrapper.find(Button).at(0);
            showButton.simulate('click');
            const button = wrapper.find(Modal.Body).find(Button)
            await act(async () => button.props().onClick());
            wrapper.update();

            const errorMessage = wrapper.find('ModalBody').text();
            expect(errorMessage).toEqual('Failed to download the file');
        });

    });
    describe('Basic rendering & interaction tests in dataset edit page', () => {
        it('should display attachments table and attachments when there exists attachments to display', async () => {
            const wrapper = mount(<Attachments dataset={dataset} isEditing={true} hasAccess={true} />);

            const table = wrapper.find(Table);
            const rows = table.find('tr');
            const headerColumns = rows.at(0).find('th').map(column => column.text());
            const attachmentColumns = rows.at(1).find('td').map(column => column.text());

            expect(rows.length).toEqual(2);
            expect(headerColumns[0]).toEqual('File Name');
            expect(headerColumns[1]).toEqual('Size');
            expect(headerColumns[2]).toEqual('Delete');
            expect(attachmentColumns[0]).toEqual('some-fileName');
            expect(attachmentColumns[1]).toEqual('10 B');
        });

        it('should display modal to confirm the delete', async () => {
            const wrapper = mount(<Attachments dataset={dataset} isEditing={true} hasAccess={true} />);

            const table = wrapper.find(Table);
            const rows = table.find('tr');
            const deleteButton = rows.at(1).find('td').at(2).find(Button);
            deleteButton.simulate('click');

            const deleteModal = wrapper.find(Modal).filterWhere(b => b.props().id === 'deleteModal');
            expect(deleteModal.props().show).toEqual(true);

            const warningMsg = deleteModal.find(Modal.Body).text();
            expect(warningMsg).toEqual('Are you sure you want to delete "some-fileName".')
        });

        it('should close delete modal if refuse to delete the attachment', async () => {
            const wrapper = mount(<Attachments dataset={dataset} isEditing={true} hasAccess={true} />);

            const table = wrapper.find(Table);
            const rows = table.find('tr');
            const deleteButton = rows.at(1).find('td').at(2).find(Button);
            deleteButton.simulate('click');

            const deleteModal = wrapper.find(Modal).filterWhere(b => b.props().id === 'deleteModal');
            const refuseButton = deleteModal.find('ModalFooter').find(Button).at(0);
            refuseButton.simulate('click');

            const modal = wrapper.find(Modal).at(0);
            expect(modal.props().show).toEqual(false);
        });

        it('should trigger delete existing attachment if confirm to delete an existing attachment', async () => {
            const callback = jest.fn();
            const wrapper = mount(<Attachments dataset={dataset} isEditing={true} hasAccess={true} handleAttachments={callback} />);

            const table = wrapper.find(Table);
            const rows = table.find('tr');
            const deleteButton = rows.at(1).find('td').at(2).find(Button);
            deleteButton.simulate('click');

            const deleteModal = wrapper.find(Modal).filterWhere(b => b.props().id === 'deleteModal');
            const confirmDeleteButton = deleteModal.find('ModalFooter').find(Button).at(1);
            confirmDeleteButton.simulate('click');

            expect(callback).toHaveBeenNthCalledWith(1, { 'deletedAttachment': 'some-fileName' });

            const modal = wrapper.find(Modal).at(0);
            expect(modal.props().show).toEqual(false);
        });

        it('should show upload modal when click on Add attachment button', async () => {
            const wrapper = mount(<Attachments isEditing={true} />);
            const button = wrapper.find(Button).filterWhere(b => b.props().id === 'addAttachment');
            button.at(0).simulate("click");

            const uploadModal = wrapper.find(UploadFileModal);
            expect(uploadModal.props().show).toEqual(true);
            const closeButton = uploadModal.find('ModalFooter').find(Button).at(0);
            closeButton.simulate('click');

            const modal = wrapper.find(Modal).at(0);
            expect(modal.props().show).toEqual(false);
        });

        it('should disable add attachment button and upload modal', async () => {
            const wrapper = mount(<Attachments dataset={maxDatasetAttachments} isEditing={true} hasAccess={true} />);
            
            const button = wrapper.find(Button).filterWhere(b => b.props().id === 'addAttachment');
            expect(button.props().disabled).toEqual(true)
            const uploadModal = wrapper.find(UploadFileModal);
            expect(uploadModal.props().show).toEqual(false);
        });
        it('if duplicate attachment is added the original should be removed', async () => {
            const duplicateFileDataset = {
                ...dataset,
                previousVersion: {
                    id: '1234',
                    version: '1',
                    attachments: {
                        currentAttachments: [...datasetAttachments]
                    }
                }
            };
            fetch.mockResponse(JSON.stringify(datasetAttachments));
            const callback = jest.fn();
            const localStorage = {stagingUuid: '1234'}
            const wrapper = mount(<Attachments dataset={duplicateFileDataset} isEditing={true} hasAccess={true} handleAttachments={callback} localStorage={localStorage}/>);
            await waitForFetch(wrapper, 1);
            expect(callback).toHaveBeenNthCalledWith(2, { 'deletedAttachment': 'some-fileName' });
        });

        it('should detect changes if previousAttachments do not match attachments', async () => {
            const prevVersionDataset = {
                ...dataset,
                previousVersion: {
                    id: '1234',
                    version: '1',
                    attachments: {
                        currentAttachments: [...datasetAttachments2, {fileName: "ExistingFile", size: 123}]
                    }
                }
            };
            const wrapper = mount(<Attachments dataset={prevVersionDataset} isEditing={false} hasAccess={true} showDiff={true}/>);
            const showButton = wrapper.find(Button).at(0);
            showButton.simulate('click');
            const modalBody = wrapper.find(Modal.Body);
            const buttonText1 = modalBody.find(Button).at(0).text();
            const buttonText2 = modalBody.find(Button).at(1).text();
            const buttonText3 = modalBody.find(Button).at(2).text();
            expect(buttonText1).toMatch('some-fileName');
            expect(buttonText2).toMatch('some-fileName2');
            expect(buttonText3).toMatch('ExistingFile');
        });

        it('should call fetch to delete staged attachment', async () => {
            const localStorage = {stagingUuid: '1234'}
            const deleteParams = {
                "credentials": "same-origin",
                "headers": {
                    "Content-Type": "application/json"
                },
                "method": "DELETE"
            };

            fetch.mockResponseOnce(JSON.stringify(datasetAttachments2));
            fetch.mockResponseOnce(JSON.stringify({message: "Deleted Succesfuly"}));
            fetch.mockResponseOnce(JSON.stringify(datasetAttachments2));
            const callback = jest.fn();
            const wrapper = mount(<Attachments dataset={dataset} isEditing={true} hasAccess={true} handleAttachments={callback} localStorage={localStorage}/>);
            await waitForFetch(wrapper, 1);
            const deleteButton = wrapper.find(Button).at(2);
            deleteButton.simulate("click")
            const confirmButton = wrapper.find(Modal).find(Button).at(1)
            confirmButton.simulate("click");
            expect(fetch).toHaveBeenCalledWith('/api/datasets/staged/1234/some-fileName2', deleteParams);
        });
    });
});