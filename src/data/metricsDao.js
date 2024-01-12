const dynamo = require("./dynamo");
const conf = require("../../conf");

let log = require('edl-node-log-wrapper');

const setLogger = logger => log = logger;

function model() {
  return dynamo.define(conf.getConfig().metricsTable, {
    hashKey: 'application',
    rangeKey: 'date'
  });
}

async function getMetrics(application) {
  try {
    log.debug('getting metrics');
    const records = await model().query(application).loadAll().exec().promise();
    log.debug('got metrics');
    return records.collectItems();
  } catch (e) {
    log.error('failed to get metrics with error: ', e);
    throw new Error('failed to get metrics');
  }
}

module.exports = { setLogger, getMetrics }
