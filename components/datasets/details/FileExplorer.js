import React, { useState, useEffect } from 'react';
import { Button, Tab, Row, Col, Modal, Spinner } from 'react-bootstrap';
import Spacer from '../../Spacer';
import utils from '../../utils';
import { FileBrowser, FileList, FileNavbar, FileToolbar, FileContextMenu, ChonkyActions, setChonkyDefaults, defineFileAction, ChonkyIconName } from 'chonky';
import { ChonkyIconFA } from 'chonky-icon-fontawesome';
import {  MdKeyboardArrowDown, MdCloudQueue } from 'react-icons/md';
import UploadFileModal from '../UploadFileModal';
import DeleteObjectModal from './DeleteObjectModal';
import SchemaModal from './SchemaModal';
import CreateTableModal from './CreateTableModal';
import hotkeys from 'hotkeys-js';
import MoveObjectModal from './MoveObjectModal';
import useNotifyModal from '../../../hooks/useNotifyModal';
import usePublishModal from '../../../hooks/usePublishModal';
import {useAppContext} from "../../AppState";
import path from 'path';

setChonkyDefaults({
  iconComponent: ChonkyIconFA,
  disableSelection: false,
  disableDragAndDrop: true,
  disableDefaultFileActions: [
    ChonkyActions.OpenSelection.id,
    ChonkyActions.SelectAllFiles.id,
    ChonkyActions.ClearSelection.id,
    ChonkyActions.ToggleHiddenFiles.id
  ],
  defaultFileViewActionId: ChonkyActions.EnableListView.id
});

const filterMultiSelection = (f) => !(hotkeys.shift || hotkeys.ctrl);

const deleteS3ObjectAction = defineFileAction({
  id: 'delete',
  requiresSelection: true,
  fileFilter: (f) => filterMultiSelection(f),
  button: {
      name: 'Delete',
      group: 'Actions',
      tooltip: 'Delete',
      toolbar: true,
      contextMenu: true,
      icon: ChonkyIconName.trash
  }
});

const downloadS3ObjectAction = defineFileAction({
  id: 'download',
  requiresSelection: true,
  fileFilter: (f) => filterMultiSelection(f) && (f.size < 524288000 && !f.isDir) ,
  button: {
      name: 'Download',
      group: 'Actions',
      tooltip: 'Download',
      toolbar: true,
      contextMenu: true,
      icon: ChonkyIconName.download
  }
});

const uploadS3ObjectAction = defineFileAction({
  id: 'upload',
  button: {
      name: 'Upload',
      group: 'Actions',
      tooltip: 'Upload',
      toolbar: true,
      contextMenu: true,
      icon: ChonkyIconName.upload
  }
});

const moveS3ObjectAction = defineFileAction({
  id: 'rename',
  requiresSelection: true,
  fileFilter: (f) => filterMultiSelection(f),
  button: {
      name: 'Move',
      group: 'Actions',
      tooltip: 'Move',
      toolbar: true,
      contextMenu: true,
      icon: ChonkyIconName.paste
  }
});

const publishS3ObjectAction = defineFileAction({
  id: 'publish',
  button: {
      name: 'Publish',
      group: 'Actions',
      tooltip: 'Publish',
      toolbar: true,
      contextMenu: true,
      icon: ChonkyIconName.users
  }
});
const unpublishS3ObjectAction = defineFileAction({
  id: 'unpublish',
  button: {
      name: 'Unpublish',
      group: 'Actions',
      tooltip: 'Unpublish',
      toolbar: true,
      contextMenu: true,
      icon: ChonkyIconName.hidden
  }
});

const customActions = [
  uploadS3ObjectAction,
  downloadS3ObjectAction,
  deleteS3ObjectAction,
  moveS3ObjectAction
];

const styles = {
  iconDetails: {
    color: 'green',
    float: 'right',
    right: '5px',
    position: 'relative',
    marginTop: '10px'
  },
  iconSpecific: {
    paddingLeft: '15px',
    paddingBottom: '5px',
  }
};

const initialActionStatus = {type: 'noType', status: '', error: false, message: ''}

const defaultFileMap = { Root: {name: 'Root', isDir: true, id: 'Root', childrenIds: []} };

