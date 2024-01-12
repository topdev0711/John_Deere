// Unpublished Work © 2022 Deere & Company.
import React, {useState, useEffect, useRef} from "react";
import {Button, Form} from "react-bootstrap";
import {MdClear} from "react-icons/md";
import ConfirmationModal from "../ConfirmationModal";
import RequiredAsterisk from "../utils/RequiredAsterisk";
import ValidatedInput from "../ValidatedInput";

const RejectButton = ({item, isUpdating, handleRejection}) => {

  const [modal, setModal] = useState(null);
    const [comments, setComments] = useState('initial');

    useEffect(() => {
        if(comments.trim() === ''){
            handleClick(true);
        }else if(comments.trim() != '' && comments != 'initial'){
            handleClick(false);
        }
    }, [comments]);

  const handleClick = (displayError) => {
      setModal({
      onAccept: () => {
          if(comments.trim() === '' || comments === 'initial'){
              handleClick(true); //Need to call itself so the popup doesn't close. Sending true to highlight the lines
          } else{
              handleRejection({...item, comments})
          }
      },
      onCancel: () => setComments(''),
      body:
        <div>
          <div>Are you sure you want to reject this request?</div>
          <br/>
          <div className="text-muted"><i>{item.name}</i></div>
          <hr/>
          <div>
            <Form.Label>Comments<RequiredAsterisk/></Form.Label>
              <ValidatedInput
                  component={Form.Control}
                  id="rejectComment"
                  onChange={({ target: { value } }) => setComments(value)}
                  defaultValue={''}
                  row={'5'}
                  as="textarea"
                  data-testid={'validatedInput'}
                  placeholder="Provide feedback with rejection"
                  isInvalid={displayError}
                  invalidMessage="You must provide a reason for rejection"
              />
          </div>
        </div>
    })
  }

  return (
    <span>
      <ConfirmationModal
        show={!!modal}
        data-testid={"confirmationModal"}
        showAcceptOnly={(modal || {}).showAcceptOnly}
        acceptButtonText={(modal || {}).acceptButtonText}
        body={(modal || {}).body}
        onCancel={() => setModal(null)}
        onAccept={() => {
          setModal(null);
          modal.onAccept()
        }}/>
      <Button
        disabled={!(item.loggedInUserIsPendingApprover || item.loggedInUserIsOwner) || isUpdating}
        hidden={!(item.loggedInUserIsPendingApprover || item.loggedInUserIsOwner)}
        variant="outline-danger"
        size="sm"
        data-testid={"rejectButton"}
        onClick={()=>handleClick(false)}>
          <MdClear/>
      </Button>
    </span>
  )
}

export default RejectButton;
