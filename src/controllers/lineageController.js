const { OK, INTERNAL_SERVER_ERROR } = require('http-status-codes');
const lineageService = require('../services/lineageService');
const { createLoggerWithAttributes } = require('../utilities/logCreator');

function setupLogger(req, res, methodName, id, version) {
  const logger = createLoggerWithAttributes(req, res, 'lineage', methodName, id, version);
  lineageService.setLogger(logger);
  return logger;
}

function registerRoutes(server) {

  server.get('/api/lineage/sourcedb', (req, res, _done) => {
    const log = setupLogger(req, res, 'get mdi source db details');
    log.info('start getting mdi source db details');
    lineageService.getSourceDBDetails()
      .then(lineage => {
        log.info('completed getting mdi source db details');
        res.status(OK).json(lineage);
      })
      .catch(error => {
        log.error(error.stack);
        res.status(INTERNAL_SERVER_ERROR).json(error);
      });
  });

  server.get('/api/lineage/sourcedb/filters', (req, res, _done) => {
    const log = setupLogger(req, res, 'get mdi source db filters');
    log.info('start getting mdi source db filters');
    lineageService.getSourceDBFilters()
      .then(lineage => {
        log.info('completed getting mdi source db filters');
        res.status(OK).json(lineage);
      })
      .catch(error => {
        log.error(error.stack);
        res.status(INTERNAL_SERVER_ERROR).json(error);
      });
  });

  server.get('/api/lineage/:datasetEnv', (req, res, _done) => {
    const { datasetEnv } = req.params;
    const log = setupLogger(req, res, 'get lineage');
    log.info('start getting lineage');
    lineageService.getLineage(datasetEnv)
      .then(lineage => {
        log.info('completed getting lineage');
        res.status(OK).json(lineage);
      })
      .catch(error => {
        log.error(error.stack);
        res.status(INTERNAL_SERVER_ERROR).json(error);
      });
  });
}

module.exports = { registerRoutes }
