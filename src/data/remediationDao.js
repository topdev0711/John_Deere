const conf = require('../../conf');
const dynamo = require('./dynamo');
let log = require('edl-node-log-wrapper');

const setLogger = logger => log = logger;

function model() {
  return dynamo.define(conf.getConfig().remediationsTable, { hashKey: 'name', rangeKey: 'createdAt'});
}

async function saveRemediation(remediation) {
  try {
    log.debug('saving remediation: ', remediation);
    await model().create(remediation);
    log.debug('saved remediation');
    return 'Success';
  } catch (error) {
    log.error('failed to save remediation with error: ', error);
    throw new Error('failed to save remediation');
  }
}

async function getPendingRemediations() {
  try {
    log.debug('getting pending remediations');
    const records =  await model().scan().loadAll().exec().promise();
    const results = await records.collectItems();
    const pendingRemediations = results.filter( result => result.status === 'PENDING');
    log.debug('got pending remediations: ', pendingRemediations);
    return pendingRemediations;
  } catch (error) {
    log.error('An unexpected error occurred when retrieving the view-remediations with error: ', error);
    throw new Error('An unexpected error occurred when retrieving the view-remediations');
  }
}

async function getRemediation(name) {
  try {
    log.debug('getting remediation for ', name);
    const query = model().query(name)
    const records = await query.descending().exec().promise();
    const items = await records.collectItems();
    log.debug(`got remediation for ${name}: ${items}`);
    return items[0];
  } catch (error) {
    log.error('An unexpected error occurred when retrieving the view-remediation with error: ', error);
    throw new Error('An unexpected error occurred when retrieving the view-remediation');
  }
}

function deleteRemediation(name, createdAt) {
  return new Promise((resolve, reject) => {
    log.debug(`deleting remediation name: ${name} at ${createdAt}`);
    model().destroy(name, createdAt, (err) => {
      if (err) {
        log.error('failed to delete remediation with error: ', err);
        reject(new Error('failed to delete remediation'));
      }
      else {
        log.debug('deleted remediation');
        resolve();
      }
    });
  });
}

module.exports = { setLogger, saveRemediation, getPendingRemediations, getRemediation, deleteRemediation }
