const changeCase = require('change-case');
const clone = require('rfdc')();
const uuid = require('uuid');
const Joi = require('joi-browser');
const accessUtility = require('../utilities/accessUtility');
const conf = require('../../conf');
const datasetApprovalService = require('./datasetApprovalService');
const datasetDao = require('../data/datasetDao');
const datasetValidator = require('./datasetValidator');
const documentDao = require('../data/documentDao');
const opensearchDao = require('../data/opensearchDao');
const activeDirectoryDao = require('../data/ldap/activeDirectoryDao');
const edlApiHelper = require('../utilities/edlApiHelper');
const emailService = require('./emailService');
const fileService = require('./fileService');
const notificationService = require('./notificationService');
const recordService = require('./recordService');
const referenceService = require('./referenceService');
const s3 = require('../data/s3');
const schemaDao = require('../data/schemaDao');
const schemaValidationService = require('./schemaValidationService');
const { APPROVED, AVAILABLE, DELETED, PENDING, PENDING_DELETE, NONDELETE_STATUSES, PROCESSING_STATUSES, ALL_STATUSES,
  isApproved, isAvailable, isDeleted, isPendingDelete, isPending, isRejected
} = require('./statusService');
const usabilityService = require('./usabilityService')
const versionService = require('./versionService');
const getIsoDatetime = () => new Date().toISOString();
const config = conf.getConfig();
const { attachmentsBucket, accountNumber, edlMetastoreApi } = config;
const refClassificationFields = ['community', 'subCommunity', 'countriesRepresented', 'gicp'];
const refDatasetFields = ['category', 'technology', 'phase', 'physicalLocation'];
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  datasetApprovalService.setLogger(logger);
  datasetDao.setLogger(logger);
  datasetValidator.setLogger(logger);
  documentDao.setLogger(logger);
  opensearchDao.setLogger(logger);
  edlApiHelper.setLogger(logger);
  emailService.setLogger(logger);
  notificationService.setLogger(logger);
  referenceService.setLogger(logger);
  s3.setLogger(logger);
  schemaDao.setLogger(logger);
  schemaValidationService.setLogger(logger);
  versionService.setLogger(logger);
};

const isLockedUser = (username, lockedBy) => {
  return (typeof lockedBy === 'string' && username === lockedBy) || (typeof lockedBy === 'object' && username === lockedBy.username);
}

const secondsInDay = 24 * 60 * 60;

async function loadDetailsForSchemas(schemas = []) {
  const schemasDetails = await Promise.all(schemas.map(async schema => {
    try {
      return await schemaDao.getSchema(schema);
    } catch (e) { }
  }));
  return schemasDetails.filter(schema => schema);
}

async function loadDetailsForViews(views = []) {
  const viewsDetails = await Promise.all(views.map(async view => {
    try {
      const schemaStructure = await schemaDao.getSchema(view.name)
      return {
        ...schemaStructure,
        ...view
      }
    } catch (e) { }
  }));
  return viewsDetails;
}

function getSchemaIds(schemas = []) {
  return schemas.map(schema => schema.id);
}

function updateLinkedSchemaId(dataset, originalLinkedSchemas) {
  const originalLinkedSchemasIds = getSchemaIds(originalLinkedSchemas);
  const datasetLinkedSchemasIds = getSchemaIds(dataset.linkedSchemas);
  dataset.tables.forEach(table => {
    const matchingLinkedSchemaIndex = originalLinkedSchemasIds.indexOf(table.schemaId);
    if (matchingLinkedSchemaIndex >= 0) {
      const updatedLinkedSchemaId = datasetLinkedSchemasIds[matchingLinkedSchemaIndex];
      if (updatedLinkedSchemaId) {
        table.schemaId = updatedLinkedSchemaId;
      }
    }
  })
}

async function loadMetadata(dataset, loadFullSchema, datasets) {
  if (!!dataset.linkedSchemas && !!dataset.linkedSchemas.length) {
    const availableDatasets = datasets.length > 1 ? datasets.filter(isAvailable) : await getLatestDatasets();
    const originalLinkedSchemas = [ ...dataset.linkedSchemas ];
    dataset.linkedSchemas = getLatestAvailableLinkedSchemas(dataset.linkedSchemas, availableDatasets);
    const hasTables = (dataset.tables || []).length;
    if (hasTables) {
      updateLinkedSchemaId(dataset, originalLinkedSchemas);
    }
  }
  const discoveredMetadata = await schemaDao.getDiscoveredSchemasForDataset(dataset.id);
  dataset.discoveredSchemas = discoveredMetadata.map(schema => schema.id);

  if (loadFullSchema) {
    dataset = await loadFullSchemas(dataset, discoveredMetadata);
  }

  const currentAttachments = await getAttachments(`${dataset.id}-${dataset.version}/`);
  dataset.attachments = { ...dataset.attachments, currentAttachments };

  return {
    ...dataset,
    ...(!dataset.paths && { paths : [] })
  };
}

async function loadFullSchemas(dataset, discoveredMeta) {
  const discoveredMetadata = discoveredMeta || await schemaDao.getDiscoveredSchemasForDataset(dataset.id);
  dataset.discoveredSchemas = !!dataset.discoveredSchemas ? dataset.discoveredSchemas : discoveredMetadata.map(({ id }) => id);

  const schemasCall = loadDetailsForSchemas(getSchemaIds(dataset.schemas));
  const linkedSchemasCall = loadDetailsForSchemas(getSchemaIds(dataset.linkedSchemas));
  const unmappedDiscoveredSchemasCall = loadDetailsForSchemas(dataset.discoveredSchemas);
  const viewsCall = loadDetailsForViews(dataset.views);
  const discoveredTablesCall = loadDetailsForSchemas(dataset.discoveredTables);

  const [schemas, linkedSchemas, unmappedDiscoveredSchemas, views, discoveredTables] = await Promise.all(
      [schemasCall, linkedSchemasCall, unmappedDiscoveredSchemasCall, viewsCall, discoveredTablesCall]
  )
  const discoveredSchemas = unmappedDiscoveredSchemas.map(schema => {
    const metadataForSchema = discoveredMetadata.find(m => m.id === schema.id);
    return {...schema, ...metadataForSchema};
  });

  return {
    ...dataset,
    schemas,
    linkedSchemas,
    discoveredSchemas,
    views,
    discoveredTables
  };
}

