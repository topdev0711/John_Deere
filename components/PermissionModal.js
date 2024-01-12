import React from "react";
import Router from 'next/router';
import { Modal, Button } from "react-bootstrap";
import PermissonDetail from '../pages/catalog/permissions/detail';
global.fetch = require('node-fetch');

export default class PermissionModal extends React.Component {
  render() {
    const { permission, show, onCancel } = this.props

    return (
      <Modal show={show} onHide={onCancel} size="xl" className="permission-modal-xl-100ht">
        <Modal.Header closeButton>
          <Modal.Title>Permission Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!!permission &&
            <PermissonDetail initialPermission={permission} buttonsHidden breadcrumbHidden />
          }
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onCancel}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              Router.push(`/catalog/permissions/detail?id=${(permission || {}).id}`)
              onCancel()
            }}
          >
            View Page
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}