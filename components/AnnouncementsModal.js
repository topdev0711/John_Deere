import {marked} from "marked";
import {Button, Modal} from "react-bootstrap";
import React from "react";
import styles from "../public/css/components/AnnouncementsModal.module.css";

const Announcement = ({announcement}) => {
  return (
    <>
      <h5>{announcement.title}</h5>
      <em>{announcement.startAt}</em>
      <br/>
      <div className="markdown" as="div" dangerouslySetInnerHTML={{__html: marked(announcement.text)}}/>
      <hr/>
    </>
  )
}

const AnnouncementsModal = ({showAnnouncements, setShowAnnouncements, announcements}) => {
  const announcementsItems  = announcements.map(announcement => <Announcement announcement={announcement} />);
  return (
    <div>
      <Modal show={showAnnouncements} size="xl" scrollable={true} id={"announcementModal"}>
        <Modal.Header>
          <Modal.Title><h3>Announcements</h3></Modal.Title>
        </Modal.Header>
        <Modal.Body className={styles['modal-body']}>
          {announcementsItems}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setShowAnnouncements(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default AnnouncementsModal;