function getLatestAvailableLinkedSchemas(linkedSchemas, datasets) {
  const trimmedSchemasId = linkedSchemas.map(schema => parseSchemaBaseId(schema.id));
  return trimmedSchemasId.map(trimmedSchema => {
    const foundDataset = datasets.find(dataset => (dataset.schemas || []).some(schema => parseSchemaBaseId(schema.id) === trimmedSchema));
    if (!!foundDataset) {
      return foundDataset.schemas.find(schema => parseSchemaBaseId(schema.id) === trimmedSchema);
    } else {
      log.warn(`No dataset found for ${trimmedSchema}.`);
      return null;
    }
  }).filter(schema => !!schema);
}

function defaultValues(dataset) {
  let {schemas = [], linkedSchemas = [], tables = [], classifications = [], sourceDatasets = [], paths = [], views = [], discoveredTables = []} = dataset;
  if (!dataset.documentation) dataset.documentation = '';
  return {
    schemas: !!schemas ? schemas : [],
    linkedSchemas: !!linkedSchemas ? linkedSchemas : [],
    tables: !!tables ? tables : [],
    classifications: !!classifications ? classifications : [],
    sourceDatasets: !!sourceDatasets ? sourceDatasets : [],
    paths: !!paths ? paths : [],
    views: !!views ? views: [],
    discoveredTables: !!discoveredTables ? discoveredTables: [],
    ...dataset
  }
}

async function processDatasets(datasets, loadFullSchema = false, allDatasets = []) {
  if (datasets.length === 1) {
    const [ dataset ] = datasets;
    return [ defaultValues(await loadMetadata(dataset, loadFullSchema, allDatasets)) ];
  }
  return (await Promise.all(datasets.map(dataset => loadMetadata(dataset, loadFullSchema, datasets)))).map(defaultValues);
}

async function getDatasets(statuses, name) {
  const query = {
    ...(name && { name }),
    ...(statuses && { statuses })
  };
  return getLatestDatasets(query);
}

function getRawDatasets(status = NONDELETE_STATUSES) {
  return datasetDao.getDatasets(status);
}

function getAllDatasetVersions(id) {
  return datasetDao.getDatasetVersions(id);
}

async function processDataset(dataset, loadFullSchema = true, allDatasets) {
  const { usability } = usabilityService.computeUsability(dataset);
  dataset.usability = usability;
  const populated = await processDatasets([dataset], loadFullSchema, allDatasets);
  return populated[0];
}

async function getLatestAvailableVersion(id) {
  return datasetDao.getLatestDataset(id);
}

const fetchDataset = (id, version, status) => {
  if(!version) return getLatestAvailableVersion(id);
  if(version !== 'latest') return datasetDao.getDataset(id, Number(version));
  return datasetDao.getLatestDataset(id, status || ALL_STATUSES);
};

const hasPreviousVersion = dataset => (isPending(dataset) || isRejected(dataset)) && dataset.version > 1;

async function getDataset(isDetailed, id, version, status) {
  const dataset = await fetchDataset(id, version, status);
  if (!!dataset?.views && Array.isArray(dataset?.views)) {
    getRidOfDuplicateViews(dataset)
  }
  if (hasPreviousVersion(dataset)) {
    dataset.previousVersion = await processDataset(await getLatestAvailableVersion(id), isDetailed);
  }
  return processDataset(dataset, isDetailed);
}

function getRidOfDuplicateViews(dataset) {
  const map = {};

  for (const item of dataset.views) {
    if (map[item.name]) {
      if (item.status === 'AVAILABLE') {
        map[item.name] = item;
      }
    } else {
      map[item.name] = item;
    }
  }
  dataset.views = []
  for (const key in map) {
    dataset.views.push(map[key]);
  }

  return dataset;
}

function sendApprovalEmails(dataset) {
  const addresses = [...new Set((dataset.approvals || []).map(approval => approval.approverEmail))]
  return emailService.sendEmails(addresses,'Dataset Pending', dataset, 'approver', 'dataset');
}

const parseSchemaBaseId = schemaId => schemaId.split('--')[0];
const updateSchemaIdVersion = ({id}, dataset) => {
  const version = dataset.version ? dataset.version : 1;
  return `${parseSchemaBaseId(id)}--${version}`;
};

const createSchemaId = dataset => {
  const version = dataset.version ? dataset.version : 1;
  return`${uuid.v4()}--${version}`;
};
const getSchemaId = (schema, dataset) => schema.id ? updateSchemaIdVersion(schema, dataset) : createSchemaId(dataset);
const setSchemaId = (schema, dataset) => ({...schema, id: getSchemaId(schema, dataset)});
const setSchemaIds = (dataset) => dataset.schemas.map(schema => setSchemaId(schema, dataset));
const getSchemaShortInfo = schemas => schemas.map(({ id, name, version, testing }) => ({ id, name, version, testing }));
const trimWhitespace = (name) => name.trim();

function tablesWithSchemaId(schemas, tables) {
  const findSchemaId = table => {
    const schema = schemas.find(schema => schema.name === table.schemaName && schema.version === table.schemaVersion);
    return { ...table, schemaId: schema.id};
  };

  const addSchemaId = table => table.schemaId ? table : findSchemaId(table);
  return tables.map(addSchemaId);
}

