const metastoreDao = require('../../../src/data/metastoreDao');
const s3 = require('../../../src/data/s3');
const conf = require('../../../conf');
const dynamo = require('../../../src/data/dynamo');
const dynamoTestUtils = require('./dynamoTestUtils');
const edlApiHelper = require('../../../src/utilities/edlApiHelper');
const { json } = require('body-parser');

const confSpy = jest.spyOn(conf, 'getConfig');
jest.mock('../../../src/data/dynamo');
jest.mock('../../../src/data/s3');
jest.mock('../../../src/utilities/edlApiHelper');
jest.mock('node-fetch', () => require('fetch-mock-jest').sandbox())
const fetchMock = require('node-fetch')


const sampleMetadata = {
  name: 'view',
  updatedAt: 'some time',
  datasets: ['dataset']
};

const sampleStructure = {
  name: 'view',
  fields: []
};

const testConfig = {
  viewsTable: 'jd-data-catalog-view',
  viewsBucket: 'jd-data-catalog-views-devl',
  isLocal: false
};

const datasetId = 'datasetId';
const tableName = 'some_db.some_table';

describe('MetastoreDao Tests', () => {
  beforeEach(() => {
    confSpy.mockImplementation(() => testConfig);
  })

  afterEach(() => {
    confSpy.mockReset();
  });
  it('should save view metadata and view structure', async () => {
    s3.save.mockResolvedValueOnce('Success');

    const result = await metastoreDao.saveMetaDataStructure(sampleStructure);

    expect(result).toEqual('Success');
    expect(s3.save).toBeCalledWith(sampleStructure);
  });

  it('should save metadata', async () => {
    const create = jest.fn();
    dynamo.define.mockReturnValue({ create });
    const result = await metastoreDao.saveViewMetadatas(sampleMetadata);

    expect(create).toBeCalledWith(sampleMetadata);
  });

  it('should throw an error when saving fails', async () => {
    const err = new Error('Boom')
    s3.save.mockRejectedValueOnce(err);

    await expect(metastoreDao.saveMetaDataStructure(sampleStructure))
      .rejects
      .toThrow(new Error('failed to save metastore structure'));
  });

  it('should get views for a dataset', async () => {
    const expectedResult = [{ name: 'some-view' }];
    const keys = ['loadAll', 'exec', 'promise', 'collectItems'];
    const query = dynamoTestUtils.createFunction(keys, expectedResult);
    dynamo.define.mockReturnValue({ query });

    const result = await metastoreDao.getViewsForDataset(datasetId);

    expect(result).toEqual(expectedResult);
  });
  it('should fail to get views for dataset', () => {
    const expectedResult = Promise.reject(new Error('Boom'));
    const keys = ['loadAll', 'exec', 'promise', 'collectItems'];
    const query = dynamoTestUtils.createFunction(keys, expectedResult);
    dynamo.define.mockReturnValue({ query });

    const result = metastoreDao.getViewsForDataset(datasetId);
    return expect(result).rejects.toThrow(new Error('failed to get dataset views'));
  });
  it('should get allViews for dataset', async () => {
    const expectedResult = [{ name: 'some-view' }];
    const keys = ['loadAll', 'exec', 'promise', 'collectItems'];
    const scan = dynamoTestUtils.createFunction(keys, expectedResult);
    dynamo.define.mockReturnValue({ scan });

    const result = await metastoreDao.getAllViews();

    expect(result).toEqual(expectedResult);
  });
  it('should fail to get allViews for dataset', () => {
    const expectedResult = Promise.reject(new Error('Boom'));
    const keys = ['loadAll', 'exec', 'promise', 'collectItems'];
    const scan = dynamoTestUtils.createFunction(keys, expectedResult);
    dynamo.define.mockReturnValue({ scan });

    const result = metastoreDao.getAllViews();
    return expect(result).rejects.toThrow(new Error('failed to get all views'));
  });


  it('should get tables for a dataset', async () => {
    const expectedResult = [{ name: 'some-table' }];
    const keys = ['loadAll', 'exec', 'promise', 'collectItems'];
    const query = dynamoTestUtils.createFunction(keys, expectedResult);
    dynamo.define.mockReturnValue({ query });

    const result = await metastoreDao.getTablesForDataset(datasetId);

    expect(result).toEqual(expectedResult);
  });
  it('should fail to get tables for dataset', () => {
    const expectedResult = Promise.reject(new Error('Boom'));
    const keys = ['loadAll', 'exec', 'promise', 'collectItems'];
    const query = dynamoTestUtils.createFunction(keys, expectedResult);
    dynamo.define.mockReturnValue({ query });

    const result = metastoreDao.getTablesForDataset(datasetId);
    return expect(result).rejects.toThrow(new Error('failed to get tables for dataset'));
  });

  it('should get table', async () => {
    const expectedResult = [{ name: tableName, datasetId }];
    const keys = ['usingIndex', 'exec', 'promise', 'collectItems'];
    const query = dynamoTestUtils.createFunction(keys, expectedResult);
    dynamo.define.mockReturnValue({ query });

    const result = await metastoreDao.getTable(tableName);

    expect(result).toEqual(expectedResult);
  });

  it('should fail to get table', () => {
    const expectedResult = Promise.reject(new Error('Boom'));
    const keys = ['usingIndex', 'exec', 'promise'];
    const query = dynamoTestUtils.createFunction(keys, expectedResult);
    dynamo.define.mockReturnValue({ query });

    const result = metastoreDao.getTable(tableName);

    expect(result).rejects.toThrow(new Error(`failed to get table for ${tableName}`));
  });

  it('should get all tables', async () => {
    const expectedResult = [{ name: 'some-table' }];
    const keys = ['exec', 'promise', 'collectItems'];
    const scan = dynamoTestUtils.createFunction(keys, expectedResult);
    dynamo.define.mockReturnValue({ scan });

    const result = await metastoreDao.getAllTables();

    expect(result).toEqual(expectedResult);

  })
  it('should get view for given view name', async () => {
    const expectedResult = [{ name: 'some-view', datasetId: 'some-dataset-id' }];
    const keys = ['usingIndex', 'exec', 'promise', 'collectItems'];
    const query = dynamoTestUtils.createFunction(keys, expectedResult);
    dynamo.define.mockReturnValue({ query });

    const result = await metastoreDao.getView('some-view');

    expect(result).toEqual(expectedResult);
  })

  it('should get a table', async () => {
    const response = {
      status: 200,
      body: {'data': 'some data'},
    };
    edlApiHelper.getParams.mockResolvedValue({});
    const database = 'anyDatabase';
    const table = 'anyTable';
    fetchMock.mock("*", response);
    const actualResponse = await metastoreDao.getMetastore(database, table);
    expect(actualResponse).toEqual(database);
  })

  it('should table be undefined when table not found', async () => {
    const response = {
      status: 404,
      body: {'errorMessage': "Table not found"},
    };
    edlApiHelper.getParams.mockResolvedValue({});
    const database = 'anyDatabase';
    const table = 'anyTable';
    fetchMock.mockReset();
    fetchMock.mock("*", response);
    const actualResponse = await metastoreDao.getMetastore(database, table);
    expect(actualResponse).toEqual(undefined);
  })

});
