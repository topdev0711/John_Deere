const errorStatusCode = require('../utilities/errorStatusCode');
const { OK } = require('http-status-codes');
const { createLoggerWithAttributes } = require('../utilities/logCreator');
const announcementService = require('../services/announcementService');
const permissionService = require("../services/permissionService");
const remediationService = require("../services/remediationService");

function setupLogger(req, res, methodName, id, version) {
  const logger = createLoggerWithAttributes(req, res, 'announcements', methodName, id, version);
  permissionService.setLogger(logger);
  remediationService.setLogger(logger);
  errorStatusCode.setLogger(logger);
  return logger;
}

function handleError(log, e, res) {
  log.error(e.stack);
  const statusCode = errorStatusCode.getStatusCode(e);
  const error = decodeURI(e);
  res.status(statusCode).json({error});
}

function registerRoutes(server) {
  server.get('/api/announcements', (req, res) => {
    const log = setupLogger(req, res, 'get announcements');
    log.info('start getting AnnouncementsModal');
    announcementService.getAnnouncements()
      .then(announcements => {
        log.info('completed getting announcements');
        res.status(OK).json(announcements);
      })
      .catch(e => {
        log.error('failed to get announcements with error: ', e);
        handleError(log, e, res);
      });
  });

  server.get('/api-external/announcements', (req, res) => {
    const {start, end} = req.query;
    const log = setupLogger(req, res,'(External) get announcements');
    log.info('start getting announcements');
    announcementService.getAnnouncements(start, end)
      .then(announcements => {
        log.info('completed getting announcements');
        res.status(OK).json(announcements);
      })
      .catch(e => {
        log.error('failed to get announcements with error: ', e);
        handleError(log, e, res);
      });
  });

  server.post('/api-external/announcements', (req, res) => {
    const log = setupLogger(req, res,'save announcements');
    res.set({'X-Correlation-Id': log.getCorrelationId()});
    announcementService.saveAnnouncement(req.body, req.user)
      .then(announcement => {
        if (announcement instanceof Error) throw announcement;
        log.info('completed saving announcement');
        res.status(OK).json({"message": "Announcement Created"});
      })
      .catch(e => {
        log.error('failed to save announcements with error: ', e);
        handleError(log, e, res);
      });
  });
}

module.exports = { registerRoutes };
