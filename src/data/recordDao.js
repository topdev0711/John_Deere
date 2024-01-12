const { INTERNAL_SERVER_ERROR, NOT_FOUND } = require('http-status-codes');
let log = require('edl-node-log-wrapper');

const setLogger = logger => log = logger;
const segments = 8;

function createError(message, statusCode) {
  const error = new Error(message);
  if (statusCode) error.statusCode = statusCode;
  return error;
}

async function saveRecord(record, model) {
  try {
    log.debug('saving record: ', record);
    const response = await model.create(record);
    log.debug('saved record');
    return response;
  } catch (e) {
    log.error('Failed to save record with error: ', e);
    throw new Error('Failed to save record');
  }
}

async function getRecords(model, status = ['AVAILABLE'], groups, clientIds, returnAll = false) {
  try {
    log.debug('getting records');
    let query = model.parallelScan(segments).where('status').in(status);
    if (groups && groups.length) query = query.where('roleType').equals('human').where('group').in(groups)
    if (clientIds && clientIds.length) query = query.where('roleType').equals('system').where('clientId').in(clientIds)

    const records = await query.exec().promise();
    const items = records.collectItems();

    log.debug('got records');

    if (returnAll) return items;
    const recordsToKeep = new Map();
    items.forEach(item => {
      const existingItem = recordsToKeep.get(`${item.id}:${item.status}`);
      if (!existingItem || (existingItem && item.version > existingItem.version) ) {
        recordsToKeep.set(`${item.id}:${item.status}`, item);
      }
    });
    return Array.from(recordsToKeep.values());
  } catch (e) {
    log.error('Failed to get records with error: ', e);
    throw new Error('Failed to get records');
  }
}

async function getRecord(id, version, model) {
  try {
    log.debug(`getting records for ${id}--${version}`);
    const record = await model.get(id, version);
    log.debug(`got records for ${id}--${version}`);
    if(record) return record.get();
    throw createError(`Could not find record ${id}:${version}`, NOT_FOUND);
  } catch (e) {
    log.error('Failed with error: ', e);
    if(e.statusCode) throw e;
    log.error(`Failed to retrieve record ${id}:${version}`);
    throw createError(`Failed to retrieve record ${id}:${version}`, INTERNAL_SERVER_ERROR);
  }
}

async function getRecordByName(model, name) {
  try {
    log.debug('getting records for: ', name);
    const records = await model.parallelScan(segments).where('name').in(name).exec().promise();
    log.debug('got records for: ', name);
    return records.collectItems();
  } catch (e) {
    log.error('Failed to get record by name with error: ', e);
    throw new Error('Failed to get record by name');
  }
}

async function getVersions(id, model) {
  try {
    log.debug('get record versions for: ', id);
    const records = await model.query(id).loadAll().exec().promise();
    log.debug('got record versions for: ', id);
    return records.collectItems();
  } catch (e) {
    log.error('Failed with error: ', e.message);
    log.error(e.stack);
    if(e.statusCode) throw e;
    log.error('Failed to retrieve records for id with error: ', e);
    throw createError('Failed to retrieve records for id', INTERNAL_SERVER_ERROR);
  }
}

async function lockRecord(id, version, username, model) {
  try {
    log.debug(`locking record ${id}--${version} by ${username}`);
    const response = await model.update({id, version, lockedBy: username});
    log.debug(`locked record ${id}--${version}`);
    return response;
  } catch (e) {
    log.error('Failed to lock record with error: ', e);
    throw new Error('Failed to lock record');
  }
}

async function unlockRecord(id, version, model) {
  try {
    log.debug(`unlocking record ${id}--${version}`);
    const response = model.update({id, version, lockedBy: null});
    log.debug(`unlocked record ${id}--${version}`);
    return response;
  } catch (e) {
    log.error('Failed to unlock record with error: ', e);
    throw new Error('Failed to unlock record');
  }
}

module.exports = {
  setLogger,
  saveRecord,
  getRecords,
  getRecord,
  getVersions,
  getRecordByName,
  lockRecord,
  unlockRecord
};
