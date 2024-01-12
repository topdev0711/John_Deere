const { Client } = require("@opensearch-project/opensearch");
const { defaultProvider } = require("@aws-sdk/credential-provider-node");
const createAwsOpensearchConnector = require("aws-opensearch-connector");
const conf = require('../../conf');
const lineageDao = require('./lineageDao');
const subCommunityList = require('../../src/data/reference/subcommunities.json')
const config = conf.getConfig();
const env = conf.getEnv();
const { indexName, opensearchUrl } = config;
const _ = require('lodash');
let log = require('edl-node-log-wrapper');
const changeCase = require('change-case');
const featureToggleService = require("../services/featureToggleService");
const {VISIBILITY} = require("../utilities/constants");
console.log("Index Name ==> " + indexName)

const wildCardFields = ["description", "deletedSchemas", "environmentName"]
const onlyTextFields = ["paths", "documentation", "custodian", "application", "id", "version", "createdBy", "updatedBy","storageLocation"]
const onlyTextGroupFields = ["classifications.community.*", "classifications.subcommunity.*",
  "classifications.gicp.*", "classifications.countriesRepresented.*", "sourceDatasets.*", "category.*",
  "phase.*", "technology.*", "physicalLocation.*", "attachments.*", "sources.*", "approvals.*", "commentHistory.*"]
const groupedFields = {
  "schemas": {"textOnlyFields": ["schemas.*^2"], "wildCardOnlyFields": ["schemas.name^5", "schemas.fields.name^5"]},
  "linkedSchemas": {"textOnlyFields": ["linkedSchemas.*^2"], "wildCardOnlyFields": ["linkedSchemas.name^5", "linkedSchemas.fields.name^5"]},
  "tables": {"textOnlyFields": ["tables.*^2"], "wildCardOnlyFields": ["tables.schemaEnvironmentName^5", "tables.tablename^5"]},
  "views": {"textOnlyFields": ["views.*^2"], "wildCardOnlyFields": ["views.name^5", "views.fields.name^5"]},
  "discoveredTables": {"textOnlyFields": ["discoveredTables.*^2"], "wildCardOnlyFields": ["discoveredTables.name^5", "discoveredTables.fields.name^5"]},
  "discoveredSchemas": {"textOnlyFields": ["discoveredSchemas.*^2"], "wildCardOnlyFields": ["discoveredSchemas.name^5", "discoveredSchemas.fields.name^5"]},
}

const setLogger = logger => {
  log = logger;
  lineageDao.setLogger(logger);
}

const hasAdGroupToggleEnabled = (toggle, groups=[]) => toggle?.enabled && (!toggle.adGroups || toggle.adGroups.some(adGroup => groups?.includes(adGroup)));
const checkIsPublic = (classifications, publicId)  => classifications.every(({gicp}) => publicId === gicp?.id);
const getCloudClient = async () => {
  const awsCredentials = await defaultProvider()();
  const connector = createAwsOpensearchConnector({
    credentials: awsCredentials,
    region: process.env.AWS_REGION ?? 'us-east-1',
    getCredentials: function (cb) { return cb() }
  });
  return new Client({ ...connector, node: opensearchUrl, });
}

const getLocalClient = () => (new Client({ node: opensearchUrl, ssl: { rejectUnauthorized: false } }));
const getClient = async () => env !== 'local' ? getCloudClient() : getLocalClient();

const fieldArrayQuery = (field, key) => field.map(item => ({ 'match': { [`${key}.keyword`]: item } }));
const fieldtermsSetQuery = (values, key, countField) => { return { 'terms_set': { [key]: { "terms": values, "minimum_should_match_field": countField}}} }

