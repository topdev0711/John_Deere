const { BAD_REQUEST, INTERNAL_SERVER_ERROR, FORBIDDEN, UNPROCESSABLE_ENTITY, NOT_FOUND} = require('http-status-codes');
let log = require('edl-node-log-wrapper');

const setLogger = logger => log = logger;

function isForbidden(message) {
  return message.startsWith("Permission denied");
}

function isBadRequest(message) {
  log.error(message);
  return message.startsWith('child') || message.startsWith('Invalid query parameter');
}

function isUnprocessableEntity(message) {
  return message.includes('Update request missing') || message.includes('Invalid Reference update type');
}

function isNotFound(message) {
  return message.includes('does not exist');
}

function getStatusCode(error) {
  const message = error.message;
  if(isForbidden(message)) return FORBIDDEN;
  if(isBadRequest(message)) return BAD_REQUEST;
  if(isUnprocessableEntity(message)) return UNPROCESSABLE_ENTITY;
  if(isNotFound(message)) return NOT_FOUND;
  return INTERNAL_SERVER_ERROR;
}

module.exports = { setLogger, getStatusCode };
