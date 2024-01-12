import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

export default class ConfirmationModal extends React.Component {

  render() {
    return (
      <Modal show={this.props.show}>
        {this.props.title &&
          <Modal.Header>
            <Modal.Title>
              {this.props.title}
            </Modal.Title>
          </Modal.Header>
        }
        <Modal.Body>{this.props.body}</Modal.Body>
        <Modal.Footer>
          <Button hidden={this.props.showAcceptOnly} onClick={this.props.onCancel} variant="secondary">{this.props.cancelButtonText || 'No'}</Button>
          <Button onClick={this.props.onAccept} variant="primary">{this.props.acceptButtonText || 'Yes'}</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
