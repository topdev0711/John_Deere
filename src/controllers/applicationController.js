const format = require('../utilities/format');
const { BAD_REQUEST, OK, INTERNAL_SERVER_ERROR, NOT_FOUND } = require('http-status-codes');
const { createLoggerWithAttributes } = require('../utilities/logCreator');
const applicationService = require('../services/applicationService');
const permissionService = require("../services/permissionService");
const remediationService = require("../services/remediationService");

function setupLogger(req, res, methodName, id, version) {
  const logger = createLoggerWithAttributes(req, res, 'applications', methodName, id, version);
  applicationService.setLogger(logger);
  permissionService.setLogger(logger);
  remediationService.setLogger(logger);
  return logger;
}

function registerRoutes(server) {
  server.get('/api/applications', (req, res) => {
    const log = setupLogger(req, res, 'get applications');
    log.info('start getting applications');
    const lite = JSON.parse(req?.query?.lite||"false");
    applicationService.getApplicationDetails(req.user.groups, req.user.username, lite)
      .then((tags) => {
        res.status(OK).json(tags);
        log.info('completed getting applications');
      })
      .catch((e) => {
        log.error(e.stack);
        const error = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({ error });
      });
  });

  server.get('/api/businessApplications', (req, res) => {
    const log = setupLogger(req, res, 'get business applications');
    log.info('start getting business applications');
    applicationService.getBusinessApplicationsList(req.user.username)
        .then((tags) => {
          res.status(OK).json(tags);
          log.info('completed getting business applications');
        })
        .catch((e) => {
          log.error(e.stack);
          const error = decodeURI(format.formatValidationErrors(e));
          res.status(BAD_REQUEST).json({ error });
        });
  });

  server.get('/api/pno', (req, res) => {
    const log = setupLogger(req, res, 'get unit department from PnO');
    log.info('start getting unit department from PnO');
    applicationService.getPnOData(req.user.username)
        .then((data) => {
          res.status(OK).json(data);
          log.info('completed getting unit department from PnO');
        })
        .catch((e) => {
          log.error(e.stack);
          const error = decodeURI(format.formatValidationErrors(e));
          res.status(BAD_REQUEST).json({ error });
        });
  });

  server.delete('/api/applications/:appName', (req, res) => {
    const { appName: id } = req.params;
    const log = setupLogger(req, res, 'delete application', id);
    log.info('start deleting application');
    applicationService.deleteApplication(id, req.user.groups, req.user.username)
      .then(() => {
        log.info('completed deleting application');
        res.status(OK).json({message: 'Successfully deleted'});
        res.end();
      })
      .catch(e => {
        log.log(e);
        res.status(INTERNAL_SERVER_ERROR).json({success: false, error: 'delete failed'});
        res.end();
      });
  });

  server.post('/api/applications/:appName', (req, res) => {
    const { appName: id } = req.params;
    const log = setupLogger(req, res, 'update Application', id);
    log.info('start updating application');
    applicationService.editApplication(id, req.body, req.user.groups, req.user.username)
      .then((tag) => {
        log.info('completed updating application');
        res.status(OK).json(tag);
        res.end();
      })
      .catch(e => {
        log.error(e.stack);
        res.status(INTERNAL_SERVER_ERROR).json({success: false, error: 'Updating Application failed'});
        res.end();
      });
  });

  server.post('/api/applications', (req, res) => {
    const log = setupLogger(req, res, 'create application');
    log.info('start creating application');
    applicationService.createApplication(req.body, req.user.groups, req.user.username)
      .then((tag) => {
        log.info('complete creating application');
        res.status(OK).json(tag);
      })
      .catch((e) => {
        log.error(e.stack);
        const error = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({ error });
      });
  });

  server.get('/api/applications/:appName', (req, res, done) => getApplication(req, res, done, req.params.appName))
  function getApplication(req, res, done, id) {
    const log = setupLogger(req, 'application', 'get application', id);
    log.info('start getting application by id');
    applicationService.getApplication(id)
      .then(application => {
        log.info('completed getting application by id');
        res.status(OK).json(application)
      })
      .catch(e => {
        log.error(e.stack);
        const status = e.statusCode ? e.statusCode: NOT_FOUND;
        const error = status === NOT_FOUND ? `Could not find application with name: ${id}`: e.message;
        res.status(status).json({ error });
      });
  }
}

module.exports = { registerRoutes };
