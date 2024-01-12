const HttpErrorHandler = require('../../../src/services/HttpErrorHandler');
const { BAD_REQUEST, INTERNAL_SERVER_ERROR, UNAUTHORIZED } = require('http-status-codes');

describe('HttpsStatusErrorHandler tests', () => {
  const httpErrorHandler = new HttpErrorHandler();

  it('should be an unauthorized response', () => {
    const actualStatus = httpErrorHandler.getStatus('authorization error');
    expect(actualStatus).toEqual(UNAUTHORIZED);
  });

  it('should be a bad request when missing a query parameter', () => {
    const actualStatus = httpErrorHandler.getStatus('missing query parameter');
    expect(actualStatus).toEqual(BAD_REQUEST);
  });

  it('should be a bad request when an invalid a query parameter', () => {
    const actualStatus = httpErrorHandler.getStatus('invalid query parameter');
    expect(actualStatus).toEqual(BAD_REQUEST);
  });

  it('should be internal server error when an unhandled message', () => {
    const actualStatus = httpErrorHandler.getStatus('some unknown error');
    expect(actualStatus).toEqual(INTERNAL_SERVER_ERROR);
  });
});