const createNamedQueries = params => {
  const { searchTerm = '' } = params;
  let queries = [];
  if(searchTerm !== '') {
    queries.push({"bool" : {
      "should": [
        {"query_string" : { "query": `${searchTerm}`, fields: ["name^10"]}},
        {"query_string" : { "query": `*${searchTerm}*`, fields: ["name^5"]}}
      ],
      "_name": "Name"
    }})
    wildCardFields.forEach(fieldName => {
      const caseFieldName = changeCase.title(fieldName);
      queries.push({"bool" : {
        "should": [
          {"query_string" : { "query": `${searchTerm}`, "fields": [`${fieldName}^5`], "lenient": true}},
          {"query_string" : { "query": `*${searchTerm}*`, "fields": [`${fieldName}^2`], "lenient": true}}
        ],
        "_name": `${caseFieldName}`
      }})
    })
    onlyTextFields.forEach(fieldName => {
      const caseFieldName = changeCase.title(fieldName);
      queries.push({"query_string" : { "query": `${searchTerm}`, "fields": [`${fieldName}^5`], "_name": `${caseFieldName}`, "lenient": true}});
    })
    onlyTextGroupFields.forEach(fieldName => {
      const finalFieldName = (fieldName == "approvals.*") ? "environmentDetails.*" : fieldName
      const caseFieldName = changeCase.title(finalFieldName.substring(0, finalFieldName.length - 2 ));
      queries.push({"query_string" : { "query": `${searchTerm}`, "fields": [`${fieldName}^5`], "_name": `${caseFieldName}`, "lenient": true}});
    })

    Object.keys(groupedFields).forEach(key => {
      const caseFieldName = changeCase.title(key);
      let subQueries = [];
      const fieldDetails = groupedFields[key];
      Object.keys(fieldDetails).forEach(groupType => {
        if(groupType == "textOnlyFields") {
          subQueries.push({"query_string" : { "query": `${searchTerm}`, "fields": fieldDetails[groupType], "lenient": true}});
        }
        if(groupType == "wildCardOnlyFields") {
          subQueries.push({"query_string" : { "query": `*${searchTerm}*`, "fields": fieldDetails[groupType], "lenient": true}});
        }
      });

      queries.push({"bool" : { "should": [ ...subQueries ], "_name": `${caseFieldName}` }})
    })

  }

  if (searchTerm === '') queries.push({ "match_all": {} })
  return queries
}

function addCustodianVisibilityQuery(visibility, allADGroups, adGroupsToSubCommunities) {
  let query = []
  if (visibility === VISIBILITY.FULL_VISIBILITY) {
    query.push({bool: {must_not: {'exists': {'field': 'visibility'}}}})
  }
  query.push(...fieldArrayQuery(allADGroups, 'custodian'));
  query.push(...fieldArrayQuery(adGroupsToSubCommunities, 'subCommunityStrArray'));
  return query
}

