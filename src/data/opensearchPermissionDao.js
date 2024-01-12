const { Client } = require("@opensearch-project/opensearch");
const { defaultProvider } = require("@aws-sdk/credential-provider-node");
const createAwsOpensearchConnector = require("aws-opensearch-connector");
const conf = require('../../conf');
const lineageDao = require('./lineageDao');
const config = conf.getConfig();
const env = conf.getEnv();
const { permissionIndexName, opensearchpermissionUrl } = config;
const _ = require('lodash');
let log = require('edl-node-log-wrapper');
const changeCase = require('change-case');

const osMainFields = ["businessCase", "clientId", "createdAt", "id",
  "requestComments", "startDate", "updatedAt", "updatedBy", "createdBy", "paths", "roleType", "version", "views"]
const groupFields = ["entitlements.*", "approvals.*", "commentHistory.*"]
const permissionsPrefix = "permissions.";

const setLogger = logger => {
  log = logger;
  lineageDao.setLogger(logger);
}

const getCloudClient = async () => {
  const awsCredentials = await defaultProvider()();
  const connector = createAwsOpensearchConnector({
    credentials: awsCredentials,
    region: process.env.AWS_REGION ?? 'us-east-1',
    getCredentials: function (cb) { return cb() }
  });
  log.info("Creating Opensearch Client for URL => " + opensearchpermissionUrl)
  return new Client({ ...connector, node: opensearchpermissionUrl, });
}

const getLocalClient = () => (new Client({ node: opensearchpermissionUrl, ssl: { rejectUnauthorized: false } }));
const getClient = async () => env !== 'local' ? getCloudClient() : getLocalClient();

const fieldArrayQuery = (field, key) => field.map(item => ({ 'match': { [`${permissionsPrefix}${key}.keyword`]: item } }));

const createNamedQueries = params => {
  const { searchTerm = '' } = params;
  let queries = [];
  if(searchTerm !== '') {
    queries.push({"multi_match" : { "query": `${searchTerm}`, fields: [permissionsPrefix + "name.normalize^500"], "_name": "Name", "lenient": true}});
    queries.push({"query_string" : { "query": `*${searchTerm}*`, fields: [permissionsPrefix + "name^5"], "_name": "Name", "lenient": true}});
    queries.push({"query_string" : { "query": `${searchTerm}`, fields: [permissionsPrefix + "name^5"], "_name": "Name", "lenient": true}});
    queries.push({"multi_match" : { "query": `${searchTerm}`, fields: [permissionsPrefix + "group.normalize^500"], "_name": "Group", "lenient": true}});
    queries.push({"query_string" : { "query": `*${searchTerm}*`, fields: [permissionsPrefix + "group^5"], "_name": "Group", "lenient": true}});
    queries.push({"query_string" : { "query": `${searchTerm}`, fields: [permissionsPrefix + "group^5"], "_name": "Group", "lenient": true}});

    osMainFields.forEach(fieldName => {
      const caseFieldName = changeCase.title(fieldName);
      queries.push({"multi_match" : { "query": `${searchTerm}`, fields: [`${permissionsPrefix}${fieldName}.normalize^5`], "_name": `${caseFieldName}`, "lenient": true}});
      queries.push({"query_string" : { "query": `${searchTerm}`, fields: [`${permissionsPrefix}${fieldName}^2`], "_name": `${caseFieldName}`, "lenient": true}});

    });
    groupFields.forEach(fieldName => {
      const finalFieldName = (fieldName == "approvals.*") ? "environmentDetails.*" : fieldName
      const caseFieldName = changeCase.title(finalFieldName.substring(0, finalFieldName.length - 2 ));
      queries.push({"query_string" : { "query": `${searchTerm}`, "fields": [`${permissionsPrefix}${fieldName}^5`], "_name": `${caseFieldName}`, "lenient": true}});
    })
  }

  if (searchTerm === '') queries.push({ "match_all": {} })
  return queries
}

const createQuery = params => {
  const { id = '', groups = [], clientIds = [], roleTypes = [],
    communities = [], countries = [], development, subCommunities = [], gicps = [], personalInformation, createdBy = '', access} = params;

  let queries = [];
  if (roleTypes.length) queries.push({ bool: { should: fieldArrayQuery(roleTypes, 'roleType') } })
  if (clientIds.length) queries.push({ bool: { should: fieldArrayQuery(clientIds, 'clientId') } })
  if (clientIds.length) queries.push({ bool: { should: { 'match': { 'roleType': 'system' } } } })
  if (id) queries.push({ bool: { must: { 'match': { 'id': id } } } })
  if (communities.length) queries.push({ bool: { should: fieldArrayQuery(communities, 'entitlements.community.name') } })
  if (countries.length) queries.push({ bool: { should: fieldArrayQuery(countries, 'entitlements.countriesRepresented.name') } })
  if (typeof development !== 'undefined' && development !== null) queries.push({ bool: { should: [{ 'match': { [permissionsPrefix + "entitlements.development"]: development } }] } })
  if (gicps.length) queries.push({ bool: { should: fieldArrayQuery(gicps, 'entitlements.gicp.name') } })
  if (typeof personalInformation !== 'undefined' && personalInformation !== null) queries.push({ bool: { should: [{ 'match': { [permissionsPrefix + "entitlements.personalInformation"]: personalInformation } }] } })
  if (subCommunities.length) queries.push({ bool: { should: fieldArrayQuery(subCommunities, 'entitlements.subCommunity.name') } })
  if (createdBy) queries.push({ bool: { must: { 'match': { 'createdBy': createdBy } } } })
  if (typeof access !== 'undefined' || access !== null ) {
    let filterArray = [...fieldArrayQuery(groups, 'group')];
    if (access === true && groups.length) queries.push({ bool: { should: filterArray }})
    if (access === false && groups.length) queries.push({ bool: { must_not: filterArray }})
  }

  return queries;
}