function getDeletedSchemas(dataset, latestAvailable) {
  if (!!dataset.deletedSchemas && !!latestAvailable) {
    const uniqueDeletedSchemas = [...new Set(dataset.deletedSchemas)];
    return uniqueDeletedSchemas.filter(deletedSchema => {
      const versionlessDeletedSchema = parseSchemaBaseId(deletedSchema);
      const isInSchemas = !!dataset.schemas.find(schema => parseSchemaBaseId(schema.id) === versionlessDeletedSchema);
      const isInLinkedSchemas = !!dataset.linkedSchemas.find(schema => parseSchemaBaseId(schema.id) === versionlessDeletedSchema);
      if (isInSchemas || isInLinkedSchemas) return false;

      const latestSchemas = !!latestAvailable.schemas ? latestAvailable.schemas : [];
      const latestLinkedSchemas = !!latestAvailable.linkedSchemas ? latestAvailable.linkedSchemas : [];
      const isInLatestSchemas = latestSchemas.find(schema => parseSchemaBaseId(schema.id) === versionlessDeletedSchema);
      const isInLatestLinkedSchemas = !!latestLinkedSchemas.find(schema => parseSchemaBaseId(schema.id) === versionlessDeletedSchema);
      return isInLatestLinkedSchemas || isInLatestSchemas;
    });
  } else return [];
}

function updateTables(dataset) {
  const tablesWithSchemaIds = dataset.tables.filter(table => table.schemaId);

  const updateSchemasToUseDatasetVersion = () => {
    const notLinkedSchema = table => !dataset.linkedSchemas.find(linkedSchema => linkedSchema.id === table.schemaId);
    const tableSchemaIdsToUpdate = tablesWithSchemaIds.filter(notLinkedSchema);
    tableSchemaIdsToUpdate.forEach(table => {
      const schemaBaseId = table.schemaId.split('--')[0];
      table.schemaId = `${schemaBaseId}--${dataset.version}`;
    });
  };

  const tablesThatHaveSchema = () => {
    const allSchemaIds = [...dataset.schemas, ...dataset.linkedSchemas].map(schema => schema.id);
    const schemaFound = (datasetSchemaIds, tableSchemaId) => datasetSchemaIds.find(datasetSchemaId => datasetSchemaId === tableSchemaId);
    return tablesWithSchemaIds.filter(table => schemaFound(allSchemaIds, table.schemaId));
  };

  const updateNewTables = () => {
    const tablesWithoutSchemaIds = dataset.tables.filter(table => !table.schemaId);
    return tablesWithoutSchemaIds.map(table => {
      const matchingSchema = dataset.schemas.find(schema => schema.name === table.schemaName && schema.version === table.schemaVersion);
      return { ...table, schemaId: matchingSchema.id };
    });
  };

  updateSchemasToUseDatasetVersion();
  const tablesToKeep = tablesThatHaveSchema();
  const newTables = updateNewTables();
  return [...tablesToKeep, ...newTables];
}

async function addApprovals(dataset, latest, user, availableDatasets) {
  const previous = !!latest && reference(await loadMetadata({...latest}, true, availableDatasets));
  const current =  await loadMetadata({...dataset,  status: PENDING}, true, availableDatasets);
  const datasetWithApprovals = await datasetApprovalService.addApprovals(dataset, latest, current, previous, user.groups);
  const { views } = datasetWithApprovals;
  datasetWithApprovals.views = views || [];
  return datasetWithApprovals;
}

async function updateFields(dataset, user, allVersions, availableDatasets) {
  dataset.name = trimWhitespace(dataset.name);
  const latest = versionService.getLatestAvailableVersion(allVersions);
  const modifiedDataset = recordService.addAuditFields(dataset, user.username);
  const schemas = getSchemaShortInfo(modifiedDataset.schemas);
  const deletedSchemas = getDeletedSchemas(modifiedDataset, latest);
  const classifications = validateAndAddClassificationIds(modifiedDataset.classifications);
  const tables = updateTables(modifiedDataset);
  const schemasAddedDataset = { ...modifiedDataset, classifications, schemas, deletedSchemas, tables };
  return await addApprovals(schemasAddedDataset, latest, user, availableDatasets);
}

const saveSchema = schema => schemaDao.saveSchema(schema);
const saveSchemas = schemas => Promise.all(schemas.map(saveSchema));

function addIdsToDataset(dataset) {
  const schemas = setSchemaIds(dataset);
  const tables = tablesWithSchemaId(schemas, dataset.tables);
  return {...dataset, schemas, tables};
}

async function createCommentHistory(id, version, user, requestComments) {
  const currentDataset = await datasetDao.getDataset(id, version);
  const history = (currentDataset && currentDataset.commentHistory) ? currentDataset.commentHistory : [];
  const requestComment = {updatedBy: user.username, updatedAt: getIsoDatetime(), comment: requestComments || "No comments" };
  return [...history, requestComment];
}

async function processDatasetRecord(datasetWithSchemaIds, user, allVersions, availableDatasets) {
  const updateFieldsCall = updateFields(datasetWithSchemaIds, user, allVersions, availableDatasets);
  const saveSchemasCall = saveSchemas(datasetWithSchemaIds.schemas);
  const [ datasetWithUpdatedFields ] = await Promise.all([updateFieldsCall, saveSchemasCall]);
  log.info(`updated fields and saved schemas for dataset ${datasetWithSchemaIds?.name}`);

  const { id, version, attachments, requestComments } = datasetWithUpdatedFields;

  if (attachments && version === 1) {
    log.info(`saving dataset attachments to ${id}-${version} in attachments bucket`);
    saveAttachments(attachments, id);
  }

  const commentHistory = await createCommentHistory(id, version, user, requestComments);
  const datasetWithCommentHistory = { ...datasetWithUpdatedFields, commentHistory };
  const dereferencedDataset = dereference(datasetWithCommentHistory);

  await save(dereferencedDataset, availableDatasets);
  log.info(`saved dataset id: ${id}`);

  await sendNotificationsOrEmails(datasetWithCommentHistory);
  log.info(`sent approval emails or notifications for dataset ${id}`);

  return { id, version };
}

