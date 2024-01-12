import { createPostParams, getParams } from './apiHelper'

const originalFetch = require('node-fetch');
const fetch = require('fetch-retry')(originalFetch);

const getViewsWithStatus = async views => {
  const params = createPostParams(views);
  const viewsResponse = await fetch('/api/views/status', params);
  return viewsResponse.json();
};

 const getDatasetIdsForView = async name => {
  return fetch(`/api/views/${name}/datasets`, {
    credentials: 'same-origin',
    method: 'GET',
    headers: {'Content-Type': 'application/json'}
  });
}

async function getEnvs(tableName, params) {
  let response = await fetch(`/api/metastore?table=${tableName}`, params);
  let databases = await response.json();
  return databases?.map(database => `${database}.${tableName}`) || [];
}

const getTables = async table => {
  const {tableName, schemaVersion, versionless} = table;
  const tableVersion = schemaVersion.replace(/\./g, '_');
  const versionedTable = `${tableName}_${tableVersion}`;
  const params = getParams;
  const promises = [getEnvs(versionedTable, params)];
  if(versionless) {
    promises.push(getEnvs(tableName, params));
  } else {
    promises.push(Promise.resolve([]));
  }
  const [versionedDatabaseTables, versionlessDatabaseTables] = await Promise.all(promises);
  return [...versionedDatabaseTables, ...versionlessDatabaseTables];
}

module.exports = { getViewsWithStatus, getDatasetIdsForView, getTables };
