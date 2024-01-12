const api = require('../utilities/edlApiHelper');
const conf = require('../../conf');
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  api.setLogger(logger);
}

function predictCommunity(body) {
  const token = conf.getConfig().databricksEdlToken;
  return api.sendRequest('https://deere-edl.cloud.databricks.com/model/EDL%20Dataset%20Community/Production/invocations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json; format=pandas-records'
    },
    body: JSON.stringify(body)
  });
}

module.exports = { setLogger, predictCommunity }
