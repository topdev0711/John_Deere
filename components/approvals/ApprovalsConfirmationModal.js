// Unpublished Work © 2022 Deere & Company.
import ConfirmationModal from "../ConfirmationModal";

const ApprovalsConfirmationModal = ({modal, setModal}) => {

  return (
    <ConfirmationModal
      show={!!modal}
      showAcceptOnly={(modal || {}).showAcceptOnly}
      acceptButtonText={(modal || {}).acceptButtonText}
      body={(modal || {}).body}
      onCancel={() => setModal(null)}
      onAccept={() => {
        setModal(null);
        modal.onAccept()
      }}/>
  )
}

export default ApprovalsConfirmationModal;