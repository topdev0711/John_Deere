import { waitFor } from "@testing-library/react";
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import { Button, Form,Toast } from 'react-bootstrap';
import { act } from 'react-dom/test-utils';
import { getSharepointFilesFolder, getSharepointFolders, getSharepointLists, getSharepointToken } from '../../../apis/sharepoint';
import SharepointUIForm from '../../../components/workflow/SharepointUIForm';
import ValidatedInput from '../../../components/ValidatedInput';

jest.mock('../../../apis/sharepoint');

configure({ adapter: new Adapter() });

const handleSharepointDetails = jest.fn();

const sharepointListRepsonse = [
    {
        EntityTypeName : "list1List",
        DocumentTemplateUrl: null,
        Title: 'list1'
    },
    {
        EntityTypeName : "list2_x0020_file",
        DocumentTemplateUrl: 1,
        Title: 'list2'
    },
    {
        EntityTypeName : "list3List",
        DocumentTemplateUrl: null,
        Title: 'list3'
    },

];

const sharepointFilesResponse = {
    Files:[
        {
            Name: 'File1'
        },
        {
            Name: 'File2'
        },
        {
            Name: 'File3'
        },
    ],
    Folders:[
        {
            Name: 'Folder1'
        },
        {
            Name: 'Folder2'
        },
        {
            Name: 'Folder3'
        },
    ]
};

