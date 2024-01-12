const {getStatusCode, createErrorMessage} = require('../../../src/controllers/controllerHandlers');
const { INTERNAL_SERVER_ERROR } = require('http-status-codes');

describe('controlHandlers tests', () => {
  const someErrorMessage = "someError";

  it('get versions', () => {
    const badDataset = require('./controllerHandlerTestResponse.json');
    const schemaVersions = badDataset.schemas.map(schema => schema.version);
    schemaVersions.forEach(version => console.info(version.split('.').join('.')));

  });

  it('should get the status attached to the error when status is provided', () => {
    const anyStatusCode = 123;
    const error = new Error(someErrorMessage);
    error.statusCode = anyStatusCode;
    const actualStatus = getStatusCode(error);
    expect(actualStatus).toEqual(anyStatusCode);
  });

  it('should report status as bad request when the status of an error is unknown', () => {
    const error = new Error(someErrorMessage);
    const actualStatus = getStatusCode(error);
    expect(actualStatus).toEqual(INTERNAL_SERVER_ERROR);
  });

  it('should create an error message based on the details attribute provided', () => {
    const error = new Error(someErrorMessage);
    error.details = [{ message: "\"anyField\" is invalid" }];
    const actualMessage = createErrorMessage(error);
    expect(actualMessage).toEqual(["'anyField' is invalid"]);
  });

  it('should create an error based on the error message when no details are provided', () => {
    const error = new Error(someErrorMessage);
    const actualMessage = createErrorMessage(error);
    expect(actualMessage).toEqual(someErrorMessage);
  });
});
