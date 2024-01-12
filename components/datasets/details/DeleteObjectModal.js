import React, { useState } from "react";
import { Button, Modal } from "react-bootstrap";

const DeleteObjectModal = (
  { show = false, handleClose, actionStatus, deleteCompleted, s3Object, datasetBucket = "", environmentName = "", datasetAccount = "" }
) => {

  const clearState = () => {
    handleClose({'deleteModal': false});
  };

  const deleteS3Object = async () => {
    actionStatus({
      type: 'Deleting...',
      status: 'started',
      error: false,
      message: ''
    });
    handleClose({'deleteModal': false});
    const res = await fetch(`/api/datasets/delete-file`, {
      credentials: "same-origin",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Bucket: datasetBucket,
        Key: s3Object,
        datasetAccount,
        environmentName,
      }),
    });
    if (res.ok) {
      actionStatus({
        type: 'Delete',
        status: 'completed',
        error: false,
        message: `deleted-${s3Object}-${new Date().getTime()}`
      });
      deleteCompleted(`deleted-${s3Object}-${new Date().getTime()}`);
    } else {
      actionStatus({
        type: 'Delete',
        status: 'failed',
        error: true,
        message: `Error in deleting - ${s3Object}`
      });
    }
  };

  return (
    <Modal show={show} backdrop="static">
      <Modal.Header>
        <Modal.Title>Delete</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ overflowY: "hidden" }}>
        <div>Are you sure you want to delete "<b>{s3Object}</b>".</div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" className="close-btn" onClick={clearState}>
          No
        </Button>
        <Button variant="primary" onClick={deleteS3Object}>
          Yes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteObjectModal;
