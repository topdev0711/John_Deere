// Unpublished Work © 2022 Deere & Company.
import {useState} from "react";
import {Button} from "react-bootstrap";
import {MdCheck} from "react-icons/md";
import ApprovalsConfirmationModal from "./ApprovalsConfirmationModal";


const ApproveButton = ({item, isUpdating, handleApproval}) => {

  const [modal, setModal] = useState(null);

  const pendingDeleteModalBody = () => {
    return (
      <div id="pending-delete-approval-modal">
        <div>Are you sure you want to approve this request?</div>
        <br/>
        <div className="text-muted"><i>Doing so will permanently delete <b style={{color: "Red"}}>{item.name} </b> from
          EDL Data Catalog and EDL.</i></div>
      </div>
    )
  }

  const otherPendingApprovalModalBody = () => {
    return (
      <div id="pending-approval-modal">
        <div>Are you sure you want to approve this request?</div>
        <br/>
        <div className="text-muted"><i>{item.name}</i></div>
      </div>
    )
  }

  const setModalBody = () => !!item.isPendingDelete ? pendingDeleteModalBody() : otherPendingApprovalModalBody();

  return (
    <span>
      <ApprovalsConfirmationModal modal={modal} setModal={setModal}/>
      <Button
        id="approve-button"
        disabled={!(item.loggedInUserIsPendingApprover || item.loggedInUserIsOwner) || isUpdating}
        hidden={!(item.loggedInUserIsPendingApprover || item.loggedInUserIsOwner)}
        variant="outline-success"
        size="sm"
        onClick={() => setModal({
          onAccept: handleApproval,
          body: setModalBody()
        })}
      >
        <MdCheck/>
      </Button>
  </span>
  )
}

export default ApproveButton;
