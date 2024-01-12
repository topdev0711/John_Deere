const { FORBIDDEN, INTERNAL_SERVER_ERROR } = require('http-status-codes');
let log = require('edl-node-log-wrapper');

const setLogger = logger => log = logger;
const getStatusCode = e => e.statusCode ? e.statusCode : INTERNAL_SERVER_ERROR;
const getErrorDetails = error => {
  try {
    return error.details.map(detail => detail.message.replace(/\"/g, "'"));
  }
  catch {
    log.error("Unable to parse error");
    return error
  }
};

const createErrorMessage = error => {
  log.error(error.stack);
  if (error.details) log.error(error.details);
  return error.details ? getErrorDetails(error) : error.message;
};

const handleInternalUnauthorized = (e, res) => {
  log.error(e.stack);
  if (e.message.match(/is not authorized/)) {
    res.status(FORBIDDEN).json({error: e.message});
  } else {
    res.status(INTERNAL_SERVER_ERROR).json({error: e.message});
  }
  res.end()
};

module.exports = { setLogger, getStatusCode, createErrorMessage, handleInternalUnauthorized };
