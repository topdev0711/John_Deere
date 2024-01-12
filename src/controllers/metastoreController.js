const { FORBIDDEN, BAD_REQUEST, INTERNAL_SERVER_ERROR, MULTI_STATUS,OK } = require('http-status-codes');
const metastoreService = require('../services/metastoreService');
const viewService = require('../services/viewService');
const { createLoggerWithAttributes } = require('../utilities/logCreator');

function setupLogger(req, res, methodName, id, version) {
  const logger = createLoggerWithAttributes(req, res, 'metastore', methodName, id, version);
  metastoreService.setLogger(logger);
  viewService.setLogger(logger);
  return logger;
}

function registerRoutes(server) {
  server.post('/api-external/views', (req, res) => {
    const log = setupLogger(req, res,  '(external) save views');

    if (!req.user.isAdmin) {
      log.error('FORBIDDEN: Not an admin. User is not authorized.');
      return res.status(FORBIDDEN).json({error: 'Not an admin. User is not authorized.'});
    }

    if (!req.body.storageLocation) {
      log.error('BAD REQUEST: A storageLocation is required to submit.');
      return res.status(BAD_REQUEST).json({error: 'A storageLocation is required to submit.'});
    }

    log.info('start saving views');
    metastoreService.processViews(req.body.storageLocation)
      .then(responses => {
        log.info('completed saving views');
        res.status(MULTI_STATUS).json(responses);
      })
      .catch(e => {
        log.error(e.stack);
        res.status(INTERNAL_SERVER_ERROR).json(e)
      });
  });

  server.post('/api-external/tables', (req, res) => {
    const log = setupLogger(req, res,  '(external) save tables');

    if (!req.user.isAdmin) {
      log.error('FORBIDDEN: Not an admin. User is not authorized.');
      return res.status(FORBIDDEN).json({error: 'Not an admin. User is not authorized.'});
    }

    if (!req.body.storageLocation) {
      log.error('BAD REQUEST: A storageLocation is required to submit.');
      return res.status(BAD_REQUEST).json({error: 'A storageLocation is required to submit.'});
    }

    log.info('start saving tables');
    metastoreService.addTables(req.body.storageLocation)
      .then(responses => {
        log.info('completed saving tables');
        res.status(MULTI_STATUS).json(responses);
      })
      .catch(e => {
        log.error(e.stack);
        res.status(INTERNAL_SERVER_ERROR).json(e)
      });
  })

  server.post('/api/views/status', (req, res) => {
    const log = setupLogger(req, res,  'update views');
    log.info('start updating views');
    viewService.getViewsWithStatus(req.body)
      .then(response => {
        log.info('completed updating views');
        res.json(response);
      })
      .catch(e => {
        log.error(e.stack);
        res.status(INTERNAL_SERVER_ERROR).json(e);
      });
  })

  server.get('/api/views/:name/datasets', (req, res) => {
    const { name: id } = req.params;
    const log = setupLogger(req, res,  'get active datasets for view', id);
    log.info('start getting active datasets for view');
    viewService.getActiveDatasetsForView(id)
      .then(response => {
        log.info('completed getting active datasets for view');
        res.json(response);
      })
      .catch(e => {
        log.error(e.stack);
        res.status(INTERNAL_SERVER_ERROR).json(e);
      });
  })

  server.get('/api/views/:name', (req, res) => {
    const { name: id } = req.params;
    const log = setupLogger(req, res,  'get view', id);
    log.info('start getting view');
    viewService.getViewDetails(id)
      .then(response => {
        log.info('completed getting view');
        res.json(response);
      })
      .catch(e => {
        log.error(e.stack);
        res.status(INTERNAL_SERVER_ERROR).json(e);
      });
  })

  server.get('/api-external/views', (req, res) => {
    const log = setupLogger(req, res,  '(external) get views');
    log.info('start getting views');
    metastoreService.getAllViewsDetails()
      .then(response => {
        log.info('complete getting views');
        res.json(response);
      })
      .catch(e => {
        log.error(e.stack);
        res.status(INTERNAL_SERVER_ERROR).json(e);
      });
  })

  server.get('/api-external/views/:name/available', (req, res) => {
    const { name: id } = req.params;
    const log = setupLogger(req, res,  '(external) get view availability', id);
    log.info('start getting view availability');
    viewService.getViewAvailability(id)
      .then(response => {
        log.info('completed getting view availability');
        res.json(response);
      })
      .catch(e => {
        log.error(e.stack);
        res.status(INTERNAL_SERVER_ERROR).json(e);
      });
  })

  server.get('/api-external/tables', (req, res) => {
    const log = setupLogger(req, res,  '(external) get tables');
    log.info('start getting tables');
    metastoreService.getAllTables()
      .then(response => {
        log.info('completed getting tables');
        res.json(response);
      })
      .catch(e => {
        log.error(e.stack);
        res.status(INTERNAL_SERVER_ERROR).json(e);
      });
  });

  server.get('/api/metastore', (req, res) => {
    const log = setupLogger(req, res,  'get databricks metastore');
    const {table} = req.query;
    log.info('start getting metastore');
    metastoreService.getMetastore(table)
      .then(databases => {
        log.info('completed getting metastore');
        res.status(OK).json(databases);
      })
      .catch(e => {
        log.error(e.stack);
        res.status(INTERNAL_SERVER_ERROR).json(e);
      });
  });
}

module.exports = { registerRoutes }
