const opensearchDao = require('../data/opensearchDao');
const cacheService = require('./commonCacheControlService');
let log = require("edl-node-log-wrapper");
const {VISIBILITY} = require("../utilities/constants");
const setLogger = logger => {
  log = logger;
  opensearchDao.setLogger(logger);
}

const createSearchParams =({searchTerm, category=[], community=[], countriesRepresented = [], custodian=[],
                             dateFilter, development, gicp=[], name = '', personalInformation, phase=[],
                             start,  subCommunity=[], summary, databases = [], servers = [],
                             tableNames = [], createdBy = '', access, adGroups =[], entitlements=[], isPublicToggleEnabled, publicId, visibility = VISIBILITY.FULL_VISIBILITY}) => {
  if(dateFilter && !start) throw new Error('Must include a "start" in query parameters along with "dateFilter".');
  const categories = [].concat(category);
  const communities = [].concat(community);
  const countries = [].concat(countriesRepresented);
  const custodians = [].concat(custodian);
  const gicps = [].concat(gicp);
  const phases = [].concat(phase);
  const subCommunities = [].concat(subCommunity);
  const toBoolean = value => value.toLowerCase() === 'true';
  const toBooleanHandleUndefined = value => typeof value === 'undefined' || value === null ? value : handleInvalidValue(value);
  const handleInvalidValue = value => Array.isArray(value) ? undefined : value.toLowerCase() === 'true';
  const databasesArr = [].concat(databases);
  const serversArr = [].concat(servers);
  const tableNamesArr = [].concat(tableNames);
  const adGroupsArr = [].concat(adGroups);
  const entitlementsArr = [].concat(entitlements);
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
    ...(subCommunities.length && { subCommunities }),
    ...(summary && { summary }),
    ...(databases.length && {databases: databasesArr}),
    ...(servers.length && {servers: serversArr}),
    ...(tableNames.length && {tableNames: tableNamesArr}),
    ...(createdBy && {createdBy}),
    ...(access && { access: toBooleanHandleUndefined(access) }),
    ...(adGroupsArr.length && {adGroups: adGroupsArr}),
    ...(entitlementsArr.length && {entitlements: entitlementsArr}),
    ...(isPublicToggleEnabled && { isPublicToggleEnabled: toBoolean(isPublicToggleEnabled)}),
    ...(publicId && {publicId}),
    ...(visibility && { visibility : visibility})
  };
}

const findDatasets = async params => {
  const { from = 0, size = 20 } = params._query;
  await cacheService.setClassificationsFromPermissions(params);
  const searchParams = createSearchParams(params._query);
  searchParams['allADGroups'] = params?._user?.groups;
  return await opensearchDao.getDatasets(searchParams, from, size);
}

const findDatasetsCount = async params => {
  await cacheService.setClassificationsFromPermissions(params);
  const searchParams = createSearchParams(params._query);
  searchParams['allADGroups'] = params?._user?.groups;
  return await opensearchDao.getDatasetsCount(searchParams);
}

module.exports = {setLogger, findDatasets, findDatasetsCount };
