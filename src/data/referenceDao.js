const {getClient} = require('./mongoClient');
const mongo = require('./mongoClient');
const { datasetsCollectionName } = require('../../conf').getConfig();
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  mongo.setLogger(logger);
};

const getSecurityType = collection => collection === datasetsCollectionName ? 'classifications' : 'entitlements';

const updateReference = async (collection, referenceType, updater, id) => {
  try {
    log.info(`updating ${referenceType} for collection: ${collection}`);
    const client = getClient();
    const db = client.db('records');
    const security = getSecurityType(collection);
    const query = {[`${security}.${referenceType}.id`]: { $eq: id} };
    const arrayFilters = {arrayFilters: [{[`element.${referenceType}.id`]: {$eq: id}}]};
    const {matchedCount, modifiedCount} = await db.collection(collection).updateMany(query, updater, arrayFilters);
    log.info(`updated ${referenceType} for collection: ${collection}`);

    return {matchedCount, modifiedCount};
  } catch (error) {
    log.error(`failed to update ${referenceType} for collection: ${collection} with error: ${error.stack}`);
    throw error;
  }
};

const updateCommunity = async (collection, { id, name }) => {
  const security = getSecurityType(collection);
  const updater = {$set: {[`${security}.$[element].community.name`]: name }};
  return updateReference(collection, 'community', updater, id);
};

const updateSubCommunity = async (collection, { currentSubCommunityId, newCommunityId, newCommunityName, newSubCommunityId, newSubCommunityName}) => {
  const security = getSecurityType(collection);
  const updater = {$set: {
      [`${security}.$[element].community.id`]: newCommunityId,
      [`${security}.$[element].community.name`]: newCommunityName,
      [`${security}.$[element].subCommunity.id`]: newSubCommunityId,
      [`${security}.$[element].subCommunity.name`]: newSubCommunityName
    }};

  return updateReference(collection, 'subCommunity', updater, currentSubCommunityId);
};

module.exports = { updateCommunity, updateSubCommunity, setLogger };
