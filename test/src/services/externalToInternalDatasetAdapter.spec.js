/**
 * @jest-environment node
 */

const adapter = require('../../../src/services/externalToInternalDatasetAdapter');
const catalogReferenceService = require('../../../src/services/catalogReferenceService');
const schemaDao = require('../../../src/data/schemaDao');
const datasetService = require('../../../src/services/datasetService');
const datasetDao = require('../../../src/data/datasetDao');
const externalDatasetModel = require('../../../src/model/externalDatasetModel');

jest.mock('../../../src/data/datasetDao');
jest.mock('../../../src/services/catalogReferenceService');
jest.mock('../../../src/data/schemaDao');
jest.mock('../../../src/services/datasetService');
jest.mock('../../../src/model/externalDatasetModel');

const id = '1234';
const version = 1;
const referenceServiceErrorMessage = 'catalogReferenceService error';
const schemaId = 'a108b4a3-d00b-4e33-a143-a73932b7ff77--1';
const schemaName = 'base schema';

function createSchema() {
  return {
    id: schemaId,
    name: schemaName,
    version: '1.0.0'
  };
}

function createDataset() {
  return {
    name: 'Netflix',
    description: "some description",
    custodian: 'EDG-NETFLIX-MANAGERS',
    sourceDatasets: [],
    category: 'Master',
    phase: 'enhance',
    technology: 'AWS',
    physicalLocation: 'us-east-1',
    tables:[],
    schemas: [],
    linkedSchemas: [],
    paths: [],
    dataRecovery: false,
    classifications: [
      {
        community: 'some_community',
        subCommunity: 'some_subCommunity',
        countriesRepresented: ['AE', 'US'],
        gicp: 'some_gicp',
        personalInformation: false,
        development: false,
        additionalTags: ['tag']
      }
    ]
  };
}

function createReferenceDataset() {
  return {
    name: 'Netflix',
    custodian: 'EDG-NETFLIX-MANAGERS',
    sourceDatasets: [],
    description: "some description",
    category: '5',
    phase: '6',
    technology: '7',
    physicalLocation: '8',
    tables:[],
    schemas: [],
    linkedSchemas: [],
    dataRecovery: false,
    paths: [],
    classifications: [
      {
        community: '1',
        subCommunity: 'subcomm',
        countriesRepresented: ['12'],
        gicp: '10',
        personalInformation: false,
        development: false,
        additionalTags: ['tag']
      }
    ],
  };
}

