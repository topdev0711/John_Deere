import React, {useState} from "react";
import {Button, Modal} from "react-bootstrap";

const NotifyModal = () => {
  const [show, setShow] = useState(false);
  const [notification, setNotification] = useState('');
  const handleClick = () => setShow(false);
  const setModal = notification => {
    setNotification(notification);
    setShow(true);
  }

  const modal = (
    <Modal className="notify-modal" size="lg" show={show} onHide={() => setShow(false)}>
      <Modal.Body>{notification}</Modal.Body>
      <Modal.Footer><Button variant="primary" onClick={handleClick}>OK</Button></Modal.Footer>
    </Modal>
  );

  return [modal, setModal];
}

export default NotifyModal;
