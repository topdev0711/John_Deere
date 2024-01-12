import React, { Component } from 'react';
import Router from 'next/router';
import { Form, Button, Col, Card, Modal, Toast, Alert } from 'react-bootstrap';
import ConfirmationModal from '../../ConfirmationModal';
import { MdAdd, MdLink, MdDelete, MdContentCopy, MdHelpOutline, MdLightbulbOutline } from 'react-icons/md';
import { AppStateConsumer } from '../../AppState';
import Select from '../../Select';
import Spacer from '../../Spacer';
import ClassificationForm from '../../ClassificationForm';
import Accordion from '../../Accordion';
import utils from '../../utils';
import uuid from 'uuid';
import { marked } from 'marked';
import SchemaForm from './SchemaForm';
import DatasetSchemaSelector from './DatasetSchemaSelector';
import datasetModel from '../../../src/model/datasetModel';
import schemaService from '../../../src/services/schemaValidationService';
import ClassificationSelectionModal from './ClassificationSelectionModal';
import Attachments from '../Attachments';
import ValidatedInput from '../../ValidatedInput';
import { isEqual, pick, omit } from 'lodash';
import MyApplicationForm from '../../MyApplicationForm';
import { deleteDataset, postDataset, predictCommunity, unlockDataset, findApplications, getLinkedDatasetsForDatasetSchema, getDatasetsForSchema, getAllAvailableDatasetSummaries, getDetailedDataset } from '../../../apis/datasets';
import { findUsabilityDetails } from '../../../apis/usability'
import { getUserInfo } from '../../../apis/users'
import Usability from "../Usability";
import SourcesEdit from "./SourcesEdit";
import SourceUtils from "../../utils/SourceUtils";

