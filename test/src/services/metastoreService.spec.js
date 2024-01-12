/**
 * @jest-environment node
 */

const metastoreService = require('../../../src/services/metastoreService');
const schemaValidationService = require('../../../src/services/schemaValidationService');
const viewService = require('../../../src/services/viewService');
const remediationService = require('../../../src/services/remediationService');
const datasetService = require('../../../src/services/datasetService')
const metastoreDao = require('../../../src/data/metastoreDao');
const datasetDao = require('../../../src/data/datasetDao');
const s3 = require('../../../src/data/s3');
const { when, resetAllWhenMocks } = require('jest-when');

jest.mock('../../../src/data/s3');
jest.mock('../../../src/data/metastoreDao');
jest.mock('../../../src/data/schemaDao');
jest.mock('../../../src/data/datasetDao');
jest.mock('../../../src/services/schemaValidationService');
jest.mock('../../../src/services/viewService');
jest.mock('../../../src/services/remediationService');
jest.mock('../../../src/services/datasetService');

describe('metastoreService Tests', () => {
  const mockDate = new Date();
  const isoDate = mockDate.toISOString();
  const storageLocation = 'some-location';
  const datasetId = 'some-dataset-id';
  const environmentName = 'some.datatype';
  const viewName = 'some.view';

  const sampleViewStructure = {
    description: "test description",
    documentation: "some documentation",
    fields: [
      {
        name: "field1",
        attribute: "id",
        datatype: "string",
        description: "test",
        nullable: false
      }
    ]
  };
  const sampleInput = {
    name: viewName,
    structure: sampleViewStructure,
    environmentNames: [environmentName]
  };

  const sampleTableInput = {
    name: "edl.test_table",
    structure: sampleViewStructure,
    environmentNames: [environmentName]
  };

  function createTestDataset() {
    return {
      id: datasetId,
      environmentName
    }
  }

  const expectedStructure = {
    ...sampleViewStructure,
    name: sampleInput.name,
    version: '1.0.0',
    id: sampleInput.name,
    testing: false,
    partitionedBy: []
  };

  const expectedTableStructure = {
    ...sampleViewStructure,
    name: sampleTableInput.name,
    version: '1.0.0',
    id: sampleTableInput.name,
    testing: false,
    partitionedBy: []
  }

  const expectedMetadata = {
    name: sampleInput.name,
    updatedAt: isoDate,
    createdAt: isoDate,
    datasetId,
    status: 'AVAILABLE',
    driftDetails: {}
  };

  const expectedViewDriftedMetadata = {
    name: 'view-drifted',
    updatedAt: isoDate,
    datasetId,
    status: 'DRIFTED',
    driftDetails: {
      type: "dataset",
      items: ['newly-added-datasetId']
    }
  };

  const expectedTableMetadata = {
    name: sampleTableInput.name,
    updatedAt: isoDate,
    datasetId: datasetId
  };

  function createExpectedDataset(viewsToAdd = [sampleInput.name]) {
    return {
      ...createTestDataset(),
      views: viewsToAdd
    };
  }
  const successfulResponse = [
    {
      id: sampleInput.name,
      status: 'Successful'
    }
  ];

  const successfulTableResponse = [
    {
      id: sampleTableInput.name,
      status: 'Successful'
    }
  ];

  function createExpectedTableDataset(tablesToAdd = [sampleTableInput.name]) {
    return {
      ...createTestDataset(),
      discoveredTables: tablesToAdd
    };
  }

  beforeEach(() => {
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    datasetDao.getLatestDatasets.mockResolvedValue([createTestDataset()]);
    schemaValidationService.validateDiscoveredSchemas.mockReturnValue([]);
    viewService.createUpdatedViews.mockResolvedValue([]);
    metastoreDao.saveViewMetadatas.mockResolvedValue('Success');
    metastoreDao.saveMetaDataStructure.mockResolvedValue('Success');
    metastoreDao.saveTableMetadatas.mockResolvedValue('Success');
    datasetService.saveDatasets.mockResolvedValue('Success');
  })
  describe('Meta Data Tests', () => {
    it('should handle an s3 failure', async () => {
      const error = 'Access denied.';
      s3.getFile.mockRejectedValueOnce(error);

      await expect(metastoreService.processViews('someLocation')).rejects.toThrow('An unexpected error occurred retrieving discovered metadata from S3.');
    });

    it('should update more than one dataset if related', async () => {
      const otherEnvironmentName = 'some.other.datatype';
      const alteredInput = { ...sampleInput, environmentNames: [environmentName, otherEnvironmentName] };
      const otherDataset = { id: 'other-id', environmentName: otherEnvironmentName };
      const otherView = { name: alteredInput.name, status: "AVAILABLE", createdAt:isoDate };
      const expectedOtherDataset = { ...otherDataset, views: [otherView] };
      const unrelatedDataset = { id: 'unrelated-id' };
      const expectedMetadata2 = { ...expectedMetadata, datasetId: otherDataset.id };
      const someView = { name: alteredInput.name, status: "AVAILABLE", createdAt:isoDate };
      const expectedUpsertItems = [createExpectedDataset([someView]), expectedOtherDataset];
      const allDatasets = [createTestDataset(), otherDataset, unrelatedDataset];
      datasetDao.getLatestDatasets.mockResolvedValueOnce(allDatasets);
      s3.getFile.mockResolvedValueOnce({ views: [alteredInput] });
      viewService.createUpdatedViews.mockResolvedValueOnce([expectedMetadata, expectedMetadata2]);
      viewService.createUpdatedDatasets.mockResolvedValueOnce(expectedUpsertItems);
      remediationService.processRemediations.mockResolvedValue([]);

      const result = await metastoreService.processViews(storageLocation);

      expect(result).toEqual(successfulResponse);
      expect(viewService.createUpdatedViews).toBeCalledWith([alteredInput], expect.arrayContaining(allDatasets));
      expect(datasetService.saveDatasets).toBeCalledWith(expectedUpsertItems);
      expect(metastoreDao.saveViewMetadatas).toBeCalledWith([expectedMetadata, expectedMetadata2]);
      expect(metastoreDao.saveMetaDataStructure).toBeCalledWith(expectedStructure);
    });

    it('should save remediation if view is drifted', async () => {
      const otherEnvironmentName = 'some.other.datatype';
      const alteredInput = { ...sampleInput, environmentNames: [environmentName, otherEnvironmentName] };
      const otherDataset = { id: 'other-id', environmentName: otherEnvironmentName };
      const otherView = {name: alteredInput.name, status: "AVAILABLE", createdAt:isoDate};
      const expectedOtherDataset = { ...otherDataset, views: [otherView] };
      const unrelatedDataset = { id: 'unrelated-id' };
      const expectedMetadata2 = { ...expectedMetadata, datasetId: otherDataset.id };
      const someView = {name: alteredInput.name, status: "AVAILABLE", createdAt:isoDate};
      const expectedUpsertItems = [createExpectedDataset([someView]), expectedOtherDataset];


      const allDatasets = [createTestDataset(), otherDataset, unrelatedDataset];
      datasetDao.getLatestDatasets.mockResolvedValueOnce(allDatasets);
      s3.getFile.mockResolvedValueOnce({ views: [alteredInput] });
      viewService.createUpdatedViews.mockResolvedValueOnce([expectedMetadata, expectedMetadata2, expectedViewDriftedMetadata]);
      viewService.createUpdatedDatasets.mockResolvedValueOnce(expectedUpsertItems);
      remediationService.processRemediations.mockResolvedValue([]);

      const result = await metastoreService.processViews(storageLocation);

      expect(result).toEqual(successfulResponse);
      expect(viewService.createUpdatedViews).toBeCalledWith([alteredInput], expect.arrayContaining(allDatasets));
      expect(metastoreDao.saveMetaDataStructure).toBeCalledWith(expectedStructure);
      expect(remediationService.processRemediations).toBeCalledWith([expectedMetadata, expectedMetadata2, expectedViewDriftedMetadata])
    });

    it('should update the same dataset with multiple views if provided', async () => {
      const secondView = {
        name: 'edl.view2',
        structure: sampleViewStructure,
        environmentNames: [environmentName]
      };
      const view1 = {name: sampleInput.name, status: "AVAILABLE", createdAt:isoDate};
      const view2 = {name: secondView.name, status: "AVAILABLE", createdAt:''};
      const expectedUpsertItems = [createExpectedDataset([view1, view2])];
      const expectedSecondStructure = { ...expectedStructure, name: secondView.name, id: secondView.name };
      const expectedSecondMetadata = { ...expectedMetadata, name: secondView.name };
      delete expectedSecondMetadata.createdAt;
      s3.getFile.mockResolvedValueOnce({ views: [sampleInput, secondView] });
      viewService.createUpdatedViews.mockResolvedValueOnce([expectedMetadata, expectedSecondMetadata]);
      viewService.createUpdatedDatasets.mockResolvedValueOnce(expectedUpsertItems);
      remediationService.saveRemediations.mockResolvedValue(['view-1']);

      await metastoreService.processViews(storageLocation);

      expect(viewService.createUpdatedViews).toBeCalledWith([sampleInput, secondView], [expect.objectContaining(createTestDataset())]);
      expect(datasetService.saveDatasets).toBeCalledWith(expectedUpsertItems);
      expect(metastoreDao.saveMetaDataStructure).toBeCalledWith(expectedStructure);
      expect(metastoreDao.saveMetaDataStructure).toBeCalledWith(expectedSecondStructure);
      expect(metastoreDao.saveViewMetadatas).toBeCalledWith([expectedMetadata, expectedSecondMetadata]);
    });

    it('should reject view if structure is not valid', async () => {
      const alteredViewStructure = { ...sampleViewStructure };
      delete alteredViewStructure.documentation;
      const alteredInput = {...sampleInput, structure: alteredViewStructure};
      const error = [{id: alteredInput.name, status: 'Invalid structure'}];
      schemaValidationService.validateDiscoveredSchemas.mockReturnValue(error);
      s3.getFile.mockResolvedValueOnce({ views: [alteredInput] });

      const result = await metastoreService.processViews(storageLocation);

      expect(result).toEqual(error);
    });

    it('should reject view if missing view name', async () => {
      const error = [{id: '', status: 'A metadata name, structure, and list of related environment names are required to save.'}];
      const alteredInput = { ...sampleInput };
      delete alteredInput.name;
      s3.getFile.mockResolvedValueOnce({ views: [alteredInput] });

      const result = await metastoreService.processViews(storageLocation);

      expect(result).toEqual(error);
    });

    it('should reject view if no datasets are included', async () => {
      const alteredInput = { ...sampleInput };
      delete alteredInput.environmentNames;
      const error = [{id: alteredInput.name, status: 'A metadata name, structure, and list of related environment names are required to save.'}];
      s3.getFile.mockResolvedValueOnce({ views: [alteredInput] });

      const result = await metastoreService.processViews(storageLocation);

      expect(result).toEqual(error);
    });

    it('should reject view if no structure is included', async () => {
      const alteredInput = { ...sampleInput };
      delete alteredInput.structure;
      const error = [{id: alteredInput.name, status: 'A metadata name, structure, and list of related environment names are required to save.'}];
      s3.getFile.mockResolvedValueOnce({ views: [alteredInput] });

      const result = await metastoreService.processViews(storageLocation);

      expect(result).toEqual(error);
    });

    it('should throw an error if dao calls fail', async () => {
      const error = new Error('Boom');
      datasetService.saveDatasets.mockRejectedValueOnce(error);
      s3.getFile.mockResolvedValueOnce({views: [sampleInput]});

      await expect(metastoreService.processViews(storageLocation)).rejects.toThrow('An unexpected error occurred when saving metadata.');
    });

    it('should throw an error if related datasets are not found', async () => {
      datasetDao.getLatestDatasets.mockResolvedValueOnce([]);
      const error = [{id: sampleInput.name, status: 'No datasets found for given environment names.'}];
      s3.getFile.mockResolvedValueOnce({views: [sampleInput]});

      const result = await metastoreService.processViews(storageLocation);

      expect(result).toEqual(error);
    });

    it('should get views for a dataset and return only AVAILABLE and DRIFTED views', async () => {
      metastoreDao.getViewsForDataset.mockResolvedValueOnce([{name: 'some view', status: 'AVAILABLE'}, {name: 'some deleted view', status: 'DELETED'}, {name: 'some drifted view', status: 'DRIFTED'}]);

      const results = await metastoreService.getViews(datasetId);

      expect(metastoreDao.getViewsForDataset).toHaveBeenCalledWith(datasetId);
      expect(results).toEqual([{name: 'some view', status: 'AVAILABLE'}, {name: 'some drifted view', status: 'DRIFTED'}]);
    });

    it('should get all available and drifted views', async () => {
        const deletedView = { name: 'some-deleted-view', datasetId, status: 'DELETED' };
        const availableView = { name: 'some-view', datasetId, status: 'AVAILABLE' };
        const driftedView = { name: 'some-drifted-view', datasetId, status: 'DRIFTED' };

        metastoreDao.getAllViews.mockResolvedValueOnce([deletedView, availableView, driftedView]);
        const results = await metastoreService.getAllViews();

        expect(results).toEqual(['some-view', 'some-drifted-view']);
    });

    it('should handle error when getting views for a dataset', async () => {
      metastoreDao.getViewsForDataset.mockRejectedValueOnce(new Error('Boom'));

      await expect(metastoreService.getViews(datasetId)).rejects.toThrow('Boom');
    });


    it('should add a table', async () => {
      s3.getFile.mockResolvedValueOnce({ tables: [sampleTableInput] });

      const result = await metastoreService.addTables(storageLocation);

      expect(result).toEqual(successfulTableResponse);
      expect(datasetService.saveDatasets).toBeCalledWith([createExpectedTableDataset([sampleTableInput.name])]);
      expect(metastoreDao.saveMetaDataStructure).toBeCalledWith(expectedTableStructure);
      expect(metastoreDao.saveTableMetadatas).toBeCalledTimes(1);
      expect(metastoreDao.saveTableMetadatas).toBeCalledWith([expectedTableMetadata]);
    })

    it('should handle an s3 failure', async () => {
      const error = 'Access denied.';
      s3.getFile.mockRejectedValueOnce(error);

      await expect(metastoreService.addTables('someLocation')).rejects.toThrow('An unexpected error occurred retrieving discovered metadata from S3.');
    });

    it('should process all valid tables and return failed tables', async () => {
      const invalidInput = {...sampleTableInput};
      delete invalidInput.name;
      const error = {id: '', status: 'A metadata name, structure, and list of related environment names are required to save.'};
      s3.getFile.mockResolvedValueOnce({tables: [sampleTableInput, invalidInput] });

      const result = await metastoreService.addTables(storageLocation);

      expect(result).toEqual([error, ...successfulTableResponse]);
      expect(datasetService.saveDatasets).toBeCalledWith([createExpectedTableDataset([sampleTableInput.name])]);
      expect(metastoreDao.saveMetaDataStructure).toBeCalledTimes(1);
      expect(metastoreDao.saveMetaDataStructure).toBeCalledWith(expectedTableStructure);
      expect(metastoreDao.saveTableMetadatas).toBeCalledTimes(1);
      expect(metastoreDao.saveTableMetadatas).toBeCalledWith([expectedTableMetadata]);
    });
  });
  describe('getDatasetsForViews Tests', () => {
  it('should get tables for a dataset and return only names.', async () => {
      metastoreDao.getTablesForDataset.mockResolvedValueOnce([{name: 'some table'}]);

      const results = await metastoreService.getTables(datasetId);

      expect(metastoreDao.getTablesForDataset).toHaveBeenCalledWith(datasetId);
      expect(results).toEqual(['some table'])
    });

    it('should get all tables details', async () => {
      metastoreDao.getAllTables.mockResolvedValueOnce([{datasetId: "some dataset id", name: 'some table', updatedAt: isoDate}]);

      const results = await metastoreService.getAllTables();

      expect(metastoreDao.getAllTables).toHaveBeenCalled;
      expect(results).toEqual([{datasetId: "some dataset id", name: 'some table', updatedAt: isoDate}])
    });

    it('should update the previously associated tables when updating a dataset', async () => {
      const alteredDataset = {...createTestDataset(), discoveredTables: ['edl.some_other_table']};
      datasetDao.getLatestDatasets.mockResolvedValueOnce([alteredDataset]);

      const alteredTable = {...sampleTableInput};
      alteredTable.name = 'edl.some_other_table2';
      const expectedTables = [sampleTableInput.name, alteredTable.name];

      s3.getFile.mockResolvedValueOnce({ tables: [sampleTableInput, alteredTable] });

      const result = await metastoreService.addTables(storageLocation);

      expect(result).toHaveLength(2);
      expect(datasetService.saveDatasets).toBeCalledWith([createExpectedTableDataset(expectedTables)]);
      expect(metastoreDao.saveMetaDataStructure).toBeCalledWith(expectedTableStructure);
    });
  });

   it('should get databases for a table', async () => {
     const anyTable = 'anyTable';
     const edlDb = 'edl_dev';
     const edlCurrent = 'edl_current_dev';

     when(metastoreDao.getMetastore).calledWith(edlDb, anyTable).mockResolvedValue(edlDb);
     when(metastoreDao.getMetastore).calledWith(edlCurrent, anyTable).mockResolvedValue(edlCurrent);

     const actualDatabases  = await metastoreService.getMetastore(anyTable);
     expect(actualDatabases).toHaveLength(2);
     expect(actualDatabases).toContain(edlDb);
     expect(actualDatabases).toContain(edlCurrent);
   });

  it('should get a database for a table', async () => {
    const anyTable = 'anyTable';
    const edlDb = 'edl_dev';
    const edlCurrent = 'edl_current_dev';

    when(metastoreDao.getMetastore).calledWith(edlDb, anyTable).mockResolvedValue(edlDb);
    when(metastoreDao.getMetastore).calledWith(edlCurrent, anyTable).mockResolvedValue(undefined);

    const actualDatabases  = await metastoreService.getMetastore(anyTable);
    expect(actualDatabases).toHaveLength(1);
    expect(actualDatabases).toContain(edlDb);
  });

  it('no databases for a table', async () => {
    metastoreDao.getMetastore.mockResolvedValue(undefined);
     const actualDatabases  = await metastoreService.getMetastore('anyTable');
     expect(actualDatabases).toHaveLength(0);
   });

});
