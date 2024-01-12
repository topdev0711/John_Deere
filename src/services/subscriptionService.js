const apiHelper = require('../utilities/edlApiHelper');
const conf = require('../../conf').getConfig();

let log = require('edl-node-log-wrapper');

const setLogger = logger => {
    log = logger;
    apiHelper.setLogger(logger);
}

async function subscribe(body) {
    const url = `${conf.edlWorkflow}/subscriptions`;
    log.info(`calling subscription api from workflow service ${url}`);
    try {
      const response = await apiHelper.postWithInternalOktaAdminParams(url, body);
      log.info(`Received successful response from ${url}`);
      log.debug(response);
      return response;
    } catch (e) {
      log.error(e);
      return e;
    }
  }

async function listSubscriptions(datatype) {
    const url = `${conf.edlCatalog}/v1/subscriptions`;
    log.info(`calling list subscription api ${url}`);
    try {
      const response = await apiHelper.getWithInternalOktaAdminParams(url);
      log.info(`Received successful response from ${url}`);
      log.debug(response);
      const filteredResult = response?.subscriptions?.filter(item => item?.dataType?.some(type => type === datatype));
      return filteredResult;
    } catch (e) {
      log.error(e);
      return e;
    }
  }

  module.exports = {
    subscribe,
    listSubscriptions,
    setLogger
  }
  