// Unpublished Work © 2021-2022 Deere & Company.
const metricsDao = require('../data/metricsDao');
let log = require('edl-node-log-wrapper');
const { get, post } = require('../utilities/edlApiHelper');
const { getConfig } = require('../../conf');
const featureToggleService = require("./featureToggleService");

const setLogger = logger => {
  log = logger;
  metricsDao.setLogger(logger);
}

const config = getConfig();
const { dqTimelinessUrl, dqMetricsUrl } = config;

async function getApplicationsMetrics(applications) {
  try {
    let metrics = [];
    if (applications.length) {
      const results = await Promise.all(applications.map(app => metricsDao.getMetrics(app)));
      metrics = results.reduce((acc, metrics) => [...acc, ...metrics], []);
    }
    return metrics;
  } catch (error) {
    log.error(error);
    throw new Error(`Data lookup for applications failed: ${applications}`);
  }
}

async function getTimelinessMetric(schema_name, dataset, frequency, from, to) {
  try {
    const urlTemplate = `${dqTimelinessUrl}/v1/edl-dq/metrics/timeliness?schema_name=${schema_name}&dataset=${dataset}&frequency=${frequency}&from=${from}&to=${to}`;
    return await get(urlTemplate, false);
  } catch (error) {
    log.error(error);
    throw new Error(`Failed to retrieve timeliness metric for schema: ${schema_name}`);
  }
}

async function getMetric(tableName, metric, status) {
  if (!status) return getLatestMetrics(tableName);
  if (status.includes('COMPLETE')) return getLatestCompleteMetrics(tableName);
  else throw new Error(`Invalid metric: ${metric}`);
}


async function postMetric(tableName) {
  return await post(`${dqMetricsUrl}/quality/${tableName}`);
}

async function getLatestCompleteMetrics(tableName) {
  try {
    let collibraFlag = (await featureToggleService.getToggle(getConfig().collibraDQConfig))?.enabled
    collibraFlag = (collibraFlag) ? collibraFlag : false;
    if(collibraFlag) {
      log.info("Getting latest completed quality metrics for ", tableName, " from Collibra")
      const result = await get(`${dqMetricsUrl}/quality/${tableName.toUpperCase()}/versions/latest?source=collibra`, false);
      return result;
    }
    else {
      log.info("Getting latest completed quality metrics for ", tableName, " from Deequ");
      const result = await get(`${dqMetricsUrl}/quality/${tableName}?status[]=COMPLETE&limit=1`, false);
      return result.pop();
    }
  } catch (error) {
    log.error(error);
    throw new Error(`Failed to retrieve latest completed quality metric for table: ${tableName.toUpperCase()}`);
  }
}

async function getLatestMetrics(tableName) {
  try {
    let collibraFlag = (await featureToggleService.getToggle(getConfig().collibraDQConfig))?.enabled
    collibraFlag = (collibraFlag) ? collibraFlag : false;
    if( collibraFlag) {
      log.info("Getting latest quality metrics for ", tableName, " from Collibra")
      return await get(`${dqMetricsUrl}/quality/${tableName.toUpperCase()}/versions/latest?source=collibra`, false);
    }
    else{
      log.info("Getting latest completed quality metrics for ", tableName, " from Deequ");
      return await get(`${dqMetricsUrl}/quality/${tableName}/versions/latest`, false);
    }
  } catch (error) {
    log.error(error);
    throw new Error(`Failed to retrieve latest quality metric for table: ${tableName.toUpperCase()}`);
  }
}

module.exports = { setLogger, getApplicationsMetrics, getTimelinessMetric, getMetric, postMetric }