describe('externalToInternalDatasetAdapter tests', () => {
  it('should allow updates to new datasets', async () => {
    const changedDataset = { ...createDataset(), name: 'New Name' };
    const existingDataset = { ...createDataset(), version: 1, status: 'PENDING' };
    const expectedDataset = { 
      ...changedDataset, 
      createdAt: undefined, 
      createdBy: undefined,
      id,
      status: 'PENDING',
      version: 1
    };

    datasetService.getLatestAvailableVersion.mockResolvedValue(existingDataset);
    datasetService.getLatestDataset.mockResolvedValue(existingDataset);
    
    const updatedDataset = await adapter.adaptExistingDataset(id, changedDataset);

    expect(updatedDataset).toEqual(expectedDataset);
  });
  
  it('should fail validating on an invalid new raw dataset', () => {
    const invalidRawDataset = { ...createDataset() };
    delete invalidRawDataset.name;
    const expectedError = {
      details: [ 
        { 
          message: '"name" is required',
        }
      ]
    }
    externalDatasetModel.validate.mockReturnValueOnce(expectedError);
    return expect(adapter.adaptNewDataset(invalidRawDataset)).rejects.toEqual({"details": [{"message": "\"name\" is required", "name": "New Dataset"}]})
  });

  it('should successfully create dataset without tables', async () => {
    const rawDataset = { ...createDataset(), sourceDatasets: ['abc'] };
    delete rawDataset.tables;
    const availableDataset = { ...createDataset(), id, version, status: 'AVAILABLE'};
    datasetService.getLatestAvailableVersion.mockResolvedValueOnce(availableDataset);
    const referenceDataset = createReferenceDataset(availableDataset);
    catalogReferenceService.getDatasetReferences.mockReturnValue(referenceDataset);

    const actualDataset = await adapter.adaptNewDataset(rawDataset);

    const sourceDatasets = [{ id: "1234", version: 1, paths: [] }];
    const expectedDataset = { ...referenceDataset, sourceDatasets};
    expect(actualDataset).toEqual(expectedDataset);
  });

  it('should replace all values with references in a new dataset', async () => {
    const rawDataset = { ...createDataset(), sourceDatasets: ['abc'] };
    const availableDataset = { ...createDataset(), id, version, status: 'AVAILABLE'};
    datasetService.getLatestAvailableVersion.mockResolvedValueOnce(availableDataset);
    const referenceDataset = createReferenceDataset(availableDataset);
    catalogReferenceService.getDatasetReferences.mockReturnValue(referenceDataset);

    const actualDataset = await adapter.adaptNewDataset(rawDataset);

    const sourceDatasets = [{ id: "1234", version: 1, paths: [] }];
    const expectedDataset = { ...referenceDataset, sourceDatasets};
    expect(actualDataset).toEqual(expectedDataset);
  });

  it('should add a null schema id for all schemas when creating a new dataset', async () => {
    const schema = createSchema()
    const tables = [ { schemaName: schema.name, schemaVersion: schema.version, tableName: 'anyName'} ];
    const rawDataset = { ...createDataset(), sourceDatasets: ['abc'], schemas: [schema], tables };
    const availableDataset = { ...createDataset(), id, version, status: 'AVAILABLE'};
    datasetService.getLatestAvailableVersion.mockResolvedValue(availableDataset);
    const referenceDataset = createReferenceDataset(availableDataset);
    catalogReferenceService.getDatasetReferences.mockReturnValue(referenceDataset);

    const actualDataset = await adapter.adaptNewDataset(rawDataset);
    const sourceDatasets = [{ id: "1234", version: 1, paths: [] }];
    const expectedDataset = { ...referenceDataset, sourceDatasets};
    expect(actualDataset).toEqual(expectedDataset);
  });

  it('should throw an error when unable to get find a source dataset for a new dataset', () => {
    const rawDataset = { ...createDataset(), sourceDatasets: ['abc'] };
    datasetService.getLatestAvailableVersion.mockResolvedValueOnce(undefined);
    const mockedReferenceDataset = createReferenceDataset();
    catalogReferenceService.getDatasetReferences.mockReturnValue(mockedReferenceDataset);

    const actualError = adapter.adaptNewDataset(rawDataset);

    return expect(actualError).rejects.toThrow(new Error('There is no dataset with id: abc'));
  });

  it('should throw an error when unable to get a reference on adapting new dataset', async () => {
    const rawDataset = createDataset();
    catalogReferenceService.getDatasetReferences.mockImplementation(() => {throw new Error(referenceServiceErrorMessage)});
    const actualError = adapter.adaptNewDataset(rawDataset);
    return expect(actualError).rejects.toThrow(new Error(referenceServiceErrorMessage));
  });

  it('should replace all values for references in an existing dataset, when there is no available dataset', async () => {
    const version = 4;
    const updateDataset = { ...createDataset(), schemas:[createSchema()] };
    datasetService.getLatestDataset.mockResolvedValueOnce({ version });
    const referenceDataset = createReferenceDataset();
    catalogReferenceService.getDatasetReferences.mockReturnValue({ ...referenceDataset, version });

    const actualDataset = await adapter.adaptExistingDataset(id, updateDataset);

    const expectedDataset = {...referenceDataset, id, version};
    expect(actualDataset).toEqual(expectedDataset);
  });

  it('should add a null schema id for all new schemas when updating a dataset', async () => {
    const version = 4;
    const schema = createSchema()
    const tables = [ { schemaName: schema.name, schemaVersion: schema.version, tableName: 'anyName'} ];

    const updateDataset = { ...createDataset(), schemas:[schema], tables };
    datasetService.getLatestAvailableVersion.mockResolvedValue({...createDataset(), version: 3});
    datasetService.getLatestDataset.mockResolvedValue({...createDataset(), version: 3});
    const referenceDataset = createReferenceDataset();
    catalogReferenceService.getDatasetReferences.mockReturnValue({ ...referenceDataset, version });

    const actualDataset = await adapter.adaptExistingDataset(id, updateDataset);

    const expectedDataset = {...referenceDataset, id, version};
    expect(actualDataset).toEqual(expectedDataset);
  });

  it('should replace all values for references in an existing dataset', async () => {
    schemaDao.getSchemas.mockResolvedValue([createSchema()]);
    const version = 4;
    const updateDataset = { ...createDataset(), schemas:[createSchema()] };
    const availableDataset = { ...createDataset(), id, status: 'AVAILABLE', schemas:[createSchema()]};
    datasetService.getLatestAvailableVersion.mockResolvedValueOnce(availableDataset);
    datasetService.getLatestDataset.mockResolvedValueOnce({availableDataset, version});

    const referenceDataset = createReferenceDataset();
    catalogReferenceService.getDatasetReferences.mockReturnValue({ ...referenceDataset, version });

    const actualDataset = await adapter.adaptExistingDataset(id, updateDataset);

    const expectedDataset = {...referenceDataset, id, version};
    expect(actualDataset).toEqual(expectedDataset);
  });

  it('should replace all values for references in an existing dataset with no schemas', async () => {
    const version = 4;
    const updateDataset = { ...createDataset(), schemas:[createSchema()] };
    
    const availableDataset = { ...createDataset(), id, status: 'AVAILABLE'};
    datasetService.getLatestAvailableVersion.mockResolvedValueOnce(availableDataset);
    datasetService.getLatestDataset.mockResolvedValueOnce({ version });

    const referenceDataset = createReferenceDataset();
    catalogReferenceService.getDatasetReferences.mockReturnValue({ ...referenceDataset, version });

    const actualDataset = await adapter.adaptExistingDataset(id, updateDataset);

    const expectedDataset = {...referenceDataset, id, version};
    expect(actualDataset).toEqual(expectedDataset);
  });

  it('should throw an error when it is unable to get existing dataset info', () => {
    const updateDataset = createDataset();
    datasetService.getLatestDataset.mockResolvedValue(undefined);
    const actualError =  adapter.adaptExistingDataset(id, updateDataset);
    return expect(actualError).rejects.toThrow(new Error('There is no dataset with id: 1234'));
  });

  it('should retain the existing paths information if the user includes paths in an external update dataset request', async () => {
    const existingReferenceDataset = { ...createReferenceDataset(), id, version, paths: []};
    datasetDao.getDatasetVersions.mockResolvedValue([existingReferenceDataset]);
    datasetService.getLatestAvailableVersion.mockResolvedValue(existingReferenceDataset);
    datasetService.getLatestDataset.mockResolvedValue(existingReferenceDataset);
    const changedDataset = {...createDataset(), paths: ['/myPath']};
    const updatedDataset = await adapter.adaptExistingDataset(id, changedDataset);
    expect(updatedDataset.paths).toEqual([]);
  });
});
