const { any } = require('prop-types');
const apiHelper = require('../utilities/edlApiHelper');
const conf = require('../../conf').getConfig();
let log = require('edl-node-log-wrapper');

const ingestRequestUrl = `${conf.edlFiles}/ingest-requests`;
const deleteRequestUrl = `${conf.edlFiles}/delete-requests`;

const setLogger = logger => {
  log = logger;
  apiHelper.setLogger(logger);
};

const findHistory = async (url, metadata) => {
  try {
    return (await apiHelper.getFilesApi(url, metadata));
  } catch (e) {
    return {requests: []};
  }
}

const sortByStartTime = (a, b) => a.metaData.startTime > b.metaData.startTime ? -1 : a.metaData.startTime < b.metaData.startTime ? 1 : 0;

const getLoadHistory = async metadata => {
  try {
    const { requests: ingestHistory = [] } = await findHistory(ingestRequestUrl, metadata);
    const { requests: deleteHistory = [] } = await findHistory(deleteRequestUrl, metadata);
    const loadHistory = [...ingestHistory, ...deleteHistory];
    return loadHistory.sort(sortByStartTime);
  } catch (e) {
    throw e;
  }
}

module.exports = { setLogger, getLoadHistory };
