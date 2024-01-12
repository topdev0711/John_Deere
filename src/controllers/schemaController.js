const { INTERNAL_SERVER_ERROR, OK } = require('http-status-codes');
const controllerHandlers = require('./controllerHandlers');
const schemaService = require('../services/schemaService');
const { createLoggerWithAttributes } = require('../utilities/logCreator');

const { createErrorMessage } = controllerHandlers;

function setupLogger(req, res, methodName, id, version) {
  const logger = createLoggerWithAttributes(req, res, 'schemas', methodName, id, version);
  controllerHandlers.setLogger(logger);
  schemaService.setLogger(logger);
  return logger;
}

function registerRoutes(server) {
  server.get('/api/schemas/:id', (req, res) => {
    const { id } = req.params;
    const log = setupLogger(req, res, 'get schema', id);
    log.info(`start getting schema for id: ${id}`);
    schemaService.getSchemaDetails(id)
      .then(details => {
        log.info('completed getting schema');
        res.status(OK).json(details);
      })
      .catch(e => res.status(INTERNAL_SERVER_ERROR).json({error: createErrorMessage(e)}))
  });

  server.get('/api-external/schemas/:id', (req, res) => {
    const { id } = req.params;
    const log = setupLogger(req, res, '(external) get schema', id);
    log.info('start getting schema');
    schemaService.getSchemaDetails(id)
      .then(details => {
        log.info('completed getting schema');
        res.status(OK).json(details);
      })
      .catch(e => res.status(INTERNAL_SERVER_ERROR).json({error: createErrorMessage(e)}))
  });

  server.get('/api/schemas/dataset/:id/:version', (req, res) => {
    const { id, version } = req.params;
    const log = setupLogger(req, res, 'get dataset schemas', id, version);
    log.info('start getting dataset schemas');
    schemaService.getSchemasForDataset(id, version)
      .then(schemas => {
        log.info('completed getting dataset schemas');
        res.status(OK).json(schemas);
      })
      .catch(e => res.status(INTERNAL_SERVER_ERROR).json({error: createErrorMessage(e)}))
  });

  server.get('/api-external/schemas/dataset/:id/:version', (req, res) => {
    const { id, version } = req.params;
    const log = setupLogger(req, res, '(external) get dataset schemas', id, version);
    log.info('start getting dataset schemas');
    schemaService.getSchemasForDataset(id, version)
      .then(schemas => {
        log.info('completed getting dataset schemas');
        res.status(OK).json(schemas);
      })
      .catch(e => res.status(INTERNAL_SERVER_ERROR).json({error: createErrorMessage(e)}))
  });
}

module.exports = { registerRoutes }
