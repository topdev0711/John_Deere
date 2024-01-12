const edlApiHelper = require("../utilities/edlApiHelper");
const { oktaApiUrl } = require('../../conf').getConfig();
let log = require('edl-node-log-wrapper');

const setLogger = logger => log = logger;
const getGroupsUri = (groupName) => `${oktaApiUrl}/groups?q=${groupName}`;
const getUsersUri = (groupId) => `${oktaApiUrl}/groups/${groupId}/users`;

async function getUsersForGroup(id, query = '') {
  try {
    log.info('getting users for group: ', id);
    const uri = getUsersUri(id) + query;
    const response = await edlApiHelper.get(uri, true);
    log.debug('got users for group', id);
    return response;
  } catch (e) {
    log.error('failed to get users for group with error: ', e);
    throw new Error('failed to get users for group');
  }
}

async function getGroups(groupName) {
  try {
    log.debug('get groups for:', groupName);
    const response = await edlApiHelper.get(getGroupsUri(groupName), true);
    log.debug('got groups for: ', groupName);
    return response;
  } catch (e) {
    log.error('failed to get groups with error: ', e);
    throw new Error('failed to get groups');
  }
}

module.exports = { setLogger, getGroups, getUsersForGroup }
