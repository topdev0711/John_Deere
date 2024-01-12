import {shallow, mount} from 'enzyme';
import FileExplorer from '../../../../components/datasets/details/FileExplorer';
import { Tab, Modal, Button } from 'react-bootstrap';
import { FileBrowser } from 'chonky';
import { waitFor, act } from '@testing-library/react';
import SchemaModal from '../../../../components/datasets/details/SchemaModal';
import UploadFileModal from '../../../../components/datasets/UploadFileModal';
import DeleteObjectModal from '../../../../components/datasets/details/DeleteObjectModal';
import CreateTableModal from '../../../../components/datasets/details/CreateTableModal';
import {useAppContext} from '../../../../components/AppState';

global.fetch = require('jest-fetch-mock');
jest.mock('../../../../components/AppState');

const exampleFileMap = {
  'Root': {
    name: 'Root',
    isDir: true,
    id: 'Root',
    childrenIds: ['/folder', '/path', '/another_file.ext', '/some_other_key.ext']
  },
  '/folder': {
     name: 'folder',
     isDir: true,
     id: '/folder',
     childrenIds: [],
     parentId: 'Root'
   },
  '/path': {
      name: 'path',
      isDir: true,
      id: '/path',
      childrenIds: [],
      parentId: 'Root'
  },
  '/some_other_key.ext': {
    id: '/some_other_key.ext',
    name: 'some_other_key.ext',
    ext: '.ext',
    modDate: '04/10/2020',
    size: 123979473,
    parentId: 'Root'
  },
  '/another_file.ext': {
    id: '/another_file.ext',
    name: 'another_file.ext',
    ext: '.ext',
    modDate: '10/10/2019',
    size: 123979473,
    parentId: 'Root'
  }
};

function createFolderFileMap() {
  return {
    'Root': {
      name: 'Root',
      isDir: true,
      id: 'Root',
      childrenIds: ['/path']
    },
    '/path': {
      name: 'path',
      isDir: true,
      id: '/path',
      parentId: 'Root',
      childrenIds: ['/path/second-batch.ext']
    },
    '/path/second-batch.ext': {
      name: 'second-batch.ext',
      parentId: 'path/',
      id: '/path/second-batch.ext',
      ext: '.ext',
      modDate: '10/10/2019',
      size: 0,
    }
  };
};

const pathFolder = {
  name: 'path',
  isDir: true,
  id: '/path',
  childrenIds: [],
  parentId: 'Root'
};

const selectedFilesForAction = {
  name: 'test',
  isDir: false,
  id: '/test',
  childrenIds: [],
  parentId: 'Root'
};

const anyUser = 'anyUser';
const id = 'datasetId';
const version = '1';
const expectedFiles = ['/folder', '/path', '/some_other_key.ext', '/another_file.ext'];

const createDataset = overrideSchema => {
  const defaultSchema = {id, version, schemas: [], paths: [], approvals: [], custodian: anyUser};
  return {...defaultSchema, ...overrideSchema};
}

