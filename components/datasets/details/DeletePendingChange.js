import { useState } from "react";
import { Button } from 'react-bootstrap';
import datasetsApi from "../../../apis/datasets";
import ErrorModal from "../../approvals/ErrorModal";

const DeletePendingChange = ({ dataset }) => {
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [pendingErrorMessage, setPendingErrorMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(null);

    const showErrorModal = (message) => {
        setPendingErrorMessage(message);
        setIsErrorModalOpen(true);
    };

    const handleErrorModalClose = () => {
        setIsErrorModalOpen(false);
        setPendingErrorMessage(null);
    };

    async function handleDelete({ id, version }) {
        setIsLoading(true);
        const deleteResponse = await datasetsApi.deleteApprovalRequest(id, version);
        if (deleteResponse.ok) {
            window.location.reload(false);
        } else {
            setIsLoading(false);
            const errorResponse = await deleteResponse.json();
            showErrorModal({ title: 'Failed to delete request.', description: errorResponse.error })
        }
    }

    return (
        <>
            <Button
                style={{ position: 'absolute', right: '10px', top: '9px' }}
                size="sm"
                variant="warning"
                id={'deletePending'}
                disabled={isLoading}
                onClick={() => { handleDelete(dataset) }}
            >
            {isLoading ? 'Loading...' : 'Delete Pending Changes'}
            </Button>
            <ErrorModal
                isOpen={isErrorModalOpen}
                message={pendingErrorMessage}
                onRequestClose={handleErrorModalClose}
            />
        </>
    )
};

export default DeletePendingChange;