async function saveDataset(dataset, user) {

  const nonDeletedDatasets = await getLatestDatasets({ statuses: NONDELETE_STATUSES });
  const availableDatasets = nonDeletedDatasets.filter(isAvailable);
  const datasetWithSchemaIds = addIdsToDataset(dataset);
  await datasetValidator.validateNew(datasetWithSchemaIds, availableDatasets, nonDeletedDatasets);
  return processDatasetRecord(datasetWithSchemaIds, user, [], availableDatasets);
}

async function saveDatasets(datasets) {
 return datasetDao.saveDatasets(datasets);
}

function addMetadataFields(dataset, existingDataset) {
 return {
    ...dataset,
    views: existingDataset.views.length ? existingDataset.views : [],
    discoveredTables: !!existingDataset.discoveredTables && existingDataset.discoveredTables.length ? existingDataset.discoveredTables : []
 }
}

async function updateDataset(updateId, updateVersion, updatedDataset, user) {
  log.info(`getting dataset and all previous versions info to update dataset: ${updateId} version: ${updateVersion}`);
  const [allVersions, nonDeletedDatasets] = await Promise.all([
    datasetDao.getDatasetVersions(updateId),
    getLatestDatasets({ statuses: NONDELETE_STATUSES })
  ]);
  const availableDatasets = nonDeletedDatasets.filter(isAvailable);
  let [ existingDataset ] = allVersions.filter(ds => ds.version === updateVersion);
  if (existingDataset) {
    existingDataset = reference(existingDataset);
  }
  const datasetWithAuditFields = recordService.mergeAuditFields(existingDataset, {...updatedDataset});
  const datasetWithMetadataFields = addMetadataFields(datasetWithAuditFields, existingDataset);
  const creationFields = getCreationUpdateFields(datasetWithMetadataFields, allVersions, user.username);
  const commentHistoryFields = getUpdatedCommentHistory(allVersions, datasetWithMetadataFields);
  const modifiedDataset = addIdsToDataset({...datasetWithMetadataFields, ...creationFields, ...commentHistoryFields});
  await datasetValidator.validateUpdate(modifiedDataset, availableDatasets, nonDeletedDatasets, allVersions, existingDataset, user.username);
  const { attachments } = updatedDataset;
  if (attachments) await mergeAttachments(attachments, updateVersion, updateId, modifiedDataset.version);
  return await processDatasetRecord({ ...modifiedDataset, status: PENDING }, user, allVersions, availableDatasets);
}

function updateReferenceData(updateRequest) {
  return datasetDao.updateReferenceData(updateRequest);
}

async function mergeAttachments(attachments, updateVersion, updateId, newVersion) {
  const { newAttachments, deletedAttachments } = attachments;
  const oldAttachments = await getAttachments(`${updateId}-${updateVersion}`);
  const oldAttachmentsFiltered = oldAttachments.filter(attachment => !deletedAttachments.includes(attachment.fileName));
  const attachmentsToCopy = [...oldAttachmentsFiltered, ...newAttachments];

  if (updateVersion === newVersion) {
    deletedAttachments.map(async attachment => {
      const deleteKey = `${updateId}-${updateVersion}/${attachment}`;
      await s3.deleteAttachment(attachmentsBucket, deleteKey);
    })
  }

  const destination = `${updateId}-${newVersion}`;
  await s3.copyObjects(attachmentsBucket, attachmentsToCopy, destination);
}

async function saveAttachments(attachments, id) {
  const { newAttachments } = attachments;
  const destination = `${id}-1`;
  await s3.copyObjects(attachmentsBucket, newAttachments, destination);
}

function sendNotificationsOrEmails(dataset) {
  return isApproved(dataset) ? sendNotifications(dataset) : sendApprovalEmails(dataset);
}

function addClassificationId(classification) {
  const id = classification.id || uuid.v4();
  return {...classification, id}
}

function validateAndAddClassificationIds(classifications) {
  const uniqueClassifications = accessUtility.getUniqueGovernance(classifications);
  const withIds = uniqueClassifications.map(addClassificationId);
  const ids = withIds.map(({id}) => id);
  const unique = [...new Set(ids)];
  if (unique.length < withIds.length) {
    throw Error('Each classification must have a unique ID');
  }
  return withIds.map(classification => {
    if (!classification.additionalTags) return classification;
    const additionalTags = classification.additionalTags.map(tag => tag.trim()).filter(tag => tag.length);
    return { ...classification, additionalTags: [...new Set(additionalTags)]};
  });
}

function checkUserIsAuthorizedToDelete(user, dataset, groups) {
  const { createdBy, custodian, status } = dataset;
  const isCustodian = groups.includes(custodian) && status === 'REJECTED';
  if (createdBy == user || (isCustodian)) {
    log.info(`${user} is authorized to delete dataset`)
  } else {
    throw new Error(`${user} is not authorized to delete dataset`);
  }
}

function getUpdatedCommentHistory(allVersions, dataset) {
  const { version, approvals, commentHistory } = dataset;
  const newVersion = versionService.calculateVersion(allVersions, dataset);
  if (newVersion === version) return { approvals, commentHistory };
  const updatedApprovals = approvals.map(approval => ({ ...approval, commentHistory: [] }));
  return { approvals: updatedApprovals, commentHistory: [] };
}

function getUpdatedCreateFields(newVersion, { version, createdBy, createdAt }, user) {
  return newVersion !== version ? { createdBy: user, createdAt: getIsoDatetime() } : { createdBy, createdAt };
}

