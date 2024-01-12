import React from 'react';
import { Form, Modal, Button } from 'react-bootstrap';
import Select from '../../Select';
import Spacer from '../../Spacer';
import utils from '../../utils'
global.fetch = require('node-fetch');

export default class DatasetSchemaSelector extends React.Component {
  state = {
    isLoading: false,
    selectedDataset: null,
    schemas: [],
    selectedSchema: null,
  }

  loadDatasetDetails = async (id, version) => {
    const datasetResponse = await fetch(`/api/datasets/${id}/${version}`, {
      credentials: 'same-origin'
    })
    const dataset = await datasetResponse.json()

    this.setState({
      isLoading: false,
      schemas: utils.formatSchemas(dataset.schemas)
    })
  }

  handleChange = (dataset) => {
    this.setState({ isLoading: true, selectedDataset: dataset, selectedSchema: null })
    this.loadDatasetDetails(dataset.id, dataset.version)
  }

  handleClick = (schema) => {
    this.setState({ selectedSchema: schema })
  }

  getAvailableDatasetsWithSchemas = () => {
    const blacklist = (this.props.blacklist || []);
    const datasets = [...(this.props.datasets || [])];
    const withoutBlacklistedSchemas = datasets.map(ds => {
      return {
        ...ds,
        schemas: (ds.schemas || []).filter((id) => !blacklist.includes(id))
      }
    });
    return withoutBlacklistedSchemas.filter(({ schemas }) => {
      return !!schemas.length
    });
  }

  getAvailableDatasets = () => {
    const availableDatasetsWithSchemas = this.getAvailableDatasetsWithSchemas()
    return Object.values(availableDatasetsWithSchemas.reduce((accum, ds) => {
      const found = accum[ds.id]
      if (!found || found.version < ds.version) {
        return { ...accum, [ds.id]: ds }
      }
      return accum
    }, {})).map(dataset => ({...dataset, label: `${dataset.name} (${dataset.phase.name})`}));
  }

  handleSchemaSelected = () => {
    const { selectedDataset: dataset, selectedSchema: schema } = this.state
    this.props.onSchemaSelected({ dataset, schema })
    this.setState({ selectedSchema: null, selectedDataset: null, schemas: [] })
  }

  render() {
    const { show, onCancel } = this.props
    const { schemas, isLoading, selectedDataset, selectedSchema } = this.state
    const blacklist = this.props.blacklist || []
    const availableDatasets = this.getAvailableDatasets()
    const displaySchemas = schemas.filter(({id}) => !blacklist.includes(id)).map(schema => ({...schema, label: `${schema.name}@${schema.version}`}));

    return (
      <>
        <div>
          <Modal show={show} onHide={onCancel} size="xl" className="modal-xl-90ht">
            <Modal.Header closeButton>
              <Modal.Title>Link Existing Schemas</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{height: '310px', overflow: 'visible'}}>
              <Spacer height="12px"/>
              <Form.Label>Datasets</Form.Label>
              <Select
                instanceId="datasetSelector"
                isDisabled={isLoading}
                onChange={this.handleChange}
                options={availableDatasets}
              />
              <Spacer height="25px" />
                <Form.Label>Schemas for selected dataset</Form.Label>
                <Select
                  instanceId="schemaSelector"
                  isDisabled={!selectedDataset}
                  options={displaySchemas}
                  onChange={this.handleClick.bind(this)}
                  value={selectedSchema}
                />
              <Spacer />
              <div className="text-muted"><i>You can link a schema from one dataset to another. Note that only the originating dataset can modify the linked schema.</i></div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => {
                  this.setState({ selectedDataset: null, schemas: [], selectedSchema: null }, () => onCancel())
                }}>
                Close
              </Button>
              <Button disabled={!selectedSchema} variant="primary" onClick={this.handleSchemaSelected}>
                Link
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </>
    )
  }
}
