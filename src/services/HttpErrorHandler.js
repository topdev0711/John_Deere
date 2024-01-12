const { BAD_REQUEST, INTERNAL_SERVER_ERROR, UNAUTHORIZED } = require('http-status-codes');

const badRequestMessages = ['missing query parameter', 'invalid query parameter'];
const isBadRequest = errorMessage => badRequestMessages.some(badRequestMessage => errorMessage.includes(badRequestMessage));
class HttpErrorHandler {
  getStatus = errorMessage => {
    if(errorMessage.includes('authorization error')) return UNAUTHORIZED;
    if(isBadRequest(errorMessage)) return BAD_REQUEST;
    return INTERNAL_SERVER_ERROR;
  }
}

module.exports = HttpErrorHandler;
