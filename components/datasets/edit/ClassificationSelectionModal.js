import React from "react";
import { Modal, Button } from "react-bootstrap";
import ClassificationDetail from "../../ClassificationDetail";
import Spacer from "../../Spacer";
import gicps from "../../../src/data/reference/gicp.json";

const disabledGicps = gicps.filter(gicp => !gicp.enabled).map(filteredGicp => filteredGicp.id);
export default class ClassificationSelectionModal extends React.Component {
  state = {
    selections: []
  }

  render() {
    const { selections } = this.state
    const { dataset, show, onCancel, onAccept } = this.props
    const modifiedClassifications = dataset.classifications?.flatMap(classification => {
      if (disabledGicps.some((i) => i === classification?.gicp?.id) ) {
        classification.gicp = {}
      }
      return [classification]
    })
    const selectAll = () => {
      this.setState({ selections: modifiedClassifications })
    }

    const deselectAll = () => {
      this.setState({ selections: [] })
    }

    return (
      <Modal show={show} onHide={onCancel} size="xl" className="modal-xl-90ht">
        <Modal.Header closeButton>
          <Modal.Title>Copy Classifications</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-muted" style={{ marginLeft: '20px', marginTop: '5px' }}>
            For convenience, you may optionally select classifications from <i>{dataset.name}</i> and copy them to this dataset.
            <Spacer height="15px"/>
            <div style={{marginTop: '3px'}}><a href="javascript:void" onClick={selectAll}>select all</a>&nbsp;&nbsp;<a href="javascript:void" onClick={deselectAll}>deselect all</a></div>
          </div>
          <ClassificationDetail
            selectable
            onSelect={(selections) => {
              this.setState({ selections })
            }}
            selected={selections.map(({id}) => id)}
            items={modifiedClassifications}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            this.setState({ selections: [] })
            onCancel()
          }}>
            Skip
          </Button>
          <Button disabled={!selections.length} variant="primary" onClick={() => {
            this.setState({selections: []})
            onAccept(selections)
          }}>
            Copy Selected Classifications
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
