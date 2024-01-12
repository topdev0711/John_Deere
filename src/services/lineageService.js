let log = require('edl-node-log-wrapper');
const { get } = require('../utilities/edlApiHelper');
const { getConfig } = require('../../conf');

const setLogger = logger => {
  log = logger;
}

const config = getConfig();
const { lineageUrl } = config;

async function getLineage(resource) {
  const url = `${lineageUrl}/v1/lineages/${resource}`
  return get(url);
}

async function getSourceDBDetails() {
  const url = `${lineageUrl}/v1/lineages/sourcedb`
  return get(url);
}

async function getSourceDBFilters() {
  const url = `${lineageUrl}/v1/lineages/sourcedb/filters`
  return get(url);
}

module.exports = { setLogger, getLineage, getSourceDBDetails, getSourceDBFilters }