function getCreationUpdateFields(dataset, allVersions, user) {
  const version = versionService.calculateVersion(allVersions, dataset);
  const { createdBy, createdAt } = getUpdatedCreateFields(version, dataset, user);
  return {createdAt, createdBy, version};
}

async function approveDataset(id, version, fullUser, details = null, sendEmail = true) {
  log.info('Going to update dataset approval:', id, version, fullUser.username, sendEmail);
  const dataset = await datasetDao.getDataset(id, version);
  const updatedDataset = await datasetApprovalService.approve(dataset, fullUser, details);
  await save(updatedDataset);
  if (sendEmail) {
    log.info('sending dataset email for id : '+ id + ' and version : ' + version + ' and sendEmail flag is : ' + sendEmail)
    await emailService.sendEmails(
        [updatedDataset.updatedBy+'@deere.com'],
        `Dataset ${changeCase.titleCase(updatedDataset.status)}`,
        updatedDataset,
        'requester',
        'dataset'
    );
  }
  if (isApproved(updatedDataset)) {
    return sendNotifications(updatedDataset, sendEmail, fullUser);
  } else if(isDeleted(updatedDataset)) {
    log.info('Going to delete all versions: ', id, fullUser.username);
    return deleteAllVersions(id);
  } else {
    return '';
  }
}

function sendNotifications(updatedDataset, sendEmail) {
  const {id, version} = updatedDataset;
  const catalogApproval = updatedDataset.approvals.find(approval => approval.system === 'Catalog');
  if(!!catalogApproval && isPendingDelete(catalogApproval)) {
    return notificationService.sendDatasetNotification(id, updatedDataset.name, version, updatedDataset.updatedAt, sendEmail, 'delete dataset');
  } else return notificationService.sendDatasetNotification(id, updatedDataset.name, version, updatedDataset.updatedAt, sendEmail);
}

async function rejectDataset(id, version, reason, fullUser) {
  const dataset = await datasetDao.getDataset(id, version);
  const updatedDataset = await datasetApprovalService.reject(dataset, reason, fullUser);
  await emailService.sendEmails(
      [updatedDataset.updatedBy+'@deere.com'],
      'Dataset Rejected',
      updatedDataset,
      'requester',
      'dataset'
  );
  return save(updatedDataset);
}

async function getLatestNonDeletedDataset(id) {
  return datasetDao.getLatestDataset(id, NONDELETE_STATUSES);
}

async function lockDataset(id, version, lockInfo) {
  const dataset = await getLatestNonDeletedDataset(id);
  if (!!dataset.lockedBy && isLockedUser(lockInfo.username, dataset.lockedBy)) return Promise.resolve();
  datasetValidator.validateLockDataset(dataset, version);
  log.info('Going to update dataset lock:', id, version, lockInfo.username);
  return datasetDao.lockDataset(id, version, lockInfo);
}

async function unlockDataset(id, version, username, userGroups) {
  const dataset = await datasetDao.getDataset(id, version);
  if (!(isLockedUser(username, dataset.lockedBy) || userGroups.includes(dataset.custodian))) {
    if (typeof dataset.lockedBy === 'string') throw new Error(`Cannot unlock another user's locked dataset. Locked by ${dataset.lockedBy}.`);
    throw new Error(`Cannot unlock another user's locked dataset. Locked by ${dataset.lockedBy.username}.`);
  }
  log.info('Going to update dataset unlock:', id, version);
  return datasetDao.unlockDataset(id, version);
}

function preventDeletionOfNonPendingDataset(dataset) {
  if (isAvailable(dataset) || isApproved(dataset) ) {
    throw new Error(`Cannot delete a dataset with a status of ${dataset.status}`);
  }
}

async function deletePendingDataset(id, version, userInfo) {
  const { username, groups } = userInfo
  console.log("user: ", username)
  console.log("groups: ", groups)
  const dataset = await datasetDao.getDataset(id, version);
  checkUserIsAuthorizedToDelete(username, dataset, groups);
  preventDeletionOfNonPendingDataset(dataset);
  const updatedDataset = {
    ...dataset,
    status: DELETED,
    updatedBy: username,
    updatedAt: getIsoDatetime()
  };
  ////
  return save(updatedDataset);
}







async function save(dataset, availableDatasets = []) {
  const fullDataset = await processDataset({...dataset}, false, !!availableDatasets.length ? availableDatasets : []);
  fullDataset.environment = {};
  log.debug('save the dataset to documentDB', fullDataset);
  return datasetDao.saveDataset(fullDataset);
}

function createSearchParams({searchTerm, category=[], community=[], countriesRepresented = [], custodian=[], dateFilter, development, gicp=[], limit, name = '', orderBy, personalInformation, phase=[], start, status, subCommunity=[], summary, databases = [], servers = [], tableNames = [], createdBy = ''}) {
  if(dateFilter && !start) throw new Error('Must include a "start" in query parameters along with "dateFilter".');
  const categories = [].concat(category);
  const communities = [].concat(community);
  const countries = [].concat(countriesRepresented);
  const custodians = [].concat(custodian);
  const gicps = [].concat(gicp);
  const phases = [].concat(phase);
  const statuses = status && [].concat(status) || [AVAILABLE];
  const subCommunities = [].concat(subCommunity);
  const toBoolean = value => value.toLowerCase() === 'true';
  const databasesArr = [].concat(databases);
  const serversArr = [].concat(servers);
  const tableNamesArr = [].concat(tableNames);
  return {
    ...(searchTerm && { searchTerm }),
    ...(categories.length && { categories }),
    ...(communities.length && { communities }),
    ...(countries.length && { countries }),
    ...(custodians.length && { custodians }),
    ...(dateFilter && { dateFilter }),
    ...(development && { development: toBoolean(development)}),
    ...(gicps.length && { gicps }),
    ...(name && { name }),
    ...(personalInformation && { personalInformation: toBoolean(personalInformation) }),
    ...(phases.length && { phases }),
    ...(start && { start }),
    ...(statuses.length && { statuses }),
    ...(subCommunities.length && { subCommunities }),
    ...(summary && { summary }),
    ...(databases.length && {databases: databasesArr}),
    ...(servers.length && {servers: serversArr}),
    ...(tableNames.length && {tableNames: tableNamesArr}),
    ...(createdBy && {createdBy})
  };
}

