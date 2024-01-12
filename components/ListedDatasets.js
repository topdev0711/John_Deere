
import React from "react";
import { Alert, ListGroup, Spinner } from "react-bootstrap";
import DatasetModal from "./DatasetModal";
import { MdAddCircleOutline} from "react-icons/md";
global.fetch = require('node-fetch');

const styles = {
  drifted: {
    background: '#EAF7E8'
  }
}

const buildDiffIcon = (drifted) => {
  if (drifted) {
    return (<span style={{ marginLeft: '8px', color: '#aaa' }}><i><MdAddCircleOutline /> New </i></span>);
  }
  return undefined;
}
export default class ListedDatasets extends React.Component {
  state = {
    showAll: false,
    selectedDataset: null,
    showPreview: false,
    isLoadingDetails: false
  }

  handleSelection = async dataset => {
    this.setState({ showPreview: true, isLoadingDetails: true })
    const res = await fetch(`/api/datasets/${dataset.id}/${dataset.version}`, {
      credentials: 'same-origin'
    })
    const fullDataset = await res.json()
    this.setState({
      selectedDataset: fullDataset,
      isLoadingDetails: false
    })
  }

  handleDriftedStyle = drifted => {
    if (drifted) {
      return styles.drifted;
    }
  }

  render() {
    const { displayedDatasets, isLoading, type } = this.props
    const { showAll, showPreview, selectedDataset, isLoadingDetails } = this.state

    displayedDatasets?.sort((a, b) => {
      return a.name.localeCompare(b.name)
    })

    const visibleDatasets = showAll ? displayedDatasets : displayedDatasets.slice(0, 10)
    return (
      <>
        <DatasetModal dataset={selectedDataset} show={showPreview} isLoading={isLoadingDetails} onCancel={() => this.setState({ selectedDataset: null, showPreview: false })} />
        <div hidden={isLoading}>
          <Alert variant="dark">
            <div className="text-muted small mb-0">
              <p hidden={!displayedDatasets.length || type !== 'accessible'} className="uxf-alert-description">The following <b>{displayedDatasets.length} datasets</b> are currently accessible with these entitlements.</p>
              <p hidden={!displayedDatasets.length || type !== 'linked'} className="uxf-alert-description">The following <b>{displayedDatasets.length} datasets</b> are currently linked to this schema.</p>
              <p hidden={!displayedDatasets.length || type !== 'views'} className="uxf-alert-description">The following <b>{displayedDatasets.length} datasets</b> are also referenced by this view.</p>
              <p hidden={!!displayedDatasets.length || type !== 'accessible'} className="uxf-alert-description">There are <b>no datasets</b> currently accessible with this permission.</p>
              <p hidden={!!displayedDatasets.length || type !== 'linked'} className="uxf-alert-description">There are <b>no datasets</b> currently linked to this schema.</p>
              <p hidden={!!displayedDatasets.length || type !== 'views'} className="uxf-alert-description">There are <b>no other datasets</b> referenced by this view</p>
            </div>
          </Alert>
          <ListGroup className="text-muted small" hidden={!displayedDatasets.length}>
            {visibleDatasets.map(ds => (
              <ListGroup.Item key={ds.id} action onClick={this.handleSelection.bind(this, ds)} style={this.handleDriftedStyle(ds.isDrifted)}>
                {ds.name} <small>({ds.phase.name})</small>
                {buildDiffIcon(ds.isDrifted)}
              </ListGroup.Item>
            ))}
            {visibleDatasets.length < displayedDatasets.length &&
              <ListGroup.Item variant="secondary" action onClick={() => this.setState({ showAll: true })}>
                Show remaining {displayedDatasets.length - visibleDatasets.length} datasets...
              </ListGroup.Item>
            }
          </ListGroup>
        </div>
        <div className="text-muted small" align="center" hidden={!isLoading}>
          <Spinner className="spinner-border uxf-spinner-border-md" animation="border" role="status">
            <span className="sr-only">Loading...</span>
          </Spinner>
        </div>
      </>
    )
  }
}
