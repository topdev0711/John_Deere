// Unpublished Work © 2022 Deere & Company.
import {useState} from 'react';
import {Button} from 'react-bootstrap';
import {MdDelete} from 'react-icons/md';
import ApprovalsConfirmationModal from './ApprovalsConfirmationModal';

const DeleteButton = ({item, isUpdating, handleDelete}) => {
  const [modal, setModal] = useState(null);

  const modalBody = () => {
    return (
      <div>
        <div>Are you sure you want to delete this request?</div>
        <br/>
        <div className="text-muted"><i>{item.name}</i></div>
      </div>
    )
  }

  return (
    <span>
      <ApprovalsConfirmationModal modal={modal} setModal={setModal}/>
      <Button
        disabled={!item.loggedInUserIsCreator || item.status === 'APPROVED' || isUpdating}
        variant="outline-dark"
        size="sm"
        onClick={() => setModal({
          onAccept: handleDelete.bind(this, item.id, item.version, item.type),
          body: modalBody()
        })}
      >
          <MdDelete/>
      </Button>
    </span>
  )
}

export default DeleteButton;
