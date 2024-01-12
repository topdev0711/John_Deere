const opensearchPermissionDao = require('../data/opensearchPermissionDao');
let log = require("edl-node-log-wrapper");
const setLogger = logger => {
  log = logger;
  opensearchPermissionDao.setLogger(logger);
}

const createSearchParams =({searchTerm, community=[], countriesRepresented = [], dateFilter, development, gicp=[], name = '', personalInformation,
                             start,  subCommunity=[], summary, createdBy = '', accessAllowed, groups=[], roleType }) => {
  if(dateFilter && !start) throw new Error('Must include a "start" in query parameters along with "dateFilter".');
  const communities = [].concat(community);
  const countries = [].concat(countriesRepresented);
  const gicps = [].concat(gicp);
  const roleTypes = [].concat(roleType);
  const subCommunities = [].concat(subCommunity);
  const toBoolean = value => value.toLowerCase() === 'true';
  const toBooleanHandleUndefined = value => typeof value === 'undefined' || value === null ? value : handleInvalidValue(value);
  const handleInvalidValue = value => Array.isArray(value) ? undefined : value.toLowerCase() === 'true';
  const groupsList = [].concat(groups);
  const access = accessAllowed;
  return {
    ...(searchTerm && { searchTerm }),
    ...(communities.length && { communities }),
    ...(countries.length && { countries }),
    ...(dateFilter && { dateFilter }),
    ...(development && { development: toBoolean(development)}),
    ...(gicps.length && { gicps }),
    ...(name && { name }),
    ...(personalInformation && { personalInformation: toBoolean(personalInformation) }),
    ...(start && { start }),
    ...(subCommunities.length && { subCommunities }),
    ...(summary && { summary }),
    ...(createdBy && {createdBy}),
    ...(access && { access: toBooleanHandleUndefined(access) }),
    ...(groupsList.length && {groups: groupsList}),
    ...(roleType && { roleTypes }),
  };
}

const findPermissions = async params => {
  const { from = 0, size = 20 } = params._query;
  params._query.groups = params._user?.groups;
  const searchParams = createSearchParams(params._query);
  return await opensearchPermissionDao.getPermissions(searchParams, from, size);
}

const findPermissionsCount = async params => {
  params._query.groups = params._user?.groups;
  const searchParams = createSearchParams(params._query);
  return await opensearchPermissionDao.getPermissionsCount(searchParams);
}

module.exports = {setLogger, findPermissions, findPermissionsCount };
