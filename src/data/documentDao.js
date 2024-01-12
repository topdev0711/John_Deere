const {getClient} = require('./mongoClient');
const mongo = require('./mongoClient');
const {AVAILABLE} = require("../services/statusService");

let log = require('edl-node-log-wrapper');

const referenceUpdateTypes = ['community', 'subCommunity'];
const isValidUpdateType = updateType => referenceUpdateTypes.includes(updateType);
const classificationFieldNames = [
  'classifications.community.name',
  'classifications.countriesRepresented.name',
  'classifications.development',
  'classifications.gicp.name',
  'classifications.personalInformation',
  'classifications.subCommunity.name'
]
    function setLogger(logger) {
  log = logger;
  mongo.setLogger(logger);
}

function createCollection(collectionName) {
  const client = getClient();
  const db = client.db('records');
  return db.collection(collectionName);
}

function buildUpdateStatement(record) {
  const _id = record.id + '-' + record.version;
  return {
    updateOne: {
      filter: {_id},
      update: {$set: {...record, _id}},
      upsert: true
    }
  };
}

function buildUpdateStatements(records) {
  return records.map(buildUpdateStatement);
}

async function putRecords(collection, records) {
  try {
    const client = getClient();
    const db = client.db('records');

    log.debug('adding records to ', collection);
    const recordsCollection = db.collection(collection);
    const insertStatements = buildUpdateStatements(records);
    const result = await recordsCollection.bulkWrite(insertStatements, {writeConcern: {j: true}});
    log.debug('added records to ', collection);
    return result;
  } catch (error) {
    log.error('failed to write to DocDb with error: ', error.stack);
    throw new Error('failed to write to DocDb');
  }
}

async function getDocument(collection) {
  try {
    const client = getClient();
    const db = client.db('records');

    log.debug('getting document from ', collection);
    const recordsCollection = db.collection(collection);
    const response = await recordsCollection.findOne();
    log.debug('got document');
    return response;
  } catch (error) {
    log.error('Could not get record from collection with error: ', error.stack);
    throw new Error('could not get record from collection');
  }
}

async function getRecords(collection) {
  try {
    const client = getClient();
    const db = client.db('records');

    log.debug('getting records from ', collection);
    const recordsCollection = db.collection(collection);
    const results = await recordsCollection.find();
    const records = await results.toArray();
    log.debug('got records from');
    return records;
  } catch (err) {
    log.error('could not get records from collection with error: ', err);
    throw new Error('could not get records from collection');
  }
}

async function putRecord(collection, record) {
  try {
    const client = getClient();
    const db = client.db('records');

    const recordsCollection = db.collection(collection);
    log.debug(`Adding record ${record} to ${collection}`);
    const response = await recordsCollection.update(
      {_id: record.id + '-' + record.version},
      {...record, _id: record.id + '-' + record.version},
      {upsert: true, writeConcern: {j: true}}
    );
    log.debug('added record');
    return response;
  } catch (err) {
    log.error('failed to put record in collection with error: ', err);
    throw new Error('failed to put record in collection');
  }
}

async function searchByIdAndVersion(collection, id, version = '') {
  try {
    const client = getClient();
    const db = client.db('records');

    const recordsCollection = db.collection(collection);
    log.debug(`search for _id:${id}-${version} in ${collection}`);
    const result = await recordsCollection.findOne({_id: id + '-' + version});
    log.debug('search complete');

    if (!result) log.error(`failed to find ${id}-${version} in ${collection}`);

    return result;
  } catch (error) {
    log.error('failed to find id and version in collection with error: ', error.stack);
    throw new Error('failed to find id and version in collection');
  }
}

async function getVersions(collection, id) {
  try {
    const client = getClient();
    const db = client.db('records');

    const recordsCollection = db.collection(collection);
    log.debug(`finding id: ${id} in collection: ${collection}`);
    const result = await recordsCollection.find({id});
    const records = await result.toArray();

    if (!records.length) log.error(`failed to find id:${id} in ${collection}`);

    return records;
  } catch (error) {
    log.error('failed to find id in collection with error: ', error.stack);
    throw new Error('failed to find id in collection');
  }
}

function fieldArrayQuery(field) {
  return field.length == 1 ? {$eq: field[0]} : {$in: field};
}

