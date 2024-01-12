const datasetService = require('../services/datasetService');
const schemaDao = require('../data/schemaDao');
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  datasetService.setLogger(logger);
}

const getSchemaDetails = async schemaId => schemaDao.getSchema(schemaId);

const getSchemasForDataset = async (id, version) => {
  try {
    const { schemas, linkedSchemas } = await datasetService.getDataset(true, id, version);
    return { schemas, linkedSchemas };
  } catch (e) {
    log.error(e.stack);
    throw new Error(`Failed to get schemas for ${id}-${version}`)
  }
}

module.exports = { setLogger, getSchemaDetails, getSchemasForDataset }
