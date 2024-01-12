const { getClient } = require('./mongoClient');
const documentDao = require('./documentDao');
const { datasetsCollectionName } = require('../../conf').getConfig();
let log = require('edl-node-log-wrapper');

function setLogger(logger) {
  log = logger;
  documentDao.setLogger(logger);
}

async function getDataset(id, version) {
  return documentDao.searchByIdAndVersion(datasetsCollectionName, id, version);
}

async function getDatasets(statuses) {
  const query = { statuses };
  return documentDao.getLatestRecords(datasetsCollectionName, query);
}

async function getDatasetVersions(id) {
  return documentDao.getVersions(datasetsCollectionName, id);
}

async function saveDataset(dataset) {
  return documentDao.putRecord(datasetsCollectionName, dataset);
}

async function saveDatasets(datasets) {
  return documentDao.putRecords('datasets', datasets);
}

function lockDataset(id, version, lockInfo) {
  return documentDao.updatePropertyForId(datasetsCollectionName, id, 'lockedBy', lockInfo, version);
}

function unlockDataset(id, version) {
  return documentDao.updatePropertyForId(datasetsCollectionName, id, 'lockedBy', null, version);
}

async function getLatestDataset(id, statuses) {
  return documentDao.getLatestRecord(datasetsCollectionName, id, statuses);
}

function getLatestDatasets(params) {
  return documentDao.getLatestRecords(datasetsCollectionName, params);
}

function getDatasetsByLinkedSchemas(id, status) {
  return documentDao.getDatasetsByLinkedSchemas(datasetsCollectionName, id, status);
}

function getDatasetsWithLinkedSchemas(id, status) {
  return documentDao.getDatasetsWithSchemas(datasetsCollectionName, id, status);
}

async function getUpstreamDatasets(id) {
  try {
    log.debug('getting upstream datasets for ', id);
    const client = getClient();
    const db = client.db('records');
    const query = { $and: [{ "status": { $eq: "AVAILABLE" }}, { "id": {$eq: id } }]};
    const fields = { "sourceDatasets.id": 1, "sourceDatasets.name": 1, "sourceDatasets.version": 1 }
    const recordsCollection = db.collection(datasetsCollectionName);
    const results = await recordsCollection.find(query).project(fields);
    const records = await results.toArray();
    log.debug('got upstream datasets for ', id);
    return Array.from(new Set(records));
  } catch (error) {
    log.error(error);
    throw new Error(`Failed to get upstream datasets.`);
  }
}

async function getDownstreamDatasets(id) {
  try {
    log.debug('getting downstream datasets for ', id);
    const client = getClient();
    const db = client.db('records');
    const group = {
      _id: {
        id: "$id",
        name: "$name",
        status: "$status"
      },
      version: {$max: "$version"}
    };
    const match = {"status": {$eq: "AVAILABLE"}, "sourceDatasets.id": { $eq: id }};
    const recordsCollection = db.collection(datasetsCollectionName);
    const results = await recordsCollection.aggregate([
      {
        $sort: {version: -1}
      },
      {
        $match: match
      },
      {
        $group: group
      }
    ]);
    const records = [].concat.apply([], (await results.toArray()).map(record => ({...record._id, version: record.version})));
    log.debug('got downstream datasets for ', id);
    return Array.from(new Set(records));
  } catch (error) {
    log.error('failed to get downstream datasets with error: ', error);
    throw new Error('failed to get downstream datasets');
  }
}

async function getRecentlyModifiedRecords(orderBy, limit) {
  const client = getClient();
  const db = client.db('records');
  try {
    const recordsCollection = db.collection('datasets');
    const results = await recordsCollection.aggregate(
      { $match: {'status': 'AVAILABLE'}},
      { $unwind: '$approvals' },
      { $match: { 'approvals.approvedBy': orderBy}},
      { $sort: { 'approvals.updateAt': -1}},
      {
        $project: {
          id: "$id",
          name: "$name",
          phase: "$phase.name",
          community: { $arrayElemAt: [ "$classifications.community.name", 0]},
          modifiedBy: "$updatedBy"
        }
      },
      {
        $project: {
          id: "$id",
          name: "$name",
          phase: "$phase.name",
          community: { $arrayElemAt: [ "$classifications.community.name", 0]},
          modifiedBy: "$updatedBy"
        }
      }
    ).limit(Number(limit));
    const records = await results.toArray();
    return records;
  } catch (err) {
    console.error(err);
    throw new Error(`Could not get recent modified collection.`);
  }
}

function updateReferenceData(updateRequest) {
  return documentDao.updateReferenceData(datasetsCollectionName,updateRequest);
}

module.exports = {
  setLogger,
  getDataset,
  getDatasets,
  getDatasetVersions,
  getLatestDataset,
  getLatestDatasets,
  saveDataset,
  saveDatasets,
  lockDataset,
  unlockDataset,
  getDatasetsByLinkedSchemas,
  getDatasetsWithLinkedSchemas,
  getUpstreamDatasets,
  getDownstreamDatasets,
  getRecentlyModifiedRecords,
  updateReferenceData
};
