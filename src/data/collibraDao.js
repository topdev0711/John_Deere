global.fetch = require('node-fetch');
const conf = require('../../conf');
const approvers = require(`./reference/approvers.json`);
const subcommunities = require(`./reference/subcommunities.json`);

const getReference = reference => () => require(`./reference/${reference}.json`);
const getCommunityNames = getReference('communities');
const getCommunity = id => getCommunityNames().find(community => community.id === id);
const getCountryCodes = getReference('countries');
const getBusinessValues = getReference('business-values');
const getCategories = getReference('categories');
const getPhases = getReference('phases');
const getTechnologies = getReference('technologies');
const getPhysicalLocations = getReference('physical-locations');
const getGicp = getReference('gicp');
const getSubCommunities = commId => subcommunities.filter(({communityId}) => communityId === commId);
const getSubCommunityFromId = subCommunityId => subcommunities.find(subCommunity => subCommunity.id === subCommunityId);
const getApprover = commId => conf.getConfig().isLocal ? 'AWS-GIT-DWIS-DEV' : approvers.find(({id}) => id === commId).approver;
const hasSubCommunity = id =>subcommunities.some(subCommunity =>subCommunity.id === id);

module.exports = {
  getCommunityNames,
  getCommunity,
  getCountryCodes,
  getBusinessValues,
  getCategories,
  getPhases,
  getTechnologies,
  getPhysicalLocations,
  getGicp,
  getSubCommunities,
  getSubCommunityFromId,
  getApprover,
  hasSubCommunity
};
