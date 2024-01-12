const datasetDao = require('../../../src/data/datasetDao');
const documentDao = require('../../../src/data/documentDao');
const dereferencedDataset = require('./datasetDaoSample-dereferenced-dataset.json');
const { datasetsCollectionName } = require('../../../conf').getConfig();

jest.mock('../../../src/data/documentDao');

describe('datasetDao tests', () => {
  beforeEach(() => {
    documentDao.putRecord.mockResolvedValue();
  });

  it('should save a datasets', async () => {
    const anyDataset = { name: 'Foo' };
    await datasetDao.saveDatasets([anyDataset]);
    expect(documentDao.putRecords).toBeCalledWith(datasetsCollectionName, [anyDataset]);
  });

  it('should fail when saving a datasets', () => {
    documentDao.putRecords.mockRejectedValue('foo');

    const anyDataset = { name: 'Foo' };
    const actualResponse = datasetDao.saveDatasets([anyDataset]);

    return expect(actualResponse).rejects.toMatch('foo');
  });

  it('should save a dataset', async () => {
    const anyDataset = { name: 'Foo' };
    await datasetDao.saveDataset(anyDataset);
    expect(documentDao.putRecord).toBeCalledWith(datasetsCollectionName, anyDataset);
  });

  it('should lock a dataset', async () => {
    await datasetDao.lockDataset('Foo', 1, 'user123');
    expect(documentDao.updatePropertyForId).toBeCalledWith(datasetsCollectionName, 'Foo', 'lockedBy', 'user123', 1);
  });

  it('should unlock a dataset', async () => {
    await datasetDao.unlockDataset('Foo', 1);
    expect(documentDao.updatePropertyForId).toBeCalledWith(datasetsCollectionName,  'Foo', 'lockedBy', null, 1);
  });

  it('should fail when saving a dataset', () => {
    documentDao.putRecord.mockRejectedValue('foo');

    const anyDataset = { name: 'Foo' };
    const actualResponse = datasetDao.saveDataset(anyDataset);

    return expect(actualResponse).rejects.toMatch('foo');
  });

  it('should get datasets', async () => {
    const datasets = [{ ...dereferencedDataset, version: 1 }, { ...dereferencedDataset, version: 2 }];
    const expectedDatasets =  [{ ...dereferencedDataset, version: 1 }, { ...dereferencedDataset, version: 2 }];
    documentDao.getLatestRecords.mockResolvedValue(datasets);
    const actualResponse = await datasetDao.getDatasets();
    expect(actualResponse).toStrictEqual(expectedDatasets);
  });

  it('should get all datasets', async () => {
    const datasets = [{ ...dereferencedDataset, version: 1 }, { ...dereferencedDataset, version: 2 }];
    const expectedDatasets =  [{ ...dereferencedDataset, version: 1 }, { ...dereferencedDataset, version: 2 }];
    documentDao.getLatestRecords.mockResolvedValue(datasets);
    const actualResponse = await datasetDao.getDatasets(['AVAILABLE'], true);
    const expectedQuery = {
      statuses: ['AVAILABLE'],
    }
    expect(documentDao.getLatestRecords).toHaveBeenCalledWith(datasetsCollectionName, expectedQuery);
    expect(actualResponse).toStrictEqual(expectedDatasets);
  });

  it('should get a specific dataset', async () => {
    const expectedResponse = dereferencedDataset;
    documentDao.searchByIdAndVersion.mockResolvedValue({ ...dereferencedDataset });
    const actualResponse = await datasetDao.getDataset(1, 1);

    expect(documentDao.searchByIdAndVersion).toHaveBeenCalledWith(datasetsCollectionName, 1, 1);
    expect(actualResponse).toStrictEqual(expectedResponse);
  });

  it('should fail to get a specific dataset', () => {
    const error = 'Boom';
    documentDao.searchByIdAndVersion.mockRejectedValueOnce(error);
    const actualResponse = datasetDao.getDataset(1, 1);

    expect(actualResponse).rejects.toMatch(error);
  });

  it('should get all versions of a dataset', async () => {
    const datasets = [{ ...dereferencedDataset, version: 1 }, { ...dereferencedDataset, version: 2 }];
    const expectedDatasets =  [{ ...dereferencedDataset, version: 1 }, { ...dereferencedDataset, version: 2 }];
    documentDao.getVersions.mockResolvedValueOnce(datasets);

    const actualDatasets = await datasetDao.getDatasetVersions('foo');
    ;
    expect(actualDatasets).toStrictEqual(expectedDatasets);
  });

  it('should get latest datasets', async () => {
    const expected = [{ id: 'some ds' }];
    const statuses = ["AVAILABLE"];
    documentDao.getLatestRecords.mockResolvedValueOnce(expected);

    const result = await datasetDao.getLatestDatasets({ statuses });
    expect(result).toEqual(expected);
    expect(documentDao.getLatestRecords).toHaveBeenCalledWith(datasetsCollectionName, { statuses });
  });

  it('should get latest dataset', async () => {
    const expected = { id: 'some ds' };
    const statuses = ["AVAILABLE"];
    documentDao.getLatestRecord.mockResolvedValueOnce(expected);

    const result = await datasetDao.getLatestDataset('id', statuses);
    expect(result).toEqual(expected);
    expect(documentDao.getLatestRecord).toHaveBeenCalledWith(datasetsCollectionName, 'id', statuses);
  });

  it('should update reference data', async () => {
    const updateRequest = {id:'anyData',name:'anyReference',updateType:'subCommunity'}
    const collection = 'datasets';
    await datasetDao.updateReferenceData(updateRequest);
   expect(documentDao.updateReferenceData).toHaveBeenCalledWith(collection,updateRequest);
  })
});
