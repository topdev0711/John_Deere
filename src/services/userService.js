const conf = require('../../conf');
const oktaDao = require('../data/oktaDao');
const activeDirectoryDao = require('../data/ldap/activeDirectoryDao');
let log = require("edl-node-log-wrapper");

const setLogger = logger => {
  log = logger;
  oktaDao.setLogger(logger);
  activeDirectoryDao.setLogger(logger);
};

const secondsInDay = 24 * 60 * 60;

function createQuery({ after = '', loadFirst = false, noLimit = false }) {
  if (loadFirst) return '?limit=100';
  if (noLimit) return '?limit=10000';
  if (after) return `?limit=10&after=${after}`
  return '?limit=10';
}

async function getUsersForGroup(groupName, params = {}) {
  const query = createQuery(params);
  const cache = await conf.getRedisCacheManager(secondsInDay);
  const cachedUsers = await cache.get(`${groupName}-${query}-users`);
  if (!cachedUsers) {
    try {
      const groups = await oktaDao.getGroups(groupName);
      const group = groups.find(({ profile }) => {
        return (
          (!!profile.windowsDomainQualifiedName && profile.windowsDomainQualifiedName.includes('JDNET')) && profile.samAccountName === groupName)
      });

      if (!group) return new Error(`${groupName} does not exist in Okta.`);
      const users = await oktaDao.getUsersForGroup(group.id, query);
      const condensedUsers = users.map(user => {
        const { id, profile: { displayName, email = '', samAccountName = '', userType = '' } } = user;
        let name = displayName ? displayName : samAccountName;
        if (!userType) {
          name = `${name} (app id)`;
        }
        return { id, displayName: name, email };
      });
      const referenceCache = await conf.getRedisCacheManager(secondsInDay);
      await referenceCache.set(`${groupName}-${query}-users`, condensedUsers);

      return condensedUsers;
    } catch (error) {
      log.error(error.stack);
      throw new Error('An unexpected error occurred when retrieving users from Okta.');
    }
  }
  return cachedUsers;
}

function getUserInfo(racfId) {
  return activeDirectoryDao.findUserInfo(racfId);
}

module.exports = { setLogger, getUsersForGroup, getUserInfo };