function createDateFilter(dateFilter, start, end) {
  return {
    [dateFilter]: {
      $gte: new Date(start).toISOString(),
      ...(end && {$lte: new Date(end).toISOString()})
    }
  };
}

function searchAllFields(word) {
  const regEx = new RegExp(`${word}`, 'i');
  const rootNames = ['_id', 'application', 'category', 'custodian', 'description', 'documentation', 'environmentName', 'id', 'status',
    'updatedBy', 'createdBy', 'name', 'owner', 'phase.name', 'category.name', 'storageLocation', 'storageAccount'];
  const arrayFieldNames = ['sourceDatasets', 'paths', 'discoveredTables', 'schemas.name', 'views.name', 'tables.tableName', 'schemas.name', 'linkedSchemas.name'];
  const allFieldQueries = [...rootNames, ...classificationFieldNames, ...arrayFieldNames].map(name => ({[name]: regEx}));
  return {$or: [...allFieldQueries]};
}

function createTextQueries(text) {
  if(!text) return {};

  const words = text.split(' ');
  const wordQueries = words.map(searchAllFields);
  return { $and: wordQueries };
}

function createClassificationQueries({ community = '', countries = [], development, subCommunities = [], gicps = [], personalInformation,}) {
  return {
    ...(community && {'classifications.community.name': community}),
    ...(countries.length && {'classifications.countriesRepresented.name': fieldArrayQuery(countries)}),
    ...(development && {'classifications.development': {$eq: development}}),
    ...(gicps.length && {'classifications.gicp.name': fieldArrayQuery(gicps)}),
    ...(personalInformation && {'classifications.personalInformation': personalInformation}),
    ...(subCommunities.length && {'classifications.subCommunity.name': fieldArrayQuery(subCommunities)}),
  }
}

function buildSearchQuery(params) {
  const { id = '', name = '', categories = [], custodians = [], groups = [], phases = [], clientIds = [], dateFilter = undefined, statuses = ['AVAILABLE'], start = '2000', end = '', searchTerm = '', roleTypes = ['human']} = params;

  const textQueries = createTextQueries(searchTerm);
  const queries = {
    ...(categories.length && {'category.name': fieldArrayQuery(categories)}),
    ...(custodians.length && {custodian: fieldArrayQuery(custodians)}),
    ...(phases.length && {'phase.name': fieldArrayQuery(phases)}),
    status: fieldArrayQuery(statuses),
    ...(groups.length && {group: fieldArrayQuery(groups), roleType: fieldArrayQuery(roleTypes)}),
    ...(clientIds.length && {clientId: fieldArrayQuery(clientIds), roleType: 'system'}),
    ...(dateFilter && createDateFilter(dateFilter, start, end)),
    ...(name && {name: new RegExp(`.*${name}.*`, 'i')}),
    ...(id && {id})
  };
  return { ...textQueries, ...createClassificationQueries(params), ...queries };
}

async function getLatestDatasetForStatus(collection, params) {
  try {
    const match = buildSearchQuery(params);
    const group = {
      _id: {
        id: "$id",
        status: "$status"
      },
      version: {$max: "$version"}
    };

    log.debug(`getting latest dataset for params: ${params} in collection: ${collection}`);
    const results = await collection.aggregate([
      {$sort: {version: -1, status: 1}},
      {$match: match},
      {$group: group}
    ]);
    const arr = results.toArray();
    log.debug('got latest dataset from collection');
    return arr;
  } catch (error) {
    log.error('failed to get latest records with error: ', error.stack);
    throw new Error('failed to get latest records');
  }
}

async function getLatestIdsForStatus(collection, params) {
  try {
    log.debug(`getting latest ids from status with params: ${params} in collection: ${collection}`);
    const idsAndVersions = await getLatestDatasetForStatus(collection, params);
    return idsAndVersions.map(({_id: {id}, version}) => `${id}-${version}`);
  } catch (error) {
    log.error('failed to get latest records with error: ', error.stack);
    throw new Error('failed to get latest records');
  }
}

function getSummaryDatasets(recordsCollection, query) {
  const fields = {"id": 1, "name": 1, "version": 1, "phase.name": 1, "classifications": 1, "schemas": 1};
  return recordsCollection.find(query).project(fields).sort({name: 1});
}

