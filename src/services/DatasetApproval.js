const { diff, addedDiff } = require('deep-object-diff');
const SchemaApproval = require('./SchemaApproval');
const { isDeleted, isPendingDelete} = require('./statusService');
const featureToggleService = require("./featureToggleService");
const fieldsRequiringAdditionalChecks = ['linkedSchemas', 'paths', 'schemas', 'tables'];
const autoApprovedFields = ['_id', 'approvals', 'commentHistory', 'createdAt', 'createdBy', 'deletedSchemas', 'description',
  'documentation', 'environment', 'environmentName', 'lockedBy', 'owner', 'physicalLocation', 'requestComments', 'status', 'storageAccount',
  'storageLocation', 'technology', 'updatedAt', 'updatedBy', 'usability', 'version', 'application', 'sourceDatasets', 'sources'];

const COMPANY_USE_ID = 'e43046c8-2472-43c5-9b63-e0b23ec09399';

class DatasetApproval {
  constructor(dataset, latestAvailableDataset, userGroups, log) {
    this.dataset = dataset;
    this.latestAvailableDataset = latestAvailableDataset || {};
    this.userGroups = userGroups;
    this.log = log;
  }

  logMessage = message => this.log.info(`${message}, requires approval`);

  isDeletingDataset = () => {
    const isDeleteDataset = isPendingDelete(this.dataset) || isDeleted(this.dataset);
    if(isDeleteDataset) this.logMessage('this is a delete dataset');
    return isDeleteDataset;
  }

  isCustodian = () => {
    const custodian = this.userGroups.includes(this.dataset.custodian);
    if (!custodian) this.logMessage('user is not the custodian');
    return custodian;
  }

  cleanCurrentAttachments = attachments => attachments.currentAttachments.map( attachment => {
    const { key, ...restOfAttachment} = attachment;
    return restOfAttachment;
  });

  cleanAttachments = attachments => ( { ...attachments,  currentAttachments: this.cleanCurrentAttachments(attachments)});

  createGeneralFieldOnlyDataset = (originalDataset) => {
    const ignoredFields = [...autoApprovedFields, ...fieldsRequiringAdditionalChecks];
    const updateDataset = (newDataset, key) => {
      if (!ignoredFields.includes(key)) newDataset[key] = originalDataset[key];
      return newDataset;
    }

    const datasetWithGeneralFields =  Object.keys(originalDataset).reduce(updateDataset, {});
    const currentAttachments = datasetWithGeneralFields.attachments ? datasetWithGeneralFields.attachments.currentAttachments : [];
    const cleanedDatasetAttachments = this.cleanAttachments({ currentAttachments });
    return { ...datasetWithGeneralFields, attachments: cleanedDatasetAttachments};
  }

  hasCompanyUseAccess = ({community, gicp}, permittedCommunities) => COMPANY_USE_ID === gicp && permittedCommunities.indexOf(community) >= 0;

  hasGeneralFieldRequiringApproval = async (companyUseToggleValues = {}) => {
    const datasetWithRequiredFieldsOnly = this.createGeneralFieldOnlyDataset(this.dataset);
    const latestAvailableDatasetWithRequiredFieldsOnly = this.createGeneralFieldOnlyDataset(this.latestAvailableDataset);
    if (!!companyUseToggleValues?.toggle) {
      let classificationWithChangesState = datasetWithRequiredFieldsOnly.classifications?.every(classification => this.hasCompanyUseAccess(classification, companyUseToggleValues?.communities));
      let classificationWithOutChangesState = latestAvailableDatasetWithRequiredFieldsOnly.classifications?.every(classification => this.hasCompanyUseAccess(classification, companyUseToggleValues?.communities));
      if (classificationWithChangesState || classificationWithOutChangesState) {
        delete datasetWithRequiredFieldsOnly['classifications'];
        delete latestAvailableDatasetWithRequiredFieldsOnly['classifications'];
      }
    }

    const changedFields = Object.entries(diff(latestAvailableDatasetWithRequiredFieldsOnly, datasetWithRequiredFieldsOnly));
    if (changedFields.length) this.logMessage(`changed fields: ${JSON.stringify(changedFields)}`);
    return !!changedFields.length;
  }

  removeDatasetId = table => ({ ...table, schemaId: table.schemaId.split('--')[0]});

  getProdTables = (dataset) => {
    const { tables = [], schemas = [] } = dataset;
    const testSchemas = schemas.filter(schema => schema.testing === true).map(schema => schema.id);
    return tables.filter(table => !testSchemas.includes(table.schemaId));
  }

  hasAddedTable = () => {
    const latestTables = this.getProdTables(this.latestAvailableDataset);
    const currentTables = this.getProdTables(this.dataset);
    const latestTableIds = latestTables.map(this.removeDatasetId).map(table => table.schemaId);
    const datasetTableIds = currentTables.map(this.removeDatasetId).map(table => table.schemaId);
    const addedTables = datasetTableIds.filter(id => !latestTableIds.includes(id));

    if(addedTables.length) this.logMessage(`added tables ${addedTables}`);
    return !!addedTables.length;
  }

  hasDeletedTable = () => {
    const latestTables = this.getProdTables(this.latestAvailableDataset);
    const currentTables = this.getProdTables(this.dataset);
    const latestTableIds = latestTables.map(this.removeDatasetId).map(table => table.schemaId);
    const datasetTableIds = currentTables.map(this.removeDatasetId).map(table => table.schemaId);
    const addedTables = latestTableIds.filter(id => !datasetTableIds.includes(id));

    if(addedTables.length) this.logMessage(`deleted tables ${addedTables}`);
    return !!addedTables.length;
  }

  hasTableUpdate = () => {
    const latestTables = this.getProdTables(this.latestAvailableDataset);
    const currentTables = this.getProdTables(this.dataset);
    const cleanedLatestTables = latestTables.map(this.removeDatasetId);
    const cleanedDatasetTables = currentTables.map(this.removeDatasetId);
    const changes = Object.keys(diff(cleanedLatestTables, cleanedDatasetTables));

    if (changes.length) this.logMessage('table has been updated');
    return !!changes.length;
  }

  tableRequiresApproval = () => this.hasAddedTable() || this.hasDeletedTable() || this.hasTableUpdate();

  hasAddedPaths = () => {
    const diffPaths = addedDiff(this.latestAvailableDataset.paths, this.dataset.paths) || [];
    const pathsAdded = Object.values(diffPaths);
    if(pathsAdded.length) this.logMessage(`paths: ${pathsAdded} has been added`);
    return !!pathsAdded.length;
  };

  requiresApproval = async (companyUseToggleValues = {}) => {
    const schemas = new SchemaApproval(this.dataset.schemas, this.latestAvailableDataset.schemas, this.log);
    const linkedSchemas = new SchemaApproval(this.dataset.linkedSchemas, this.latestAvailableDataset.linkedSchemas, this.log);
    return this.isDeletingDataset() ||
        !this.isCustodian() ||
        schemas.requiresApproval() ||
        linkedSchemas.hasAddedSchemas() ||
        linkedSchemas.hasDeletedSchemas() ||
        this.tableRequiresApproval() ||
        this.hasAddedPaths() ||
        await this.hasGeneralFieldRequiringApproval(companyUseToggleValues);
  }
}

module.exports = DatasetApproval;
