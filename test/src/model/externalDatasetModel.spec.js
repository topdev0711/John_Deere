const externalDatasetModel = require('../../../src/model/externalDatasetModel');

const validDataset = {
  name: 'Netflix',
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
      subCommunity: '11',
      countriesRepresented: ['12', '13'],
      gicp: '14',
      personalInformation: false,
      development: false,
      additionalTags: ['tag']
    }
  ],
  requestComments: 'some comments',
  dataRecovery: false
};

describe('externalDatasetModel', () => {
it('valid new dataset with all fields', () => {
    expect(externalDatasetModel.validate(validDataset)).toBeNull();
  });

it('valid new dataset wihtout an optional field', () => {
    delete validDataset.documentation;
    expect(externalDatasetModel.validate(validDataset)).toBeNull();
  });

it('invalid dataset with missing name', () => {
    const invalidDataset = { ...validDataset };
    delete invalidDataset.name;

    const error = externalDatasetModel.validate(invalidDataset);

    expect(error.message).toEqual('child \"name\" fails because [\"name\" is required]');
    expect(error.details[0].name).toEqual('New Dataset');
  });
});