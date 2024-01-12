const datasetModel = require('../../../src/model/datasetModel');
const {VISIBILITY} = require("../../../src/utilities/constants");

describe('datasetModel', () => {
  const isoDate = new Date().toISOString();

  const validDataset = {
    id: 'my-dataset-id',
    name: 'Netflix',
    version: 1,
    createdBy: 'Scooby',
    createdAt: isoDate,
    description: 'Streaming service for TV shows and movies',
    documentation: '##### Support Resources',
    custodian: 'EDG-NETFLIX-MANAGERS',
    sourceDatasets: [],
    category: '4',
    phase: 'enhance',
    technology: '7',
    physicalLocation: '8',
    schemas: [{}],
    linkedSchemas: [],
    tables: [{
      schemaId: 'schema-id',
      schemaName: 'schema-name',
      schemaVersion: '1.0.0',
      tableName: 'my_table'
    }],
    paths: ['/'],
    classifications: [
      {
        community: '10',
        subCommunity: '245e8922-8ea7-4a21-92cc-06e9b3551bdc',
        countriesRepresented: ['12', '13'],
        gicp: '14',
        personalInformation: false,
        development: false,
        additionalTags: ['tag']
      }
    ],
    approvals: [{}],
    commentHistory: [],
    requestComments: 'some comments',
    deletedDatasets: ['some-id'],
    dataRecovery: false,
    usability: 0
};

  it('valid new dataset', () => {
    expect(datasetModel.validateAllFields(validDataset)).toBeNull();
  });

  it('has visibility of FULL_VISIBILITY and throws no errors', () => {
    const testDataset = {...validDataset};
    testDataset['visibility'] = VISIBILITY.FULL_VISIBILITY
    expect(datasetModel.validateAllFields(testDataset)).toBeNull();
  });

  it('has visibility of NO_VISIBILITY and throws no errors', () => {
    const testDataset = {...validDataset};
    testDataset['visibility'] = VISIBILITY.NO_VISIBILITY
    expect(datasetModel.validateAllFields(testDataset)).toBeNull();
  });

  it('has invalid visibility and throws a validation error', () => {
    const invalidDataset = {...validDataset};
    invalidDataset['visibility'] = 'INVALID_VALUE'
    const error = datasetModel.validateAllFields(invalidDataset);
    expect(error.message).toEqual('child "visibility" fails because ["visibility" must be one of [FULL_VISIBILITY, VIEWS_ONLY, NO_VISIBILITY]]');
  });

  it('valid updated dataset on schemas', () => {
    expect(datasetModel.validateFieldsExist({schemas: [{}]})).toBeNull();
  });

  it('valid updated dataset on linked schemas', () => {
    expect(datasetModel.validateFieldsExist({linkedSchemas: [{ id: 'some-id', name: 'some-name', version: 'some-version' }]})).toBeNull();
  });

  it('application is optional', () => {
    const dataset = {...validDataset}
    expect(datasetModel.validateAllFields(dataset)).toBeNull();
  });

  it('application should be a string', () => {
    const invalidDataset = {...validDataset};
    invalidDataset['application'] = 123
    const error = datasetModel.validateAllFields(invalidDataset);
    expect(error.message).toEqual('child \"application\" fails because [\"application\" must be a string]');
  });

  it('valid dataset for application as a string', () => {
    const dataset = {...validDataset};
    dataset['application'] = "test-component";
    expect(datasetModel.validateAllFields(dataset)).toBeNull();
  });

  it('invalid dataset', () => {
    const invalidDataset = {...validDataset};
    delete invalidDataset.technology;

    const error = datasetModel.validateAllFields(invalidDataset);

    expect(error.message).toEqual('child \"technology\" fails because [\"technology\" is required]');
    expect(error.details[0].name).toEqual(invalidDataset.name);
  });

  it('dataset missing name', () => {
    const invalidDataset = {...validDataset};
    delete invalidDataset.name;

    const error = datasetModel.validateAllFields(invalidDataset);

    expect(error.details[0].name).toEqual('New Dataset');
  });

  it('table name contains invalid characters', () => {
    const invalidDataset = {...validDataset};
    invalidDataset.tables[0].tableName = 'name+with/invalid#characters';

    const error = datasetModel.validateAllFields(invalidDataset);

    expect(error.message).toEqual('child \"tables\" fails because [\"tables\" at position 0 fails because [child \"tableName\" fails because [\"tableName\" with value \"name+with/invalid#characters\" fails to match the required pattern: /^\\w+$/]]]');
  });

  it('table name contains invalid sub community', () => {
    const invalidDataset = {...validDataset};
    invalidDataset.tables[0].tableName = 'test';
    invalidDataset.classifications[0].subCommunity = '12';

    const error = datasetModel.validateAllFields(invalidDataset);

    expect(error.message).toContain('child \"classifications\" fails because \[\"classifications\" at position 0 fails because \[child \"subCommunity\" fails because \[\"subCommunity\" must be one of \[');
  });

  it('table name is too long', () => {
    const invalidDataset = {...validDataset};
    let tableName = '';
    for(let i = 0; i < 101; i++) tableName += 'a';
    invalidDataset.tables[0].tableName = tableName;
    invalidDataset.classifications[0].subCommunity = '245e8922-8ea7-4a21-92cc-06e9b3551bdc';
    const error = datasetModel.validateAllFields(invalidDataset);
    expect(error.message).toEqual('child \"tables\" fails because [\"tables\" at position 0 fails because [child \"tableName\" fails because [\"tableName\" length must be less than or equal to 100 characters long]]]');
  });
});
