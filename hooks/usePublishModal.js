import {Button, Form, Modal} from "react-bootstrap";
import React, {useState} from "react";
import Router from "next/router";
import {postPublishedPaths} from "../apis/datasets";

const publishNotification = <em>This will allow permitted users to <strong>read</strong> data at these paths.</em>;
const unpublishNotification = <em>This will allow permitted users to <strong>read</strong> data at these paths.</em>

const usePublishModal = (id, version, setNotifyModal) => {
  const [show, setShow] = useState(false);
  const [publicationStatus, setPublicationStatus] = useState('');
  const [notification, setNotification] = useState(undefined);
  const [publishingPaths, setPublishingPaths] = useState(false);
  const [comments, setComments] = useState('');
  const [path, setPath] = useState('');

  const getVisiblePath = () => path === '/' ? 'Root' : path;

  const closePublishModal = () => {
    setShow(false);
    setComments('');
  };

  const updatePublishComments = ({target: {value}}) => setComments(value);

  const getErrorMessage = async response => {
    try {
      const errorResponse = response.json();
      const errorMessage = typeof (errorResponse) === 'object' ? errorResponse.error : errorResponse;
      return errorMessage.replace('{"details":{"message":"', '').replace('"}}', '');
    } catch (e) {
      return `Failed to publish path with status: ${response.statusText}`;
    }
  }

  const createNotification = displayError => (
    <div>
      <div>The submission failed because:</div>
      <br/>
      <div dangerouslySetInnerHTML={{__html: displayError}}/>
    </div>
  );

  function handlePublishError(res) {
    const errorMessage = getErrorMessage(res);
    console.error(errorMessage);
    const displayError = errorMessage.replace('{"details":{"message":"', '').replace('"}}', '');
    const notification = createNotification(displayError);
    closePublishModal();
    setNotifyModal(notification);
  }

  const updatePublishedPaths = async () => {
    setPublishingPaths(true);
    const res = await postPublishedPaths(id, version, path, comments);
    setPublishingPaths(false);

    if (res.ok) Router.push('/approvals');
    else handlePublishError(res);
  }

  const placeholder = "(Optional) Provide details about this request for approvers";
  const handleCancel = () => closePublishModal();
  const handleSubmit = async () => {
    await updatePublishedPaths();
    closePublishModal();
  }

  const publishModal = (
    <Modal size="lg" show={show} onHide={() => setShow(false)}>
      <Modal.Body>
        <div>
          <div>Are you sure you want to {publicationStatus} <strong>{getVisiblePath()}</strong>?</div>
          <div>All child paths will also be published.</div>
          <br />
          <div>{notification}</div>
        </div>
        <div>
          <hr/>
          <div><Form.Control as="textarea" placeholder={placeholder} onChange={updatePublishComments}/></div>
        </div>
      </Modal.Body>
      <Modal.Footer>
      <div>
        <Button variant="secondary" onClick={handleCancel}>No</Button>&nbsp;&nbsp;
        <Button variant="primary" disabled={publishingPaths} onClick={handleSubmit}>Submit for approval</Button>
      </div>
      </Modal.Footer>
    </Modal>
  )

  const setPublishModal = path => {
    setPath(path);
    setShow(true);
    setNotification(publishNotification);
    setPublicationStatus('publish');
  }

  const setUnpublishModal = path => {
    setPath(path);
    setShow(true);
    setNotification(unpublishNotification);
    setPublicationStatus('unpublish');
  }

  return [publishModal, setPublishModal, setUnpublishModal];
}

export default usePublishModal;
