import React, { useState, useCallback, useMemo, useRef } from "react";
import { Button, Modal, ProgressBar, Row, Col, Container, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import {
  FaFile,
  FaTrashAlt,
  FaFileUpload,
  FaRegTimesCircle,
  FaFilePdf,
  FaFileCode,
  FaFileCsv,
  FaFileWord,
  FaFileImage,
  FaFileVideo,
  FaFileAudio,
  FaFilePowerpoint,
  FaFileArchive,
  FaFileExcel,
} from "react-icons/fa";

const defaultStyles = {
  css: <FaFileCode color="#E79627" size="80" />,
  csv: <FaFileCsv color="#3a7003" size="80" />,
  doc: <FaFileWord color="#2C5898" size="80" />,
  docx: <FaFileWord color="#2C5898" size="80" />,
  gif: <FaFileImage color="#26A2C1" size="80" />,
  gz: <FaFileArchive color="#497CE3" size="80" />,
  htm: <FaFileCode color="#E79627" size="80" />,
  html: <FaFileCode color="#E79627" size="80" />,
  ini: <FaFileCode color="#E79627" size="80" />,
  java: <FaFileCode color="#E79627" size="80" />,
  jpeg: <FaFileImage color="#26A2C1" size="80" />,
  jpg: <FaFileImage color="#26A2C1" size="80" />,
  js: <FaFileCode color="#E79627" size="80" />,
  json: <FaFileCode color="#E79627" size="80" />,
  jsx: <FaFileCode color="#E79627" size="80" />,
  mkv: <FaFileVideo color="#b7ff00" size="80" />,
  mp3: <FaFileAudio color="#ffd000" size="80" />,
  mp4: <FaFileVideo color="#b7ff00" size="80" />,
  mpeg: <FaFileVideo color="#b7ff00" size="80" />,
  mpg: <FaFileVideo color="#b7ff00" size="80" />,
  pdf: <FaFilePdf color="#D52A29" size="80" />,
  php: <FaFileCode color="#E79627" size="80" />,
  png: <FaFileImage color="#26A2C1" size="80" />,
  ppt: <FaFilePowerpoint color="#EA7130" size="80" />,
  pptx: <FaFilePowerpoint color="#EA7130" size="80" />,
  py: <FaFileCode color="#E79627" size="80" />,
  rar: <FaFileArchive color="#497CE3" size="80" />,
  svg: <FaFileImage color="#26A2C1" size="80" />,
  tar: <FaFileArchive color="#497CE3" size="80" />,
  wmv: <FaFileVideo color="#b7ff00" size="80" />,
  wpd: <FaFileVideo color="#b7ff00" size="80" />,
  xlr: <FaFileExcel color="#1A754C" size="80" />,
  xls: <FaFileExcel color="#1A754C" size="80" />,
  xlsx: <FaFileExcel color="#1A754C" size="80" />,
  yml: <FaFileCode color="#E79627" size="80" />,
  zip: <FaFileArchive color="#497CE3" size="80" />,
  "7z": <FaFileArchive color="#497CE3" size="80" />,
  zipx: <FaFileArchive color="#497CE3" size="80" />,
};

const baseStyle = {
  cursor: "pointer",
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  paddingTop: "15px",
  paddingRight: "5px",
  paddingLeft: "5px",
  borderWidth: 2,
  borderRadius: 2,
  borderColor: "#eeeeee",
  borderStyle: "dashed",
  backgroundColor: "#fafafa",
  color: "#bdbdbd",
  outline: "none",
};

const activeStyle = {
  borderColor: "#367c2b",
};

const acceptStyle = {
  borderColor: "#00e676",
};

const rejectStyle = {
  borderColor: "#ff1744",
};

const UploadFileModal = (
  { show = false, handleClose, actionStatus, uploadCompleted, datasetBucket = "", environmentName = "", datasetAccount = "", path = "", isAttachment = false }
) => {
  const [ selectedFiles, setSelectedFiles ] = useState(undefined);
  const [ currentFile, setCurrentFile ] = useState(undefined);
  const [ progress, setProgress ] = useState(0);
  const [ message, setMessage ] = useState("");
  const [ disableSubmitBtn, setDisableSubmitBtn ] = useState(false);
  const [ messageClass, setMessageClass ] = useState(" ");
  const cancelFileUpload = useRef(null);
  const [ tooLarge, setTooLarge ] = useState(false);

  const maxSize = 536870912000;

  const onDrop = useCallback((droppedFiles) => {
    setTooLarge(false);
    setMessage('');
    setSelectedFiles(droppedFiles);
  }, []);

  const onDropRejected = useCallback((droppedFiles) => {
    setTooLarge(true);
  }, []);

  const clearState = () => {
    setTooLarge(false);
    if (disableSubmitBtn) {
      handleClose({'uploadModal': false});
      return;
    }
    setSelectedFiles(undefined);
    setCurrentFile(undefined);
    setProgress(0);
    setMessage("");
    setMessageClass(" ");
    handleClose({'uploadModal': false});
  };

  const upload = () => {
    if (!selectedFiles) return;
    let cf = selectedFiles[0];
    if (!cf) return;
    setDisableSubmitBtn(true);
    setProgress(0);
    setCurrentFile(cf);
    actionStatus({
      type: 'Uploading...',
      status: 'started',
      error: false,
      message: ''
    })
    const formData = new FormData();
    if (isAttachment) {
      formData.append("isAttachment", isAttachment)
    }
    else {
      formData.append("datasetBucket", datasetBucket);
      formData.append("environmentName", environmentName);
      formData.append("datasetAccount", datasetAccount);
    }
    formData.append("path", path);
    formData.append("fileSize", cf.size);
    formData.append("file", cf);

    console.log("axios upload file start", new Date());
    cancelFileUpload.current = axios.CancelToken.source();

    cancelFileUpload?.current?.token?.promise
        .then((cancel) => {
          console.log("Cancelled : ", cancel.message);
        })
        .catch((err) => {
          console.log('Cancel token error:', err.message);
        });


    const options = {
      cancelToken: cancelFileUpload?.current?.token,
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload progress: ${progress}%`);
        setProgress(progress);
      },
    };

    axios.post(`/api/datasets/upload-file`, formData, options)
      .then((response) => {
        console.log(`Uploaded the file ${cf.name}`)
        setMessageClass("text-success");
        setMessage("Successfully uploaded");
        setTimeout(() => {
          setSelectedFiles(undefined);
          setCurrentFile(undefined);
          setProgress(0);
          setMessage("");
          setDisableSubmitBtn(false);
        }, 1000);

        uploadCompleted(`${cf.name}-${new Date().getTime()}`);

        actionStatus({
          type: 'Upload',
          status: 'completed',
          error: false,
          message: `uploaded-${cf.name}-${new Date().getTime()}`
        })
      })
      .catch((err) => {
        if (axios.isCancel(err)) {
          setMessage(err.message);
          setCurrentFile(undefined);
          setDisableSubmitBtn(false);
          actionStatus({
            type: 'noType',
            status: '',
            error: false,
            message: ''
          })
        } else {
          setProgress(0);
          setMessageClass("text-danger");
          setMessage("Could not upload the file!");
          setCurrentFile(undefined);
          setDisableSubmitBtn(false);
          actionStatus({
            type: 'noType',
            status: '',
            error: false,
            message: ''
          })
        }
      });
  };

  const cancelUpload = () => {
    if (cancelFileUpload.current) {
      cancelFileUpload.current.cancel("User has cancelled");
    }
  };

  const fileIcon = (name) => {
    const iconType = name.slice((Math.max(0, name.lastIndexOf(".")) || Infinity) + 1).toLowerCase();
    const ret = defaultStyles[iconType];
    if (ret) {
      return ret;
    }
    return <FaFile color="#7A8387" size="80" />;
  };

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({ onDrop, multiple: false, maxSize, onDropRejected });
  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isDragActive ? activeStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isDragActive, isDragReject]
  );

  const remove = () => {
    setSelectedFiles(undefined);
    setMessage("");
  };
  const acceptedFilesItems = selectedFiles
    ? selectedFiles.map((file) => (
        <Col key={file.path}>
          <Row className="file-icon" key="file-icon">
            <Col className="float-left">{fileIcon(file.name)}</Col>
            <Col>
              {!disableSubmitBtn ? (
                <OverlayTrigger placement="bottom" overlay={<Tooltip id="button-tooltip-2">Remove File</Tooltip>}>
                  <button className="delete float-right bg-transparent" style={{ border: "none" }} variant="outline-dark" onClick={remove}>
                    <FaTrashAlt size="15" />
                  </button>
                </OverlayTrigger>
              ) : null}
            </Col>
          </Row>
          <Row key="file-path">
            <Col className="float-left ml-2">
              <span>{file.name} </span>
            </Col>
          </Row>
          <Row key={file.size}>
            <Col className="ml-2">
              <small>{(file.size / 1000).toFixed(2)} Kb</small>
            </Col>
          </Row>
        </Col>
      ))
    : null;

  return (
    <Modal show={show} backdrop="static">
      <Modal.Header>
        <Modal.Title>File Upload</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ overflowY: "hidden" }}>
        <Container>
          <Row>
            <Col md={{ span: 10 }}>
              <div className="upload-file" {...getRootProps({ style })}>
                <input {...getInputProps()} />
                <FaFileUpload size="40" />
                <p className="text-center">Drag & Drop files here or click to select file(s)</p>
              </div>
              {tooLarge && <div className="text-danger mt-2">Maximum upload file size: 500Gb.</div>}
            </Col>
            <Col md={{ span: 14 }}>
              <Row className="accepted-files">{acceptedFilesItems}</Row>
              {currentFile ? (
                <Row>
                  <Col xs={20} md={18} className="my-auto ml-2" key="progressbar">
                    <ProgressBar className="upload-file-progressbar" variant="success" style={{ flex: 1, height: 10 }} now={progress} max={95} />
                  </Col>
                  <Col xs={2} md={2} key="upload-cancel">
                    {/* <OverlayTrigger placement="bottom" overlay={<Tooltip id="button-tooltip-2">Cancel Upload</Tooltip>}> */}
                      <button className="delete float-right bg-transparent" style={{ border: "none" }} variant="outline-dark" onClick={() => cancelUpload()}>
                        <FaRegTimesCircle size="15" />
                      </button>
                    {/* </OverlayTrigger> */}
                  </Col>
                </Row>
              ) : null}
              <Row>
                <Col>
                  <div className={`upload-message ${messageClass}`}>{message}</div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" className="close-btn" onClick={clearState}>
          Close
        </Button>
        <Button variant="primary" onClick={upload} disabled={disableSubmitBtn}>
          {disableSubmitBtn ? "Uploading..." : "Upload"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UploadFileModal;