async function getLatestRecords(collectionName, params = {}) {
  try {
    const collection = createCollection(collectionName);
    log.debug(`getting latest records with params: ${params} from collection: ${collectionName}`);
    const _ids = await getLatestIdsForStatus(collection, params);

    if (!_ids.length) {
      log.warn(`failed to find ${collectionName} with params: ${JSON.stringify(params)}`);
      return [];
    }

    const query = {_id: {$in: _ids}};
    const data = params.summary ? await getSummaryDatasets(collection, query) : await collection.find(query);
    const records = await data.toArray();
    log.debug('got latest records');
    return records;
  } catch (error) {
    log.error('failed to get latest records with error: ', error.stack);
    throw new Error('failed to get latest records');
  }
}

async function getLatestId(collection, params) {
  try {
    const match = buildSearchQuery(params);
    const group = {
      _id: {
        id: "$id",
      },
      version: {$max: "$version"}
    };
    log.debug(`getting latest id for params: ${params} in collection: ${collection}`);
    const results = await collection.aggregate([
      {
        $sort: {version: -1, status: 1}
      },
      {
        $match: match
      },
      {
        $group: group
      }
    ]);
    const idsAndVersions = await results.toArray();
    if (idsAndVersions.length > 1) throw new Error('too many ids');

    return idsAndVersions.map(({_id: {id}, version}) => {
      return `${id}-${version}`;
    });
  } catch (error) {
    log.error('failed to get latest record id with error: ', error.stack);
    throw new Error('failed to get latest record id');
  }
}

async function getLatestRecord(collection, id, statuses) {
  try {
    const client = getClient();
    const db = client.db('records');
    const params = {id, ...(statuses && {statuses})};
    const recordsCollection = db.collection(collection);

    log.debug(`getting latest record for id: ${id} and statuses: ${statuses} for collection: ${collection}`);
    const [_id] = await getLatestId(recordsCollection, params);
    log.debug('got latest record for id');
    if (!_id) return undefined;
    return await recordsCollection.findOne({_id});
  } catch (error) {
    log.error('failed to get latest record from collection with error: ', error.stack);
    throw new Error('failed to get latest record from collection');
  }
}

async function updatePropertyForId(collection, id, field, newValue, version = 0) {
  try {
    const client = getClient();
    const db = client.db('records');

    const recordsCollection = db.collection(collection);
    log.debug(`updating property for id: ${id} field: ${field} with new value: ${newValue} on version: ${version} in collection: ${collection}`);
    const result = await recordsCollection.update(
      {
        id,
        ...(version && {version})
      },
      {
        $set:
          {
            [field]: newValue
          }
      }
    );
    log.debug('updated property for id');

    return result;
  } catch (error) {
    log.error('failed to update property for id with error: ', error.stack);
    throw new Error('failed to update property for id');
  }
}

async function deleteCollection(collection) {
  try {
    const client = getClient();
    const db = client.db('records');

    log.debug(`deleting collection: ${collection}`);
    const recordsCollection = db.collection(collection);
    const result = await recordsCollection.drop();
    log.debug('deleted collection');
    return result;
  } catch (error) {
    log.error('failed to delete collection with error: ', error.stack);
    throw new Error('failed to delete collection');
  }
}

async function listCollections() {
  try {
    const client = getClient();
    const db = client.db('records');
    log.debug('get collections list');
    await db.listCollections({}, {nameOnly: true});
    log.debug('got collection list');
    return true;
  } catch (error) {
    log.error(error);
    log.error('failed to list collections');
    return false;
  }
}

//TODO Intend to be Removed.
/** Start - Below Code Will be Removed after Migration completes*/
function getRestrictedGICPQuery(collection) {
  return collection === 'datasets' ?
    {classifications: {$elemMatch: {"gicp.id": {$eq: '7ef24262-e13e-43a6-b0e9-dcfc0638a46f'}}}} :
    {entitlements: {$elemMatch: {"gicp.id": {$eq: '7ef24262-e13e-43a6-b0e9-dcfc0638a46f'}}}}
}

function createRestrictedGICPUpdateStatement(collection) {
  return collection === 'datasets' ?
    {$set: {"classifications.$[element].gicp.name": 'Highly Confidential'}} :
    {$set: {"entitlements.$[element].gicp.name": 'Highly Confidential'}}
}