const createQuery = params => {
  const { id = '', name = '', categories = [], custodians = [], groups = [], phases = [], clientIds = [], searchTerm = '', roleTypes = ['human'],
    communities = [], countries = [], development, subCommunities = [], gicps = [], personalInformation, createdBy = '', dbUnique = [],
    sUnique = [], tbUnique = [], entitlements = [], access, isPublicToggleEnabled, publicId = '', allADGroups = [], companyUseToggle = false, visibility = VISIBILITY.FULL_VISIBILITY, adGroupsToSubCommunities=[], custodianVisibleToggle = false} = params;
  let queries = [];
  if (categories.length) queries.push({ bool: { should: fieldArrayQuery(categories, 'category.name') } })
  if (custodians.length) queries.push({ bool: { should: fieldArrayQuery(custodians, 'custodian') } })
  if (phases.length) queries.push({ bool: { should: fieldArrayQuery(phases, 'phase.name') } })
  if (groups.length) queries.push({ bool: { should: fieldArrayQuery(groups, 'group') } })
  if (groups.length) queries.push({ bool: { should: fieldArrayQuery(roleTypes, 'roleType') } })
  if (clientIds.length) queries.push({ bool: { should: fieldArrayQuery(clientIds, 'clientId') } })
  if (clientIds.length) queries.push({ bool: { should: { 'match': { 'roleType': 'system' } } } })
  if (id) queries.push({ bool: { must: { 'match': { 'id': id }}}})
  if (communities.length) queries.push({ bool: { should: fieldArrayQuery(communities, 'classifications.community.name') } })
  if (countries.length) queries.push({ bool: { should: fieldArrayQuery(countries, 'classifications.countriesRepresented.name') } })
  if (typeof development !== 'undefined' && development !== null) queries.push({ bool: { should: [{ 'match': { 'classifications.development': development } } ]} })
  if (gicps.length) queries.push({ bool: { should: fieldArrayQuery(gicps, 'classifications.gicp.name') } })
  if (typeof personalInformation !== 'undefined' && personalInformation !== null) queries.push({ bool: { should: [{ 'match': { 'classifications.personalInformation': personalInformation } }] } })
  if (subCommunities.length) queries.push({ bool: { should: fieldArrayQuery(subCommunities, 'classifications.subCommunity.name') } })
  if (dbUnique.length) queries.push({ bool: { should: fieldArrayQuery(dbUnique, 'environmentName') } })
  if (sUnique.length) queries.push({ bool: { should: fieldArrayQuery(sUnique, 'environmentName') } })
  if (tbUnique.length) queries.push({ bool: { should: fieldArrayQuery(tbUnique, 'environmentName') } })
  if (createdBy) queries.push({ bool: { must: { 'match': { 'createdBy': createdBy } } } })
  if (custodianVisibleToggle) {
    queries.push({bool: {should: addCustodianVisibilityQuery(visibility, allADGroups, adGroupsToSubCommunities)}})
    if (visibility !== VISIBILITY.FULL_VISIBILITY) {
      queries.push({bool: {must_not: {'match': {'visibility': VISIBILITY.FULL_VISIBILITY}}}})
      queries.push({bool: {must: {'exists': {'field': 'visibility'}}}})
    }
  }
  if( typeof access !== 'undefined' || access !== null ){
    let filterTermsSetQuery = fieldtermsSetQuery(entitlements, 'entitlementsStrArray', 'entitlementsCount');
    let publicArrayQuery = []
    publicArrayQuery.push(... fieldArrayQuery(allADGroups, 'custodian'));
    if (isPublicToggleEnabled) publicArrayQuery.push(... fieldArrayQuery([publicId], 'classifications.gicp.id'));
    if (companyUseToggle) publicArrayQuery.push({ 'match': { [`hasAllCompanyUseFlag`]: companyUseToggle } })
    if (access === true && entitlements.length) queries.push({ bool: { should: [ filterTermsSetQuery, ...publicArrayQuery ] }})
    if (access === false && entitlements.length) queries.push({ bool: { must_not: [ filterTermsSetQuery, ...publicArrayQuery ] }})
  }

  return queries;
}

const fetchLineageDataTypes = async (params) => {

  const { databases = [], servers = [], tableNames = [] } = params;
  if(databases.length || servers.length || tableNames.length) {
    const lineageInfo = await lineageDao.getLineageInfoByDST();
    const dbUnique = [...new Set([].concat(...databases.map(database => { return lineageInfo[database.toLowerCase()]})))];
    const sUnique = [...new Set([].concat(...servers.map(server => { return lineageInfo[server.toLowerCase()]})))];
    const tbUnique = [...new Set([].concat(...tableNames.map(tableName => { return lineageInfo[tableName.toLowerCase()]})))];
    return { dbUnique, sUnique, tbUnique};
  }
  return {};
}

async function fetchSubCommunitiesFromADGroup(allADGroups = [], searchList = []) {
  if (!!searchList && !!allADGroups){
    const lookupSet = new Set(allADGroups)
    return searchList.filter(elem => lookupSet.has(elem?.approver)).map(inst => inst.id)
  }
  return [];
}

const buildSearchQuery = async (params, from = 0, size = 500) => {
  const { dbUnique = [], sUnique = [], tbUnique = [] } = await fetchLineageDataTypes(params);
  const paramsFinal = {...params, dbUnique, sUnique, tbUnique};
  const baseQuery = { bool: { should: [ ...createNamedQueries(params)] }};
  return {bool: {must: [baseQuery, ...createQuery(paramsFinal)]}};
}

const buildFetchQuery = async (params, from = 0, size = 500) => {
  const query = await buildSearchQuery(params, from ,size);
  const { searchTerm = '' } = params;
  let fetchQuery = { index: indexName, body: { from, size, query}};
  if( searchTerm === '') fetchQuery["body"] =  { ...fetchQuery["body"], sort: [ {"name.keyword": { "order": "asc"}}]};
  fetchQuery["body"] =  { ...fetchQuery["body"], "_source" : ["custodian","classifications", "id", "status", "name", "description", "phase", "usability", "createdBy", "environmentName", "schemas", "linkedSchemas", "entitlementsStrArray", "entitlementsCount", "hasAllCompanyUseFlag", "visibility"] }
  return fetchQuery;
}

