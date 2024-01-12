const userService = require('../services/userService');
const format = require('../utilities/format');
const { BAD_REQUEST, NOT_FOUND, OK } = require('http-status-codes');
const { createLoggerWithAttributes } = require('../utilities/logCreator');

function setupLogger(req, res, methodName, id, version) {
  const logger = createLoggerWithAttributes(req, res, 'users', methodName, id, version);
  userService.setLogger(logger);
  return logger;
}

const getGroupUsers = (req, res) => {
  const { params: { name: id }, query } = req;
  const log = setupLogger(req, res, 'get users for group', id);
  log.info('start getting users for group');
  userService.getUsersForGroup(id, query)
    .then(users => {
      log.info('completed getting users for group');
      res.status(OK).json(users);
    })
    .catch(e => {
      log.error(e.stack);
      const error = decodeURI(format.formatValidationErrors(e));
      res.status(BAD_REQUEST).json({ error });
    });
};

const getUserInfo = (req, res) => {
  const log = setupLogger(req, res, 'get user info');
  const { id }= req.params;
    log.info('getting user info for ', id);
    userService.getUserInfo(id)
      .then(user => {
        log.info('got user info for ', id);
        res.status(OK).json(user);
      }).catch(error => {
    log.error(`failed to get user info for ${req.params.id} with error: ${error.stack}`);
    res.status(NOT_FOUND).json({ error: error.message });
  });
};

function registerRoutes(server) {
  server.get('/api/group/:name/users', getGroupUsers);

  server.get('/api/users/:id', getUserInfo);

  server.get('/api-external/users/:id', getUserInfo);
}

module.exports = { registerRoutes };
