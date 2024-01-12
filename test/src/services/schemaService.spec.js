/**
 * @jest-environment node
 */

const schemaDao = require('../../../src/data/schemaDao');
const datasetService = require('../../../src/services/datasetService');
const schemaService = require('../../../src/services/schemaService');

jest.mock('../../../src/data/schemaDao');
jest.mock('../../../src/services/datasetService');

describe('schemaService tests', () => {
  it('should get a schema', async () => {
    const expectedSchema = { anySchema: 'anySchema' };
    schemaDao.getSchema.mockResolvedValue(expectedSchema);
    const actualSchema = await schemaService.getSchemaDetails('anyId');
    expect(actualSchema).toEqual(expectedSchema);
  });

  it('should throw an error when it fails to get a schema', async () => {
    const error = new Error('someError');
    schemaDao.getSchema.mockRejectedValue(error);
    return expect(schemaService.getSchemaDetails('anyId')).rejects.toThrow(error);
  });

  it('should get schemas for a dataset', async () => {
    const expectedSchemas = [{ anySchema: 'anySchema' }];
    const expectedLinkedSchemas = [{ anyLinkedSchema: 'anyLinkedSchema' }];
    const expectedResponse = { schemas: expectedSchemas,  linkedSchemas: expectedLinkedSchemas };
    const dataset = { schemas: expectedSchemas,  linkedSchemas: expectedLinkedSchemas };
    datasetService.getDataset.mockResolvedValue(dataset);

    const actualResponse = await schemaService.getSchemasForDataset('anyId', 'anyVersion')

    expect(actualResponse).toEqual(expectedResponse);
  });

  it('should throw an error when it fails to get schemas for a dataset', async () => {
    datasetService.getDataset.mockRejectedValue(new Error('someError'));

    const expectedError = 'Failed to get schemas for anyId-anyVersion';
    return expect(schemaService.getSchemasForDataset('anyId', 'anyVersion')).rejects.toThrow(expectedError);
  });
});