const excludedStringEndings = [".zip",".rdf",".dat",".gvi",".log",".dtc",".jpg",".metadata",".can",".txt",".7z",".pickle",".bag",".png",".asc",".json"];
const excludedSubstrings = ["/_"];

async function loadFileMap(datasetId, datasetVersion, { token, prefix }) {
  return fetch(`/api/datasets/${datasetId}/versions/${datasetVersion}/files`, {
    credentials: 'same-origin',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'next': token,
      'prefix': prefix
    }
  });
}

function updateFileMap(currentFileMap, { fileMap: newFileMap, NextContinuationToken: token = ''}, prefix) {
  let updatedMap = { ...currentFileMap };
  for (const key in newFileMap) {
    if (!!currentFileMap[key] && currentFileMap[key].isDir) {
      updatedMap[key] = {
        ...currentFileMap[key],
        childrenIds: [ ...new Set([...currentFileMap[key].childrenIds, ...newFileMap[key].childrenIds]) ]
      }
    } else {
      updatedMap[key] = !!newFileMap[key].modDate ? {...newFileMap[key], modDate: new Date(newFileMap[key].modDate)} : newFileMap[key];
    }
  }

  const folderId = !!prefix ? `/${prefix.slice(0, -1)}` : 'Root';
  updatedMap[folderId] = {
    ...updatedMap[folderId],
    token,
    loaded: !!token ? false : true
  }

  return updatedMap;
}

function fileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function removeBucketName(storageLocation) {
  const isDatatypeBucket = (dir) => !dir.match(/^(s3:)|^(jd-us01-edl)|^$/g);
  const appendDirectory = (acc, dir) => isDatatypeBucket(dir) ? `${acc}/${dir}` : acc;
  const directories = storageLocation.split('/');
  return directories.reduce(appendDirectory, '');
}

function isSchemaMatch(schema, key) {
  const match = schema.directories.find(directory => {
    const containsDirectory = key.substring(0, directory.length) === directory;
    const nextChar = key.charAt(directory.length);
    const hasValidNextChar = key.length === directory.length || nextChar === '/';
    const containsExcludedString = !!excludedStringEndings.find(str => key.endsWith(str)) || !!excludedSubstrings.find(str => key.includes(str));
    return !containsExcludedString && containsDirectory && hasValidNextChar;
  });
  return match !== undefined;
}

