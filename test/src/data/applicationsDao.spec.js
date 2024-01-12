const applicationsDao = require('../../../src/data/applicationsDao');
const conf = require('../../../conf');
const dynamo = require('../../../src/data/dynamo');
const dynamoTestUtils = require('./dynamoTestUtils');

const confSpy = jest.spyOn(conf, 'getConfig');

jest.mock('../../../src/data/dynamo');

const sampleApplication = {
  applicationName: 'application-1',
  unit: '90',
  department: '980'
};

const testConfig = {
  applicationsTable: 'jd-data-catalog-applications',
  isLocal: false
};

describe('applicationsDao Tests', () => {
  beforeEach(() => {
    confSpy.mockImplementation(() => testConfig);
  });

  afterEach(() => {
    confSpy.mockReset();
  });
  it('should save application', async () => {
    const create = jest.fn();
    const describeTable= jest.fn((cb) => cb(null, {
      // The mock table description
      Table: {
        TableName: 'mock-table',
        TableStatus: 'ACTIVE',
      }
    }))
    dynamo.define.mockReturnValue({describeTable, create});
    const result = await applicationsDao.saveApplication(sampleApplication);
    expect(create).toBeCalledWith(sampleApplication);
    expect(result).toEqual('Success');
  });

  it('should not throw an error when saving fails', () => {
    const create = jest.fn();
    create.mockRejectedValue('boom');
    dynamo.define.mockReturnValue({create});
    return expect(applicationsDao.saveApplication(sampleApplication))
        .resolves.not.toThrow();
  });

  it('should get application for given application name', async () =>{
    const sampleApplication = [{ applicationName: 'app-1' }];
    const expectedResult = { applicationName: 'app-1' };
    const keys = ['descending', 'exec', 'promise', 'collectItems'];
    const query = dynamoTestUtils.createFunction(keys, sampleApplication);
    const describeTable= jest.fn((cb) => cb(null, {
      // The mock table description
      Table: {
        TableName: 'mock-table',
        TableStatus: 'ACTIVE',
      }
    }))
    dynamo.define.mockReturnValue({describeTable, query});
    const result = await applicationsDao.getApplication('app-1');
    expect(result).toEqual(expectedResult);
  });

  it('should not fail to get application for given application name',  () => {
    const expectedResult = Promise.reject(new Error('An unexpected error occurred when retrieving the application app-1'));
    const keys = ['descending', 'exec', 'promise', 'collectItems'];
    const query = dynamoTestUtils.createFunction(keys, expectedResult);
    dynamo.define.mockReturnValue({query});

    const result =  applicationsDao.getApplication('app-1');
    return expect(result).resolves.not.toThrow();
  });

  it('should delete application', async () => {
    const destroy = jest.fn();
    const describeTable= jest.fn((cb) => cb(null, {
      // The mock table description
      Table: {
        TableName: 'mock-table',
        TableStatus: 'ACTIVE',
      }
    }))
    dynamo.define.mockReturnValue({describeTable,destroy});
    destroy.mockImplementation((hash, cb) => cb());
    const result = await applicationsDao.deleteApplication('applicationName');
    expect(destroy.mock.calls[0][0]).toEqual('applicationName');
  });

  it('should not fail to delete application', () => {
    const destroy = jest.fn();
    const describeTable= jest.fn((cb) => cb(null, {
      // The mock table description
      Table: {
        TableName: 'mock-table',
        TableStatus: 'ACTIVE',
      }
    }))
    dynamo.define.mockReturnValue({describeTable, destroy});
    destroy.mockImplementation((hash, cb) => cb('error'));
    const result = applicationsDao.deleteApplication('applicationName');
    return expect(result).resolves.not.toThrow();
  });

});