async function searchForDataset(params) {
    const { orderBy, limit } = params;
    const searchParams = createSearchParams(params);
    return orderBy ? await getRecentModifiedRecords(orderBy, limit) : datasetDao.getLatestDatasets(searchParams);
}

async function searchForLinkedDatasets(id, status) {
  if(!id) throw new Error('dataset id not given for searchForLinkedDatasets');
  return datasetDao.getDatasetsByLinkedSchemas(id, status || AVAILABLE);
}

async function searchForLinkedDatasetsWithLinkedSchemas(id) {
  if(!id) throw new Error('dataset id not given for searchForLinkedDatasetsWithLinkedSchemas');
  return datasetDao.getDatasetsWithLinkedSchemas(id, AVAILABLE);
}

async function findAllForApproval(user, allDatasets) {
  const latest = allDatasets ? versionService.getLatestVersions(allDatasets) : await getLatestDatasets({ statuses: PROCESSING_STATUSES });
  return datasetApprovalService.getUserApprovals(latest, user);
}

function buildPendingDeletionDataset(latestNonDeletedDataset, username, version, comments, isAdmin) {
  const updatedAt = getIsoDatetime();
  const historyRecord = { updatedBy: username, updatedAt, comment: comments };

  return {
    ...latestNonDeletedDataset,
    updatedBy: username || 'EDL',
    updatedAt: updatedAt,
    version,
    status: isAdmin ? APPROVED : PENDING,
    requestComments: comments,
    commentHistory: [...(latestNonDeletedDataset.commentHistory || []), historyRecord],
    approvals: isAdmin ? [{ system: "Catalog", status: PENDING_DELETE, updatedAt }] : latestNonDeletedDataset.approvals.filter(approval => approval.custodian)
  };
}

async function deleteDatasetForAdmin(id, latestNonDeletedDataset, username, newVersion, comments, isAdmin) {
  const pendingApprovedDeletionDataset = buildPendingDeletionDataset(latestNonDeletedDataset, username, newVersion, comments, isAdmin);
  log.info(`Admin delete request dataset ${id} and version ${newVersion}`);
  await save(pendingApprovedDeletionDataset);
  await notificationService.sendDatasetNotification(id, pendingApprovedDeletionDataset.name, pendingApprovedDeletionDataset.version, pendingApprovedDeletionDataset.updatedAt, 'delete dataset');
  return { id, version: newVersion };
}

async function deleteDatasetForNonAdmin(latestNonDeletedDataset, username, newVersion, comments, isAdmin) {
  if (!!latestNonDeletedDataset.lockedBy) delete latestNonDeletedDataset.lockedBy;
  const pendingDeletionDataset = buildPendingDeletionDataset(latestNonDeletedDataset, username, newVersion, comments, isAdmin);
  const referencedDataset = reference({...pendingDeletionDataset});
  const approvalsDataset = await datasetApprovalService.addApprovalsForDelete(referencedDataset);
  const finalDataset = dereference(approvalsDataset)
  await save(finalDataset);
  return finalDataset;
}

async function deleteDataset(id, comments, { username, isAdmin }) {
  const allVersions = await datasetDao.getDatasetVersions(id);
  if (!allVersions || allVersions.length === 0) throw new Error(`Cannot find dataset with id = ${id}`);
  const latestNonDeletedDataset = versionService.getLatestNonDeletedVersion(allVersions);
  if (!latestNonDeletedDataset) throw new Error(`Cannot find available dataset with id = ${id}`);
  const newVersion = versionService.calculateVersion(allVersions, latestNonDeletedDataset);

  const { approvals, commentHistory } = getUpdatedCommentHistory(allVersions, latestNonDeletedDataset);
  latestNonDeletedDataset.approvals = approvals;
  latestNonDeletedDataset.commentHistory = commentHistory;

  if(isAdmin) {
    return deleteDatasetForAdmin(id, latestNonDeletedDataset, username, newVersion, comments, isAdmin);
  }

  versionService.allowedToUpdate(allVersions, latestNonDeletedDataset, username);
  return deleteDatasetForNonAdmin(latestNonDeletedDataset, username, newVersion, comments, isAdmin);
}

async function deleteAllVersions(id) {
  const allVersions = await datasetDao.getDatasetVersions(id);
  const promises = [];
  allVersions.forEach(dataset => {
    if (!isDeleted(dataset)) {
      dataset.status = DELETED;
      promises.push(save(dataset));
    }
  });
  return Promise.all(promises);
}

async function addSchemasToDataset(id, schemas) {
  const [ sampleSchema ] = schemas;
  if(!!sampleSchema.discovered) return addDiscoveredSchemasToDataset(id, schemas);
  throw Error('Only discovered schemas are allowed to be added at this time.');
}

