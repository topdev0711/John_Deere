import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, Col, Table } from 'react-bootstrap';
import { MdAttachFile, MdAttachment, MdAdd, MdDelete } from 'react-icons/md';
import { FaAsterisk } from 'react-icons/fa';
import UploadFileModal from './UploadFileModal';
import uuid from 'uuid';

const styles = {
    meta: {
        display: 'block',
        color: '#777',
        background: '#00000000'
    },
    add: {
        float: 'right',
        marginTop: '-4px',
        whiteSpace: 'nowrap'
    },
    delete: {
        float: 'left'
    },
    nameColumn: {
        width: '500px'
    },
    sizeColumn: {
        width: '50px'
    },
    deleteColumn: {
        width: '50px'
    },
    added: {
        background: '#EAF7E8'
    },
    removed: {
        background: '#FFEEEE'
    },
    tabChanges: {
        fontSize: '10px',
        marginTop: '-4px',
        color: '#e69d00'
    },
    displayAttachments: {
        marginTop: '-5px',
        marginLeft: '-7px'
    }
};

const KB = 1000;
const MB = 1000000;

const Attachments = (
    {
        dataset = {},
        hasAccess = false,
        showDiff = false,
        isEditing = false,
        localStorage = {},
        handleAttachments = () => {} 
    }
) => {
    const initialActionStatus = { type: 'noType', status: '', error: false, message: '' };
    const [actionStatus, setActionStatus] = useState(initialActionStatus);
    const [attachments, setAttachments] = useState([]);
    const [newAttachments, setNewAttachments] = useState([]);
    const [previousAttachments, setPreviousAttachments] = useState([]);
    const [showAttachments, setShowAttachments] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [disableUploadModal, setDisableUploadModal] = useState(false);
    const [deleteObject, setDeleteObject] = useState({});
    const { previousVersion, attachments: datasetAttachments } = dataset;
    const { stagingUuid, deletedAttachments = [] } = localStorage;

    useEffect(() => {
        if (datasetAttachments) setAttachments(datasetAttachments.currentAttachments);
        if (previousVersion) {
            const { attachments: previousDatasetAttachments = [] } = previousVersion;
            setPreviousAttachments(previousDatasetAttachments.currentAttachments);
        }
    }, [])

    useEffect(() => {
        loadStagingAttachments();
    }, [stagingUuid])

    useEffect(() => {
        attachmentLimit();
        handleDuplicates();
    }, [newAttachments, deletedAttachments, attachments, previousAttachments])

    function attachmentLimit() {
        if (attachments && deletedAttachments) {
            if (attachments.length - deletedAttachments.length + newAttachments.length > 4) {
                setShowUploadModal(false);
                setDisableUploadModal(true);
            }
            else if (disableUploadModal) {
                setDisableUploadModal(false);
            }
        }
    }

    function handleDuplicates() {
        const newAttachmentsList = newAttachments.map(attachments => attachments.fileName);
        attachments.map(attachment => {
            if (newAttachmentsList.includes(attachment.fileName) && !deletedAttachments.includes(attachment.fileName)) {
                handleAttachments({ deletedAttachment: attachment.fileName });
            }
        });
    }

    async function loadStagingAttachments() {
        if (stagingUuid) {
            const stagingAttachmentsUrl = `/api/datasets/staged-attachments/${stagingUuid}`;
            const stagingAttachmentsResponse = await fetch(stagingAttachmentsUrl, {
                credentials: 'same-origin'
            });
            const stagingAttachmentsJson = await stagingAttachmentsResponse.json();
            Array.isArray(stagingAttachmentsJson) ? setNewAttachments(stagingAttachmentsJson) : setNewAttachments([]);
            handleAttachments({ newAttachments: stagingAttachmentsJson });
        }
    }

    function compareAttachments(attachments, comparingAttachments, match=false) {
        return attachments.filter(attachment => {
            const isMatch = comparingAttachments.find(a => {
                return a.fileName === attachment.fileName && a.size === attachment.size;
            });
            return match ? isMatch : !isMatch;
        });
    }

    function addFileStatus(attachments, status) {
        const attachmentsWithStatus = attachments.map(values => ({ ...values, status }));
        return attachmentsWithStatus;
    }

    function getAttachmentChanges() {
        const addedAttachments = compareAttachments(attachments, previousAttachments);
        const removedAttachments = compareAttachments(previousAttachments, attachments);
        const unchangedAttachments = compareAttachments(attachments, previousAttachments, true);

        return { 
            added: addFileStatus(addedAttachments, 'added'),
            removed: addFileStatus(removedAttachments, 'removed'),
            unchanged: addFileStatus(unchangedAttachments, 'unchanged')
         };
    }

    function displayAttachmentChanges({ added, removed, unchanged }) {
        const allAttachments = [...added, ...removed, ...unchanged];
        return allAttachments.map(({ key, fileName, bucketName, account, status }, idx) => {
            if (status === 'added') {
                return displayAttachmentOnModal(key, fileName, bucketName, account, idx, styles.added);
            } else if (status === 'removed') {
                return displayAttachmentOnModal(key, fileName, bucketName, account, idx, styles.removed);
            } else {
                return displayAttachmentOnModal(key, fileName, bucketName, account, idx);
            }
        });
    }

    function displayAttachmentOnModal(key, fileName, bucketName, account, idx, displayStyle = styles.meta) {
        return (
            <>
                <span>
                    <Button
                        key={idx}
                        onClick={() => downloadFile(key, fileName, bucketName, account)}
                        style={{ 'whiteSpace': 'nowrap', 'backgroundColor': displayStyle.background }}
                        variant='link'
                    >
                        <MdAttachFile color='black' />{fileName}
                    </Button>
                    <br />
                </span>
            </>
        )
    }

    function displayModalBody(hasAccess, attachments, statusMsg) {
        if ( statusMsg && statusMsg !== 'downloaded') {
            return <div className="text-danger mt-2">{statusMsg}</div>
        } else {
            if (hasAccess) {
                if (showDiff) {
                    return displayAttachmentChanges(getAttachmentChanges())
                } else {
                    return attachments.map(({ key, fileName, bucketName, account }, idx) => {
                        return displayAttachmentOnModal(key, fileName, bucketName, account, idx);
                    })
                }
            } else {
                return (<h5><b>You must have access to the dataset to view/download attachments</b></h5>)
            }
        }
    }

    function displayAttachmentOnList(attachment, staging) {
        return (
            <tr>
                <td style={styles.nameColumn}>{attachment.fileName}</td>
                <td style={styles.sizeColumn}>{fileSize(attachment.size)}</td>
                <td style={styles.deleteColumn}>
                    <Button
                        style={styles.delete}
                        onClick={() => deleteAttachmentModal(attachment.fileName, staging)}
                        size="sm"
                        variant="outline-dark">
                        <MdDelete />
                    </Button>
                </td>
            </tr>
        )
    }

    async function download(key, attachmentsBucket, account) {
        const response = await fetch('/api/datasets/download-file', {
            credentials: 'same-origin',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'key': key,
                'bucket': attachmentsBucket,
                'account': account
            }
        });
        return response;
    }

    async function triggerDownload(response, fileName) {
        const responseBlob = await response.blob();
        let url = window.URL.createObjectURL(responseBlob);
        let fileLink = document.createElement('a');
        fileLink.href = url;
        fileLink.download = fileName;
        fileLink.click();
    }

    async function handleFailure(response) {
        if (response.status == '403') {
            setActionStatus({ type: 'Download', status: 'failed', error: true, message: 'Access Denied' });
        } else {
            const responseJson = await response.json();
            setActionStatus({ type: 'Download', status: 'failed', error: true, message: responseJson.message });
        }
    }

    async function downloadFile(key, fileName, attachmentsBucket, account) {
        setActionStatus({ type: 'Downloading...', status: 'started', error: false, message: '' });
        try {
            const downloadResponse = await download(key, attachmentsBucket, account);
            if (downloadResponse.ok) {
                await triggerDownload(downloadResponse, fileName);
            } else {
                await handleFailure(downloadResponse);
            }
        } catch (err) {
            console.log(err);
            setActionStatus({ type: 'Download', status: 'failed', error: true, message: 'Failed to download the file' });
        }
    }

    const deleteStagedAttachment = async (fileName) => {
        const request = await fetch(`/api/datasets/staged/${stagingUuid}/${fileName}`, {
            credentials: "same-origin",
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json'
            }
        });
        await request.json();
        loadStagingAttachments();
    };

    const deleteAttachmentModal = (fileName, staged) => {
        setDeleteObject({ fileName, staged });
        setShowDeleteModal(true);
    };

    const deleteAttachment = () => {
        const {staged, fileName} = deleteObject;
        if (staged) {
            deleteStagedAttachment(fileName);
        } else {
            handleAttachments({ deletedAttachment: fileName });
        }
        setDeleteObject({});
        setShowDeleteModal(false);
    }

    const showActionCompleted = () => {
        setActionStatus(initialActionStatus);
        loadStagingAttachments();
    };

    const fileSize = (size) => {
        if (size >= KB && size < MB) return Math.round(size / KB * 100) / 100 + " KB";
        if (size >= MB) return Math.round(size / MB * 100) / 100 + " MB";
        else return Math.round(size * 100) / 100 + " B";
    };

    const createStagingUuid = () => {
        if (!localStorage.stagingUuid) {
            handleAttachments({ stagingUuid: uuid.v4() });
        }
    };

    const hasAttachmentsChanges = () => {
        const { added, removed } = getAttachmentChanges(attachments, previousAttachments);
        return !!added.length || !!removed.length;
    }

    return (
        <>
            {!isEditing &&
                <>
                    <span style={styles.meta}>
                        <MdAttachFile size="18" /> <b>Attachments:</b>
                        {attachments && attachments.length ?
                            <Button
                                style={styles.displayAttachments}
                                size="sm"
                                variant="link"
                                hidden={attachments.length === 0}
                                id={'attachments'}
                                onClick={() => setShowAttachments(true)}
                            >
                                <><MdAttachment /> Show attachments ({attachments.length})</>
                                {showDiff && hasAttachmentsChanges() && <> <FaAsterisk style={styles.tabChanges} /></>}
                            </Button>
                            : <i> No attachments</i>}
                    </span>
                    <Modal id={"attachmentsModal"} show={showAttachments} scrollable={true} animation={true}>
                        <Modal.Header>
                            <Modal.Title><h3>Attachments</h3></Modal.Title>
                        </Modal.Header>
                        <Modal.Body style={{ height: '310px' }}>
                            {displayModalBody(hasAccess, attachments, actionStatus.message)}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button
                                onClick={() => {
                                    setShowAttachments(false)
                                    setActionStatus(initialActionStatus)
                                }}>
                                Close
                        </Button>
                        </Modal.Footer>
                    </Modal>
                </>
            }
            {isEditing &&
                <>
                    <Form.Row>
                        <Form.Group as={Col} className="mb-0">
                            <h4>Attachments</h4>
                        </Form.Group>
                        <Form.Group as={Col} className="mb-0">
                            <Button id="addAttachment"
                                style={styles.add}
                                onClick={() => {
                                    createStagingUuid()
                                    setShowUploadModal(true)
                                }}
                                disabled={disableUploadModal}
                                size="sm"
                                variant="outline-primary">
                                <MdAdd /> Add Attachments
                            </Button>
                        </Form.Group>
                    </Form.Row>
                    <hr />
                    {(!!attachments.length || !!newAttachments.length) &&
                        <Table bordered hover>
                            <thead style={{ backgroundColor: '#eee' }}>
                                <tr>
                                    <th>File Name</th>
                                    <th>Size</th>
                                    <th>Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attachments.filter(a => !deletedAttachments.includes(a.fileName)).map(attachment => {
                                    return displayAttachmentOnList(attachment, false)
                                })}
                                {!!newAttachments && newAttachments.map(newAttachment => {
                                    return displayAttachmentOnList(newAttachment, true)
                                })}
                            </tbody>
                        </Table>
                    }
                    <UploadFileModal
                        show={showUploadModal}
                        handleClose={() => {
                            setShowUploadModal(false)
                            setActionStatus(initialActionStatus)
                        }}
                        uploadCompleted={() => showActionCompleted()}
                        path={`/staged/${stagingUuid}`}
                        isAttachment={true}
                        actionStatus={(aStatus) => setActionStatus({ ...actionStatus, ...aStatus })}
                    />
                    <Modal id="deleteModal" show={showDeleteModal} backdrop="static">
                        <Modal.Header>
                            <Modal.Title>Delete</Modal.Title>
                        </Modal.Header>
                        <Modal.Body style={{ overflowY: "hidden" }}>
                            <div>Are you sure you want to delete "<b>{deleteObject.fileName}</b>".</div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button 
                                variant="secondary"
                                className="close-btn"
                                onClick={() => {
                                    setDeleteObject({})
                                    setShowDeleteModal(false)}}>
                                No
                            </Button>
                            <Button
                                variant="primary" 
                                onClick={deleteAttachment}>
                                Yes
                            </Button>
                        </Modal.Footer>
                    </Modal>
                    <br />
                </>
            }
        </>
    )
};

export default Attachments;
