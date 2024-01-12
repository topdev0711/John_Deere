const remediationService = require('../services/remediationService');
const { BAD_REQUEST } = require('http-status-codes');
const format = require('../utilities/format');
const { createLoggerWithAttributes } = require('../utilities/logCreator');

const admins = ['dp11317', 'br79641', '0oaj75755xAF3dJgQ0h7', "0oa61niur1qpKMeBU1t7", "0oab61no9hmKkuuMA0h7", "EDL"];
const isAdmin = user => admins.includes(user);

function setupLogger(req, res, methodName, id, version) {
  const logger = createLoggerWithAttributes(req, res, 'remediations', methodName, id, version);
  remediationService.setLogger(logger);
  return logger;
}

function registerRoutes(server) {
  server.post('/api-external/remediations', (req, res) => {
    const log = setupLogger(req, res, 'save remediations');

    if (!isAdmin(req.user.username)) {
      log.info('Only admins can run this command.');
      return res.json('Only admins can run this command.');
    }

    log.info('start saving remediations');
    remediationService.saveRemediations(req.body)
      .then(() => {
        log.info('completed saving remediations');
        res.end();
      })
      .catch(e => {
        log.error(e.stack);
        const errorMessage = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({error: errorMessage});
    });
  });
}

module.exports = { registerRoutes };