async function addDiscoveredSchemasToDataset(datasetId, schemas) {
  const datasets = await getLatestDatasets({ statuses: NONDELETE_STATUSES });
  const allDatasetVersions = datasets.filter(dataset => dataset.id === datasetId);
  if (allDatasetVersions.length === 0) throw Error('Dataset does not exist');
  const discoveredSchemas = await schemaDao.getDiscoveredSchemas();
  const discoveredSchemaIdsForDataset = discoveredSchemas.filter(schema => schema.datasetId === datasetId).map(schema => schema.id);

  const errors = validateDiscoveredSchemas(schemas, datasets, datasetId);
  const invalidIds = errors.map(({ id }) => id);
  const validSchemas = schemas.filter(({ id, discovered }) => id && discovered && !invalidIds.includes(id));

  const updatedSchemaMetadatas = validSchemas.map(({id, discovered}) => {
    return {
      testing: true,
      datasetId,
      discovered,
      id
    };
  });

  const metadataIds = updatedSchemaMetadatas.map(({id}) => id);
  const uniqueSchemas = [...new Set([...discoveredSchemaIdsForDataset, ...metadataIds])];

  await Promise.all([
    schemaDao.saveDiscoveredSchemas(updatedSchemaMetadatas, validSchemas),
    documentDao.updatePropertyForId('datasets', datasetId, 'discoveredSchemas', uniqueSchemas)
  ]);

  const successfulSubmissions = updatedSchemaMetadatas.map(({ id }) => ({id, status: 'Successful'}));
  return [...errors, ...successfulSubmissions];
}

function validateDiscoveredSchemas(schemas, datasets, datasetId) {
  const schemaValidationErrors = schemaValidationService.validateDiscoveredSchemas(schemas);

  const existingSchemaIds = datasets.filter(ds => ds.id !== datasetId).reduce((acc, dataset) => {
    const {discoveredSchemas = [], schemas = []} = dataset;
    const ids = schemas.map(schema => parseSchemaBaseId(schema.id));
    return [...acc, ...ids, ...discoveredSchemas];
  }, []);

  const idErrors = schemas.reduce((acc, { id, discovered }) => {
    if (!id || !discovered) {
      return [...acc, {id, status: 'Must include a schema id and discovered timestamp'}];
    }
    if (existingSchemaIds.includes(id)) {
      return [...acc, {id, status: `Schema ID ${id} is not unique to this dataset`}];
    }
    if (schemas.filter(schema => schema.id === id).length > 1) {
      return [...acc, {id, status: `Schema ID ${id} is used more than once in this submission`}];
    }
    return acc;
  }, []);
  return [...schemaValidationErrors, ...idErrors];
}

async function removeSchemaFromDataset(id, schemaId) {
  const metadata = await schemaDao.getDiscoveredSchemasForDataset(id);
  const updatedMeta = metadata.filter(m => m.id !== schemaId);
  await documentDao.updatePropertyForId('datasets', id, 'discoveredSchemas', updatedMeta.map(m => m.id));
  return schemaDao.deleteDiscoveredSchema(id, schemaId);
}

async function getDatasetContents(id, version, continuationToken = '', prefix = '') {
  const { phase, storageAccount, storageLocation } = await datasetDao.getDataset(id, version);
  if (phase.name === 'Enhance') throw Error('Only raw and model datasets support this feature currently.');
  try {
    const result = await s3.getContents(storageLocation, storageAccount, continuationToken, prefix, "/");
    return { ...result, fileMap : fileService.createFileMap(result) };
  } catch (e) {
    log.error(e.stack);
    return new Error('An unexpected error occurred when getting dataset contents.');
  }
}

async function getAttachments(bucketPath) {
  const formattedBucketPath = bucketPath.endsWith('/') ? bucketPath : `${bucketPath}/`;
  try {
    const contents = await s3.getContents(attachmentsBucket, accountNumber, '', formattedBucketPath, "/");
    const attachments = contents.Contents.map(content => {
      const fileName = content.Key.split("/").pop();
      const key = formattedBucketPath + fileName;
      return {
        key,
        fileName,
        bucketName: attachmentsBucket,
        account: accountNumber,
        size: content.Size
      };
    });
    const filteredAttachments = attachments.filter(attachment => attachment.size != 0);
    return !!filteredAttachments.length ? filteredAttachments : []
  } catch (e) {
    log.error(e.stack);
    return new Error('An unexpected error occurred when getting attachments.');
  }
}

const removePaths = (dataset, path) => dataset.paths.filter(publishedPath => publishedPath !== path);

async function saveUpdatedDataset(dataset) {
  const { id, name, schemas } = dataset;
  log.info(`saving updated dataset ${name}`);
  await saveSchemas(schemas)
  await save(dataset);
  await sendNotificationsOrEmails(dataset);
  log.info(`dataset ${id} saved, sent approval emails or notifications`);
}

async function updatePublishedPaths(id, version, { path, comments }, user) {
  const [ currentDataset, allVersions, availableDatasets ] = await Promise.all([
    datasetDao.getDataset(id, version),
    datasetDao.getDatasetVersions(id),
    getLatestDatasets()
  ]);
  const datasetWithDefaultValues = defaultValues(currentDataset);
  const latest = defaultValues(versionService.getLatestAvailableVersion(allVersions));
  const creationFields = getCreationUpdateFields(datasetWithDefaultValues, allVersions, user.username);
  const modifiedDataset = { ...datasetWithDefaultValues, ...creationFields };

  versionService.allowedToUpdate(allVersions, modifiedDataset, user, 'Dataset');

  const dataset = { ...modifiedDataset, paths: modifiedDataset.paths || []};

  if (dataset.phase.name.toLowerCase() === 'enhance') {
    throw new Error('Cannot publish paths for an enhance dataset.');
  }

  const requestComments = comments || 'No comments';
  const isUnpublished = dataset.paths.some(publishedPath => publishedPath === path);
  const paths = isUnpublished ? removePaths(dataset, path) : [...dataset.paths, path];
  const referencedDataset = reference({ ...dataset, requestComments, paths, status: PENDING});

  let updatedDataset = await addApprovals({ ...referencedDataset, requestComments, paths }, latest, user, availableDatasets);

  const updateField = isUnpublished ? 'unpublishedPath' : 'publishedPath';
  updatedDataset.approvals.forEach(approval => approval[updateField] = path);
  const approvals = dereferenceApprovals(updatedDataset.approvals);

  const requestComment = { updatedBy: updatedDataset.updatedBy, updatedAt: dataset.updatedAt, comment: requestComments };
  const commentHistory = [ ...(updatedDataset.commentHistory || []), requestComment];

  await saveUpdatedDataset({ ...dataset, approvals, status: updatedDataset.status, commentHistory, paths, requestComments });

  return { id: dataset.id, version: dataset.version };
}

