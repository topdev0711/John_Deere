const conf = require('../../conf');
const dynamo = require('./dynamo');
let log = require('edl-node-log-wrapper');

const setLogger = logger => log = logger;

function model() {
  return dynamo.define(conf.getConfig().applicationsTable, {hashKey: 'applicationName'});
}

async function saveApplication(application) {
  try {
    log.debug('saving application: ', JSON.stringify(application));
    await model().create(application);
    log.debug('saved application');
    return 'Success';
  } catch (error) {
    log.error(`failed to save application with error type: ${error.__type} and error is ${error}`);
  }
}

async function getApplication(applicationName) {
  try {
    log.debug('getting application for ', applicationName);
    const query = model().query(applicationName)
    const records = await query.descending().exec().promise();
    const items = await records.collectItems();
    log.debug(`got application for ${applicationName}: ${items}`);
    return items[0];
  } catch (error) {
    log.error('An unexpected error occurred when retrieving the applications with error: ', error);
  }
}

function deleteApplication(applicationName) {
  return new Promise((resolve, reject) => {
    log.debug(`deleting Application name: ${applicationName}`);
    model().destroy(applicationName, (err) => {
      if (err) {
        log.error('failed to delete application with error: ', err);
        resolve();
      }
      else {
        log.debug('deleted application');
        resolve();
      }
    });
  });
}

module.exports = { setLogger, saveApplication, getApplication, deleteApplication }
