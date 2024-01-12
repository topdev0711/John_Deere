const referenceService = require('./referenceService');
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  referenceService.setLogger(logger);
}

function getReferencedDatasetEntitlement(nonReferencedEntitlement) {
  const referencedEntitlement = {
    community: referenceService.getId('communities', nonReferencedEntitlement.community),
    subCommunity: referenceService.getId('communities', nonReferencedEntitlement.community, 'subCommunities', nonReferencedEntitlement.subCommunity),
    gicp: referenceService.getId('gicp', nonReferencedEntitlement.gicp),
    countriesRepresented: referenceService.getIds('countries', nonReferencedEntitlement.countriesRepresented),
    additionalTags: nonReferencedEntitlement.additionalTags,
    development: nonReferencedEntitlement.development,
    personalInformation: nonReferencedEntitlement.personalInformation
  }

  if(nonReferencedEntitlement.id) referencedEntitlement.id = nonReferencedEntitlement.id;

  return referencedEntitlement;
}

function getDatasetReferences(dataset) {
  return {
    classifications: dataset.classifications.map(getReferencedDatasetEntitlement),
    category: referenceService.getId('categories', dataset.category),
    phase: referenceService.getId('phases', dataset.phase),
    technology: referenceService.getId('technologies', dataset.technology),
    physicalLocation: referenceService.getId('physicalLocations', dataset.physicalLocation)
  };
}

function getReferencedPermissionEntitlement(nonReferencedEntitlement) {
  return getReferencedDatasetEntitlement(nonReferencedEntitlement);
}

module.exports = { setLogger, getReferencedPermissionEntitlement, getDatasetReferences };