async function findGICPReferencedData(collection) {
  try {
    const client = getClient();
    const db = client.db('records');

    log.debug(`find GICP reference data for collection: ${collection}`);
    const result = await db.collection(collection).find(getRestrictedGICPQuery(collection));
    const arr = await result.toArray();
    log.debug('found GICP reference data');
    return arr;
  } catch (error) {
    log.error('failed to find GICP reference data with error: ', error.stack);
  }
}

async function updateGICPReferences(collection) {
  try {
    const client = getClient();
    const db = client.db('records');

    log.debug(`updating GICP references for collection: ${collection}`);
    const result = await db.collection(collection).updateMany(
      getRestrictedGICPQuery(collection),
      createRestrictedGICPUpdateStatement(collection),
      {arrayFilters: [{"element.gicp.id": {$eq: '7ef24262-e13e-43a6-b0e9-dcfc0638a46f'}}]});
    log.debug('updated GICP references');

    const {matchedCount, modifiedCount} = result;
    return {matchedCount, modifiedCount};
  } catch (error) {
    log.error('failed to Update Records with error: ', error.stack);
  }
}

async function updateNameReferences(collection) {
  try {
    const client = getClient();
    const db = client.db('records');

    log.debug(`updating Name references for collection: ${collection}`);

    const query = collection === 'datasets' ?
      {classifications: {$elemMatch: {"subCommunity.id": {$eq: '665bf594-f2f9-4f21-b3a1-269754b97b3b'}}}} :
      {entitlements: {$elemMatch: {"subCommunity.id": {$eq: '665bf594-f2f9-4f21-b3a1-269754b97b3b'}}}}

    const updater = collection === 'datasets' ?
      {$set: {"classifications.$[element].subCommunity.name": 'CAPA'}} :
      {$set: {"entitlements.$[element].subCommunity.name": 'CAPA'}}

    const arrayFilters = {arrayFilters: [{"element.subCommunity.id": {$eq: '665bf594-f2f9-4f21-b3a1-269754b97b3b'}}]}

    const result = await db.collection(collection).updateMany(
      query,
      updater,
      arrayFilters);
    log.debug('updated Name references');

    const {matchedCount, modifiedCount} = result;
    return {matchedCount, modifiedCount};
  } catch (error) {
    log.error('failed to Update Records with error: ', error.stack);
  }
}

function validateUpdateReferenceParameters(id, name, update) {
  if (!id) throw new Error('Update request missing id');
  if (!name) throw new Error('Update request missing name');
  if (!update) throw new Error('Update request missing update');
  if (!isValidUpdateType(update)) throw new Error(`Invalid Reference update type: ${update}`);
}

async function updateReferenceData(collection, {id, name, update}) {
  validateUpdateReferenceParameters(id, name, update);
  try {
    const client = getClient();
    const db = client.db('records');

    log.debug(`updating Name references for collection: ${collection}`);

    const security = collection === 'datasets' ? 'classifications' : 'entitlements';
    const query = {[`${security}.${update}.id`]: { $eq: id} };
    const updater = {$set: {[`${security}.$[element].${update}.name`]: name}};
    const arrayFilters = {arrayFilters: [{[`element.${update}.id`]: {$eq: id}}]};
    const result = await db.collection(collection).updateMany(query, updater, arrayFilters);
    log.debug('updated Name references');

    const {matchedCount, modifiedCount} = result;
    return {matchedCount, modifiedCount};
  } catch (error) {
    log.error('failed to Update Records with error: ', error.stack);
  }
}

async function getLinkedSchemasIdsForDataset(collection, params) {
  try {
    const match = buildSearchQuery(params);
    const group = {
      _id: {
        id: "$id",
        linkedSchemas: "$linkedSchemas",
      },
      version: {$max: "$version"}
    };

    log.debug(`getting linked schema ids for dataset with params: ${JSON.stringify(params)} in collection: ${collection}`);
    const results = await collection.aggregate([
      {
        $sort: {version: -1, status: 1}
      },
      {
        $match: match
      },
      {
        $group: group
      }
    ]);
    const arr = await results.toArray();
    log.debug('got linked schema ids for dataset');
    return arr;
  } catch (error) {
    log.error('failed to get linked schema ids for dataset with error: ', error.stack);
    throw new Error('failed to get linked schema ids for dataset');
  }
}