const styles = {
  card: {
    minHeight: '210px',
    overflow: 'visible'
  },
  add: {
    float: 'right',
    marginTop: '-4px',
    whiteSpace: 'nowrap'
  },
  govButtons: {
    float: 'right',
    marginTop: '-10px'
  },
  right: {
    float: 'right'
  },
  accordian: {
    derivedFrom: { float: 'left', fontSize: '8pt', marginLeft: '20px', marginTop: '2px' },
    subtitle: {
      display: 'inline-block',
      maxWidth: '45%',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    button: {
      whiteSpace: 'nowrap'
    }
  }
};

const localStorageKeys = [
  'id',
  'name',
  'description',
  'version',
  'status',
  'documentation',
  'owner',
  'custodian',
  'sourceDatasets',
  'application',
  'category',
  'phase',
  'classifications',
  'schemas',
  'linkedSchemas',
  'tables',
  'paths',
  'dataRecovery',
  'deletedSchemas',
  'stagingUuid',
  'deletedAttachments',
  'sources'
];

export class DatasetForm extends Component {
  state = {
    _isMounted: false,
    id: null,
    name: '',
    version: null,
    description: '',
    documentation: '',
    userId: '',
    owner: {},
    custodian: '',
    sourceDatasets: [],
    application: '',
    category: '',
    phase: '',
    technology: { id: "1f8ee69b-62ad-42a3-9598-02947ea25670", name: 'AWS' },
    physicalLocation: { id: "6c2760b1-fabf-45fb-adc6-9d717e38b598", name: 'us-east-1' },
    classifications: [],
    schemas: [],
    tables: [],
    paths: [],
    mdPreview: '',
    showDocsModal: false,
    modal: null,
    isLoading: false,
    showSchemaSelector: false,
    previousVersion: null,
    showClassificationsModal: false,
    modalDataset: {},
    datasetErrors: [],
    schemaErrors: [],
    showToast: false,
    requestComments: '',
    deleteModal: null,
    deletedSchemas: [],
    canSave: true,
    dataRecovery: false,
    selectData: [],
    stagingUuid: '',
    deletedAttachments: [],
    newAttachments: [],
    showApplicationModal: false,
    classificationPrediction: '',
    datasetSummaries: [],
    usabilityDetails: { usability: 0, dimensions: [] }
  };

  toggleSchemaSelector = () => this.setState(s => ({ showSchemaSelector: !s.showSchemaSelector }));
  setSources = sources => this.setState({sources});

  setClassificationPrediction = async () => {
    if (this.shouldGetClassificationPrediction()) {
      const prediction = await this.getClassificationPrediction();
      this.setState({ classificationPrediction: prediction });
    }
  }

  getClassificationPrediction = async () => {
    try {
      const loggedInUser = this.props.context.loggedInUser;
      const body = [{
        name: this.state.name,
        description: this.state.description,
        documentation: this.state.documentation,
        custodian: this.state.custodian,
        created_by: loggedInUser ? loggedInUser.username : ''
      }];
      const predictedResponse = await predictCommunity(body);
      if (predictedResponse.ok) {
        const predictions = await predictedResponse.json();
        return predictions[0];
      }
      return '';
    } catch (e) {
      return '';
    }
  }

  predictedClassificationMissing = () => {
    const { classificationPrediction, classifications } = this.state;
    if (classifications.length === 0) return true;

    const classificationIndex = classifications.findIndex(({ community = {} }) => community.name === classificationPrediction);
    return classificationIndex === -1;
  };

  shouldGetClassificationPrediction = () => {
    return this.predictedClassificationMissing() && [this.state.custodian, this.state.name, this.state.description].every(e => Boolean(e));
  };

  getApplications = async () => {
    try {
      const response = await findApplications();
      const applications = response.ok ? await response.json() : [];
      this.setState({ selectData: applications });
    } catch (error) {
      console.log(error);
    }
  }

  setDatasetSummaries = async () => {
    const datasetSummaries = await getAllAvailableDatasetSummaries() || [];
    this.setState({ datasetSummaries });
  }

  async getDetailedDataset() {
    const { dataset: { id, version } } = this.props;
    return getDetailedDataset(true, id, version);
  }

  async componentDidMount() {
    const { dataset } = this.props;
    await this.handleUsabilityDisplay(dataset);

    this._isMounted = true;
    this.getApplications();
    this.setDatasetSummaries();
    if (dataset) {
      if (!dataset.previousVersion && dataset.status === 'AVAILABLE') dataset.previousVersion = dataset;
      if (!!dataset.id && !!localStorage.getItem(dataset.id)) {
        const lockedDataset = utils.getLocalStorageItem(dataset.id, omit(dataset, ['previousVersion']));
        if (lockedDataset.version !== dataset.version) {
          localStorage.removeItem(dataset.id);
          this.setInitialState(dataset);
        } else {
          this.setInitialState({ ...lockedDataset, previousVersion: dataset.previousVersion });
        }
      } else {
        this.setInitialState(dataset);
      }
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  cleanDatasetForSave(dataset) {
    const cleanedDataset = pick({ ...dataset }, localStorageKeys);
    return {
      ...cleanedDataset,
      schemas: dataset.schemas.filter(({ linkedFrom }) => !linkedFrom),
      linkedSchemas: dataset.schemas.filter(({ linkedFrom }) => !!linkedFrom)
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { dataset: initialDataset } = this.props;
    const { canSave, isLoading } = this.state;
    if (this._isMounted) {
      if (prevProps != this.props) {
        const currentRefs = this.props.context.referenceData;
        this.setState({
          physicalLocation: currentRefs.physicalLocations.find(p => p.name === 'us-east-1'),
          technology: currentRefs.technologies.find(t => t.name === 'AWS'),
        })
      }
      const condensedState = this.cleanDatasetForSave(this.state);
      const condensedPrevState = this.cleanDatasetForSave(prevState);
      if (!!condensedPrevState.id && !isEqual(condensedState, condensedPrevState) && canSave && !isLoading) {
        this.setInitialToLatestAvailable(condensedState);
      }
      if (prevProps && prevProps.dataset) {
        if (!!prevProps.dataset.lockedBy && !initialDataset.lockedBy && !localStorage.getItem(initialDataset.id)) {
          this.setInitialState(initialDataset);
        }
      }
    }
  }

  setInitialToLatestAvailable = async condensedState => {
    const { isEditing, dataset: initialDataset } = this.props;
    const initialPreparedState = await this.buildInitialState(initialDataset);
    const initialCleanedState = this.cleanDatasetForSave(initialPreparedState);
    const initial = pick(initialCleanedState, localStorageKeys);
    delete initial.version;
    this.saveChanges(isEditing, initial, condensedState);
  }

  saveChanges = (isEditing, dataset, condensedState) => {
    try {
      utils.setLocalStorage(isEditing, dataset, condensedState);
    } catch (e) {
      console.error(e);
      this.setState({
        canSave: false,
        modal: {
          onAccept: () => this.setState({ modal: null }),
          showAcceptOnly: true,
          acceptButtonText: 'OK',
          body: (
            <div>
              <div>Your browser's cache is full. You can still edit and submit for approval, but changes will not be saved if you close the tab or window.</div>
            </div>
          )
        }
      });
    }
  };

  getLinkedDatasets = async (id, status) => (id ? getLinkedDatasetsForDatasetSchema(id, status) : []);

  getSourceDatasetForLinkedSchemas = async id => (id ? getDatasetsForSchema(id) : []);

  getSchemasWithLinkedInfo = async () => {
    const { dataset: propsDataset } = this.props;
    const isDetailedSchemas = propsDataset.schemas.length === 0 || !!propsDataset.schemas[0].fields;
    const isDetailedLinkedSchemas = propsDataset.linkedSchemas.length === 0 || !!propsDataset.linkedSchemas[0].fields;
    const dataset = isDetailedSchemas && isDetailedLinkedSchemas ? propsDataset : (await this.getDetailedDataset());
    const linkedSchemasSourceDatasets = await this.getLinkedDatasets(dataset.id, dataset.status);
    const findLinkedDataset = ({ id }) => linkedSchemasSourceDatasets.find(({ schemas }) => schemas.map(schema => schema.id).includes(id));
    const linkedSchemas = dataset.linkedSchemas.map(schema => ({ ...schema, linkedFrom: findLinkedDataset(schema) }));

    const datasetsLinkedToThisDatasetSchemas = await this.getSourceDatasetForLinkedSchemas(dataset.id);
    const findSchemaDataset = ({ id }) => datasetsLinkedToThisDatasetSchemas.find(({ linkedSchemas }) => linkedSchemas.map(schema => schema.id).includes(id));
    const schemas = dataset.schemas.map(schema => ({ ...schema, linkedDatasets: findSchemaDataset(schema) || [] }));

    return [...schemas, ...linkedSchemas];
  };

  buildInitialState = async (initialDataset) => {
    const { context: { referenceData }, propsDataset } = this.props;
    const dataset = initialDataset ? initialDataset : propsDataset;
    const schemas = await this.getSchemasWithLinkedInfo();
    return {
      ...dataset,
      userId: dataset?.owner?.userId || '',
      schemas,
      classifications: dataset.classifications.map(c => ({ id: c.id || uuid.v4(), ...c })),
      physicalLocation: referenceData.physicalLocations.find(p => p.name === 'us-east-1'),
      technology: referenceData.technologies.find(t => t.name === 'AWS'),
      deletedSchemas: dataset.status !== 'AVAILABLE' ? (dataset.deletedSchemas || []) : [],
      requestComments: ''
    };
  };

  setInitialState = async (dataset) => {
    const initialState = await this.buildInitialState(dataset);
    this.setState({ ...initialState }, this.setClassificationPrediction);
  }

  handleChange = async (field, event) => {
    try {
      const newValue = !event ? [] : await (event.target ? event.target.value : event);
      this.setState({ [field]: newValue }, this.setClassificationPrediction);
      await this.handleUsabilityDisplay(this.constructDatasetToBeStored());
    } catch (e) {
      console.error(e);
    }
  }

  handleChangeTag = tag => this.setState({ application: !tag ? '' : tag.value });

  createSourceDatasetModal = (event) => {
    const sources = this.state.sourceDatasets;
    const newSources = (event || []).filter(e => !sources.find(s => s.id === e.id));
    const newDatasets = this.state.datasetSummaries.filter(ds => newSources.find(ns => ns.id === ds.id));
    const modalDataset = newDatasets[0] || { name: '', classifications: [] }

    this.setState({
      sourceDatasets: !event ? [] : event.target ? event.target.value : event,
      showClassificationsModal: !!newDatasets.length && !!newDatasets[0].classifications.length,
      modalDataset: {
        ...modalDataset, classifications: modalDataset.classifications.map(c => {
          return {
            ...c,
            id: c.id || uuid.v4(),
            derivedFrom: { id: modalDataset.id, name: modalDataset.name }
          }
        })
      }
    });
  }

  governanceDetailChanged = (blockId, field, value) => {
    const updated = this.state.classifications.map(block => {
      if (block.id !== blockId) return block;
      const defaultedValue = value == null ? [] : value;
      const cleanedValue = (field === 'additionalTags') ? defaultedValue.map(v => v.label.trim()) : defaultedValue;
      return Object.assign({}, block, { [field]: cleanedValue });
    });

    this.setState({ classifications: updated });
  }

  addGovBlock = () => {
    const { classifications } = this.state;
    this.setState({
      classifications: [{ id: uuid.v4(), isNew: true }, ...classifications]
    });
  }

  removeGovBlock = id => {
    const { classifications } = this.state;
    this.setState({ classifications: classifications.filter(item => item.id !== id) });
  };

  constructSchemaField = field => {
    const result = {
      name: field.name,
      attribute: (field.attribute.name || field.attribute),
      datatype: (field.datatype.name || field.datatype),
      description: field.description,
      nullable: !!field.nullable
    }

    if (result.datatype !== 'decimal') return result;

    const precision = !!field.precision ? Number(field.precision) : 10
    const scale = !!field.scale ? field.scale : 0;
    return { ...result, precision, scale };
  }

  constructSchemas = () => {
    return this.state.schemas.filter(s => !s.linkedFrom).map(s => {
      return {
        id: s.id,
        name: s.name,
        version: s.version,
        description: s.description,
        documentation: s.documentation,
        partitionedBy: (s.partitionedBy || []).map(p => (p.name || p)),
        updateFrequency: s.updateFrequency,
        testing: !!s.testing,
        fields: s.fields.map(this.constructSchemaField)
      }
    })
  };

  constructClassification = classification => {
    const dataClassification = { ...classification };
    delete dataClassification.derivedFrom;
    delete dataClassification.isNew;
    dataClassification.community = (dataClassification.community || {}).id;
    dataClassification.subCommunity = dataClassification.subCommunity ? (dataClassification.subCommunity || {}).id : null;
    dataClassification.gicp = (dataClassification.gicp || {}).id;
    dataClassification.countriesRepresented = (dataClassification.countriesRepresented || []).map(country => country.id);
    dataClassification.personalInformation = !!dataClassification.personalInformation;
    dataClassification.development = !!dataClassification.development;
    dataClassification.additionalTags = dataClassification.additionalTags || [];
    return dataClassification;
  };

  constructSourceDataset = sourceDataset => {
    return {
      version: sourceDataset.version,
      id: sourceDataset.id,
      name: sourceDataset.name
    }
  };

  constructDatasetToBeStored = () => {
    const { deletedSchemas, dataRecovery, newAttachments, deletedAttachments, sources } = this.state;
    const sourceUtils = new SourceUtils(sources || [], this.setSources);

    const datasetToBeStored = {
      name: this.state.name,
      description: this.state.description,
      requestComments: !!this.state.requestComments ? this.state.requestComments : 'No comments',
      documentation: this.state.documentation,
      custodian: this.state.custodian,
      sourceDatasets: this.state.sourceDatasets.map(this.constructSourceDataset),
      application: this.state.application,
      category: this.state.category.id,
      dataRecovery,
      phase: this.state.phase.id,
      technology: this.state.technology.id,
      physicalLocation: this.state.physicalLocation.id,
      linkedSchemas: this.state.schemas.filter(s => !!s.linkedFrom).map(({ id, name, version }) => ({ id, name, version })),
      deletedSchemas,
      tables: this.getValidTables(),
      paths: this.state.paths,
      schemas: this.constructSchemas(),
      classifications: this.state.classifications.map(this.constructClassification),
      attachments: { newAttachments, deletedAttachments },
      sources: sourceUtils.sourcesWithNoIds()
    };
    const { dataset } = this.props;

    if (dataset) {
      datasetToBeStored.id = dataset.id;
      datasetToBeStored.version = dataset.version;
    }
    const { owner } = this.state;
    return owner ? { ...datasetToBeStored, owner } : datasetToBeStored;
  }

  handleDelete = async () => {
    this.setState({ isLoading: true });
    const { id, requestComments } = this.state;
    const requestBody = { requestComments };
    try {
      const datasetResponse = await deleteDataset(id, requestBody);
      this.handleServerResponse(datasetResponse);
    } catch (e) {
      console.error(e);
    }
  }

  handleSubmit = async () => {
    this.setState({ showToast: false });
    const { datasetErrors, schemaErrors } = await this.validateForm();

    this.setState({ owner: undefined });
    if (this.state.userId) {
      try {
        const newOwner = await getUserInfo(this.state.userId);
        this.setState({ owner: newOwner });
      } catch (e) {
        datasetErrors.push({ context: { key: 'owner' }, details: e.message });
      }
    }

    if (datasetErrors.length) console.log('datasetErrors: ', datasetErrors);
    if (schemaErrors.length) console.log('schemaErrors: ', schemaErrors);
    if (!datasetErrors.length && !schemaErrors.length) {
      this.setState({ isLoading: true });
      let requestBody = this.constructDatasetToBeStored();
      try {
        const datasetResponse = await postDataset(this.props.dataset, requestBody);
        this.handleServerResponse(datasetResponse);
      } catch (e) {
        console.error(e);
      }
    } else {
      this.setState({ showToast: true });
    }
  }

  handleServerResponse = async (datasetResponse) => {
    const { dataset, isEditing } = this.props;
    if (datasetResponse.ok) {
      if (isEditing && utils.localStorageStatuses.includes(dataset.status)) {
        localStorage.removeItem(dataset.id);
        const unlockResponse = dataset.status === 'AVAILABLE' ? await unlockDataset(dataset) : { ok: true };
        if (unlockResponse.ok) {
          Router.push('/approvals');
        } else {
          const err = await unlockResponse.json();
          this.setState({ body: err.error, isLoading: false });
        }
      } else {
        Router.push('/approvals');
      }
    } else {
      this.setState({ isLoading: false });
      let errorResponse;
      try {
        errorResponse = await datasetResponse.json();
      } catch (e) {
        errorResponse = datasetResponse.statusText;
      }
      this.setModal({
        onAccept: () => this.setState({ modal: null }),
        showAcceptOnly: true,
        acceptButtonText: 'OK',
        body: (
          <div>
            <div>The submission failed because:</div>
            <br />
            <div dangerouslySetInnerHTML={{ __html: errorResponse.error }} />
          </div>
        )
      })
      console.log(errorResponse);
    }
  }

  handleCancelAndUnlock = () => {
    const { dataset, onCancel, cancelAndUnlock } = this.props;
    if (!!dataset && dataset.status !== 'AVAILABLE') {
      utils.removeAndUnlockRecord(dataset);
      if (!!onCancel) onCancel();
    } else if (!!dataset) {
      if (!!cancelAndUnlock) {
        cancelAndUnlock(true);
      }
    } else if (!!onCancel) onCancel();
  }

  handleMdPreview = (e, documentation = '') => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    this.setState({
      mdPreview: documentation,
      showDocsModal: !this.state.showDocsModal
    });
  }

  /*----------Schema Authoring functions ---------------*/

  addSchema = (schema = null) => {
    let updatedSchemas = this.state.schemas;
    let newSchema = {
      name: '',
      documentation: '',
      description: '',
      partitionedBy: [],
      ...schema,
      fields: (schema || { fields: [] }).fields.length > 0 ?
        schema.fields.map(f => ({ ...f, id: uuid.v4() })) :
        [
          {
            id: uuid.v4(),
            name: '',
            description: '',
            nullable: false,
            attribute: { id: 'None', name: "None" },
            datatype: { id: 'int', name: 'int' }
          }
        ],
      id: uuid.v4(),
      version: '',
      isNew: true,
      environmentName: ''
    };

    const matchingTableBySchemaName = this.state.tables.find(table => table.schemaName === newSchema.name);
    if (matchingTableBySchemaName) {
      const newTable = {
        schemaName: null,
        schemaVersion: null,
        schemaId: newSchema.id,
        tableName: matchingTableBySchemaName.tableName
      };
      this.setState({
        schemas: [newSchema, ...updatedSchemas],
        tables: [...this.state.tables, newTable]
      });
    } else {
      this.setState({
        schemas: [newSchema, ...updatedSchemas]
      });
    }
  }

  removeSchema = removeId => {
    const { schemas, deletedSchemas } = this.state;
    const newSchemas = schemas.filter(s => s.id !== removeId);
    const newDeletedSchemas = [...deletedSchemas, removeId];
    this.setState({ schemas: newSchemas, deletedSchemas: newDeletedSchemas });
  }

  getValidTables = () => {
    const { schemas, tables } = this.state;
    return tables.filter(table => !!table.tableName && schemas.find(schema => schema.id === table.schemaId));
  }

  updateTableName = (newSchema, tableName) => {
    tableName = !!tableName ? tableName : null;

    let existingTables = this.state.tables.map(table => ({ ...table }));
    const matchingTable = schemaId => existingTables.find(table => table.schemaId === schemaId);
    const allSchemas = this.state.schemas.concat(this.state.linkedSchemas).filter(schema => !!schema);

    const otherSchemasToUpdate = allSchemas.filter(schema => schema.name === newSchema.name && schema.id !== newSchema.id);
    otherSchemasToUpdate.forEach(schema => {
      const existingTable = matchingTable(schema.id);
      if (existingTable) {
        existingTable.tableName = tableName;
      } else {
        existingTables = [...existingTables, {
          schemaId: schema.id,
          schemaName: schema.name,
          schemaVersion: schema.version,
          tableName
        }];
      }
    });

    const updatedExistingTable = matchingTable(newSchema.id);
    if (updatedExistingTable) {
      updatedExistingTable.schemaName = newSchema.name;
      updatedExistingTable.schemaVersion = newSchema.version;
      updatedExistingTable.tableName = tableName;
    } else {
      existingTables = [...existingTables, {
        schemaId: newSchema.id,
        schemaName: newSchema.name,
        schemaVersion: newSchema.version,
        tableName
      }];
    }
    this.setState({ tables: existingTables });
  }

  setSchemaFieldIds = schema => {
    if (!schema.fields) return schema;
    schema.fields.map(field => {
      if (field.id) return field;
      field.id = uuid.v4();
      return field;
    });
    return schema;
  }

  updateSchemas = (newSchema, wasRemoved, tableName) => {
    const existingSchemas = this.state.schemas;
    const found = existingSchemas.find(s => s.id == newSchema.id);
    const updates = existingSchemas.map(s => {
      if (s.id == newSchema.id) return !wasRemoved ? newSchema : null;
      return s;
    }).filter(x => !!x);
    const updatedSchemas = found ? updates : updates.concat(newSchema);

    if (found) {
      const nameChanged = found.name !== newSchema.name;
      const versionChanged = found.version !== newSchema.version;
      if (nameChanged || versionChanged) this.updateTableName(newSchema, tableName);
    }

    this.setState({ schemas: updatedSchemas });
  }

  handleSchemaSelectedForLinking = details => {
    this.setState(s => {
      return {
        showSchemaSelector: false,
        schemas: s.schemas.concat([{ ...details.schema, isNew: true, linkedFrom: { id: details.dataset.id, name: details.dataset.name } }])
      }
    });
  }

  cleanId = id => `${id}`.split('--')[0] || id;

  isSchemaInPreviousVersion = (schema) => {
    const { previousVersion } = this.state;
    const safePrevious = { ...{ schemas: [], linkedSchemas: [] }, ...previousVersion };
    const prevSchemas = safePrevious.schemas.concat(safePrevious.linkedSchemas);
    return prevSchemas.some(s => this.cleanId(s.id) === this.cleanId(schema.id));
  }

  isSchemaFieldEnabled = (schema, checkSchemaExists = false) => {
    const schemaNotExists = () => !this.isSchemaInPreviousVersion(schema)
    const strategy = checkSchemaExists ? schemaNotExists : (() => true)
    return strategy() && !schema.linkedFrom
  }

  /*----------------------------------------------------*/

  setModal = modal => this.setState({ modal });

  setDeletionModal = deleteModal => this.setState({ deleteModal });

  formatSchemaError = (err, idx) => {
    return {
      ...err,
      context: { key: '', ...err.context },
      path: ['schemas', idx, ...(err.path || [])]
    }
  }

  validateForm = () => {
    return new Promise((res, rej) => {
      try {
        const dataset = this.constructDatasetToBeStored();
        const datasetErrors = (datasetModel.validateAllFields(dataset) || { details: [] }).details;
        const { schemas, linkedSchemas } = dataset;
        const newSchemasId = this.state.schemas.filter(s => s.isNew).map(s => s.id);
        const allSchemaErrors = schemas.map((schema, idx) => {
          const errors = (schemaService.validateSchemas([schema], linkedSchemas, newSchemasId) || []).map(error => error.details);
          return (errors[0] || []).map(err => this.formatSchemaError(err, idx));
        });
        const schemaErrors = allSchemaErrors.reduce((accum, items) => accum.concat(items), []);
        this.setState({ datasetErrors, schemaErrors }, () => res({ datasetErrors: this.state.datasetErrors, schemaErrors: this.state.schemaErrors }));
      } catch (err) {
        rej(err);
      }
    });
  };

  hasSchemaErrors = idx => {
    return this.state.schemaErrors.some(err => {
      const [kind, index] = (err.path || [])
      return kind === 'schemas' && index === idx;
    });
  };

  hasTableNameError = tableName => {
    return this.state.datasetErrors.some(error => {
      return (error.path || []).some(path => path === 'tableName') && error.context.value === tableName;
    });
  }

  updateRequestComments = ({ target: { value } }) => this.setState({ requestComments: value });

  getTableName = schemaId => {
    const tableDetails = this.state.tables.find(table => table.schemaId === schemaId);
    return (tableDetails || {}).tableName;
  }

  acceptDelete = () => {
    const { requestComments, deleteModal } = this.state;
    const deleteModalState = !!requestComments ? null : { ...deleteModal, body: this.deleteModalBody(true) };
    this.setDeletionModal(deleteModalState);
    if (!!requestComments) this.handleDelete();
  }

  deleteModalBody = (error = false) => {
    const baseString = "Provide details about this request for approvers"
    const placeholder = !!error ? "Required: " + baseString : baseString
    return (
      <div>
        <div>Are you sure you want to delete this dataset?</div>
        <br />
        <div className="text-muted">
          <i>This action <b style={{ color: "Red" }}>will remove {this.state.name}</b> from EDL and the EDL Data Catalog.</i>
        </div>
        <hr />
        <div>
          <Form.Label>Comments</Form.Label>
          <Form.Control
            as="textarea"
            isInvalid={error}
            placeholder={placeholder}
            onBlur={this.updateRequestComments.bind(this)}
            id='requestComments'
          />
        </div>
      </div>
    )
  }

  acceptSourceClassifications = selections => {
    const { classifications } = this.state;
    this.setState({
      classifications: [...classifications, ...selections.map(selection => ({ ...selection, id: uuid.v4() }))],
      showClassificationsModal: false,
      modalClassifications: []
    });
  }

  handleAttachments = ({ stagingUuid, deletedAttachment, newAttachments }) => {
    if (newAttachments && newAttachments.length) this.setState({ newAttachments });
    if (stagingUuid) this.setState({ stagingUuid });
    if (deletedAttachment) this.setState({ deletedAttachments: [...this.state.deletedAttachments, deletedAttachment] });
  };

  handleSuccess = (selectApplication = '') => {
    this.getApplications();
    this.setState({ showApplicationModal: false, application: selectApplication });
  }

  handleShow = value => this.setState({ showApplicationModal: value });

  handleUsabilityDisplay = async dataset => {
    try {
      const usabilityDetails = await findUsabilityDetails(dataset);
      this.setState({ usabilityDetails });
    } catch (error) {
      console.error(error);
    }
  }

  render() {
    const {
      showToast,
      modalDataset,
      showClassificationsModal,
      previousVersion,
      custodian,
      sourceDatasets,
      application,
      category,
      phase,
      technology,
      physicalLocation,
      classifications,
      schemas,
      modal,
      isLoading,
      showSchemaSelector,
      deleteModal,
      dataRecovery,
      datasetErrors,
      documentation,
      selectData,
      stagingUuid,
      deletedAttachments,
      showApplicationModal,
      classificationPrediction,
      datasetSummaries,
      usabilityDetails,
      userId,
      sources = []
    } = this.state;

    const { referenceData: { phases, categories, technologies, physicalLocations }, loggedInUser } = this.props.context;
    const { isEditing, dataset } = this.props;
    const isNewPendingDataset = !!dataset && dataset.version === 1 && dataset.status !== 'AVAILABLE';
    const groups = ((loggedInUser || {}).groups || []).filter(g => g.startsWith('AWS') === true || g.startsWith('EDG') === true);
    const custodianOptions = groups.map(g => ({ value: g, label: g }));
    const showClassificationError = datasetErrors.some(({ context: { key } }) => key === 'classifications');
    const showSourceError = datasetErrors.some(({ context: { key } }) => key === 'sources');


    return (
      <>
        <ClassificationSelectionModal
          show={showClassificationsModal}
          dataset={modalDataset}
          onAccept={(selections) => this.acceptSourceClassifications(selections)}
          onCancel={() => this.setState({ showClassificationsModal: false, modalClassifications: [] })}
        />
        <ConfirmationModal
          id="confirmation"
          show={!!modal}
          showAcceptOnly={(modal || {}).showAcceptOnly}
          acceptButtonText={(modal || {}).acceptButtonText}
          body={(modal || {}).body ? modal.body : `Are you sure you want to ${(modal || {}).action}?`}
          onCancel={() => { this.setModal(null); this.setState({ requestComments: '' }) }}
          onAccept={() => { this.setModal(null); modal.onAccept() }}
        />
        <ConfirmationModal
          id="deletionConfirmation"
          show={!!deleteModal}
          showAcceptOnly={(deleteModal || {}).showAcceptOnly}
          acceptButtonText={(deleteModal || {}).acceptButtonText}
          body={(deleteModal || {}).body}
          onCancel={() => { this.setDeletionModal(null); this.setState({ requestComments: '' }) }}
          onAccept={(deleteModal || { onAccept: () => { } }).onAccept()}
        />
        <Modal size="lg" show={this.state.showDocsModal} onHide={this.handleMdPreview}>
          <Modal.Header closeButton>
            <Modal.Title>Markdown Preview</Modal.Title>
          </Modal.Header>
          <Modal.Body className="markdown" dangerouslySetInnerHTML={{ __html: marked(this.state.mdPreview ? this.state.mdPreview : 'No preview to display.') }}></Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={this.handleMdPreview}>Close Preview</Button></Modal.Footer>
        </Modal>
        <Modal show={showApplicationModal} onHide={() => { this.handleShow(false) }} size="xl" className="modal-xl-90ht">
          <Modal.Header closeButton>
            <Modal.Title>Create Application</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <MyApplicationForm
              loggedInUser={loggedInUser}
              router={Router}
              onCancel={() => { this.handleShow(false) }}
              onSuccess={selectApplication => { this.handleSuccess(selectApplication) }} >
            </MyApplicationForm>
          </Modal.Body>
        </Modal>
        <div className="float-right" style={{ marginTop: '-55px' }}>
          <Button
            onClick={
              this.setDeletionModal.bind(this, {
                onAccept: () => this.acceptDelete,
                body: this.deleteModalBody()
              })
            }
            size="sm"
            variant="outline-danger"
            disabled={isLoading}
            hidden={!isEditing || isNewPendingDataset}
            id='deleteDatasetButton'
          >
            Delete Dataset
          </Button>&nbsp;&nbsp;&nbsp;&nbsp;
          <Button
            size="sm"
            variant="outline-primary"
            href="https://confluence.deere.com/display/EDAP/Datasets"
            target="_blank"
          >
            <MdHelpOutline size="15" />&nbsp;
            Help
          </Button>
        </div>
        <Spacer height="10px" />
        <Card>
          <Card.Header id="title">
            {this.props.title}
            <Usability usabilityDetails={{ ...usabilityDetails }} />
          </Card.Header>
          <Card.Body>
            <Card.Text as="div">
              <Form>
                <Form.Group>
                  <Form.Label>Name</Form.Label>
                  <ValidatedInput
                    component={Form.Control}
                    id="name"
                    onBlur={this.handleChange.bind(this, 'name')}
                    defaultValue={this.state.name}
                    type="text"
                    placeholder="Unique name for the dataset"
                    isInvalid={datasetErrors.some(({ context: { key } }) => key === 'name')}
                    invalidMessage="Must provide a name with at least three consecutive letters"
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <ValidatedInput
                    component={Form.Control}
                    id="description"
                    onBlur={this.handleChange.bind(this, 'description')}
                    defaultValue={this.state.description}
                    type="text"
                    placeholder="Description of the dataset"
                    isInvalid={datasetErrors.some(({ context: { key } }) => key === 'description')}
                    invalidMessage="Must provide a description with less than 200 characters"
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Documentation (<a href="components/datasets/edit/DatasetForm#"
                    onClick={(e) => this.handleMdPreview(e, documentation)}>preview</a>)</Form.Label>
                  <ValidatedInput
                    key={documentation}
                    component={Form.Control}
                    id="documentation"
                    defaultValue={documentation}
                    onBlur={this.handleChange.bind(this, 'documentation')}
                    as="textarea"
                    style={{ fontFamily: 'initial' }}
                    placeholder="(Optional) Additional documentation (markdown supported)"
                    isInvalid={datasetErrors.some(({ context: { key } }) => key === 'documentation')}
                    invalidMessage="Documentation cannot exceed 1500 characters"
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Owner</Form.Label>
                  <ValidatedInput
                    key={userId}
                    component={Form.Control}
                    id="owner"
                    defaultValue={userId}
                    onBlur={this.handleChange.bind(this, 'userId')}
                    style={{ fontFamily: 'initial' }}
                    placeholder="(Optional) User ID of the person to contact with questions about this dataset"
                    isInvalid={datasetErrors.some(({ context: { key } }) => key === 'owner')}
                    invalidMessage="Invalid user ID"
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Custodian</Form.Label>
                  <ValidatedInput
                    component={Select}
                    id="custodian"
                    onChange={(item) => this.handleChange('custodian', item.value)}
                    value={custodian ? { value: custodian, label: custodian } : null}
                    noOptionsMessage={() => "You aren't a member of any AWS or EDG."}
                    placeholder="AD group who will manage this data"
                    options={custodianOptions}
                    isInvalid={datasetErrors.some(({ context: { key } }) => key === 'custodian')}
                    invalidMessage="Select or enter a custodian with less than 200 characters"
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>My Application</Form.Label>
                  <Select
                    instanceId="application"
                    onChange={(tag) => this.handleChangeTag(tag)}
                    value={application ? { value: application, label: application } : null}
                    placeholder="(Optional) Select..."
                    options={selectData}
                    isClearable={true}
                    isApplication={true}
                    text="Create Application"
                    showModal={() => { this.handleShow(true) }}
                  />
                </Form.Group>
                <Form.Group controlId="formGridSource">
                  <Form.Label>Source Datasets</Form.Label>
                  <Select
                    instanceId="sourceDatasets"
                    onChange={(e) => this.createSourceDatasetModal(e)}
                    options={datasetSummaries.filter(ds => ds.id !== this.state.id)
                      .map(ds => ({ id: ds.id, version: ds.version, name: ds.name, label: `${ds.name} (${ds.phase.name})` }))
                    }
                    placeholder="(Optional) Select..."
                    value={sourceDatasets}
                    isMulti
                  />
                </Form.Group>
                <Form.Group controlId="formGridCat">
                  <Form.Label>Category</Form.Label>
                  <ValidatedInput
                    component={Select}
                    id="category"
                    onChange={this.handleChange.bind(this, 'category')}
                    options={categories}
                    value={category}
                    isInvalid={datasetErrors.some(({ context: { key } }) => key === 'category')}
                    invalidMessage="Must select a category"
                    inline
                  />
                </Form.Group>
                <Card style={styles.card}>
                  <Card.Body className="bg-light">
                    <Form.Row>
                      <Form.Group as={Col} controlId="formGridPhase">
                        <Form.Label>Phase</Form.Label>
                        <ValidatedInput
                          component={Select}
                          id="phase"
                          onChange={this.handleChange.bind(this, 'phase')}
                          options={phases}
                          value={phase}
                          isDisabled={!!previousVersion}
                          isInvalid={datasetErrors.some(({ context: { key } }) => key === 'phase')}
                          invalidMessage="Must select a phase"
                        />
                      </Form.Group>
                    </Form.Row>
                    <Form.Row>
                      <Form.Group as={Col} controlId="formGridTech">
                        <Form.Label>Technology</Form.Label>
                        <Select
                          instanceId="technology"
                          isDisabled
                          onChange={this.handleChange.bind(this, 'technology')}
                          options={technologies}
                          value={technology}
                        />
                      </Form.Group>
                      <Form.Group as={Col} controlId="formGridPhysLoc">
                        <Form.Label>Physical Location</Form.Label>
                        <Select
                          instanceId="physicalLocation"
                          isDisabled
                          onChange={this.handleChange.bind(this, 'physicalLocation')}
                          options={physicalLocations}
                          value={physicalLocation}
                        />
                      </Form.Group>
                    </Form.Row>
                    <Spacer height='5px' />
                    <Form.Check
                      id='dataRecoveryCheck'
                      checked={!!dataRecovery}
                      type="checkbox"
                      label="Enable Data Recovery"
                      onChange={({ target: { checked } }) => this.setState({ dataRecovery: checked })}
                      custom
                    />
                  </Card.Body>
                </Card>
                <Spacer />
                <Attachments
                  dataset={dataset}
                  isEditing={true}
                  localStorage={{ stagingUuid: stagingUuid, deletedAttachments: deletedAttachments }}
                  handleAttachments={this.handleAttachments}
                />
                <SourcesEdit key="dataset-sources" sources={sources} setSources={this.setSources} datasetErrors={datasetErrors} showSourceError={showSourceError} setModal={this.setModal}/>
                {classificationPrediction && this.shouldGetClassificationPrediction() &&
                  <Alert variant="warning">
                    <div className="text-muted" >
                      <MdLightbulbOutline />&nbsp;&nbsp;
                      <span className="small mb-0">We recommend you add the <b>{classificationPrediction}</b> classification based on the information you have provided.</span>
                    </div>
                  </Alert>
                }
                <Form.Row>
                  <Form.Group as={Col} className="mb-0">
                    <h4>Governance Details</h4>
                  </Form.Group>
                  <Form.Group as={Col} className="mb-0">
                    <Button id="addClassification" style={styles.add} onClick={this.addGovBlock} size="sm" variant={showClassificationError ? "outline-danger" : "outline-primary"}><MdAdd /> Add Classification</Button>
                  </Form.Group>
                </Form.Row>
                {showClassificationError &&
                  <Form.Text className="text-danger .d-block">
                    Must add at least one classification.
                  </Form.Text>
                }
                <hr />
                {classifications.length > 0 &&
                  <Accordion
                    filterable
                    activeKey={(classifications.filter(c => c.isNew).find(c => c.isNew) || {}).id || datasetErrors?.map(err => err.path)?.filter(path => path[0] === 'classifications')?.map(arr => arr[1])?.map(val => classifications[val])[0]?.id}
                    items={classifications.map((block, idx) => {
                      return {
                        id: block.id,
                        filterContent: block,
                        actions: [{
                          text: 'Remove',
                          icon: <MdDelete size="18" />,
                          handler: this.setModal.bind(this, { action: 'remove', onAccept: this.removeGovBlock.bind(null, block.id) })
                        }],
                        header: (
                          <>
                            <span style={{ display: 'block' }} className="text-muted small"><b>Community:</b> <i>{block.community && block.community.name ? block.community.name : 'None'}</i></span>
                            <span style={{ display: 'block' }} className="text-muted small"><b>Sub-Community:</b> <i>{block.subCommunity && block.subCommunity.name ? block.subCommunity.name : 'None'}</i></span>
                          </>
                        ),
                        headerAccessory: block.derivedFrom && <><MdContentCopy /> Copied from {block.derivedFrom.name}</>,
                        invalid: datasetErrors.some(err => (err.path || []).filter(x => x[0] === 'classifications').some(x => x === idx)),
                        body: (
                          <ClassificationForm
                            key={block.id}
                            defaultValue={block}
                            onChange={this.governanceDetailChanged.bind(this, block.id)}
                            errors={datasetErrors.filter(err => {
                              const path = (err.path || [])
                              if (path.length && path[0] === 'classifications') {
                                return path[1] === idx
                              }
                              return false
                            })}
                          />
                        )
                      }
                    })}
                  />
                }
                {phase.name === 'Enhance' &&
                  <>
                    <Spacer />
                    <Form.Row>
                      <Form.Group as={Col} className="mb-0">
                        <h4>Schemas</h4>
                      </Form.Group>
                      <Form.Group as={Col} className="mb-0">
                        <span style={styles.add}>
                          <Button id="linkSchema" disabled={phase.name !== 'Enhance'} onClick={this.toggleSchemaSelector} size="sm" variant="outline-primary"><MdLink /> Link Schema</Button>&nbsp;&nbsp;
                          <Button id="addSchema" disabled={phase.name !== 'Enhance'} onClick={() => this.addSchema()} size="sm" variant="outline-primary"><MdAdd /> Add Schema</Button>
                        </span>
                      </Form.Group>
                    </Form.Row>
                    <DatasetSchemaSelector
                      show={showSchemaSelector}
                      onCancel={() => this.setState({ showSchemaSelector: false })}
                      datasets={datasetSummaries}
                      blacklist={schemas.map(s => s.id)}
                      onSchemaSelected={this.handleSchemaSelectedForLinking}
                    />
                    <hr />
                  </>
                }
                {schemas.length > 0 && phase.name === 'Enhance' && schemas[0].fields &&
                  <Accordion
                    id="schemaAccordion"
                    filterable
                    activeKey={(schemas.filter(s => s.isNew).find(s => s.isNew) || {}).id}
                    items={schemas.map((schema, idx) => {
                      return {
                        id: schema.id,
                        filterContent: schema,
                        actions: [{
                          text: !!schema.linkedFrom ? 'Unlink' : 'Remove',
                          icon: !!schema.linkedFrom ? <MdLink size="18" /> : <MdDelete size="18" />,
                          disabled: !!schema.linkedDatasets && schema.linkedDatasets.length > 0,
                          handler: this.setModal.bind(this, {
                            action: !!schema.linkedFrom ? 'unlink' : 'remove',
                            onAccept: this.removeSchema.bind(null, schema.id)
                          })
                        }, {
                          text: 'Duplicate',
                          icon: <MdContentCopy size="18" />,
                          disabled: !schema.name || !schema.name.length || schema.linkedFrom,
                          handler: this.addSchema.bind(this, schema)
                        }],
                        invalid: this.hasSchemaErrors(idx) || this.hasTableNameError(this.getTableName(schema.id)),
                        header: (
                          <>
                            <span style={{ display: 'block' }} className="text-muted small"><b>Name:</b> <i>{schema.name || 'None'}</i></span>
                            <span style={{ display: 'block' }} className="text-muted small"><b>Version:</b> <i>{schema.version || 'None'}</i></span>
                          </>
                        ),
                        headerAccessory: schema.linkedFrom && <><MdLink /> Linked from {schema.linkedFrom.name}</>,
                        body: (
                          <SchemaForm
                            currentSchema={this.setSchemaFieldIds(schema)}
                            onSchemaChange={this.updateSchemas}
                            onTableNameChange={this.updateTableName}
                            handleMdPreview={this.handleMdPreview}
                            isFieldEnabled={this.isSchemaFieldEnabled.bind(this, schema)}
                            handleClick={this.props.handleClick}
                            tableName={this.getTableName(schema.id)}
                            tableNameError={this.hasTableNameError(this.getTableName(schema.id))}
                            phase={phase.name}
                            errors={this.state.schemaErrors.filter(err => {
                              const path = (err.path || []);
                              return path.length && path[0] === 'schemas' ? path[1] === idx : false;
                            })}
                          />
                        )
                      }
                    })}
                  />
                }
                <Spacer />
                <div style={styles.right}>
                  <Button
                    onClick={this.setModal.bind(this, { action: 'cancel', onAccept: this.handleCancelAndUnlock })}
                    variant="secondary"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>&nbsp;&nbsp;
                  <Button
                    onClick={
                      this.setModal.bind(this, {
                        action: 'submit',
                        onAccept: this.handleSubmit,
                        body: (
                          <div>
                            <div>Are you sure you want to submit this request?</div>
                            <br />
                            <div className="text-muted"><i>{this.state.name}</i></div>
                            <hr />
                            <div>
                              <Form.Label>Comments</Form.Label>
                              <Form.Control
                                as="textarea"
                                placeholder="(Optional) Provide details about this request for approvers"
                                onBlur={this.updateRequestComments.bind(this)}
                              />
                            </div>
                          </div>
                        )
                      })
                    }
                    variant="primary"
                    disabled={isLoading}
                  >
                    Submit for Approval
                  </Button>
                </div>
              </Form>
              <Spacer />
            </Card.Text>
          </Card.Body>
        </Card>

        <Toast
          hidden={!showToast}
          show={showToast}
          onClose={() => this.setState({ showToast: false })}
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            borderColor: '#c21020'
          }}
        >
          <Toast.Header>
            <strong className="mr-auto">Invalid for submission</strong>
          </Toast.Header>
          <Toast.Body>Please review the errors and make any necessary corrections.</Toast.Body>
        </Toast>
      </>
    );
  }
}

/* istanbul ignore next */
const DatasetFormComponent = props => <AppStateConsumer>
  {ctx => <DatasetForm {...props} context={ctx} />}
</AppStateConsumer>;

export default DatasetFormComponent;