describe('FileExplorer Test Suite', () => {
  beforeEach(() => {
    fetch.mockResponse(JSON.stringify({fileMap: exampleFileMap}));
  });

  afterEach(() => {
    fetch.resetMocks();
  })

  describe('Basic rendering tests', () => {
    it('should render basic FileExplorer', () => {
      const wrapper = shallow(<FileExplorer dataset={createDataset()}/>);
      const button = wrapper.find('#nextPageButton').at(0);

      expect(wrapper).toBeDefined();
      expect(fetch).not.toHaveBeenCalled();
      expect(button.props().hidden).toEqual(true);
    });

    it('should load files asynchronously if datasetId prop is provided and set details to default message', async () => {
      const expectedParams = {
        "credentials": "same-origin",
        "headers": {"Content-Type": "application/json", "next": "", "prefix": ""}, "method": "GET"
      };

      const wrapper = mount(<FileExplorer dataset={createDataset()}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

      const panes = wrapper.find(Tab.Pane);
      expect(fetch).toHaveBeenCalledWith(`/api/datasets/${id}/versions/${version}/files`, expectedParams);
      expect(panes.at(0).text()).toEqual('Select a file for more details...');
    });

    it('should render with files when id is provided', async () => {
      const wrapper = mount(<FileExplorer dataset={createDataset()}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();

      const fileBrowser = wrapper.find(FileBrowser);
      const panes = wrapper.find(Tab.Pane);

      expect(fileBrowser.props().files).toHaveLength(expectedFiles.length);
      expect(fileBrowser.props().folderChain).toHaveLength(1);
      expect(fileBrowser.props().folderChain[0].name).toEqual('Root');
      for (const file of expectedFiles) {
        expect(panes.filterWhere(pane => pane.props().eventKey.includes(file))).toBeDefined();
      }
    });

    it('should render file actions dropdown for custodian', async () => {
      useAppContext.mockReturnValue({loggedInUser: {groups: [anyUser]}});

      const wrapper = mount(<FileExplorer dataset={createDataset()} />);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      const fileBrowser = wrapper.find(FileBrowser);
      expect(fileBrowser.props().fileActions).toHaveLength(5);
      expect(fileBrowser.props().fileActions.find(t=> t.id === 'publish')).toBeDefined();
    });

    it('should render file actions with Unpublish dropdown for custodian and having publish path', async () => {
      useAppContext.mockReturnValue({loggedInUser: {groups: [anyUser]}});
      const wrapper = mount(<FileExplorer dataset={createDataset({paths: ['/']})} />);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      const fileBrowser = wrapper.find(FileBrowser);
      expect(fileBrowser.props().fileActions).toHaveLength(5);
      expect(fileBrowser.props().fileActions.find(t=> t.id === 'unpublish')).toBeDefined();
    });

    it('should render file actions dropdown with only download button for user who is not custodian but has read access', async () => {
      useAppContext.mockReturnValue({loggedInUser: {groups: []}});
      const wrapper = mount(<FileExplorer dataset={createDataset()} hasAccess={true}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      const fileBrowser = wrapper.find(FileBrowser);
      expect(fileBrowser.props().fileActions).toHaveLength(1);
    });

    it('should not render file actions for user who is not custodian and doesnot have read access', async () => {
      useAppContext.mockReturnValue({loggedInUser: {groups: []}});
      const wrapper = mount(<FileExplorer dataset={createDataset()} hasAccess={false}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      const fileBrowser = wrapper.find(FileBrowser);
      expect(fileBrowser.props().fileActions).toBeUndefined();
    });

    it('should only render files that are mapped as children', async () => {
      const tempFileMap = {
        'Root': {
          name: 'Root',
          isDir: true,
          id: 'Root',
          childrenIds: ['/folder']
        },
        '/folder': {
          name: 'folder',
          isDir: true,
          id: '/folder',
          childrenIds: [],
          parentId: 'Root'
        },
        'some-file': {value: 'some value'}
      };

      fetch.mockResponse(JSON.stringify({fileMap: tempFileMap}));
      const wrapper = mount(<FileExplorer dataset={createDataset()}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();

      const fileBrowser = wrapper.find(FileBrowser);
      expect(fileBrowser.props().files).toHaveLength(1);
      expect(fileBrowser.props().files[0].id).toEqual('/folder');
    });
  });

  describe('Basic interaction tests', () => {
    it('should allow selection of individual details of file', async () => {
      const exampleFile = '/another_file.ext';
      const mouseClickFile = {
        id: "mouse_click_file",
        payload: {
          clickType: "single",
          file: {
            id: exampleFile
          }
        }
      };

      const wrapper = mount(<FileExplorer dataset={createDataset()}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      await act(async () => wrapper.find(FileBrowser).props().onFileAction(mouseClickFile));
      wrapper.update();

      const tabContainer = wrapper.find(Tab.Container);
      expect(tabContainer.props().activeKey).toEqual(`file-${exampleFile}`);
    });

    it('should allow selection of folder', async () => {
      const exampleFolder = '/path';
      const mouseClickFolder = {
        id: "mouse_click_file",
        payload: {
          clickType: "single",
          file: {
            id: exampleFolder
          }
        }
      };

      const wrapper = mount(<FileExplorer dataset={createDataset()}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      await act(async () => wrapper.find(FileBrowser).props().onFileAction(mouseClickFolder));
      wrapper.update();

      const tabContainer = wrapper.find(Tab.Container);
      expect(tabContainer.props().activeKey).toEqual(`file-${exampleFolder}`);
    });

    it('should add selected folder to folder chain', async () => {
      const openFolder = {
        "id": "open_files",
        "payload": {
          "targetFile": pathFolder
        }
      };
      const updatedPathFolder = {...pathFolder, childrenIds: ['/path/second-batch.ext'], loaded: true, token: ''};
      fetch
        .mockResponseOnce(JSON.stringify({fileMap: exampleFileMap}))
        .mockResponseOnce(JSON.stringify({fileMap: createFolderFileMap()}));

      const wrapper = mount(<FileExplorer dataset={createDataset()}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      await act(async () => wrapper.find(FileBrowser).props().onFileAction(openFolder));
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
      wrapper.update();

      const folderChain = wrapper.find(FileBrowser).props().folderChain;
      const files = wrapper.find(FileBrowser).props().files;

      expect(folderChain).toHaveLength(2);
      expect(folderChain).toContainEqual(updatedPathFolder);
      expect(files).toHaveLength(updatedPathFolder.childrenIds.length);
    });

    it('should open Upload File modal onClick of upload action', async () => {
      const uploadFileAction = {
        "id": "upload"
      };
      const wrapper = mount(<FileExplorer dataset={createDataset()}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      await act(async () => wrapper.find(FileBrowser).props().onFileAction(uploadFileAction));
      wrapper.update();
      const uploadModal = wrapper.find(UploadFileModal);
      expect(uploadModal.props().show).toEqual(true);
      expect(uploadModal.props().path).toEqual('Root');
      const modal = wrapper.find(Modal);
      const modalFooter = modal.find(Modal.Footer);
      const buttons = modalFooter.find(Button);
      expect(buttons.at(0).text()).toEqual("Close");
      expect(buttons.at(1).text()).toEqual("Upload");
    });

    it('should pop-up error download file if download-file api throws error', async () => {
      const mouseClickFile = {
        id: "mouse_click_file",
        payload: {
          clickType: "single",
          file: {
            id: selectedFilesForAction.id
          }
        }
      };
      const expectedParams = {
        "credentials": "same-origin",
        "headers": {"Content-Type": "application/json", "key": "test", "bucket":"", "account":""}, "method": "POST"
      };
      const downloadFileAction = {
        "id": "download",
        "payload": {
          "targetFile": selectedFilesForAction
        },
        "state": {
          "selectedFilesForAction": [selectedFilesForAction]
        }
      };
      const wrapper = mount(<FileExplorer dataset={createDataset()}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      fetch.mockResponse(JSON.stringify({error: 'some error'}), {status: '400'});
      await act(async () => wrapper.find(FileBrowser).props().onFileAction(mouseClickFile));
      wrapper.update();
      await act(async () => wrapper.find(FileBrowser).props().onFileAction(downloadFileAction));
      wrapper.update();
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith(`/api/datasets/download-file`, expectedParams);
      expect(wrapper.find('#error-action-modal').at(0).props().show).toEqual(true);
    });

    it('should download file', async () => {
      const mouseClickFile = {
        id: "mouse_click_file",
        payload: {
          clickType: "single",
          file: {
            id: selectedFilesForAction.id
          }
        }
      };
      const expectedParams = {
        "credentials": "same-origin",
        "headers": {"Content-Type": "application/json", "key": "test", "bucket":"", "account":""}, "method": "POST"
      };
      const downloadFileAction = {
        "id": "download",
        "payload": {
          "targetFile": selectedFilesForAction
        },
        "state": {
          "selectedFilesForAction": [selectedFilesForAction]
        }
      };
      const wrapper = mount(<FileExplorer dataset={createDataset()}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      global.URL.createObjectURL = jest.fn();
      const blob = new Blob(['testContent'], {
        type: 'application/pdf',
      });
      fetch.mockResponse(blob, {status: '200'});
      await act(async () => wrapper.find(FileBrowser).props().onFileAction(mouseClickFile));
      wrapper.update();
      await act(async () => wrapper.find(FileBrowser).props().onFileAction(downloadFileAction));
      wrapper.update();
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith(`/api/datasets/download-file`, expectedParams);
      expect(wrapper.find('#error-action-modal').at(0).props().show).toEqual(false);
    });

    it('should open delete modal and delete file on click of delete from actions after selecting a file/folder', async () => {
      const mouseClickFile = {
        id: "mouse_click_file",
        payload: {
          clickType: "single",
          file: {
            id: selectedFilesForAction.id
          }
        }
      };
      const deleteFileAction = {
        "id": "delete",
        "payload": {
          "targetFile": selectedFilesForAction
        },
        "state": {
          "selectedFilesForAction": [selectedFilesForAction]
        }
      };
      const wrapper = mount(<FileExplorer dataset={createDataset()}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      fetch.mockResponse(JSON.stringify({error: 'some error'}), {status: '400'});
      await act(async () => wrapper.find(FileBrowser).props().onFileAction(mouseClickFile));
      wrapper.update();
      await act(async () => wrapper.find(FileBrowser).props().onFileAction(deleteFileAction));
      wrapper.update();
      const deleteModal = wrapper.find(DeleteObjectModal);
      expect(deleteModal.props().show).toEqual(true);
      const deleteButton = deleteModal.find(Button).at(1);
      expect(deleteButton.text()).toContain("Yes");
      await act(async () => deleteButton.props().onClick());
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    });

    it('should allow navigation back in folder chain', async () => {
      const openFolder = {
        "id": "open_files",
        "payload": {
          "targetFile": pathFolder
        }
      };
      const openAnotherFolder = {
        "id": "open_files",
        "payload": {
          "targetFile": exampleFileMap['Root']
        }
      };
      const updatedRootFolder = {
        ...exampleFileMap['Root'],
        loaded: true,
        token: ''
      }
      fetch
        .mockResponseOnce(JSON.stringify({fileMap: exampleFileMap}))
        .mockResponseOnce(JSON.stringify({fileMap: createFolderFileMap()}));

      const wrapper = mount(<FileExplorer dataset={createDataset()}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      await act( async () => wrapper.find(FileBrowser).props().onFileAction(openFolder));
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
      await act( async () => wrapper.find(FileBrowser).props().onFileAction(openAnotherFolder));

      const folderChain = wrapper.find(FileBrowser).props().folderChain;
      const files = wrapper.find(FileBrowser).props().files;

      expect(folderChain).toHaveLength(1);
      expect(folderChain).toContainEqual(updatedRootFolder);
      expect(files).toHaveLength(expectedFiles.length);
    });
  });

  describe('Loading of additional contents tests', () => {
    it('should allow for loading additional files only if continuation token provided', async () => {
      fetch.mockResponse(JSON.stringify({NextContinuationToken: 'token', fileMap: exampleFileMap}));

      const wrapper = mount(<FileExplorer dataset={createDataset()}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();

      const button = wrapper.find('#nextPageButton').at(0);
      expect(button.props().hidden).toEqual(false);
      expect(button.text()).toEqual('Next 20');
    });

    it('should fetch more datasets if button clicked and token present', async () => {
      const token = 'token';
      const expectedParams = {
        "credentials": "same-origin",
        "headers": {"Content-Type": "application/json", "next": token, "prefix": ""}, "method": "GET"
      };
      const secondFileMap = {
        'Root': {
          name: 'Root',
          isDir: true,
          id: 'Root',
          childrenIds: ['/second-batch']
        },
        '/second-batch': {
          name: 'second-batch.ext',
          parentId: 'Root',
          id: '/second-batch.ext',
          ext: '.ext',
          modDate: '10/10/2019',
          size: 0,
        }
      }
      fetch
        .mockResponseOnce(JSON.stringify({NextContinuationToken: token, fileMap: exampleFileMap}))
        .mockResponseOnce(JSON.stringify({fileMap: secondFileMap}));

      const wrapper = mount(<FileExplorer dataset={createDataset()}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      const button = wrapper.find('#nextPageButton').at(0);
      button.simulate('click');
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
      wrapper.update();

      const fileBrowser = wrapper.find(FileBrowser);
      const files = fileBrowser.props().files;
      expect(files).toHaveLength(expectedFiles.length + 1);
      expect(files.find(f => f.name === secondFileMap['/second-batch'].name)).toBeTruthy();
      expect(fetch).toHaveBeenCalledWith(`/api/datasets/${id}/versions/${version}/files`, expectedParams);
    });
  });

  describe('Loading of folders tests', () => {
    const secondFileMap = createFolderFileMap();

    const thirdFileMap = {
      'Root': {
        name: 'Root',
        isDir: true,
        id: 'Root',
        childrenIds: ['/path']
      },
      '/path': {
        name: 'path',
        isDir: true,
        id: '/path',
        parentId: 'Root',
        childrenIds: ['/path/second-batch.ext', '/path/third-batch.ext']
      },
      '/path/third-batch.ext': {
        name: 'third-batch.ext',
        parentId: 'path/',
        id: '/path/third-batch.ext',
        ext: '.ext',
        modDate: '10/10/2019',
        size: 0,
      }
    };

    it('should fetch more files if folder double clicked', async () => {
      const openFolder = {
        "id": "open_files",
        "payload": {
          "targetFile": pathFolder
        }
      };
      const expectedParams = {
        "credentials": "same-origin",
        "headers": {"Content-Type": "application/json", "next": "", "prefix": "path/"}, "method": "GET"
      };
      fetch
        .mockResponseOnce(JSON.stringify({fileMap: exampleFileMap}))
        .mockResponseOnce(JSON.stringify({fileMap: secondFileMap}));

      const wrapper = mount(<FileExplorer dataset={createDataset()}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      act(() => wrapper.find(FileBrowser).props().onFileAction(openFolder));
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
      wrapper.update();
      const files = wrapper.find(FileBrowser).props().files;

      expect(files).toHaveLength(1);
      expect(files.find(f => f.name === secondFileMap['/path/second-batch.ext'].name)).toBeTruthy();
      expect(fetch).toHaveBeenCalledWith(`/api/datasets/${id}/versions/${version}/files`, expectedParams);
    });

    it('should fetch more files if next 20 button clicked while in folder with token present', async () => {
      const openFolder = {
        "id": "open_files",
        "payload": {
          "targetFile": pathFolder
        }
      };
      const token = 'continuation token';
      const expectedParams = {
        "credentials": "same-origin",
        "headers": {"Content-Type": "application/json", "next": token, "prefix": "path/"}, "method": "GET"
      };

      fetch
        .mockResponseOnce(JSON.stringify({fileMap: exampleFileMap}))
        .mockResponseOnce(JSON.stringify({NextContinuationToken: token, fileMap: secondFileMap}))
        .mockResponseOnce(JSON.stringify({fileMap: thirdFileMap}));

      const wrapper = mount(<FileExplorer dataset={createDataset()}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      act(() => wrapper.find(FileBrowser).props().onFileAction(openFolder));
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
      wrapper.update();
      wrapper.find('#nextPageButton').at(0).simulate('click');
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
      wrapper.update();

      const files = wrapper.find(FileBrowser).props().files;

      expect(files).toHaveLength(2);
      expect(files.find(f => f.name === thirdFileMap['/path/third-batch.ext'].name)).toBeTruthy();
      expect(fetch).toHaveBeenCalledWith(`/api/datasets/${id}/versions/${version}/files`, expectedParams);
    });

    it('should not fetch folder if it has previously been loaded', async () => {
      const openFolder = {
        "id": "open_files",
        "payload": {
          "targetFile": pathFolder
        }
      };
      const openAnotherFolder = {
        "id": "open_files",
        "payload": {
          "targetFile": exampleFileMap['Root']
        }
      };
      const updatedPathFolder = {...pathFolder, childrenIds: ['/path/second-batch'], loaded: true, token: ''};
      const reopenFolder = {
        "id": "open_files",
        "payload": {
          "targetFile": updatedPathFolder
        }
      };
      fetch
        .mockResponseOnce(JSON.stringify({fileMap: exampleFileMap}))
        .mockResponseOnce(JSON.stringify({fileMap: createFolderFileMap()}));

      const wrapper = mount(<FileExplorer dataset={createDataset()}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      await act(async () => wrapper.find(FileBrowser).props().onFileAction(openFolder));
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
      wrapper.update();
      await act(async () => wrapper.find(FileBrowser).props().onFileAction(openAnotherFolder));
      wrapper.update();
      await act(async () => wrapper.find(FileBrowser).props().onFileAction(reopenFolder));
      wrapper.update();

      const files = wrapper.find(FileBrowser).props().files;

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(files).toHaveLength(1);
    });
  });

  describe('Handle fetch errors tests', () => {
    it('should show error when api call failed', async () => {
      fetch.mockResponse(JSON.stringify({error: 'some error'}), {status: '400'});

      const wrapper = mount(<FileExplorer dataset={createDataset()}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();

      const notifyModal = wrapper.find('.notify-modal').find(Modal.Body);
      expect(notifyModal.text()).toEqual('some error');
    });

    it('should have specific message when dataset is missing storage location error', async () => {
      fetch.mockResponse(JSON.stringify({error: 'does not include storage location'}), {status: '400'});

      const wrapper = mount(<FileExplorer dataset={createDataset()}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();

      const notifyModal = wrapper.find('.notify-modal').find(Modal.Body);
      expect(notifyModal.text()).toEqual('Dataset does not include storage information. Please re-adapt to update with the latest information.');
    });

    it('should call api call fetch rejects', async () => {
      fetch.mockRejectOnce(JSON.stringify({message: 'some error'}), {status: '400'});

      const wrapper = mount(<FileExplorer dataset={createDataset()}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();

      const notifyModal = wrapper.find('.notify-modal').find(Modal.Body);
      expect(notifyModal.text()).toEqual('some error');
    });
  });

  describe('schema mapping tests', () => {
    const testSchema = {
      "id": "0a521db0-f7d0-4832-b3b3-638507f9ba8a--2",
      "name": "MAI_INVENTORY",
      "version": "1.0.0",
      "description": "Inventory",
      'discovered': 'sometime',
      "documentation": "",
      "partitionedBy": [],
      "testing": false,
      "fields": [
        {
          "name": "SNAPSHOT_DATE",
          "attribute": "id",
          "datatype": "date",
          "description": "SNAPSHOT_DATE",
          "nullable": false
        }
      ],
      "environmentName": "com.deere.enterprise.datalake.enhance.mai_inventory",
      "glueTables": [
        {
          "Name": "classic_rock_songs_all_csv",
          "Retention": 0,
          "StorageDescriptor": {
            "Location": "s3://jd-us01-edl-devl-raw-fff3b8e47a0fef170a07b381c4b2d8d3/some_other_key.ext",
            "Compressed": false,
            "NumberOfBuckets": -1,
            "BucketColumns": [],
          },
        },
        {
          "StorageDescriptor": {
            "Location": "s3://jd-us01-edl-devl-raw-fff3b8e47a0fef170a07b381c4b2d8d3/folder/",
          },
        }
      ]
    };

    it('should show schemas link for files with matching schemas', async () => {
      const exampleFile = '/some_other_key.ext';
      const mouseClickFile = {
        id: "mouse_click_file",
        payload: {
          clickType: "single",
          file: {
            id: exampleFile
          }
        }
      };

      console.info(createDataset({discoveredSchemas: [testSchema]}));
      const wrapper = mount(<FileExplorer dataset={createDataset({discoveredSchemas: [testSchema]})}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      await act(async () => wrapper.find(FileBrowser).props().onFileAction(mouseClickFile));
      wrapper.update();

      const metaPane = wrapper.find(Tab.Pane).filterWhere(pane => pane.props().eventKey === `file-${exampleFile}`);
      const link = metaPane.find('Button').at(1);

      expect(link.props().hidden).toEqual(false);
      expect(link.text()).toEqual('View Schema');
    });

    it('should not show schemas link if none match', async () => {
      const exampleFile = '/some_other_key.ext';
      const mouseClickFile = {
        id: "mouse_click_file",
        payload: {
          clickType: "single",
          file: {
            id: exampleFile
          }
        }
      };
      const schema = {...testSchema, glueTables: []};

      const wrapper = mount(<FileExplorer dataset={createDataset({discoveredSchemas: [schema]})}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      await act(async () => wrapper.find(FileBrowser).props().onFileAction(mouseClickFile));
      wrapper.update();

      const metaPane = wrapper.find(Tab.Pane).filterWhere(pane => pane.props().eventKey === `file-${exampleFile}`);
      const link = metaPane.find('Button').at(1);

      expect(link.props().hidden).toEqual(true);
      expect(link.text()).toEqual('View Schema');
    });

    it('should return schema with correct table information when display schema is selected', async () => {
      const exampleFile = '/some_other_key.ext';
      const mouseClickFile = {
        id: "mouse_click_file",
        payload: {
          clickType: "single",
          file: {
            id: exampleFile
          }
        }
      };
      const expectedSchema = {
        ...testSchema,
        directories: [exampleFile, "/folder"],
        glueTables: [
          {...testSchema.glueTables[0], path: exampleFile}
        ]
      };

      const wrapper = mount(<FileExplorer dataset={createDataset({discoveredSchemas: [testSchema]})}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      await act(async () => wrapper.find(FileBrowser).props().onFileAction(mouseClickFile));
      wrapper.update();

      const metaPane = wrapper.find(Tab.Pane).filterWhere(pane => pane.props().eventKey === `file-${exampleFile}`);
      const link = metaPane.find('Button').at(1);
      link.simulate('click');
      wrapper.update();
      const schemaModal = wrapper.find(SchemaModal);

      expect(schemaModal.props().schema).toEqual(expectedSchema);
    });

    it('should not return schema when display schema is selected for directories', async () => {
      const exampleFolder = '/folder';
      const mouseClickFolder = {
        id: "mouse_click_file",
        payload: {
          clickType: "single",
          file: {
            id: exampleFolder
          }
        }
      };
      const expectedSchema = {
        ...testSchema,
        directories: ["/some_other_key.ext", exampleFolder],
        glueTables: [
          {...testSchema.glueTables[1], path: exampleFolder}
        ]
      };

      const wrapper = mount(<FileExplorer dataset={createDataset({discoveredSchemas: [testSchema]})}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      await act(async () => wrapper.find(FileBrowser).props().onFileAction(mouseClickFolder));
      wrapper.update();

      const metaPane = wrapper.find(Tab.Pane).filterWhere(pane => pane.props().eventKey === `file-${exampleFolder}`);
      const link = metaPane.find('Button');

      expect(link).toHaveLength(0)
    });

    it('should link files to parent directorys schema', async () => {
      const openFolder = {
        "id": "open_files",
        "payload": {
          "targetFile": pathFolder
        }
      };
      const secondFileMap = createFolderFileMap();
      const updatedSchema = {
        ...testSchema,
        name: 'udpatedSchema',
        glueTables: [
          {
            "StorageDescriptor": {
              "Location": "s3://jd-us01-edl-devl-raw-fff3b8e47a0fef170a07b381c4b2d8d3/path/",
            }
          }
        ]
      }
      fetch
        .mockResponseOnce(JSON.stringify({fileMap: exampleFileMap}))
        .mockResponseOnce(JSON.stringify({fileMap: secondFileMap}));

      const wrapper = mount(<FileExplorer dataset={createDataset({discoveredSchemas: [updatedSchema]})}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      act(() => wrapper.find(FileBrowser).props().onFileAction(openFolder));
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
      wrapper.update();
      const metaPane = wrapper.find(Tab.Pane).filterWhere(pane => pane.props().eventKey === "file-/path/second-batch.ext");
      const link = metaPane.find('Button').at(1);
      link.simulate('click');
      wrapper.update();
      const schemaModal = wrapper.find(SchemaModal);

      expect(schemaModal.props().schema.name).toEqual(updatedSchema.name);
    });

    it('should not link files to parent directorys schema if file is in exclution list', async () => {
      const openFolder = {
        "id": "open_files",
        "payload": {
          "targetFile": pathFolder
        }
      };
      const exampleFile = '/path/something.json';
      const mouseClickFile = {
        id: "mouse_click_file",
        payload: {
          clickType: "single",
          file: {
            id: exampleFile
          }
        }
      };
      const secondFileMap = {
        ...createFolderFileMap(),
        '/path': {
          name: 'path',
          isDir: true,
          id: '/path',
          parentId: 'Root',
          childrenIds: ['/path/second-batch.ext', exampleFile]
        },
        '/path/something.json': {
          name: 'something.json',
          parentId: 'path/',
          id: exampleFile,
          ext: 'something.json',
          modDate: '10/10/2019',
          size: 0,
        }
      };
      const updatedSchema = {
        ...testSchema,
        name: 'udpatedSchema',
        glueTables: [
          {
            "StorageDescriptor": {
              "Location": "s3://jd-us01-edl-devl-raw-fff3b8e47a0fef170a07b381c4b2d8d3/path/",
            }
          }
        ]
      };
      fetch
        .mockResponseOnce(JSON.stringify({fileMap: exampleFileMap}))
        .mockResponseOnce(JSON.stringify({fileMap: secondFileMap}));

      const wrapper = mount(<FileExplorer dataset={createDataset({discoveredSchemas: [updatedSchema]})}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      act(() => wrapper.find(FileBrowser).props().onFileAction(openFolder));
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
      wrapper.update();
      await act(async () => wrapper.find(FileBrowser).props().onFileAction(mouseClickFile));
      wrapper.update();
      const metaPane = wrapper.find(Tab.Pane).filterWhere(pane => pane.props().eventKey === `file-${exampleFile}`);
      const link = metaPane.find('Button').at(1);

      expect(link.props().hidden).toEqual(true);
    });

    it('should link root files to schema if root is returned as storage location', async () => {
      const exampleFile = '/some_other_key.ext';
      const mouseClickFile = {
        id: "mouse_click_file",
        payload: {
          clickType: "single",
          file: {
            id: exampleFile
          }
        }
      };

      const schema = {
        ...testSchema,
        glueTables: [
          {
            "Name": "classic_rock_songs_all_csv",
            "Retention": 0,
            "StorageDescriptor": {
              "Location": "s3://jd-us01-edl-devl-raw-fff3b8e47a0fef170a07b381c4b2d8d3/",
              "Compressed": false,
              "NumberOfBuckets": -1,
              "BucketColumns": [],
            },
          },
          {
            "StorageDescriptor": {
              "Location": "s3://jd-us01-edl-devl-raw-fff3b8e47a0fef170a07b381c4b2d8d3/folder/",
            },
          }
        ]
      };

      const wrapper = mount(<FileExplorer dataset={createDataset({discoveredSchemas: [schema]})}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      await act(async () => wrapper.find(FileBrowser).props().onFileAction(mouseClickFile));
      wrapper.update();

      const metaPane = wrapper.find(Tab.Pane).filterWhere(pane => pane.props().eventKey === `file-${exampleFile}`);
      const link = metaPane.find('Button').at(1);

      expect(link.props().hidden).toEqual(false);
      expect(link.text()).toEqual('View Schema');
    });

    it('should call create table with the correct s3 path', async () => {
      const exampleFile = '/some_other_key.ext';
      const mouseClickFile = {
        id: "mouse_click_file",
        payload: {
          clickType: "single",
          file: {
            id: exampleFile
          }
        }
      };

      const schema = {
        ...testSchema,
        glueTables: [
          {
            "Name": "classic_rock_songs_all_csv",
            "Retention": 0,
            "StorageDescriptor": {
              "Location": "s3://jd-us01-edl-devl-raw-fff3b8e47a0fef170a07b381c4b2d8d3/",
              "Compressed": false,
              "NumberOfBuckets": -1,
              "BucketColumns": [],
            },
            "Parameters": {
              "skip.header.line.count": "1",
              "sizeKey": "84199",
              "UPDATED_BY_CRAWLER": "devl_raw_akshay_dataset_for_ml",
              "CrawlerSchemaSerializerVersion": "1.0",
              "recordCount": "956",
              "averageRecordSize": "88",
              "CrawlerSchemaDeserializerVersion": "1.0",
              "compressionType": "none",
              "classification": "csv",
              "columnsOrdered": "true",
              "areColumnsQuoted": "false",
              "delimiter": ";",
              "typeOfData": "file"
            }
          },
          {
            "StorageDescriptor": {
              "Location": "s3://jd-us01-edl-devl-raw-fff3b8e47a0fef170a07b381c4b2d8d3/folder/",
            },
            "Parameters": {
              "skip.header.line.count": "1",
              "sizeKey": "84199",
              "UPDATED_BY_CRAWLER": "devl_raw_akshay_dataset_for_ml",
              "CrawlerSchemaSerializerVersion": "1.0",
              "recordCount": "956",
              "averageRecordSize": "88",
              "CrawlerSchemaDeserializerVersion": "1.0",
              "compressionType": "none",
              "classification": "csv",
              "columnsOrdered": "true",
              "areColumnsQuoted": "false",
              "delimiter": ";",
              "typeOfData": "file"
            }
          }
        ]
      };

      const wrapper = mount(<FileExplorer dataset={createDataset({discoveredSchemas: [schema]})}/>);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      await act(async () => wrapper.find(FileBrowser).props().onFileAction(mouseClickFile));
      wrapper.update();

      const metaPane = wrapper.find(Tab.Pane).filterWhere(pane => pane.props().eventKey === `file-${exampleFile}`);
      const link = metaPane.find('Button').at(0);
      expect(link.props().hidden).toEqual(false);
      expect(link.text()).toEqual('Create Table');
      link.simulate('click');
      wrapper.update();
      const createTableModal = wrapper.find(CreateTableModal);

      expect(createTableModal.props().tableInfo.path).toEqual("s3://jd-us01-edl-devl-raw-fff3b8e47a0fef170a07b381c4b2d8d3/");
    });
  });
});
