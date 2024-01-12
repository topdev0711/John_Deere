import React from 'react'
import Router from 'next/router'
import { Modal, Spinner, Button } from "react-bootstrap"
import DatasetDetail from '../pages/catalog/datasets/detail'

export default class DatasetModal extends React.Component {
  render() {
    const { dataset, show, onCancel, isLoading } = this.props
    return (
      <Modal show={show} onHide={onCancel} size="xl" className="modal-xl-90ht">
        <Modal.Header closeButton>
          <Modal.Title>Dataset Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!!dataset &&
            <DatasetDetail initialId={dataset.id} initialVersion={dataset.version} breadcrumbHidden buttonsHidden />
          }
          {!!isLoading &&
            <div className="text-muted small" align="center">
              <Spinner className="spinner-border uxf-spinner-border-md" animation="border" role="status">
                <span className="sr-only">Loading...</span>
              </Spinner>
            </div>
          }
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onCancel}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              Router.push(`/catalog/datasets/detail?id=${(dataset || {}).id}`)
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