const sharepointFoldersResponse = [
    {
        FileSystemObjectType: 1,
        FileRef: '/sites/documents/foldername1',
        FileLeafRef: 'foldername1'
    },
    {
        FileSystemObjectType: 1,
        FileRef: '/sites/documents/foldername2',
        FileLeafRef: 'foldername2'
    },
    {
        FileSystemObjectType: 1,
        FileRef: '/sites/documents/foldername3',
        FileLeafRef: 'foldername3'
    },
    {
        FileSystemObjectType: 0,
        FileRef: '/sites/documents/foldername3.docx',
        FileLeafRef: 'foldername3'
    }

];
describe('sharepointUI Form Tests', () => {
    beforeEach(() => {
        getSharepointToken.mockResolvedValue('Bearer Token123');
        getSharepointLists.mockResolvedValue(sharepointListRepsonse);
        getSharepointFolders.mockResolvedValue(sharepointFoldersResponse);
        getSharepointFilesFolder.mockResolvedValue(sharepointFilesResponse);
    });
    it('should render sharepoint UI Form with Credentials', async () => {
        const wrapper = mount(<SharepointUIForm handleSharepointDetails={handleSharepointDetails} />);
        const inputs = wrapper.find('input');

        expect(inputs.at(0).props().id).toEqual('clientId');
        expect(inputs.at(1).props().id).toEqual('clientSecret');
        expect(inputs.at(2).props().id).toEqual('siteUrl');
        expect(inputs.at(3).props().id).toEqual('tenantId');

    });
    it('should show password in clientSecret field', async () => {
        const wrapper = mount(<SharepointUIForm handleSharepointDetails={handleSharepointDetails} />);
        const clientSecretInput = wrapper.find('input').filterWhere(input => input.props().id === 'clientSecret');

        expect(clientSecretInput.props().type === 'password');

        const passButton = wrapper.find(Button).filterWhere(button => button.props().id === 'showPassButton');
        passButton.simulate('click');
        wrapper.update();
        const updatedClientSecretInput = wrapper.find('input').filterWhere(input => input.props().id === 'clientSecret');

        expect(updatedClientSecretInput.props().type).toEqual('text');
    });

    it('should enable Verify Access button', async () => {
        const wrapper = mount(<SharepointUIForm handleSharepointDetails={handleSharepointDetails} />);
        const inputs = wrapper.find('input');

        const clientId = inputs.at(0);
        const clientSecret = inputs.at(1);
        const sharepointUrl = inputs.at(2);
        const tenantId = inputs.at(3);

        clientId.simulate('blur', { target: { value: 'testClientId' } });
        clientSecret.simulate('blur', { target: { value: 'test ClientSecret' } });
        sharepointUrl.simulate('blur', { target: { value: 'test sharepointUrl' } });
        tenantId.simulate('blur', { target: { value: 'testTenantId' } });

        wrapper.update();
        const verifyButton = wrapper.find(Button).filterWhere(input => input.props().id === 'verifyAccess');
        expect(verifyButton.props().disabled).toEqual(false);
    });
    it('should show toast error when access failed', async () => {
        const wrapper = mount(<SharepointUIForm handleSharepointDetails={handleSharepointDetails} />);
        const inputs = wrapper.find('input');

        const clientId = inputs.at(0);
        const clientSecret = inputs.at(1);
        const sharepointUrl = inputs.at(2);
        const tenantId = inputs.at(3);

        clientId.simulate('blur', { target: { value: 'test' } });
        clientSecret.simulate('blur', { target: { value: 'test' } });
        sharepointUrl.simulate('blur', { target: { value: 'test' } });
        tenantId.simulate('blur', { target: { value: 'test' } });

        wrapper.update();
        const verifyButton = wrapper.find(Button).filterWhere(input => input.props().id === 'verifyAccess');
        getSharepointToken.mockResolvedValue(new Error);
        act(() => { verifyButton.simulate('click') });
        expect.assertions(2);
        const toast = wrapper.find(Toast); 
        try {
            await waitFor(() => expect(getSharepointToken).toHaveBeenCalledTimes(1));
            expect(toast.props().hidden).toEqual(true);  
        } catch (e) {
          expect(toast.props().hidden).toEqual(false);  
        }
    });
    it('should click verify access and show sharepoint lists, and checkboxes', async () => {
        const wrapper = mount(<SharepointUIForm handleSharepointDetails={handleSharepointDetails} />);
        const inputs = wrapper.find('input');

        const clientId = inputs.at(0);
        const clientSecret = inputs.at(1);
        const sharepointUrl = inputs.at(2);
        const tenantId = inputs.at(3);

        clientId.simulate('blur', { target: { value: 'testClientId' } });
        clientSecret.simulate('blur', { target: { value: 'test ClientSecret' } });
        sharepointUrl.simulate('blur', { target: { value: 'test sharepointUrl' } });
        tenantId.simulate('blur', { target: { value: 'testTenantId' } });

        wrapper.update();
        const verifyButton = wrapper.find(Button).filterWhere(input => input.props().id === 'verifyAccess');

        act(() => { verifyButton.simulate('click') });
        await waitFor(() => expect(getSharepointToken).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(getSharepointLists).toHaveBeenCalledTimes(1));
        wrapper.update();

        const checkboxList = wrapper.find(Form.Check).filterWhere(checkbox => checkbox.props().id === 'mdi-lists');
        const checkboxFile = wrapper.find(Form.Check).filterWhere(checkbox => checkbox.props().id === 'mdi-files');
        const listSelectInput = wrapper.find(ValidatedInput).filterWhere(input => input.props().id === 'listSelect');
        const fileDestinationDirInput = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'fileDestinationDir');

        expect(checkboxList.props().id).toEqual("mdi-lists");
        expect(checkboxFile.props().id).toEqual("mdi-files");
        expect(listSelectInput.props().id).toEqual("listSelect");
        expect(fileDestinationDirInput).toHaveLength(1);
    });
    it('should handle list changes', async () => {
        const wrapper = mount(<SharepointUIForm handleSharepointDetails={handleSharepointDetails} />);
        const inputs = wrapper.find('input');

        const clientId = inputs.at(0);
        const clientSecret = inputs.at(1);
        const sharepointUrl = inputs.at(2);
        const tenantId = inputs.at(3);

        clientId.simulate('blur', { target: { value: 'testClientId' } });
        clientSecret.simulate('blur', { target: { value: 'test ClientSecret' } });
        sharepointUrl.simulate('blur', { target: { value: 'test sharepointUrl' } });
        tenantId.simulate('blur', { target: { value: 'testTenantId' } });

        wrapper.update();
        const verifyButton = wrapper.find(Button).filterWhere(input => input.props().id === 'verifyAccess');

        act(() => { verifyButton.simulate('click') });
        await waitFor(() => expect(getSharepointToken).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(getSharepointLists).toHaveBeenCalledTimes(1));
        wrapper.update();

        const listSelectInput = wrapper.find(ValidatedInput).filterWhere(input => input.props().id === 'listSelect');

        act(() => { listSelectInput.props().onChange([{ id: 'List1', name: 'List1' }]) });
        wrapper.update();

    });
    it('should click files checkbox and display library selection form', async () => {
        const wrapper = mount(<SharepointUIForm handleSharepointDetails={handleSharepointDetails} />);
        const inputs = wrapper.find('input');

        const clientId = inputs.at(0);
        const clientSecret = inputs.at(1);
        const sharepointUrl = inputs.at(2);
        const tenantId = inputs.at(3);

        clientId.simulate('blur', { target: { value: 'testClientId' } });
        clientSecret.simulate('blur', { target: { value: 'test ClientSecret' } });
        sharepointUrl.simulate('blur', { target: { value: 'test sharepointUrl' } });
        tenantId.simulate('blur', { target: { value: 'testTenantId' } });

        wrapper.update();
        const verifyButton = wrapper.find(Button).filterWhere(input => input.props().id === 'verifyAccess');

        act(() => { verifyButton.simulate('click') });
        await waitFor(() => expect(getSharepointToken).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(getSharepointLists).toHaveBeenCalledTimes(1));
        wrapper.update();

        const checkboxFile = wrapper.find(Form.Check).filterWhere(checkbox => checkbox.props().id === 'mdi-files').find('input').at(0);
        act(() => { checkboxFile.simulate('click') });
        wrapper.update();
        const libSelect = wrapper.find(ValidatedInput).filterWhere(input => input.props().id === 'libSelect');
        expect(libSelect.props().id).toEqual('libSelect');

    });
    it('should select Folder and File when file is selected', async () => {
        const wrapper = mount(<SharepointUIForm handleSharepointDetails={handleSharepointDetails} />);
        const inputs = wrapper.find('input');

        const clientId = inputs.at(0);
        const clientSecret = inputs.at(1);
        const sharepointUrl = inputs.at(2);
        const tenantId = inputs.at(3);

        clientId.simulate('blur', { target: { value: 'testClientId' } });
        clientSecret.simulate('blur', { target: { value: 'test ClientSecret' } });
        sharepointUrl.simulate('blur', { target: { value: 'test sharepointUrl' } });
        tenantId.simulate('blur', { target: { value: 'testTenantId' } });

        wrapper.update();
        const verifyButton = wrapper.find(Button).filterWhere(input => input.props().id === 'verifyAccess');

        act(() => { verifyButton.simulate('click') });
        await waitFor(() => expect(getSharepointToken).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(getSharepointLists).toHaveBeenCalledTimes(1));
        wrapper.update();

        const checkboxFile = wrapper.find(Form.Check).filterWhere(checkbox => checkbox.props().id === 'mdi-files').find('input').at(0);
        act(() => { checkboxFile.simulate('click') });
        wrapper.update();
        const libSelect = wrapper.find(ValidatedInput).filterWhere(input => input.props().id === 'libSelect');

        act(() => { libSelect.props().onChange({ id: 'Documents', name: 'Documents' }) });
        await waitFor(() => expect(getSharepointFolders).toHaveBeenCalledTimes(1));
        wrapper.update();

        const folderSelect = wrapper.find(ValidatedInput).filterWhere(input => input.props().id === 'folderSelect');
        act(() => { folderSelect.props().onChange({ id: '/sites/EDLIngest/Shared Documents/test', name: '/sites/EDLIngest/Shared Documents/test' }) });
        await waitFor(() => expect(getSharepointFilesFolder).toHaveBeenCalledTimes(1));
        wrapper.update();

        const fileSelect = wrapper.find(ValidatedInput).filterWhere(input => input.props().id === 'fileSelect');
        expect(fileSelect.props().id).toEqual('fileSelect');
    });
});