import {Form, Col, Card, InputGroup, Button, Toast} from 'react-bootstrap';
import ValidatedInput from '../ValidatedInput';
import ConfirmationModal from '../ConfirmationModal';
import React, {useEffect, useState} from 'react';
import {FaEyeSlash, FaEye} from 'react-icons/fa';
import {getSharepointToken, getSharepointLists, getSharepointFolders, getSharepointFilesFolder} from '../../apis/sharepoint';
import Select from '../Select';
import Spacer from '../Spacer';

const styles = {
  card: {
    minHeight: '250px',
    overflow: 'visible',
  },
  sharepointListOptions: {
    color: 'green',
    float: 'right',
    right: '5px',
    position: 'right',
    marginTop: '10px',
  }
};

const SharepointUIForm = ({handleSharepointDetails, isInValid = () => {}}) => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [siteUrl, setSiteUrl] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [isFormComplete, setIsFormComplete] = useState(false);
  const [accessVerified, setAccessVerified] = useState(false);
  const [sharepointLists, setSharepointLists] = useState([]);
  const [displayType, setDisplayType] = useState('list');
  const [selectedItems, setSelectedItems] = useState([]);
  const [docFolder, setDocFolder] = useState('');
  const [fileFolders, setFileFolders] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [modalBody, setModalBody] = useState(null);
  const [fileDestinationDir, setFileDestinationDir] = useState('');
  const [errors, setErrors] = useState({key: ""})
  const [showToast, setShowToast] = useState(false);
  const clearState = () => {
    setFileDestinationDir("");
    setErrors({key: ""})
  };

  const createOptions = name => ({id: name, name});
  const sharepointListOptions = sharepointLists.filter(item => item.DocumentTemplateUrl == null && item.EntityTypeName.endsWith("List")).map(item => {
    return item.Title
  }).filter(v => !!v).map(createOptions);
  const sharepointDocOptions = sharepointLists.filter(item => item.DocumentTemplateUrl != null).map(item => {
    return {id: item.EntityTypeName.replace("_x0020_", " "), name: item.Title}
  }).filter(v => !!v);
  const sharepointFolderOptions = fileFolders.filter(v => !!v).map(createOptions);
  const sharepointFileOptions = fileList.filter(v => !!v).map(createOptions);

  const showPassHandler = (event) => {
    event.preventDefault();
    setShowPass(!showPass);
  };

  const handleListChange = (values) => {
    const lists = values ? values.map(value => value.name) : [];
    setSelectedItems(lists);
  }

  const getDisplayType = (type) => {
    setDocFolder('');
    setFileFolders([]);
    setFileList([]);
    handleListChange([]);
    setDisplayType(type)
  }

  useEffect(() => {
    if (!!clientId && !!clientSecret && !!siteUrl && !!tenantId) {
      setIsFormComplete(true);
    } else setIsFormComplete(false);
  }, [clientId, clientSecret, siteUrl, tenantId]);

  useEffect(() => {
    handleSharepointDetails({
      clientId,
      clientSecret,
      siteUrl,
      tenantId,
      displayType,
      selectedItems: displayType === 'list' ? selectedItems.toString() : selectedItems.map(item => `${item}`).toString(),
      docFolder,
      fileDestinationDir
    })
  }, [clientId, clientSecret, siteUrl, tenantId, displayType, selectedItems, docFolder, fileDestinationDir]);

  const loadSharepointFolders = async (sharepointLibrary) => {
    try {
      setDocFolder('');
      setFileFolders([]);
      setFileList([]);
      handleListChange([]);
      const sharepointToken = await getSharepointToken(clientId, clientSecret, tenantId);
      const folderList = await getSharepointFolders(sharepointToken, siteUrl, sharepointLibrary.name);
      setDocFolder(sharepointLibrary.id);
      const arrayFolders = folderList.filter(item => item.FileSystemObjectType === 1).map(item => item.FileRef);
      let allFoldersWithFiles = []
      await folderList.map(item => {
        const filepath = trimStringAfter(item.FileRef, "/");
        return (!arrayFolders.includes(filepath)) ? allFoldersWithFiles.push(item.FileRef) : ""
      });
      function trimStringAfter(value, limiter) {
        const lastIndex = value.lastIndexOf(limiter)
        return value.substring(0, lastIndex === -1 ? value.length : lastIndex)
      }
      allFoldersWithFiles = allFoldersWithFiles.concat(arrayFolders)
      const uniquefileFolderValue =  ([...new Set(allFoldersWithFiles)]).filter(v => !!v);
      setFileFolders(uniquefileFolderValue);
    } catch (error) {
      console.error("loadSharepointFolders", error);
    }
  };

  const loadSharepointFiles = async (sharepointFolder) => {
    try {
      setFileList([]);
      handleListChange([]);
      const splitPath = sharepointFolder.name.split('/').pop();
      if (splitPath.includes('.')) {
        const values = [{'id': splitPath, 'name': splitPath}]
        const pathValueLibrary = sharepointFolder.name.split("/").at(-2)
        setDocFolder(pathValueLibrary);
        handleListChange(values)
      } else {
        setSelectedItems([]);
        const sharepointToken = await getSharepointToken(clientId, clientSecret, tenantId);
        const fileList = await getSharepointFilesFolder(sharepointToken, siteUrl, sharepointFolder.name);
        const fileListName = !!fileList.Files.length ? fileList.Files.map(item => item.Name) : [];
        //For folder to get visible in the last folder, uncomment below two lines.
        // const folderListName = !!fileList.Folders.length ? fileList.Folders.map(item => item.Name) : [];
        // const fileFolderValue = (fileListName.concat(folderListName)).filter(v => !!v);
        const pathValue = sharepointFolder.name.split("/").slice(-2).join('/')
        setDocFolder(pathValue);
        //If also want to show folders pass fileFolderValue instead of fileListName in below line.
        setFileList(fileListName);
      }
    } catch (error) {
      console.error("loadSharepointFiles", error);
    }
  };

  const verifyAccess = async () => {
    try {
      const sharepointToken = await getSharepointToken(clientId, clientSecret, tenantId);
      const sharepointList = await getSharepointLists(sharepointToken, siteUrl);
      setSharepointLists(sharepointList);
      setAccessVerified(true);
    } catch (error) {
      setShowToast(true);
      console.error("Access Denied", error);
    }
  };
  const handleChange = (event) => {
    if (event.target.value != "") {
      validate(event.target.value);
    } else {
      clearState();
    }
  };

  const validate = (str) => {
    let pattern = /^([a-zA-Z0-9!_.*'()&$@=;:\+,?-]+(\/|\s)*[a-zA-Z0-9!_.*'()&$@=;:\+,?-]*)+(\/[a-zA-Z0-9!_.*'(/)&$@=;:\+,?-\s]+)*$/g;
    if (!pattern.test(str)) {
      setErrors({key: "Invalid Destination"});
    } else {
      setErrors({key: ""});
    }
  }

  return (
    <>
      <ConfirmationModal id="workflow-create-form-error"
                         show={!!modalBody}
                         showAcceptOnly={true}
                         acceptButtonText="OK"
                         body={(modalBody || {}).body}
                         onAccept={() => setModalBody(null)}
      />
      <Form.Row>
        <Form.Group as={Col} className="mb-0">
          <h4>Sharepoint Configuration</h4>
        </Form.Group>
      </Form.Row>
      <Form.Group hidden={accessVerified}>
        <Card style={styles.card}>
          <Card.Body className="bg-light">
            <Form.Row>
              <Form.Group as={Col}>
                <Form.Label>Client Id</Form.Label>
                <InputGroup>
                  <ValidatedInput
                    component={Form.Control}
                    id="clientId"
                    type="text"
                    placeholder="Client Id"
                    defaultValue={clientId}
                    onBlur={(e) => setClientId(e.target.value)}
                    invalidMessage="Must provide Client Id"
                    isInvalid={isInValid('clientId')}
                  />
                </InputGroup>
              </Form.Group>
              <Form.Group as={Col}>
                <Form.Label>Client Secret</Form.Label>
                <InputGroup>
                  <ValidatedInput
                    component={Form.Control}
                    id="clientSecret"
                    type={showPass ? 'text' : 'password'}
                    defaultValue={clientSecret}
                    onBlur={(e) => setClientSecret(e.target.value)}
                    invalidMessage="Must provide password"
                    isInvalid={isInValid('clientSecret')}
                  />
                  <Button onClick={showPassHandler} variant="outline-primary" id="showPassButton">
                    {showPass ? <FaEyeSlash/> : <FaEye/>}
                  </Button>
                </InputGroup>
              </Form.Group>
            </Form.Row>
            <Form.Row>
              <Form.Group as={Col}>
                <Form.Label>Sharepoint Url</Form.Label>
                <ValidatedInput
                  component={Form.Control}
                  id="siteUrl"
                  type="text"
                  placeholder="Site Url"
                  defaultValue={siteUrl}
                  onBlur={(e) => setSiteUrl(e.target.value)}
                  invalidMessage="Must provide Sharepoint URL"
                  isInvalid={isInValid('siteUrl')}
                />
              </Form.Group>
              <Form.Group as={Col}>
                <Form.Label>Tenant Id</Form.Label>
                <ValidatedInput
                  component={Form.Control}
                  id="tenantId"
                  type={showPass ? 'text' : 'tenantId'}
                  placeholder="Tenant Id"
                  defaultValue={tenantId}
                  onBlur={(e) => setTenantId(e.target.value)}
                  invalidMessage="Must provide Tenant Id"
                  isInvalid={isInValid('tenantId')}
                />
              </Form.Group>
            </Form.Row>
            <Button
              disabled={!isFormComplete}
              onClick={verifyAccess}
              size="sm"
              variant="outline-primary"
              id="verifyAccess"
            >
              Verify Access
            </Button>
          </Card.Body>
        </Card>
      </Form.Group>
      {accessVerified &&
        <Form.Row>
          <Spacer height="20px"/>
          <Form.Check
            id="mdi-lists"
            name="mdi-source-type-radio"
            type="radio"
            label="Lists"
            defaultChecked={true}
            onClick={() => getDisplayType('list')}
            custom
          />
          <Form.Check
            id="mdi-files"
            name="mdi-source-type-radio"
            type="radio"
            label="Files"
            onClick={() => getDisplayType('file')}
            custom
          />
        </Form.Row>
      }
      {accessVerified && displayType === 'list' &&
        <>
          <Spacer height="20px"/>
          <Form.Group as={Col}>
            <Col>
              <Form.Group>
                <h5>Sharepoint Lists</h5>
                <ValidatedInput
                  component={Select}
                  placeholder="Choose one or more lists to sync"
                  onChange={value => {
                    handleListChange(value)
                  }}
                  options={sharepointListOptions}
                  isMulti
                  id="listSelect"
                  invalidMessage="Must provide Sharepoint Lists"
                  isInvalid={isInValid('selectedItems')}
                />
              </Form.Group>
            </Col>
          </Form.Group>
        </>
      }
      {accessVerified && displayType === 'file' &&
        <>
          <Spacer height="20px"/>
          <Form.Group as={Col}>
            <Col>
              <Form.Group>
                <h5>Document Library</h5>
                <ValidatedInput
                  component={Select}
                  placeholder="Choose Document Library Name"
                  onChange={value => {loadSharepointFolders(value)}}
                  options={sharepointDocOptions}
                  id="libSelect"
                  invalidMessage="Must provide Document Library"
                  isInvalid={isInValid('docFolder')}
                />
              </Form.Group>
            </Col>
          </Form.Group>
          {!!docFolder &&
            <Form.Group as={Col}>
              <Col>
                <Form.Group>
                  <h5>Library Folders</h5>
                  <ValidatedInput
                    component={Select}
                    placeholder="Choose Folder"
                    onChange={value => {loadSharepointFiles(value)}}
                    options={sharepointFolderOptions}
                    id="folderSelect"
                    invalidMessage="Must provide Library Folder"
                    isInvalid={isInValid('selectedItems')}
                  />
                </Form.Group>
              </Col>
            </Form.Group>
          }
          {!!fileList.length &&
            <Form.Group as={Col}>
              <Col>
                <Form.Group>
                  <h5>File Folders</h5>
                  <ValidatedInput
                    component={Select}
                    placeholder="Choose File"
                    onChange={value => {handleListChange(value)}}
                    options={sharepointFileOptions}
                    id="fileSelect"
                    isMulti
                    invalidMessage="Must provide File folders"
                    isInvalid={isInValid('selectedItems')}
                  />
                </Form.Group>
              </Col>
            </Form.Group>
          }
        </>
      }
      {accessVerified &&
        <Form.Group>
          <Form.Label>File Destination (Optional)</Form.Label>
          <ValidatedInput
            component={Form.Control}
            id="fileDestinationDir"
            type="text"
            placeholder="Enter the destination"
            onBlur={(e) => setFileDestinationDir(e.target.value)}
            onChange={(e) => handleChange(e)}
            isInvalid={errors.key}
            invalidMessage={errors.key}
          />
        </Form.Group>
      }
      <Toast
        hidden={!showToast}
        show={showToast}
        onClose={() => setShowToast(false)}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          borderColor: '#c21020',
        }}
      >
        <React.Fragment>
          <Toast.Header>
            <strong className="mr-auto">Access Denied.</strong>
          </Toast.Header>
          <Toast.Body>Please make sure you entered right credentials</Toast.Body>
        </React.Fragment>
      </Toast>
    </>
  )
}

export default SharepointUIForm;
