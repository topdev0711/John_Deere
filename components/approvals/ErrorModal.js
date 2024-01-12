import Modal from 'react-modal';
import styles from '../../static/css/ErrorModal.module.css';

const ErrorModal = ({ isOpen, message, onRequestClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Error Modal"
      className={styles.modalContent}
      overlayClassName={styles.modalOverlay}
      ariaHideApp={false}
    >
      <h2>{message && message.title}</h2>
      <p>{message && message.description}</p>
      <div className={styles.buttonWrapper}>
        <button className={styles.okButton} onClick={onRequestClose}>OK</button>
      </div>
    </Modal>
  );
};

export default ErrorModal;
