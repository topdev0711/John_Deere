/* istanbul ignore file */
const log = require('edl-node-log-wrapper');
const uuidv4 = require("uuid/v4");
const conf = require('../../conf');
const { logLevel } = conf.getConfig();

function getOtherVars(id, version) {
  const otherVars = {}
  if (id) otherVars.id = id;
  if (version) otherVars.version = version;
  return otherVars;
}

function createLogger(req, microservice, methodName, id, version) {
  log.setLevel(logLevel);
  const correlationId = req.header('X-Correlation-Id') || req.header('X-Deere-ID') || uuidv4();
  const clientId = req.user.client_id;
  const userId = req.user.username;
  const otherVars = getOtherVars(id, version);
  microservice = "governanceUI-" + microservice;


  if (otherVars) log.logSetup(correlationId, clientId, userId, microservice, methodName, otherVars);
  else log.logSetup(correlationId, clientId, userId, microservice, methodName);

  return log;
}

function createLoggerWithAttributes(req, res, microservice, methodName, id, version) {
  log.setLevel(logLevel);
  const correlationId = req.header('X-Correlation-Id') || req.header('X-Deere-ID') || uuidv4();
  const clientId = req.user.client_id;
  const userId = req.user.username;
  const otherVars = getOtherVars(id, version);
  microservice = "governanceUI-" + microservice;

  if (otherVars) log.logSetup(correlationId, clientId, userId, microservice, methodName, otherVars);
  else log.logSetup(correlationId, clientId, userId, microservice, methodName);

  res.set({'X-Correlation-Id': log.getCorrelationId()});
  return log;
}

module.exports = { createLogger, createLoggerWithAttributes };
