import React, { useState } from 'react';
import { Modal, Button, Col, Row, Form } from "react-bootstrap"
import ValidatedInput from '../../ValidatedInput'

const CreateTableModal = ({show, onCancel, tableInfo = {}}) => {
  const [databaseName, setDatabaseName] = useState("");
  const [tableName, setTableName] = useState("");
  const [message, setMessage] = useState("");
  const [messageClass, setMessageClass] = useState("");


  const clearState = () => {
    setDatabaseName("")
    setTableName("")
    setMessage("")
    onCancel();
    setMessageClass("");
  };


  const createTable = async() => {
    setMessage('');
    const { datasetEnvironmentName = '', fileType = '', path = '', delimiter = '' } = tableInfo;
    try {
        const response = await fetch('/api/datasets/create-table', {
            credentials: 'same-origin',
            method: 'POST',
            body: JSON.stringify({databaseName, tableName, fileType, datatype: datasetEnvironmentName, path, delimiter}),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result =  await response.json();
            setMessageClass("text-success");
            setMessage(result.message);
        } else {
            const err = await response.json();
            setMessageClass("text-danger");
            try {
                let errorText = JSON.parse(err.error).errorMessage
                if (!errorText) {
                    errorText = JSON.parse(err.error)
                }
                setMessage(errorText);
            } catch (e) {
                setMessage(err.error);
            }
        }
    } catch (e) {
        console.log('Error:', e);
        setMessageClass("text-danger");
        setMessage("Table creation failed! " + e.message);
    }
  };

  return (
    <Modal show={show} onHide={clearState} size="l" className="modal-xl-60ht">
      <Modal.Header closeButton>
        <Modal.Title>Create Table</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="container" >
          <Form.Group as={Row}>
          <div style={{padding: '5px'}}><Form.Label>Database Name</Form.Label></div>
            <Col style={{align:'left'}}>
              <ValidatedInput
                type="text"
                id="databaseName"
                component={Form.Control}
                placeholder="Enter your database name"
                onBlur={(e) => setDatabaseName(e.target.value)}
              />
            </Col>
          </Form.Group>
        </div>
        <div className="container">
          <Form.Group as={Row}>
          <div style={{paddingRight: '35px' ,paddingLeft: '5px'}}><Form.Label>Table Name</Form.Label></div>
            <Col style={{align:'left'}}>
              <ValidatedInput
                type="text"
                id="tableName"
                component={Form.Control}
                placeholder="Enter your table name"
                onBlur={(e) => setTableName(e.target.value)}
              />
            </Col>
          </Form.Group>
        </div>
        <div className={`create-message ${messageClass}`}>{message}</div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={clearState} >
          Close
        </Button>
        <Button id="createTableButton"
          variant="primary"
          onClick={createTable}>
          Create Table
        </Button>
      </Modal.Footer>
    </Modal>
  )
};

export default CreateTableModal;
