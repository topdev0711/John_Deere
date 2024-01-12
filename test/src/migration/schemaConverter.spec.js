const schemaConverter = require('../../../src/migration/schemaConverter');
const schemaDao = require('../../../src/data/schemaDao');

jest.mock('../../../src/data/schemaDao');

const schemaId = '97218c53-f732-4fc1-8ab1-c95acde048ee--3';

describe('Schema Converter Test Suite', () => {

  afterEach(() => {
    jest.clearAllMocks();
  })

  it('should convert schema string id reference to json', async () => {
    const daoResponse = {
      name: "some-schemaName",
      version: "1.0.0"
    };
    schemaDao.getSchema.mockResolvedValueOnce(daoResponse);
    const expectedResponse = {
      id: schemaId,
      ...daoResponse
    };
    const actualJson = await schemaConverter.stringToJson(schemaId);
    expect(actualJson).toEqual(expectedResponse);
  });

  it('should throw error if failed to get schema details', async () => {
    schemaDao.getSchema.mockRejectedValueOnce({ message: 'some error' });
    return expect(schemaConverter.stringToJson(schemaId)).rejects.toThrow('some error');
  });

  it('should return undefined if schema does not exist', async () => {
    schemaDao.getSchema.mockRejectedValueOnce({ message: 'The specified key does not exist' });
    const response = await schemaConverter.stringToJson(schemaId);
    expect(response).toEqual(undefined);
  });

  it('should convert json reference to schema string id', () => {
    const json = {
      id: schemaId,
      name: "some-schemaName",
      version: "1.0.0"
    };
    const actualString = schemaConverter.jsonToString(json);
    expect(actualString).toEqual(schemaId);
  });

  it('should return same datasets when there exist no schemas in datasets', async () => {
    const datasets = [ { id: 'id1' }, { id: 'id2' } ];
    const convertedDatasets = await schemaConverter.convertDatasetsSchemasToJson(datasets);
    expect(convertedDatasets).toEqual(datasets);
  });

  it('should return converted datasets when there exist schemas in datasets and every schema is non-missing', async () => {
    const schema = { id: schemaId, name: 'anyName', version: 'anyVersion' };
    const datasets = [ 
      { id: 'id1' },
      { 
        id: 'id2',
        schemas: [schemaId]
      } 
    ];
    const expectedDataset = [
      { id: 'id1' },
      { 
        id: 'id2',
        schemas: [
          schema
        ]
      } 
    ];
    schemaDao.getSchema.mockResolvedValueOnce(schema);
    const convertedDatasets = await schemaConverter.convertDatasetsSchemasToJson(datasets);
    expect(convertedDatasets).toEqual(expectedDataset);
  });

  it('should return converted datasets when there exist schemas in datasets and one schema is missing', async () => {
    const schema = { id: schemaId, name: 'anyName', version: 'anyVersion' };
    const datasets = [ 
      { id: 'id1' },
      { 
        id: 'id2',
        schemas: [
          schemaId,
          'some-id'
        ]
      } 
    ];
    const expectedDataset = [
      { id: 'id1' },
      { 
        id: 'id2',
        schemas: [
          schema
        ]
      } 
    ];
    schemaDao.getSchema.mockResolvedValueOnce(schema);
    schemaDao.getSchema.mockRejectedValueOnce({ message: 'The specified key does not exist' });
    const convertedDatasets = await schemaConverter.convertDatasetsSchemasToJson(datasets);
    expect(convertedDatasets).toEqual(expectedDataset);
  });

  it('should return converted datasets when there exist linkedSchemas in datasets and every schema is non-missing', async () => {
    const schema = { id: schemaId, name: 'anyName', version: 'anyVersion' };
    const datasets = [ 
      { id: 'id1' },
      { 
        id: 'id2',
        linkedSchemas: [schemaId]
      } 
    ];
    const expectedDataset = [
      { id: 'id1' },
      { 
        id: 'id2',
        linkedSchemas: [
          schema
        ]
      } 
    ];
    schemaDao.getSchema.mockResolvedValueOnce(schema);
    const convertedDatasets = await schemaConverter.convertDatasetsSchemasToJson(datasets);
    expect(convertedDatasets).toEqual(expectedDataset);
  });

  it('should return converted datasets when there exist linkedSchemas in datasets and one schema is missing', async () => {
    const schema = { id: schemaId, name: 'anyName', version: 'anyVersion' };
    const datasets = [ 
      { id: 'id1' },
      { 
        id: 'id2',
        linkedSchemas: [
          schemaId,
          'some-id'
        ]
      } 
    ];
    const expectedDataset = [
      { id: 'id1' },
      { 
        id: 'id2',
        linkedSchemas: [
          schema
        ]
      } 
    ];
    schemaDao.getSchema.mockResolvedValueOnce(schema);
    schemaDao.getSchema.mockRejectedValueOnce({ message: 'The specified key does not exist' });
    const convertedDatasets = await schemaConverter.convertDatasetsSchemasToJson(datasets);
    expect(convertedDatasets).toEqual(expectedDataset);
  });
  
  it('should add testing flag to schema details', async () => {
    const currSchemaDetails = { id: schemaId, name: 'anyName', version: 'anyVersion' };
    const newSchemaDetails = { id: schemaId, name: 'anyName', version: 'anyVersion', testing: false };
    const datasets = [ 
      { id: 'id1' },
      { 
        id: 'id2',
        schemas: [currSchemaDetails]
      } 
    ];
    const expectedDataset = [
      { id: 'id1' },
      { 
        id: 'id2',
        schemas: [newSchemaDetails]
      } 
    ];
    schemaDao.getSchema.mockResolvedValueOnce(newSchemaDetails);
    const convertedDatasets = await schemaConverter.addingTestingToSchemaDetails(datasets);
    expect(convertedDatasets).toEqual(expectedDataset);
  });

  it('should return testing key added schema object within datasets when there exist schemas in datasets and one schema is missing', async () => {
    const currSchemaDetails = { id: schemaId, name: 'anyName', version: 'anyVersion' };
    const newSchemaDetails = { id: schemaId, name: 'anyName', version: 'anyVersion', testing: false };
    const datasets = [ 
      { id: 'id1' },
      { 
        id: 'id2',
        schemas: [
          currSchemaDetails,
          { id: 'some-id', name: 'some-name', version: 'some-version' }
        ]
      } 
    ];
    const expectedDataset = [
      { id: 'id1' },
      { 
        id: 'id2',
        schemas: [
          newSchemaDetails
        ]
      } 
    ];
    schemaDao.getSchema.mockResolvedValueOnce(newSchemaDetails);
    schemaDao.getSchema.mockRejectedValueOnce({ message: 'The specified key does not exist' });
    const convertedDatasets = await schemaConverter.addingTestingToSchemaDetails(datasets);
    expect(convertedDatasets).toEqual(expectedDataset);
  });
})
