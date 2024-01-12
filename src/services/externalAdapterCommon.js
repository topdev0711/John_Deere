const { NOT_FOUND } = require('http-status-codes');
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
};

const deleteUpdateFields = ({approvals, status, version, ...remainingDataset}) => remainingDataset;
const cleanNewExternal = ({ id, createdAt, createdBy, environmentName, ...remainingDataset}) => remainingDataset;
const cleanUpdatedExternal = dataset => deleteUpdateFields(dataset);
const notFoundError = (id, resourceType) => {
  const error = new Error(`There is no ${resourceType} with id: ${id}`);
  error.statusCode = NOT_FOUND;
  return error;
};

async function getCreationInfo(latestVersion, id, user, resourceType) {
  if (!latestVersion || !latestVersion.version) throw notFoundError(id, resourceType);
  log.info('retrieved latest version');
  const { version, createdAt, createdBy, status } = latestVersion;
  const creationInfo = status !== 'AVAILABLE' ? { createdAt, createdBy } : { createdBy: user, createdAt: getIsoDatetime() };
  return { ...creationInfo, version, status};
}

const getIsoDatetime = () => new Date().toISOString();

module.exports = { setLogger, cleanNewExternal, cleanUpdatedExternal, getCreationInfo, notFoundError };
