const { computeUsability, addUsabilities } = require("../services/usabilityService");
const { OK, INTERNAL_SERVER_ERROR } = require("http-status-codes");
const controllerHandlers = require('./controllerHandlers');
const documentService = require('../services/documentService');
const { createLoggerWithAttributes } = require('../utilities/logCreator');

const { getStatusCode, createErrorMessage, handleInternalUnauthorized } = controllerHandlers;

const admins = ['0oab61no9hmKkuuMA0h7', '0oa61niur1qpKMeBU1t7'];
const isAuthorized = ({user}) => admins.includes(user.client_id) || admins.includes(user.username);
const handleUnauthorized = res => handleInternalUnauthorized(new Error('Not an admin. User is not authorized'), res);
const handleDocumentCallError = (log, error, res) => {
  log.error('PUT usability', error);
  res.status(INTERNAL_SERVER_ERROR).json({ errorMessage: error.message });
}

function setupLogger(req, res, methodName, id, version) {
  const logger = createLoggerWithAttributes(req, res, 'usabilities', methodName, id, version);
  controllerHandlers.setLogger(logger);
  documentService.setLogger(logger);
  return logger;
}

const usabilityDetails = (req, res) => {
  const log = setupLogger(req, res, 'get usability');
  log.info('start getting usability');
  try {
    const usability = computeUsability(req.body);
    log.info('completed getting usability');
    res.status(OK).json(usability);
  } catch (e) {
    log.error('getting usability Error:', e);
    res.status(getStatusCode(e)).json({error: createErrorMessage(e)});
  }
};

function registerRoutes(server) {
  server.post('/api/usability', usabilityDetails);
  server.post('/api-external/usability', usabilityDetails);

  server.put('/api-external/usability', async (req, res) => {
    const log = setupLogger(req, res, 'update all usabilities');
    if (!isAuthorized(req)) return handleUnauthorized(res);
    const collection = 'datasets';

    log.info('start updating all usabilities')
    await documentService.getRecords(collection)
      .then(addUsabilities)
      .then(records => records.forEach(record => documentService.putDocument(collection, record)))
      .then(() => {
        log.info('completed updating all usabilities');
        res.status(OK).json({ message: 'completed request' });
      })
      .catch(error => handleDocumentCallError(log, error, res));
  });
}

module.exports = { registerRoutes };
