import React, { useState } from "react";
import { Button, Modal, InputGroup, FormControl,Form, DropdownButton, Dropdown, Spinner} from "react-bootstrap";
import ValidatedInput from '../../ValidatedInput';

const MoveObjectModal = (
  { show = false, handleClose, s3Object,moveCompleted, datasetBucket = "", datasetAccount = "", actionStatusForMove }
) => {
  const [updatedKey, setUpdatedKey] = useState("");
  const [errors,setErrors]=useState({
    key:""
  })
  const clearState = () => {
    handleClose({ moveModal: false });
    setUpdatedKey("");
    setErrors({
      key:""
    })
  };

  const moveS3Object = async () => {
    actionStatusForMove({
      type: 'Moving...',
      status: 'started',
      error: false,
      message: ''
    });
    handleClose({ moveModal: false });
    const res = await fetch(`/api/datasets/move-file`, {
      credentials: "same-origin",
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bucket: datasetBucket,
        oldFilePath: s3Object,
        newFilePath: updatedKey,
        account: datasetAccount,
    }),
  });
  if (res.ok) {
    actionStatusForMove({
      type: 'Move',
      status: 'completed',
      error: false,
      message: `moved/renamed-${s3Object}-${new Date().getTime()}`
    });
    moveCompleted(`moved-${s3Object}-${new Date().getTime()}`);
    clearState();
  } else {
    actionStatusForMove({
      type: 'Move',
      status: 'failed',
      error: true,
      message: `Error while moving/renaming file - ${s3Object}`
    });
    clearState();
  }

}

  const handleChange = (event) => {
    if (event.target.value === s3Object) setUpdatedKey("");
    else {
      validate(event.target.value);
      event.target.value.endsWith("/") ? setUpdatedKey(event.target.value+s3Object) : setUpdatedKey(event.target.value);
    }
  };

  const validate=(str)=>{
    let pattern=/^([a-zA-Z0-9!_.*'()&$@=;:\+,?-]+(\/|\s)*[a-zA-Z0-9!_.*'()&$@=;:\+,?-]*)+(\/[a-zA-Z0-9!_.*'(/)&$@=;:\+,?-\s]+)*$/g;
    if(!pattern.test(str)){
      setErrors({key:"Invalid Destination"});
    }
    else{
      setErrors({key:""});
    }
  }

  return (
    <Modal show={show} backdrop="static">
      <Modal.Header>
        <Modal.Title>Move</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ overflowY: "hidden" }}>
        <div>
         You can move as well as rename a file by specifying the new destination.
        </div>
        <br></br>
        <InputGroup className="mb-3">
          <InputGroup.Prepend>
            <InputGroup.Text>Destination</InputGroup.Text>
          </InputGroup.Prepend>

          <ValidatedInput
            type="text"
            id="updatedKey"
            defaultValue={s3Object}
            component={Form.Control}
            placeholder="Enter the destination"
            onChange={(e) => handleChange(e)}
            isInvalid={errors.key}
            isValid={!errors.key}
          />
          <Form.Control.Feedback type="invalid">{errors.key}</Form.Control.Feedback>
        </InputGroup>
        {updatedKey ? (
          <div>
            <ul>
              <li key="existing-key">
                Existing Location:{" "}
                <b>
                  <del>{s3Object}</del>
                </b>
              </li>
              <li key="new-key">
                New Location: <b>{updatedKey}</b>
              </li>
            </ul>
          </div>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" className="close-btn" onClick={clearState}>
          Cancel
        </Button>
        <Button variant="primary" onClick={moveS3Object} disabled = {!!errors.key}>
          Ok
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MoveObjectModal;
