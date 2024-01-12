const documentDao = require('../data/documentDao');

let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  documentDao.setLogger(logger);
};

async function getDocument(collection) {
  return documentDao.getDocument(collection);
}

function putDocument(collection, document) {
  return documentDao.putRecord(collection, document);
}

async function getRecords(collection) {
  return documentDao.getRecords(collection);
}

async function deleteCollection(collection) {
  if (!collection) {
    throw new Error('Collection is required.');
  }
  return documentDao.deleteCollection(collection);
}

async function listCollections() {
  return documentDao.listCollections();
}

function searchByIdAndVersion(collection, id, version) {
  return documentDao.searchByIdAndVersion(collection, id, version);
}
//TODO Intend to be Removed.
/** Start - Below Code Will be Removed after Migration completes*/
function findGICPReferencedData(collection) {
  if (!collection) {
    throw new Error('Collection is required.');
  }
  return documentDao.findGICPReferencedData(collection);
}

function updateGICPReferences(collection) {
  if (!collection) {
    throw new Error('Collection is required.');
  }
  return documentDao.updateGICPReferences(collection);
}

function updateNameReferences(collection) {
  if (!collection) {
    throw new Error('Collection is required.');
  }
  return documentDao.updateNameReferences(collection);
}
/** End - Below Code Will be Removed after Migration completes*/

module.exports = {
  setLogger,
  deleteCollection,
  getDocument,
  putDocument,
  getRecords,
  listCollections,
  searchByIdAndVersion,
  findGICPReferencedData,
  updateGICPReferences,
  updateNameReferences
}
