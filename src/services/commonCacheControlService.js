const permissionService = require('../services/permissionService');
const conf = require('../../conf');
let log = require("edl-node-log-wrapper");
const ttlInSeconds = 600;
const setLogger = logger => {
  log = logger;
}

async function getClassifications(params, groupKey, cache) {
  log.info('Entitlements not cached');
  let queryParams = { status: ['AVAILABLE'], roleType: params?._user?.roles ? params?._user?.roles : ['human', 'system'], group: params?._user?.groups };
  let actualPermission = await permissionService.searchForPermission(queryParams);
  const entitlements = getUserEntitlements(actualPermission);
  const entitlementsArray = Array.from(new Set(entitlements.map(entitlement => {
    const crIds = entitlement.hasOwnProperty('countriesRepresented') ? entitlement.countriesRepresented.map(crObject => crObject.id) : [];
    if(crIds.length > 0) crIds.sort();
    const crIdsStr = (crIds.length === 0 ) ? "" : "-" + crIds.join("-");
    const cId = (entitlement.community?.id) ? entitlement.community.id : "";
    const sId = (entitlement.subCommunity?.id) ? entitlement.subCommunity.id : "";
    const gicpId = (entitlement.gicp?.id) ? entitlement.gicp.id : "";
    const dev = (entitlement.hasOwnProperty('development')) ? entitlement.development : "";
    const pi = (entitlement.hasOwnProperty('personalInformation')) ? entitlement.personalInformation : "";
    const tags = (entitlement.hasOwnProperty('additionalTags')) ? entitlement.additionalTags?.sort()?.join('-') : "";
    return cId + "-" + crIdsStr + "-" + dev + "-" + gicpId + "-" + pi + "-" + sId + "-" + tags;
  })));
  await cache.set(groupKey, entitlementsArray);
  log.debug('Cached Entitlements => '  + entitlementsArray);
  return entitlementsArray;
}

async function setClassificationsFromPermissions(params) {
  let timerStart = Date.now();
  let groups = params?._user?.groups?.sort().join('-');
  log.debug("Groups to get from Cache => " + groups)
  let cache = await conf.getRedisCacheManager(ttlInSeconds);
  const cachedEntitlements = await cache.get(groups);
  log.debug("Cached Entitlements => " + cachedEntitlements?.length);
  const entitlements = cachedEntitlements || (await getClassifications(params, groups, cache));
  log.info(`Time for ${params?._user?.groups.length} groups to get sorted and read from cache : ${Date.now()-timerStart} ms`);

  params._query.entitlements = entitlements;
}

let getUserEntitlements = (permissions) => permissions.filter(isPermEffective).map(p => p.entitlements).reduce((accum, items) => {
  return accum.concat(items);
}, []);

let isPermEffective = (perm) => {
  if (!perm) return false;
  let now = new Date();
  let start = new Date(perm.startDate);
  let end = new Date(perm.endDate);
  return start.getTime() < now && (!perm.endDate || (end.getTime() > now.getTime()));
}


module.exports = {setLogger, setClassificationsFromPermissions };
