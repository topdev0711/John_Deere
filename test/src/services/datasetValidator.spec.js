const datasetModel = require('../../../src/model/datasetModel');
const datasetValidator = require('../../../src/services/datasetValidator');
const schemaValidationService = require('../../../src/services/schemaValidationService');
const tableNameValidationService = require('../../../src/services/tableNameValidationService');
const versionService = require('../../../src/services/versionService');
const featureToggleService = require('../../../src/services/featureToggleService');
const edlApiHelper = require('../../../src/utilities/edlApiHelper');

jest.mock('../../../src/model/datasetModel');
jest.mock('../../../src/services/schemaValidationService');
jest.mock('../../../src/services/tableNameValidationService');
jest.mock('../../../src/services/versionService');
jest.mock('../../../src/services/featureToggleService');
jest.mock('../../../src/utilities/edlApiHelper');

const mockDate = new Date();
const isoDate = mockDate.toISOString();
const datasetId = '1234';
const schemaId = 'a108b4a3-d00b-4e33-a143-a73932b7ff77--1';
const schemaName = 'base schema';
const user = 'Fred';
const createSchema = () => ({id: schemaId, name: schemaName, version: '1.0.0'});

function createDataset() {
  return {
    id: datasetId,
    name: 'Netflix',
    requestComments: 'some test comments',
    version: 1,
    createdBy: user,
    createdAt: isoDate,
    description: 'Streaming service for TV shows and movies',
    documentation: '##### Support Resources',
    custodian: 'EDG-NETFLIX-MANAGERS',
    deletedSchemas: [],
    sourceDatasets: [],
    category: '4',
    phase: '6',
    technology: '7',
    physicalLocation: '8',
    schemas: [createSchema()],
    linkedSchemas: [],
    tables: [],
    paths: [],
    status: 'AVAILABLE',
    classifications: [
      {
        community: '10',
        subCommunity: '11',
        countriesRepresented: ['12', '13'],
        gicp: '14',
        id: '2345',
        personalInformation: false,
        development: false,
        additionalTags: ['tag']
      }
    ],
    approvals: []
  };
}


function assertError(actualError, message, name) {
  return actualError.then(() => fail('it should not reach here'))
    .catch(error => {
      console.info('actual Error in assertError: ', error);
      console.info('error details: ', error.details)
      expect(error.details[0].message).toEqual(message);
      expect(error.details[0].name).toEqual(name);
    });
}

function mockEDlResponse(){
  const datasetToSave = createDataset();
  return {
    "name": datasetToSave.schemas[0].name,
    "namespace": "com.deere.enterprise.datalake.raw",
    "version": datasetToSave.schemas[0].version,
  }
}

