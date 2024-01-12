const { OK } = require('http-status-codes');
const referenceService = require('../services/referenceService');
const errorStatusCode = require("../utilities/errorStatusCode");
const { createLoggerWithAttributes } = require('../utilities/logCreator');
const { handleInternalUnauthorized } =  require("./controllerHandlers");
const conf = require('../../conf');

const {isAdmin} = conf.getConfig();
const handleUnauthorized = res => handleInternalUnauthorized(new Error('Not an admin. User is not authorized'), res);
const root = '/api/references/';

function setupLogger(req, res, methodName, id, version) {
  const logger = createLoggerWithAttributes(req, res, 'references', methodName, id, version);
  res.set({'X-Correlation-Id': logger.getCorrelationId()});
  referenceService.setLogger(logger);
  return logger;
}

function getReferenceData(req, res, done) {
  const log = setupLogger(req, res, 'get references');
  log.info('start getting references');
  try {
    const references = referenceService.getAllReferenceData();
    log.info('completed getting references');
    res.json(references);
  } catch(e) {
    log.error(e.stack);
    done('unable to fetch references');
  }
}

function sendUpdatesToEdlDataCatalog(req, res, done) {
  const log = setupLogger(req, res, 'update references');
  log.info('start updating references');
  referenceService.updateReferences(req.query.id)
    .then(response => {
      log.info('completed updating references');
      res.json(response);
    })
    .catch(e => {
      log.error(e.stack);
      done('unable to update references');
    });
}

const updateSubCommunity = (req, res) => {
  const {body: { newId: newSubCommunityId}, params: {id: currentSubCommunityId}} = req;
  const { id } = req.params;
  const log = setupLogger(req, res, 'update subCommunity', id);
  if(!isAdmin(req.user)) return handleUnauthorized(res);

  log.info('started updating subCommunity');
  referenceService.updateSubCommunity({ newSubCommunityId, currentSubCommunityId })
    .then(() => {
      log.info('completed updating subCommunity');
      res.status(OK).json({message: 'Successfully updated subCommunity'});
    })
    .catch(e => {
      log.error(`Failed to update ${currentSubCommunityId}`, e.stack);
      res.status(errorStatusCode.getStatusCode(e)).json({ error: e.message} );
    });
};

const updateCommunity = (req, res) => {
  const { params: { id } } = req;
  const log = setupLogger(req, res, 'update community', id);
  if(!isAdmin(req.user)) return handleUnauthorized(res);

  log.info('started updating community');
  referenceService.updateCommunity({id})
    .then(() => {
      log.info('completed updating community');
      res.status(OK).json({message: 'Successfully updated community'});
    })
    .catch(e => {
      log.error(`Failed to update community: ${id}`, e.stack);
      res.status(errorStatusCode.getStatusCode(e)).json({ error: e.message} );
    });
};

function registerRoutes(server) {
  server.get(root, (_req, res, done) => getReferenceData(_req, res, done));
  server.get('/api-external/references', (_req, res, done) => getReferenceData(_req, res, done));
  server.get('/api/references/update', (req, res, done) => sendUpdatesToEdlDataCatalog(req, res, done));
  server.patch('/api-external/references/community/:id/update', updateCommunity);
  server.patch('/api-external/references/subCommunity/:id/update', updateSubCommunity);
}

module.exports = { registerRoutes };