const FileExplorer = ({ dataset, hasAccess }) => {
  const {id: datasetId = '', version: datasetVersion = '', paths: publishedPaths = [], discoveredSchemas: schemas = [], approvals: datasetApprovals = []} = dataset;
  const globalContext = useAppContext();

  const [key, setKey] = useState('default');
  const [size, setSize] = useState("")
  const [checkDir, setDir] = useState(false)
  const [fileName, setName] = useState("no name")
  const [params, setParams] = useState({ token: '', prefix: '' })
  const [folderChain, setFolderChain] = useState([ defaultFileMap.Root ]);
  const [files, setFiles] = useState([ null ]);
  const [nonNullFiles, setNonNullFiles] = useState([]);
  const [fileMap, setFileMap ] = useState(defaultFileMap);
  const [currentFolder, setCurrentFolder] = useState(defaultFileMap.Root);
  const [loading, setLoading] = useState(true);
  const [showActionModal, setShowActionModal] = useState({});
  const [datasetBucket, setDatasetBucket] = useState("");
  const [environmentName, setEnvironmentName] = useState("");
  const [datasetAccount, setDatasetAccount] = useState("");
  const [actionCompleted, setActionCompleted] = useState("notCompleted");
  const [actionStatus, setActionStatus] = useState(initialActionStatus);
  const [contextActionFile, setContextActionFile] = useState('');
  const [downloadModal , setDownloadModal] = useState({});
  const [s3Name, setS3Name ] = useState("");
  const handleDwnloadClose = () =>  setDownloadModal({});
  const closeActionModal = (action) => setShowActionModal({...showActionModal, ...action});
  const showActionCompleted = (str) => setActionCompleted(str);
  const [mappedSchemas, setMappedSchemas] = useState([]);
  const [matchedFileMap, setMatchedFileMap] = useState({});
  const [selectedSchema, setSelectedSchema] = useState({});
  const [showSchema, setShowSchema] = useState(false);
  const [selectedForCreateTable, setSelectedForCreateTable] = useState({});
  const [showSelectedForCreateTable, setShowSelectedForCreateTable] = useState(false);
  const [notifyModal, setNotifyModal] = useNotifyModal();
  const [publishModal, setPublishModal, setUnpublishModal] = usePublishModal(datasetId, datasetVersion, setNotifyModal);

  const edlApproval = (dataset || {approvals: []}).approvals.find(approval => approval.approvedBy === 'EDL');
  const approvalSchemas = ((edlApproval || {details: {}}).details || {schemas: []}).schemas || [];

  const isCustodian = globalContext?.loggedInUser?.groups?.includes(dataset?.custodian);

  const getPath = () => {
    const path = (currentFolder || {}).id;
    return path === 'Root' ? '/' : path;
  }

  const getVisiblePath = () => {
    const path = getPath();
    return path === '/' ? 'Root' : path;
  }

  const pathIsPublished = () => {
    const currentPath = getPath();
    return publishedPaths.some(path => currentPath.startsWith(path));
  }

  const hidePublish = () => !isCustodian || pathIsPublished();

  const hideUnpublish = () => {
    if (!isCustodian) {
      return true;
    }
    const currentPath = getPath();
    const published = publishedPaths.some(path => currentPath === path);
    return !published;
  }

  const showPublished = () => {
    return pathIsPublished();
  }

  const getFiles = (folder) => folder.childrenIds.map(id => fileMap[id]);
  const getPrefix = (file) => `${file.id.slice(1, file.id.length)}/`;
  const getToken = (file) => (file.token || '');
  const maxDownloadSize = 536870912000;

  const downloadFile = (id, name, datasetBucket, datasetAccount) => {
    let slicedId = id.slice(1);
    if (name && slicedId.indexOf(name) === -1) {
      slicedId += path.sep + name
    }
    setActionStatus({type: 'Downloading...',status: 'started',error: false,message: ''});
    fetch(`/api/datasets/download-file`, {
      credentials: 'same-origin',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'key': slicedId,
        'bucket': datasetBucket,
        'account': datasetAccount
      }
    })
    .then(response => {
      if (!response.ok) {
        if(response.status == '403') {
          setActionStatus({type: 'Download',status: 'failed',error: true ,message: 'Access Denied'});
        } else {
          response.json().then( err =>
            {
              setActionStatus({type: 'Download',status: 'failed',error: true ,message: err.message});
            }
          )
        }
      } else {
        response.blob().then(blob => {
          setActionStatus({type: 'Download',status: 'completed',error: false, message: 'downloaded'});
          let url = window.URL.createObjectURL(blob);
          let a = document.createElement('a');
          a.href = url;
          a.download = name;
          a.click();
        });
      }
    })
    .catch(error => console.error(error)
    );
  }

  const handleFileAction = (data) => {
    const { id, payload, state } = data;
    const contextSelectedFile = state && state.selectedFilesForAction;
    if(contextSelectedFile && contextSelectedFile.length){
      const file = contextSelectedFile[0].id.substr(1).trim();
      setContextActionFile(file);
    }
    if (id === deleteS3ObjectAction.id && actionStatus.status !== 'started') {
      setShowActionModal({...showActionModal,'deleteModal': true})
    } else if (id === uploadS3ObjectAction.id) {
      setShowActionModal({...showActionModal,'uploadModal': true})
    } else if (id === moveS3ObjectAction.id) {
      setShowActionModal({...showActionModal,'moveModal': true})
    } else if (id === downloadS3ObjectAction.id) {
      downloadFile(key.replace('file-',''), fileName, datasetBucket, datasetAccount)
    } else if (id === publishS3ObjectAction.id) {
      setPublishModal(getPath());
    } else if (id === unpublishS3ObjectAction.id) {
      setUnpublishModal(getPath());
    } else {
      if (id === ChonkyActions.MouseClickFile.id) {
        const { clickType, file } = payload;
        if (clickType === 'single') {
          setKey(`file-${file.id}`);
          setSize(file.size);
          setName(file.name);
          setDir(!file.isDir);
        }
      }
      if (id === ChonkyActions.OpenFiles.id) {
        const { targetFile: file } = payload;
        if (!file.isDir) return;
        let inChain = false;
        let newChain = [];
        for (const i in folderChain) {
          const folder = folderChain[i];
          newChain = [...newChain, folder];
          if (folder.id === file.id) {
            setFolderChain(newChain);
            setCurrentFolder(folder);
            setFiles(getFiles(folder));
            inChain = true;
            break;
          }
        }
        if (inChain) return;
        setFolderChain([...folderChain, file]);
        setCurrentFolder(file);
        if (!file.childrenIds.length && !file.loaded) {
          setParams({token: getToken(file), prefix: getPrefix(file)});
        } else {
          setFiles(getFiles(file));
        }
      }
    }
  };

  const buildSchemaTable = (id) => {
    const schemaId = matchedFileMap[id].schema ? matchedFileMap[id].schema : '';
    const schema = mappedSchemas.find(schema => schema.id === schemaId);
    const uniqueId = matchedFileMap[id].isDir ? id + '/' : id;
    const table = schema.glueTables.find(({ path }) => uniqueId.includes(path));
    return {schema, table}
  }

  useEffect(() => {
    if(datasetApprovals.length){
      const edlApproval = datasetApprovals.find(app => app.system === 'EDL' && app.approvedBy === 'EDL');
      const datasetBucket =  edlApproval && edlApproval?.details?.dataset?.values?.find(val => val.name === 'S3 Bucket Name');
      if (datasetBucket) setDatasetBucket(datasetBucket.value);
      const environmentName = edlApproval && edlApproval?.details?.dataset?.name;
      if (environmentName) setEnvironmentName(environmentName);
      const datasetAccount =  edlApproval && edlApproval?.details?.dataset?.values?.find(val => val.name === 'Account');
      if (datasetAccount) setDatasetAccount(datasetAccount.value);
    }
  }, [datasetApprovals])

  useEffect(() => {
    setNonNullFiles(files.filter(f => !!f));
    const [ lastFile ] = files.slice(-1);
    setLoading(!lastFile);
  }, [files]);

  useEffect(() => {
    if(actionCompleted !== 'notCompleted'){
      if(actionCompleted.substr(0,7) === 'deleted' || actionCompleted.substr(0,5) === 'moved'){
        setFileMap(defaultFileMap);
        setFolderChain([ defaultFileMap.Root ]);
        setCurrentFolder(defaultFileMap.Root);
        setFiles([null]);
        setParams({ token: '', prefix: '' })
      } else {
        setParams(prev => ({...prev}))
      }
    }
  }, [actionCompleted])

  useEffect(() => {
    async function getFileMap() {
      !!params.token ? setFiles([...files, null]) : setFiles([ null ]);
      try {
        const res = await loadFileMap(datasetId, datasetVersion, params);
        if(res.ok) {
          const fullResponse = await res.json();
          const updatedMap = updateFileMap(fileMap, fullResponse, params.prefix);
          const updatedFolder = updatedMap[currentFolder.id];
          const updatedFiles = updatedFolder.childrenIds.map(id => updatedMap[id]);
          setS3Name(fullResponse.Name)
          setFileMap(updatedMap);
          setFolderChain([...folderChain.slice(0, -1), updatedFolder]);
          setCurrentFolder(updatedFolder);
          setFiles(updatedFiles);
        } else {
          setFiles([]);
          let errorResponse;
          const err = await res.json();
          console.error('Error ', err);
          if(err.error.includes('does not include storage location')) {
            errorResponse = 'Dataset does not include storage information. Please re-adapt to update with the latest information.'
          } else {
            errorResponse = err.error;
          }
          setNotifyModal(errorResponse);
        }
      } catch (e) {
        const parsed = JSON.parse(e);
        const errorResponse = parsed.message ? parsed.message : parsed;
        setNotifyModal(errorResponse);
      }
    }
    getFileMap();
  }, [ datasetId, params ]);

  useEffect(() => {
    if (!!schemas.length && !schemas[0].directories) {
      const schemasWithDirectories = schemas.map(schema => {
        if(!!schema.glueTables && !!schema.glueTables.length) {
          const tables = schema.glueTables.map(table => {
            const storageLocation = table.StorageDescriptor ? table.StorageDescriptor.Location ? table.StorageDescriptor.Location : '' : '';
            return {...table, path: removeBucketName(storageLocation)};
          });
          const paths = tables.map(({ path }) => path);
          return {...schema, directories: paths, glueTables: tables};
        }
        return {...schema, directories: []};
      });
      setMappedSchemas(schemasWithDirectories);
    }
  }, [schemas]);

  useEffect(() => {
    if (!fileMap.Root.schema) {
      const clone = require('rfdc')();
      const tempFileMap = clone(fileMap);
      for (const key in tempFileMap) {
        if (!tempFileMap[key].schema) {
          const match = mappedSchemas.find(schema => {
            if (schema.directories) {
              return isSchemaMatch(schema, key);
            }
            return false;
          });
          tempFileMap[key].schema = match ? match.id : '';
        }
      }
      setMatchedFileMap(tempFileMap);
    }
  }, [fileMap, mappedSchemas]);

  return (
    <>
      {notifyModal}
      {publishModal}
      <SchemaModal
        schema={selectedSchema}
        environmentApprovalSchemas={approvalSchemas}
        show={showSchema}
        onCancel={() => {setShowSchema(false); setSelectedSchema({})}}
      />
      <CreateTableModal
        tableInfo={selectedForCreateTable}
        show={showSelectedForCreateTable}
        onCancel={() => {setShowSelectedForCreateTable(false); setSelectedForCreateTable({});}}
      />
      <UploadFileModal
        show={showActionModal['uploadModal']}
        handleClose={(action) => closeActionModal(action)}
        uploadCompleted={(str) => showActionCompleted(str)}
        path={getVisiblePath()}
        datasetBucket={datasetBucket}
        environmentName={environmentName}
        datasetAccount={datasetAccount}
        actionStatus={(aStatus) => setActionStatus({...actionStatus, ...aStatus})}
      />
      <DeleteObjectModal
        show={showActionModal['deleteModal']}
        handleClose={(action) => closeActionModal(action)}
        deleteCompleted={(str) => showActionCompleted(str)}
        s3Object={contextActionFile}
        datasetBucket={datasetBucket}
        environmentName={environmentName}
        datasetAccount={datasetAccount}
        actionStatus={(aStatus) => setActionStatus({...actionStatus, ...aStatus})}
      />
      <MoveObjectModal
        show={showActionModal['moveModal']}
        handleClose={(action) => closeActionModal(action)}
        moveCompleted={(str) => showActionCompleted(str)}
        s3Object={contextActionFile}
        datasetBucket={datasetBucket}
        datasetAccount={datasetAccount}
        actionStatusForMove={(aStatus) => setActionStatus({...actionStatus, ...aStatus})}
      />
      <Modal id="error-action-modal" size="md" show={actionStatus.error} onHide={() => setActionStatus(initialActionStatus)}>
        <Modal.Body style={{ overflowY: "hidden" }}>
          <div className="text-danger mt-2">{actionStatus.message}</div>
          <Button variant="primary" onClick={() => setActionStatus(initialActionStatus)} style={{float: 'right'}}>
            Ok
          </Button>
        </Modal.Body>
      </Modal>
      <Tab.Container id="file-tabs" activeKey={key} defaultActiveKey='default'>
        <Row>
          <Col md={{ span: 14 }}>
            <div className="small" style={styles.iconDetails}>
              {showPublished() && (
                <span id="accessAllowed" style={styles.iconSpecific}>
                  <MdCloudQueue /> Published
                </span>
              )}
              {actionStatus.status==='started' &&
                <>
                  <Spinner as="span" animation="grow" size="sm" />
                  <span>{actionStatus.type}</span>
                </>
              }
            </div>
          </Col>
        </Row>
        <Row>
          <Col md={{ span: 14 }} style={{ height: 400 }}>
            <FileBrowser
              files={files}
              folderChain={folderChain}
              onFileAction={handleFileAction}
              {...((isCustodian && hideUnpublish()) && {fileActions:[...customActions, publishS3ObjectAction]})}
              {...((isCustodian && hidePublish()) && {fileActions:[...customActions, unpublishS3ObjectAction]})}
              {...((!isCustodian && hasAccess && {fileActions:[downloadS3ObjectAction]}))}
            >
              <FileNavbar />
              <FileToolbar />
              <FileList />
              <FileContextMenu />
            </FileBrowser>
            <Button
              id="nextPageButton"
              size="sm"
              hidden={!currentFolder.token || loading}
              block variant="outline-light"
              style={{ borderColor: '#d8d8d8', color: '#aaa', border: 'none' }}
              onClick={() => {
                if (currentFolder.id !== 'Root') {
                  setParams({token: getToken(currentFolder), prefix: getPrefix(currentFolder)});
                } else {
                  setParams({token: getToken(currentFolder), prefix: ''});
                }
              }}
            >
              Next 20
              <MdKeyboardArrowDown size="25" />
            </Button>
          </Col>
          <Col md={{ span: 10 }} style={{ borderLeft: '1px solid #ccc', minHeight: `140px` }}>
            <Tab.Content style={{height: '100%'}}>
              <Tab.Pane eventKey="default" style={{ boxShadow: 'none' }}><i className="text-muted">Select a file for more details...</i></Tab.Pane>
              <Tab.Pane eventKey="folder" style={{ boxShadow: 'none' }}><i className="text-muted">Double-click a folder to load contents...</i></Tab.Pane>
              {nonNullFiles.map(({id = '', modDate = '', size = '0', name = 'No name', isDir = false}) => {
                  return (
                    <Tab.Pane key={id} eventKey={`file-${id}`} style={{ boxShadow: 'none', wordWrap: 'break-word', minHeight: '100%'}} >
                      {!isDir &&
                          <>
                            <Button
                                id='createTable'
                                style={{ float:'right', margin:'5px'}}
                                hidden={!(matchedFileMap[id] ? matchedFileMap[id].schema ? true : false : false)}
                                size='sm'
                                variant='outline-primary'
                                onClick={() => {
                                  const {table} = buildSchemaTable(id);
                                  const datasetEnvironmentName = datasetApprovals.find(app => app.system === 'EDL' && app.approvedBy === 'EDL')?.details?.dataset?.name;
                                  let pathName = s3Name ? 's3://' + s3Name + id : table.StorageDescriptor.Location;
                                  const tableInfo = { datasetEnvironmentName, fileType: table.Parameters.classification, path: pathName, delimiter: table.Parameters.delimiter}
                                  setSelectedForCreateTable({ ...tableInfo })
                                  setShowSelectedForCreateTable(true);
                                }}
                            >
                              Create Table
                            </Button>
                            <Button
                                id='viewSchema'
                                style={{ float:'right', margin:'5px'}}
                                hidden={!(matchedFileMap[id] ? matchedFileMap[id].schema ? true : false : false)}
                                size='sm'
                                variant='outline-primary'
                                onClick={() => {
                                  const {schema, table} = buildSchemaTable(id)
                                  setSelectedSchema({...schema, glueTables: [table]});
                                  setShowSchema(true);
                                }}
                            >
                              View Schema
                            </Button>
                          </>
                      }

                      <h3>Metadata</h3>
                      <Spacer height='10px'/>
                      <b style={{fontSize: '85%'}}>Name: </b>
                      <i className="text-muted small">{name}</i>
                      <Spacer height='6px'/>
                      <b style={{fontSize: '85%'}}>Path: </b>
                      <i className="text-muted small">{id}</i>
                      &nbsp;&nbsp;
                      {!isDir &&
                        <>
                          <Spacer height='6px'/>
                          <b style={{fontSize: '85%'}}>Modified: </b>
                          <i className="text-muted small">{utils.formatDate(modDate)}</i>
                          <Spacer height='6px'/>
                          <b style={{fontSize: '85%'}}>Size: </b>
                          <i className="text-muted small">{fileSize(size)}</i>
                        </>
                      }
                      {(size > maxDownloadSize) &&
                        <>
                        <Spacer height='6px'/>
                        <i className="text-danger small">File size exceeds 500 MB download limit.</i>
                        </>
                      }
                    </Tab.Pane>
                  )
              })}
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </>
  )
};

export default FileExplorer;
