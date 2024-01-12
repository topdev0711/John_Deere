const ldap = require('./ldapClient');
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  ldap.setLogger(logger);
}

const ownerNames = ['managedBy', 'JohnDeereGroupManagedBy1', 'JohnDeereGroupManagedBy2'];
const ownerTitle = { managedBy: 'owner', JohnDeereGroupManagedBy1: 'backupOwner', JohnDeereGroupManagedBy2: 'backupOwner1'};
const isOwner = key => ownerNames.includes(key);
const parseName = owner => owner.substring(owner.indexOf('CN=') + 3, owner.indexOf(','));
const mergeOwner = (owners, owner) => ({...owners, ...owner});

async function findOwnerDetails(name) {
  const filter = `(cn=${name})`;
  const [ldapResponse] = await ldap.search(filter, ['mail', 'sAMAccountName']);
  return ldapResponse;
}

async function createOwnerWithDetails(group, owner) {
  const name = parseName(group[owner]);
  const { sAMAccountName: username } = await findOwnerDetails(escapedToHex(name));
  return { [ownerTitle[owner]]: {name, username, email: `${username}@deere.com`} };
}

async function findNamesByRacfIds(racfIds) {
  const filter = '(sAMAccountName=${param})';
  const results = await ldap.searchArray(filter, ['cn', 'sAMAccountName'], racfIds);
  return results.map(result => { return {racfId: result.sAMAccountName, name: result.cn} });
}

async function findUsersInfo(userIds) {
  const filter = '(sAMAccountName=${param})';
  const response = await ldap.searchArray(filter, ['cn', 'mail', 'sAMAccountName'], userIds);
  return response
    .filter(record => JSON.stringify(record) !== '{}')
    .map(result => { return {userId: result.sAMAccountName, name: result.cn, mail: result.mail} });
}

const findUserInfo = async userId => {
  const users = await findUsersInfo([userId]);
  if(!users.length) throw new Error('Racf ID not found');
  return users[0];
}

function escapedToHex(str) {
  if(!str) return str;

  let newValue = '';
  for(let i = 0; i < str.length; i++) {
    let char = str.charAt(i);
    switch(char) {
      case '(':
        char = '\\28'
        break;
      case ')':
        char = '\\29'
        break;
    }
    newValue = newValue + char
  }
  return newValue;
}

async function findAdGroup(adGroupName) {
  const filter = `(&(samaccountname=${adGroupName})(objectclass=group))`;
  const [adGroup] = await ldap.search(filter, ownerNames);
  return adGroup;
}

async function findOwners(adGroupName) {
  try {
    log.debug(`finding AD group ${adGroupName}`);
    const group = await findAdGroup(adGroupName);
    log.debug(`found AD group ${group}`);

    const owners = Object.keys(group).filter(isOwner);
    log.debug(`finding owner details for ${owners}`);
    const ownersWithEmail = await Promise.all(owners.map(owner => createOwnerWithDetails(group, owner)));
    log.debug(`found owner details: ${ownersWithEmail}`);
    return ownersWithEmail.reduce(mergeOwner, {});
  } catch (e) {
    log.error('failed to find AD owners with error: ', e);
    throw new Error('failed to find AD owners');
  }
}

module.exports = { setLogger, findOwners, findNamesByRacfIds, findUserInfo };
