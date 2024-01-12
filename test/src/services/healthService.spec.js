/**
 * @jest-environment node
 */

const datasetService = require('../../../src/services/datasetService');
const healthService = require('../../../src/services/healthService');
const AWS = require('aws-sdk-mock');
const conf = require('../../../conf');
const spyConf = jest.spyOn(conf, 'getConfig');

jest.mock('../../../src/services/datasetService');
jest.mock('cache-manager');

describe('healthService test suite', () => {

  beforeEach(() => {
    spyConf.mockImplementation(() => ({
      isLocal: false,
      jdCatalogNotificationDlq: 'Doesnt Matter',
      dynamoMonitorId: 'com.deere.enterprise.datalake.enhance.core.manufacturing.ProductCatalogData'
    }))
    AWS.mock('SQS', 'getQueueAttributes', {Attributes: { ApproximateNumberOfMessages: '0' }});
    jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue({
      get: async () => {},
      set: async () => {}
    });
    datasetService.getDataset.mockResolvedValue({});
  });

  it('should return true if redis cache sets Local', async () => {
    const getCall = jest.fn().mockImplementation(() => Promise.resolve({healthy: 'true'}));
    const setCall = jest.fn().mockImplementation(() => Promise.resolve('OK'));
    jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue({ get: jest.fn().mockImplementation(() => Promise.resolve({healthy: 'true'})), set: setCall });

    const results = await healthService.checkHealth();
    expect(results.Redis).toEqual(true);
  });
  it('should return true if redis cache sets Dev Prod', async () => {
    const getCall = jest.fn().mockImplementation(() => Promise.resolve({healthy: 'true'}));
    const setCall = jest.fn().mockImplementation(() => Promise.resolve('true'));
    jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue({ get: jest.fn().mockImplementation(() => Promise.resolve({healthy: 'true'})), set: setCall });

    const results = await healthService.checkHealth();
    expect(results.Redis).toEqual(true);
  });
  it('should return false if redis cache fails to set Dev Prod', async () => {
    const getCall = jest.fn().mockImplementation(() => Promise.resolve({healthy: 'true'}));
    const setCall = jest.fn().mockImplementation(() => Promise.resolve('false'));
    jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue({ get: jest.fn().mockImplementation(() => Promise.resolve({healthy: 'true'})), set: setCall });

    const results = await healthService.checkHealth();
    expect(results.Redis).toEqual(false);
  });

  it('should return false if redis cache fails to set', async () => {
    const getCall = jest.fn().mockImplementation(() => Promise.resolve({healthy: 'true'}));
    const setCall = jest.fn().mockImplementation(() => Promise.reject());
    jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue({ get: getCall, set: setCall });

    const results = await healthService.checkHealth();
    expect(results.Redis).toEqual(false);
  });

  it('should return true if returns dataset from dynamo', async () => {
    datasetService.getDataset.mockReset();
    datasetService.getDataset.mockResolvedValueOnce({ id: 'com.deere.enterprise.datalake.enhance.core.manufacturing.ProductCatalogData'});
    const results = await healthService.checkHealth();
    expect(results.Dynamo).toEqual(true);
  });

  it('should return false if returns nothing from dynamo', async () => {
    const results = await healthService.checkHealth();
    expect(results.Dynamo).toEqual(false);
  });

  it('should return true if no items in the DLQ', async () => {
    const results = await healthService.checkHealth();
    expect(results.EdlAdapter).toEqual(true);
  });

  it('should return false if items in the DLQ', async () => {
    AWS.restore();
    AWS.mock('SQS', 'getQueueAttributes', {Attributes: { ApproximateNumberOfMessages: '1' }});
    const results = await healthService.checkHealth();
    expect(results.EdlAdapter).toEqual(false);
  });
});