async function getSchemasIdsForDataset(collection, id) {
  try {
    const db = getClient().db('records');
    const query = {"id": {$eq: id}};

    const recordsCollection = db.collection(collection);
    log.debug(`getting schema ids for dataset ${id} in collection: ${collection}`);
    const record = await recordsCollection.findOne(query);
    log.debug('got schema ids for dataset');

    return (record.schemas || []).map(schema => schema.id);
  } catch (error) {
    log.error('failed to get schema ids for dataset with error: ', error.stack.stack);
    throw new Error('failed to get schema ids for dataset');
  }
}

async function getDatasetsByLinkedSchemas(collection, id, status) {
  try {
    const db = getClient().db('records');
    const recordsCollection = db.collection(collection);
    const match = {id: id, statuses: [status]};
    log.debug(`getting dataset by linked schemas with id: ${id} status: ${status} in collection: ${collection}`);
    const dataset = await getLinkedSchemasIdsForDataset(recordsCollection, match);
    const linkedSchemaIds = dataset.flatMap(data => data._id.linkedSchemas.map(linkedSchema => linkedSchema.id));
    const query = {$and: [{"status": {$eq: AVAILABLE}}, {"schemas.id": {$in: linkedSchemaIds}}]};
    const records = await recordsCollection.find(query);
    const arr = await records.toArray();
    log.debug('got dataset by linked schemas');
    return arr;
  } catch (error) {
    log.error('failed to get dataset by linked schemas with error: ', error.stack);
    throw new Error('failed to get dataset by linked schemas');
  }
}

async function getDatasetsWithSchemas(collection, id, status) {
  try {
    const schemaIds = await getSchemasIdsForDataset(collection, id);

    log.debug('getting datasets with schemas');
    const db = getClient().db('records');
    const query = {$and: [{"status": {$eq: status}}, {"linkedSchemas.id": {$in: schemaIds}}]};
    const recordsCollection = db.collection(collection);
    const records = await recordsCollection.find(query);
    const response = await records.toArray();
    log.debug('got datasets with schemas');
    return response;
  } catch (error) {
    log.error('failed to get datasets with schemas with error: ', error.stack);
    throw new Error('failed to get datasets with schemas');
  }
}

async function getPermissionsForViews(collection, views) {
  if (!views || !views.length) {
    log.error(error);
    return new Error('No views provided in the input to search permissions');
  }
  try {
    const db = getClient().db('records');
    const query = {$and: [{"status": {$eq: AVAILABLE}}, {"views": {$in: views}}]};
    const fields = {"id": 1, "name": 1, "version": 1, "views": 1, "entitlements": 1, "group": 1};

    const recordsCollection = db.collection(collection);
    log.debug(`getting permissions for views: ${views} in collection: ${collection}`);
    const results = await recordsCollection.find(query).project(fields);
    const records = await results.toArray();
    log.debug('got permissions for view');
    return records;
  } catch (error) {
    log.error('failed to get permissions for views with error: ', error.stack);
    throw new Error('failed to get permissions for views');
  }
}

 function getPermissionsForEntitlements(collection, communityName,subCommunityName) {
  try {
    const db = getClient().db('records');
    const query = {'entitlements.community.name':communityName,'entitlements.subCommunity.name':subCommunityName};
    const recordsCollection = db.collection(collection);
    log.debug(`getting permissions for entitlements: ${communityName} ${subCommunityName} in collection: ${collection}`);
    const results = recordsCollection.find(query);
    const records = results.toArray();
    log.debug('got permissions for entitlement');
    return records;
  } catch (error) {
    log.error('failed to get permissions for entitlements with error: ', error.stack);
    throw new Error('failed to get permissions for entitlements');
  }
}

module.exports = {
  setLogger,
  deleteCollection,
  getDocument,
  getLatestRecords,
  getLatestRecord,
  getRecords,
  getVersions,
  listCollections,
  putRecords,
  putRecord,
  searchByIdAndVersion,
  updatePropertyForId,
  findGICPReferencedData,
  updateNameReferences,
  updateReferenceData,
  updateGICPReferences,
  getDatasetsByLinkedSchemas,
  getDatasetsWithSchemas,
  getPermissionsForViews,
  getPermissionsForEntitlements
}