const buildSearchQuery = async (params) => {
  const baseQuery = { bool: { should: [ ...createNamedQueries(params)] }};
  const query = { bool: { must: [ baseQuery, ...createQuery(params)] } };
  return query;
}

const buildPermissionCountQuery = async (query) => {
  return {"size":0,"aggs":{"all_nested_count":{"nested":{"path":"permissions"},"aggs":{"bool_aggs":{"filter":query,"aggs":{"filtered_aggs":{"sum":{"field":"permissions.count"}}}}}}}};
}

const getPermissionFieldsToRetrieve = () => [ "name", "id", "startDate", "endDate" ].map((val) => `${permissionsPrefix}${val}`);

const buildFetchQuery = async (params, from = 0, size = 500) => {
  const query = await buildSearchQuery(params);
  const { searchTerm = "" } = params;
  let fetchQuery = { index: permissionIndexName, body: { from, size, "query": {"nested" :
    {"path": "permissions", query,  "score_mode": "sum",  "inner_hits": { "size": 10000,"_source": [...getPermissionFieldsToRetrieve()]}} } }};
  if (searchTerm === "")
    fetchQuery["body"] = {
      ...fetchQuery["body"],
      sort: [{ "roleType.keyword": { order: "asc" }}, { "id.keyword": { order: "asc" }}],
    };
  else
    fetchQuery["body"] = {
      ...fetchQuery["body"],
      sort: [{ "roleType.keyword": { order: "asc" }}, { "_score": { order: "desc" }}],
    };
  fetchQuery["body"] = {
    ...fetchQuery["body"],
    _source: ["id", "roleType"]
  };
  return fetchQuery;
};

const getPermissions = async (params, from = 0, size = 20) => {
  try {
    log.info('starting search for permissions');
    const opensearchClient = await getClient();
    const searchParams = await buildFetchQuery(params, from, size);
    log.debug("Get permissions search params => " + JSON.stringify(searchParams));
    const response = await opensearchClient.search(searchParams);
    log.info('completed search for permissions');
    const output = response.body.hits.hits.map(({ _source, inner_hits }) => {
      let { id, roleType } = _source;

      const permissions = inner_hits.permissions.hits.hits.map(el => {return el._source});
      const matched_queries = [...new Set(...inner_hits.permissions.hits.hits.map(el => {return el.matched_queries}))]
      let isMember = params.groups.includes(id);
      const summary = { id, roleType, permissions, isMember};
      return { ...summary, matched_queries }
    });
    return output;
  } catch (e) {
    log.error(e.stack);
    throw new Error('An unexpected error occurred when getting permissions from OpenSearch.');
  }
}

const getPermissionsCount = async (params) => {
  try {
    log.info("starting count for permissions");
    const opensearchClient = await getClient();
    const query = await buildSearchQuery(params);
    log.debug("Query for Group Count => " + JSON.stringify(query));
    const permissionsCountQuery = await buildPermissionCountQuery(query);
    log.debug("Query for Permission Count => " + JSON.stringify(permissionsCountQuery));
    const groupCountParams = { index: permissionIndexName, body: { "query": {"nested" : {"path": "permissions", query } } } };
    const permissionsCountParams = {
      index: permissionIndexName,
      body: permissionsCountQuery,
    };
    const [groupCountResponse, permissionsCountResponse] = await Promise.all([
      opensearchClient.count(groupCountParams),
      opensearchClient.search(permissionsCountParams),
    ]);

    log.info("completed getPermissionsCount call");
    return {
      groups: groupCountResponse?.body?.count,
      permissions:
        permissionsCountResponse?.body?.aggregations?.all_nested_count
          ?.bool_aggs?.filtered_aggs?.value,
    };
  } catch (e) {
    log.error(e.stack);
    throw new Error("An unexpected error occurred when getting permissions from OpenSearch.");
  }
};

module.exports = { setLogger, buildSearchQuery, buildFetchQuery, getPermissions, getPermissionsCount };