describe('datasetValidator tests', () => {
  beforeEach(() => {
    edlApiHelper.getEDLMetadata
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce(mockEDlResponse());
  })
  afterEach(() => jest.resetAllMocks());

    describe('new dataset validation tests', () => {
    it('should successfully validate a new dataset', async () => {
      const dataset = {...createDataset(), linkedSchemas: ['my-schema']};
      const availableDatasets = [{...createDataset(), schemas: ['my-schema']}];
      const nonDeletedDatasets = [createDataset()];
      featureToggleService.getToggle.mockResolvedValue({ enabled: false });
      const actualResponse = await datasetValidator.validateNew(dataset, availableDatasets, nonDeletedDatasets);
      expect(actualResponse).toEqual(undefined);
      expect(tableNameValidationService.validateTables).toBeCalledWith(dataset, nonDeletedDatasets);
    });

    it('should fail when dataset model is invalid', async () => {
      const dataset = createDataset();
      featureToggleService.getToggle.mockResolvedValue({enabled: true});
      datasetModel.validateAllFields.mockReturnValue({details: [{message: 'bad stuff'}]});
      try {
        await datasetValidator.validateNew(dataset, [dataset], undefined);
      } catch(error) {
        console.info('actual Error in assertError: ', error);
        console.info('error details: ', error.details)
        expect(error.details[0].message).toEqual('bad stuff');
        expect(error.details[0].name).toEqual(dataset.name);
      }
    });
  });

  describe('update dataset validation tests', () => {
    it('should successfully validate when no fields that require validation are passed', async() => {
      featureToggleService.getToggle.mockResolvedValue({ enabled: false });
      const actualResponse = await datasetValidator.validateUpdate({}, [{}], [], [], {}, 'anyUser');
      expect(actualResponse).toEqual(undefined);
    });


    it('should successfully validate when some validated fields are passed', async() => {
      const dataset = {
        id: datasetId,
        name: 'Netflix',
        requestComments: 'some test comments',
        version: 1,
        phase: '6',
        schemas: [createSchema()],
      };
      featureToggleService.getToggle.mockResolvedValue({ enabled: false });
      const actualResponse = await datasetValidator.validateUpdate(dataset, [dataset], [],[], dataset);
      expect(actualResponse).toEqual(undefined);
    });

    it('should successfully validate when all fields are passed', async () => {
      const dataset = createDataset();
      featureToggleService.getToggle.mockResolvedValue({ enabled: false });
      const actualResponse = await datasetValidator.validateUpdate(dataset, [dataset], [],[], dataset);
      expect(actualResponse).toEqual(undefined);
    });

    it('should fail when dataset model is invalid', () => {
      const dataset = createDataset();
      datasetModel.validateAllFields.mockReturnValue({details: [{message: 'bad stuff'}]});

      const actualError = datasetValidator.validateUpdate(dataset, [dataset], [],[], dataset);

      return assertError(actualError, 'bad stuff', dataset.name);
    });

    it('should fail when the version is invalid', () => {
      const expectedError = new Error('Dataset update not allowed.');
      expectedError.details = [{ message: 'anyError' }];
      versionService.allowedToUpdate.mockImplementation(() => {throw expectedError});
      const dataset = createDataset();

      const actualError = datasetValidator.validateUpdate(dataset, [dataset], [], [], {}, 'anyUser');

      return assertError(actualError, 'anyError', undefined);
    });

    it('should fail when trying to change phase', () => {
      const changePhaseDataset = {...createDataset(), phase: '1'};
      const actualError = datasetValidator.validateUpdate(changePhaseDataset, [changePhaseDataset], [], [], createDataset(), 'anyUser');
      return assertError(actualError, 'Cannot change dataset phase', undefined);
    });

    it('should fail when trying to change phase', () => {
      // mock schemaDao.getSchemas
      // mock schemaValidationService.validateUpdatedSchemas

      //TODO verify schemaValidationService.validateUpdatedSchemas called with ...
      featureToggleService.getToggle.mockResolvedValue({ enabled: true });
      const changePhaseDataset = {...createDataset(), phase: '1'};
      const actualError = datasetValidator.validateUpdate(changePhaseDataset, [changePhaseDataset], [], [], createDataset(), 'anyUser');
      return assertError(actualError, 'Cannot change dataset phase', undefined);
    });
  });

  describe('dataset validation failure scenarios', () => {
    it('should fail when there is an invalid schema', () => {
      featureToggleService.getToggle.mockResolvedValue({ enabled: true });
      const message = 'invalid schema';
      const dataset = createDataset();
      schemaValidationService.validateSchemas.mockReturnValue([{details: [{name: dataset.name, message}]}]);

      const actualError = datasetValidator.validateNew(dataset, [dataset], undefined);

      return assertError(actualError, message, dataset.name)
    });

    it('should fail when GICP public is with personal information as true', () => {
      const message = 'classification with id 2345 with public gicp has personal information flag as true which is not permitted as per GICP policy';
      const dataset = createDataset();
      featureToggleService.getToggle.mockResolvedValue({ enabled: true });
      delete dataset.classifications;
      const classifications = [
        {
          community: '10',
          subCommunity: '11',
          countriesRepresented: ['12', '13'],
          gicp: '10710b7a-7391-4860-a18d-1d7edc746fe7',
          id: '2345',
          personalInformation: true,
          development: false,
          additionalTags: ['tag']
        }
      ];
      const dataset1 = {...dataset, classifications}

      const actualError = datasetValidator.validateNew(dataset1, [dataset1], undefined);
      console.log(JSON.stringify(actualError));
      return assertError(actualError, message, undefined)
    });

    it('should fail when there are invalid linkIds', () => {
      featureToggleService.getToggle.mockResolvedValue({ enabled: true });
      const dataset = { ...createDataset(), linkedSchemas: ['anyId']};
      const availableDatasets = [createDataset()];
      const actualError = datasetValidator.validateNew(dataset, availableDatasets, undefined);
      return assertError(actualError, 'Invalid linkedSchemas: anyId do not exist', undefined);
    });

    it('should fail when the name is changed', () => {
      featureToggleService.getToggle.mockResolvedValue({ enabled: true });
      const dataset = { ...createDataset()};
      delete dataset.id
      const availableDatasets = [{...createDataset(), phase:{id:'6'}}];
      const actualError = datasetValidator.validateUpdate(dataset, availableDatasets, availableDatasets, availableDatasets, createDataset());
      return assertError(actualError, 'Another dataset with id: 1234 already exists with the same name and phase', undefined);
    })

    it('should fail when there are invalid table names', () => {
      const dataset =  { ...createDataset(), name: 'someName'};
      featureToggleService.getToggle.mockResolvedValue({ enabled: true });
      tableNameValidationService.validateTables.mockResolvedValue({details: [{name: 'table names', message: 'bad stuff'}]});

      const actualError = datasetValidator.validateNew(dataset, [dataset], undefined);

      return assertError(actualError, 'bad stuff', 'table names');
    });

    it('should handle multiple failures', () => {
      const dataset = createDataset();
      featureToggleService.getToggle.mockResolvedValue({ enabled: true });
      datasetModel.validateAllFields.mockReturnValue({details: [{message: 'bad stuff'}]});
      const message = 'invalid schema';
      schemaValidationService.validateSchemas.mockReturnValue([{details: [{name: dataset.name, message}]}]);

      const actualError = datasetValidator.validateNew(dataset, [dataset], undefined);

      return assertError(actualError, 'bad stuff', dataset.name);
    });
  });

  describe('Validate dataset for lock', () => {
    it('Should throw exception if dataset version not matches with version being locked', () => {
      const dataset = createDataset();
      expect(() => {datasetValidator.validateLockDataset(dataset, 2)}).toThrowError(new Error('You can only lock the most recent non-deleted dataset version. The latest version is 1.'));
    });

    it('Should throw exception if dataset status is not AVAILABLE', () => {
      const dataset = createDataset();
      dataset.status = 'PENDING'
      const actualError = () => datasetValidator.validateLockDataset(dataset, 1);
      expect(actualError).toThrowError(new Error('Only available datasets are lockable.'));
    });

    it('Should throw exception if dataset is already locked', () => {
      const dataset = createDataset();
      dataset.lockedBy = 'blah'
      const actualError = () => datasetValidator.validateLockDataset(dataset, 1);
      expect(actualError).toThrowError(new Error('Cannot lock a dataset that is already locked. Locked by blah.'));
    });
  });


  describe( 'validate for duplicate schemas', () => {


    beforeEach(()=>{
      jest.clearAllMocks()
    })

    afterEach(() => jest.resetAllMocks())

    it('Should throw error if created schema representation exists in EDL', async () => {
      //given
      edlApiHelper.getEDLMetadata.mockReset()
      const dataset = createDataset();
      const schema = dataset.schemas[0]
      const jdCatalogSchemaResponse = [
        {
          "name": 'base schema',
          "namespace": `com.deere.enterprise.datalake.raw`,
          "version": '1.0.0'
        }
      ];

      edlApiHelper.getEDLMetadata
            .mockResolvedValue(jdCatalogSchemaResponse);

      try{
        await datasetValidator.validateIncomingDataset(dataset.schemas, dataset.phase)
      } catch(error) {
        expect(error.message).toEqual(`Duplicate schema found in EDL for schema name (${schema.name}) version (${schema.version})`)
      }
    });

    it('Should pass when saving unique schemas', async () => {
      edlApiHelper.getEDLMetadata.mockReset()
      const dataset = createDataset();
      const jdCatalogSchemaResponse = [
        {
          "name": 'new schema',
          "version": '1.0.0'
        }
      ];

      edlApiHelper.getEDLMetadata
            .mockResolvedValue(jdCatalogSchemaResponse);

      const actualResponse = await datasetValidator.validateIncomingDataset(dataset.schemas, dataset.phase)
      expect(actualResponse).toEqual(undefined);
    });

    it('Should Resolve if created schema is empty for (Raw and Model)', async () => {
      //given
      edlApiHelper.getEDLMetadata.mockReset()
      const dataset = createDataset();
      const jdCatalogSchemaResponse = [];

      edlApiHelper.getEDLMetadata
            .mockResolvedValue(jdCatalogSchemaResponse);

      const result = await datasetValidator.validateIncomingDataset([], dataset.phase)
      //when && then
       expect(result).toEqual(undefined)
    });


    it('Should pass when updating unique schemas', async () => {
      datasetValidator.checkNonDeletedDatasets = jest.fn();
      const existingSchemas = createSchema()
      const newSchema = {
        "name": 'new schema',
        "version": '1.0.0'
      }


      const dataset = {...createDataset(), schemas: [existingSchemas, newSchema]};
      const actualResponse = await datasetValidator.checkNonDeletedDatasets([dataset], createDataset())
      expect(dataset.schemas.length).toBe(2)
      expect(actualResponse).toBe(undefined);
      expect(datasetValidator.checkNonDeletedDatasets).toHaveBeenCalledTimes(1);
      expect(datasetValidator.checkNonDeletedDatasets).toBeCalledWith([dataset], createDataset());
    });

    it('Should pass when updating unique schemas', async () => {
      datasetValidator.checkNonDeletedDatasets = jest.fn();
      const dataset = createDataset();
      const actualResponse = await datasetValidator.checkNonDeletedDatasets(dataset, [])
      expect(actualResponse).toBe(undefined);
      expect(datasetValidator.checkNonDeletedDatasets).toHaveBeenCalledTimes(1);
      expect(datasetValidator.checkNonDeletedDatasets).toBeCalledWith(dataset, []);
    });

    it('Should pass when deleted schema with update/modify dataset call', async () => {
      datasetValidator.checkNonDeletedDatasets = jest.fn();
      // edlApiHelper.getEDLMetadata.mockReset()
      const exisitingDataset = createDataset()
      const newSchema = {
        "name": 'base schema',
        "version": '1.0.0'
      }
      delete exisitingDataset.schemas

      const updatedDataset = [{ ...exisitingDataset, schemas: [newSchema]}]


      const result = await datasetValidator.checkNonDeletedDatasets(updatedDataset, exisitingDataset)
      //when && then
      expect(result).toEqual(undefined)
      expect(datasetValidator.checkNonDeletedDatasets).toHaveBeenCalledTimes(1);
      expect(datasetValidator.checkNonDeletedDatasets).toBeCalledWith(updatedDataset, exisitingDataset);
    });

  })
});