function dereference(datasetSource) {
  let dataset = referenceService.dereferenceIds(datasetSource, refDatasetFields);
  dataset.classifications = (dataset.classifications || []).map(classification => referenceService.dereferenceIds(classification, refClassificationFields));
  dataset.approvals = dereferenceApprovals(dataset.approvals);
  return dataset;
}

function dereferenceApprovals(approvals = []) {
  return approvals.map(approval => {
    const { subCommunity = '', community = '',  custodian = '' } = approval;
    const { id, name, approver } = subCommunity ? referenceService.getValue(subCommunity) : referenceService.getValue(community);
    return {
      ...approval,
      ...(!custodian && subCommunity) && { subCommunity: { id, name, approver } },
      ...(!custodian && community) && { community: { id, name, approver } }
    }
  });
}

function getReferenceIds(object, references) {
  references.forEach(key => {
    if (key === 'countriesRepresented') {
      object[key] = object[key].map(country => country.id);
    } else {
      object[key] = object[key].id;
    }
  })
}

function reference(datasetSource) {
  let dataset = clone(datasetSource);
  getReferenceIds(dataset, refDatasetFields);
  dataset.classifications.forEach(classification => getReferenceIds(classification, refClassificationFields));
  dataset.approvals = referenceApprovals(dataset.approvals);
  return dataset;
}

function referenceApprovals(approvals = []) {
  return approvals.map((approval) => {
    const { subCommunity = '', community = '',  custodian = '' } = approval;
    const subCommunityId = subCommunity.id || '';
    const communityId = community.id || '';
    return {
      ...approval,
      ...(!custodian && subCommunity) && { subCommunity: subCommunityId },
      ...(!custodian && community) && { community: communityId }
    }
  });
}

async function createTable(tableInfo) {
  const tableSchema = Joi.string().regex(/^\w+$/).max(100).required().error(new Error('Must be a valid table name. Table name can not be empty and can not contain spaces/special characters'));
  const {error} = tableSchema.validate(tableInfo.tableName);

  if(error)
    throw error;

  const url = edlMetastoreApi + 'v1/metastore/tables';
  const ctres = await edlApiHelper.postWithContentType(url, tableInfo);
  return ctres;
}

async function availableDatasetIds(datasetIds) {
  const availableDatasetIds = [];
  await Promise.all(datasetIds.map(async datasetId => {
    const datasetAvailable = await getLatestDataset(datasetId, ['AVAILABLE']);
    if (datasetAvailable) availableDatasetIds.push(datasetId);
  }));
  return availableDatasetIds;
}

async function getLatestDatasets(params) {
  return datasetDao.getLatestDatasets(params);
}

function getLatestDataset(id, statuses) {
  return datasetDao.getLatestDataset(id, statuses);
}

function getLineages(id, type) {
  if(type === 'downstream') {
    return datasetDao.getDownstreamDatasets(id);
  } else if(type === 'upstream') {
    return datasetDao.getUpstreamDatasets(id);
  }
  throw new Error("Operation not supported without type");
}

async function getCacheObject(cache, key) {
  try {
    const namesMap = await cache.get(key);
    return namesMap && Array.from(namesMap.keys()).length > 0 ? namesMap: new Map();
  } catch (error) {
    return new Map();
  }
}

async function getRecentModifiedRecords(orderBy, limit) {
  const records = await datasetDao.getRecentlyModifiedRecords(orderBy, limit);
  const racfIds = records.map(record => record.modifiedBy);
  const cache = await conf.getRedisCacheManager(secondsInDay);
  const cachedRacfIdNamesMap = await getCacheObject(cache, 'racfIdsNamesMap');
  const existingRacfIds = cachedRacfIdNamesMap ? Array.from(cachedRacfIdNamesMap.keys()) : [];
  const missingRacfIds = racfIds.filter(racfId => existingRacfIds.indexOf(racfId) === -1);
  const racfIdsNames = missingRacfIds.length > 0 ? await activeDirectoryDao.findNamesByRacfIds(missingRacfIds) : [];
  const racfIdsNamesMap = new Map(racfIdsNames.map(key => [key.racfId, key.name]));
  const allRacfIdsNames = new Map([ ...cachedRacfIdNamesMap , ...racfIdsNamesMap]);
  await cache.set('racfIdsNamesMap', allRacfIdsNames);
  return records.map(record => {return {...record, modifiedBy: allRacfIdsNames.get(record.modifiedBy)}});
}

module.exports = {
  setLogger,
  availableDatasetIds,
  removeSchemaFromDataset,
  addSchemasToDataset,
  getDataset,
  getDatasets,
  getLatestDatasets,
  getAllDatasetVersions,
  getRawDatasets,
  getDatasetContents,
  getAttachments,
  getLatestAvailableVersion,
  getLatestDataset,
  saveDataset,
  saveDatasets,
  updateDataset,
  updateReferenceData,
  approveDataset,
  rejectDataset,
  lockDataset,
  unlockDataset,
  deleteDataset,
  deletePendingDataset,
  findAllForApproval,
  save,
  searchForDataset,
  updatePublishedPaths,
  createTable,
  searchForLinkedDatasets,
  searchForLinkedDatasetsWithLinkedSchemas,
  getLineages
};
