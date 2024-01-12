import {getParams} from './apiHelper';

const timeout = 10000;

const getFullSchemaInfo = schemaId => fetch(`/api/schemas/${schemaId}`, getParams);

const getFullSchemaInfoData = async schemaId => {
  const originalFetch = require('node-fetch');
  const fetch = require('fetch-retry')(originalFetch);

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const params = {...getParams, signal: controller.signal};
  const response = await fetch(`/api/schemas/${schemaId}`, params);
  clearTimeout(id);

  const body = await response.json();

  if (response.ok) return body;

  throw new Error(JSON.stringify(body));
}

const getTimelinessInfo = async (schemaName, from, to, frequency, datasetName) => {
  const params = new URLSearchParams({schema_name: schemaName, dataset: datasetName, frequency, from, to});
  return fetch(`/api/metrics/timeliness?${params}`, getParams);
}

module.exports = {getFullSchemaInfo, getFullSchemaInfoData, getTimelinessInfo};
