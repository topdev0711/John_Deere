import React, { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useRouter } from 'next/router';

const PermissionListModal = (
  { show = false, onCancel, id, permissions, isViewRequest = false }
) => {
  const router = useRouter();
 
  const names = permissions.map(({name}) => name).sort((a, b) => a.localeCompare(b));
  return (
    <Modal show={show} backdrop="static" onHide={onCancel}>
      <Modal.Header>
      <Modal.Title>You already have access to this {isViewRequest ? 'view' : 'dataset'} provided by the following permissions</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {
          names.length > 0 && (
            <ul>
              {names.map((name) => (
                <li>{name}</li>
              ))}
            </ul>
          )
        }
        
      </Modal.Body>
      <Modal.Footer>
      <div>Are you sure you want to add a new permission?</div>
        <Button variant="secondary" className="close-btn" onClick={onCancel}>
          No
        </Button>
        <Button 
          variant="primary" 
          onClick={() => {
            router.push(isViewRequest ? `/catalog/permissions/request?sourceView=${id}&isViewRequest=true` : `/catalog/permissions/request?sources=${id}`);
            onCancel();
          }}
        >
          Yes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PermissionListModal;
