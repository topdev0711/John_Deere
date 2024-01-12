const {isEqual, omit} = require('lodash');

const omittedGovernanceKeys = ['id'];
const ALL_ACTION = 'ALL';

function safeObject(item) {
  return item || {};
}

function safeArray(items) {
  return items || [];
}

function containsEveryItemOrAll(entitlements = [], classifications = []) {
  return classifications.every(a => entitlements.includes(a) || entitlements.includes(ALL_ACTION));
}

function hasAllRules(entitlements, classifications) {
  return classifications.every(govRule => {
    return entitlements.some(entRule => {
      return entRule.community === govRule.community &&
        entRule.subCommunity === govRule.subCommunity &&
        entRule.gicp === govRule.gicp &&
        containsEveryItemOrAll(entRule.countriesRepresented, govRule.countriesRepresented) &&
        containsEveryItemOrAll(entRule.additionalTags, govRule.additionalTags) &&
        entRule.personalInformation === govRule.personalInformation &&
        entRule.development === govRule.development
    });
  });
}

function simplify(items) {
  return items.map(item => {
    return {
      community: safeObject(item.community).name,
      subCommunity: safeObject(item.subCommunity).name,
      gicp: safeObject(item.gicp).name,
      countriesRepresented: safeArray(item.countriesRepresented).map(c => c.name),
      additionalTags: safeArray(item.additionalTags),
      personalInformation: !!item.personalInformation,
      development: !!item.development
    }
  })
}

function canAccess(entitlements, classifications) {
  const simplifiedEntitlements = simplify(entitlements);
  const simplifiedClassifications = simplify(classifications);
  return hasAllRules(simplifiedEntitlements, simplifiedClassifications);
}

function getUniqueGovernance(blocks) {
  let remainingGovernanceBlocks = [...blocks];
  return blocks.filter(block => {
    remainingGovernanceBlocks.splice(0, 1);
    const totalDuplicates = remainingGovernanceBlocks.find(b => isIdentical(block, b));
    return !totalDuplicates;
  })
}

function isIdentical(a, b) {
  const strippedA = omit(a, omittedGovernanceKeys);
  const strippedB = omit(b, omittedGovernanceKeys);
  return isEqual(strippedA, strippedB);
}

const findLatestAvailableVersions = (items) => {
  const versionsAvailable = items.filter(p => {
    return p.status === 'AVAILABLE'
  })

  return Object.values(versionsAvailable.reduce((accum, item) => {
    const found = accum[item.id]
    if (!found || found.version < item.version) {
      return { ...accum, [item.id]: item }
    }
    return accum
  }, {}))
}

module.exports = {
  canAccess,
  getUniqueGovernance,
  findLatestAvailableVersions
};
