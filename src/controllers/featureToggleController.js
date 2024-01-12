const { OK, INTERNAL_SERVER_ERROR } = require('http-status-codes');
const featureToggleService = require('../services/featureToggleService');
const { createLoggerWithAttributes } = require('../utilities/logCreator');
const controllerHandlers = require("./controllerHandlers");
const conf = require("../../conf");

const config = conf.getConfig();
const {isAdmin} = config;
const {handleInternalUnauthorized} = controllerHandlers;
const handleUnauthorized = res => handleInternalUnauthorized(new Error('Not an admin. User is not authorized'), res);

function setupLogger(req, res, methodName, id, version) {
  const logger = createLoggerWithAttributes(req, res, 'feature-toggle', methodName, id, version);
  featureToggleService.setLogger(logger);
  return logger;
}

const getToggles = (req, res) => {
  const log = setupLogger(req, res, 'get toggles');
  log.info('start getting toggles');
  featureToggleService.getToggles(req?.query?.status)
    .then(toggles => {
      log.info('completed getting toggles');
      res.status(OK).json(toggles);
    })
    .catch(error => {
      log.error(`failed to get all toggles with error: ${error.stack}`);
      res.status(INTERNAL_SERVER_ERROR).json(error);
    });
}

const getExternalToggles = (req, res) => {
  const log = setupLogger(req, res, 'get toggles');
  if (!isAdmin(req.user)) {
    log.error(`${req.user} is not authorized to get toggles`);
    return handleUnauthorized(res);
  }

  return getToggles(req, res);
}

const getToggle = (req, res) => {
  const name = req.params.name;
  const log = setupLogger(req, res, `get toggle for ${name}`);
  log.info('start getting toggle');
  featureToggleService.getToggle(name, req?.query?.status)
    .then(toggle => {
      log.info(`completed getting toggle for ${name}`);
      res.status(OK).json(toggle);
    })
    .catch(error => {
      log.error(`failed to get toggles with error: ${error.stack}`);
      res.status(INTERNAL_SERVER_ERROR).json(error);
    });
}

const getExternalToggle = (req, res) => {
  const log = setupLogger(req, res, 'get toggle');
  if (!isAdmin(req.user)) {
    log.error(`${req.user} is not authorized to get toggle`);
    return handleUnauthorized(res);
  }

  return getToggle(req, res);
}

const registerRoutes = server => {
  server.get('/api/toggles', (req, res) => getToggles(req, res));
  server.get('/api-external/toggles', (req, res) => getExternalToggles(req, res));

  server.get('/api/toggles/:name', (req, res) => getToggle(req, res));
  server.get('/api-external/toggles/:name', (req, res) => getExternalToggle(req, res));
}

module.exports = { registerRoutes };