const getSchemaCount = (arrays) => {
  const nameSet = new Set();
  arrays.forEach(element => {
    element.forEach(innerEle => nameSet.add(innerEle.name));
  });
  return nameSet.size;
}
const getDatasets = async (params, from = 0, size = 20) => {
  try {
    log.info('starting search for datasets');
    let [companyUseToggle, custodianVisibleToggle, adGroupsToSubCommunities] =
        await Promise.all([featureToggleService.getToggle(conf.getConfig().companyUseAccessFlag),
          featureToggleService.getToggle(conf.getConfig().custodianVisibleFlag),
          fetchSubCommunitiesFromADGroup(params?.allADGroups, subCommunityList)
        ])
    let isCompanyUseEnabled = hasAdGroupToggleEnabled(companyUseToggle, params.allADGroups)
    let isCustodianVisibleEnabled = custodianVisibleToggle?.enabled
    params['companyUseToggle']  = isCompanyUseEnabled
    params['custodianVisibleToggle']  = isCustodianVisibleEnabled
    params['adGroupsToSubCommunities'] = adGroupsToSubCommunities

    const openSearchClient = await getClient();
    const searchParams = await buildFetchQuery(params, from, size);
    log.debug("getDatasets Request => " + JSON.stringify(searchParams));
    const response = await openSearchClient.search(searchParams);
    log.info('completed search for datasets');
    return response.body.hits.hits.map(({ _source, matched_queries }) => {
      const {environmentName, createdBy, classifications, entitlementsStrArray, entitlementsCount, schemas = [], linkedSchemas = [], id, status, name, description, phase = {}, usability, custodian, hasAllCompanyUseFlag, visibility} = _source;
      const schemaCount = getSchemaCount([schemas, linkedSchemas]);
      let intersects = _.intersection(entitlementsStrArray, params.entitlements);
      let isPublic = checkIsPublic(classifications, params.publicId);
      let isCustodian = !!params?.allADGroups?.includes(custodian)
      let isCompanyUse = isCompanyUseEnabled && hasAllCompanyUseFlag
      const isAccessibleFlag = isCustodian || isCompanyUse || (params.isPublicToggleEnabled ? (isPublic || intersects.length === entitlementsCount) : intersects.length === entitlementsCount);
      const summary = {classifications, schemaCount, id, status, name, description, phase, usability, createdBy, environmentName, isAccessibleFlag, visibility};
      return { ...summary, matched_queries }
    });

  } catch (e) {
    log.error(e.stack);
    throw new Error('An unexpected error occurred when getting dataset from OpenSearch.');
  }
}

const getDatasetsCount = async params => {
  try {
    log.info('starting search for datasets count');
    const [companyUseToggle, custodianVisibleToggle, adGroupsToSubCommunities] =
        await Promise.all([featureToggleService.getToggle(conf.getConfig().companyUseAccessFlag),
          featureToggleService.getToggle(conf.getConfig().custodianVisibleFlag),
          fetchSubCommunitiesFromADGroup(params?.allADGroups, subCommunityList)
        ]);
    let isCompanyUseEnabled = hasAdGroupToggleEnabled(companyUseToggle, params.allADGroups)
    let isCustodianVisibleEnabled = custodianVisibleToggle?.enabled
    params['companyUseToggle']  = isCompanyUseEnabled
    params['custodianVisibleToggle']  = isCustodianVisibleEnabled
    params['adGroupsToSubCommunities'] = adGroupsToSubCommunities

    const opensearchClient = await getClient();
    const query = await buildSearchQuery(params);
    const searchParams = { index: indexName, body: { query } };
    log.debug("getDatasetsCount Request => " + JSON.stringify(searchParams));
    const response = await opensearchClient.count(searchParams);
    log.info('completed search for datasets');
    return response.body.count;
  } catch (e) {
    log.error(e.stack);
    throw new Error('An unexpected error occurred when getting dataset from OpenSearch.');
  }
}

module.exports = { setLogger, buildSearchQuery, buildFetchQuery, getDatasets, getDatasetsCount };
