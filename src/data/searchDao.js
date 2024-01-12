const es = require('elasticsearch');
const conf = require('../../conf');
const awsConnect = require('http-aws-es');
let log = require('edl-node-log-wrapper');

function getOptionalConfig() {
  const { amazonES } = conf.getConfig();
  return {connectionClass: awsConnect, amazonES};
}

function getClient() {
  const { esHost } = conf.getConfig();
  return new es.Client({host: esHost, ...getOptionalConfig()});
}

function buildGroupFilter(filters, group) {
  const terms = {'group.keyword': group};
  const term = {'roleType.keyword': 'human'};
  return filters.concat([{terms}, {term}]);
}

function buildClientIdFilter(filters, clientId) {
  return filters.concat([{
    terms: {
      'clientId.keyword': clientId
    }
  }, {
    term: {
      'roleType.keyword': 'system'
    }
  }]);
}

function buildDateFilter(filters, dateFilter, start, end) {
  const startISODate = start && new Date(start).toISOString();
  const endISODate = end && new Date(end).toISOString();
  if (start && end) {
    return filters.concat(JSON.parse(`{
      "range": {
        "${dateFilter}":{
          "gte": "${startISODate}",
          "lte": "${endISODate}"
        }
      }
    }
  `));
  } else {
    return filters.concat(JSON.parse(`{
      "range": {
        "${dateFilter}":{
          "gte": "${startISODate}"
        }
      }
    }
  `));
  }
}

function getSearchByStatusFilters(status = ['AVAILABLE'], group = undefined, clientId = undefined, queryParams = {}) {
  const {dateFilter = undefined, start = undefined, end = undefined} = queryParams;

  let filters = [{terms: {'status.keyword': status}}];

  if (group) filters = buildGroupFilter(filters, group);
  else if (clientId) filters = buildClientIdFilter(filters, clientId);

  if (dateFilter) filters = buildDateFilter(filters, dateFilter, start, end);

  return filters;
}

function getSearchByStatusConfig(index, filters) {
  return {
    index,
    body: {
      query: {
        bool: {
          filter: filters
        }
      },
      size: 10000
    }
  }
}

async function searchByStatus(index, status = ['AVAILABLE'], group = undefined, clientId = undefined, queryParams = {}) {
  try {
    log.debug(`searching ${index} by status ${status}`);
    const client = getClient();
    const filters = getSearchByStatusFilters(status, group, clientId, queryParams)
    const searchParams = getSearchByStatusConfig(index, filters);
    const searchResponse = await client.search(searchParams).then(result => result.hits.hits.map(x => x._source));
    log.debug(`searched ${index} by status ${status}`);

    return searchResponse;
  } catch (e) {
    log.error('failed search by status with error: ', e);
    throw new Error('failed search by status');
  }
}

function getSearchByIdAndVersionConfig(version, id, index) {
  const versionMatch = {match: {version}};
  const idMatch = {match: {id}};
  const must = !!version ? [idMatch, versionMatch] : [idMatch];
  const searchConfig = {
    index,
    body: {
      query: {
        bool: {
          must
        }
      },
      size: !!version ? 1 : 10000
    }
  }
  return searchConfig;
}

async function searchByIdAndVersion(index, id, version = '') {
  const versionSuffix = version ? `--${version}` : version;
  const resource = `${id}${versionSuffix}`;
  try {
    log.debug(`searching ${index} for ${resource}`);
    const client = getClient();
    const searchConfig = getSearchByIdAndVersionConfig(version, id, index);
    const searchResponse = await client.search(searchConfig).then(result => result.hits.hits.map(x => x._source));
    log.debug(`searching ${index} for ${resource}`);

    return searchResponse;
  } catch (e) {
    log.error('failed search by id and version with error: ', e);
    throw new Error('failed search by id and version');
  }
}

async function upsert(index, item) {
  const id = item.id + '--' + item.version;
  try {
    log.debug(`upserting to ${index} with id ${id}`);
    const client = getClient();
    const upsertConfig = {
      index,
      refresh: 'wait_for',
      type: index.substring(0, index.length - 1),
      id,
      body: item
    }
    const upsertResponse = await client.index(upsertConfig);
    log.debug(`upserted to ${index} with id ${id}`);

    return upsertResponse;
  } catch (e) {
    log.error('failed to upsert with error: ', e);
    throw new Error('failed to upsert');
  }
}

async function bulkUpsert(index, items) {
  const client = getClient();
  const _index = index;
  const _type = index.substring(0, index.length - 1);
  const body = items.map(item => {
    const _id = item.id + '--' + item.version;
    return [
      {index: { _index, _type, _id }},
      {...item, environment: {}}
    ];
  }).reduce((a, b) => a.concat(b), []);

  try {
    log.debug(`bulk upserting to ${index}`);
    const bulkResponse = await client.bulk({body});
    log.debug(`bulk upserted to ${index}`);
    return bulkResponse;
  } catch (e) {
    log.error('failed bulk upsert with error: ', e);
    throw new Error('failed bulk upsert');
  }
}

async function deleteIndex(index) {
  try {
    log.debug(`deleting index ${index}`);
    const client = getClient();
    await client.indices.delete({index});
    log.debug(`deleted index ${index}`);

    log.debug(`creating index ${index}`);
    const createResponse = client.indices.create({index});
    log.debug(`creating index ${index}`);

    return createResponse;
  } catch (e) {
    log.error('failed to delete index with error: ', e);
    throw new Error('failed to delete index');
  }
}

async function updatePropertyForId(index, id, field, newValue) {
  try {
    log.debug(`updating property in ${index}`);
    const client = getClient();
    const updateResponse = await client.updateByQuery({
      index,
      refresh: true,
      waitForCompletion: true,
      body: {
        script: {
          source: `ctx._source['${field}'] = ${JSON.stringify(newValue)}`,
          lang: 'painless'
        },
        query: {
          term: {
            'id.keyword': id
          }
        }
      }
    });
    log.debug(`updated property in ${index}`);
    return updateResponse;
  } catch (e) {
    log.error('failed to update property with error: ', e);
    throw new Error('failed to update property');
  }
}

module.exports = { updatePropertyForId, searchByIdAndVersion, searchByStatus, upsert, bulkUpsert, deleteIndex };
