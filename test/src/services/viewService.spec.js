const viewService = require('../../../src/services/viewService');
const metastoreDao = require('../../../src/data/metastoreDao');
const permissionDao = require('../../../src/data/permissionDao');
const datasetDao = require('../../../src/data/datasetDao');
const schemaDao = require('../../../src/data/schemaDao');
const {when} = require('jest-when');

jest.mock('../../../src/data/metastoreDao');
jest.mock('../../../src/data/permissionDao');
jest.mock('../../../src/data/datasetDao');
jest.mock('../../../src/data/schemaDao');

describe('viewService Tests', () => {
  const mockDate = new Date();
  const isoDate = mockDate.toISOString();
  const datasetId = 'some-dataset-id';
  const environmentName = 'some.datatype';
  const viewName = 'some.view';

  const activeView = {
    name: viewName,
    datasetId,
    status: 'AVAILABLE',
    createdAt: isoDate
  };

  const classification = {
    additionalTags: [
      'some-tag',
      'another-tag'
    ],
    development: false,
    personalInformation: false,
    countriesRepresented: [
      { name: 'some-country' },
      { name: 'another-country' }
    ],
    community: { name: 'some-community' },
    subCommunity: { name: 'some-subcommunity' },
    gicp: { name: 'some-classification' }
  };

  const datasetWithView = {
    id: datasetId,
    environmentName,
    status: 'AVAILABLE',
    classifications: [classification],
    views: [viewName]
  };

  const discoveredView = {
    name: viewName,
    environmentNames: [environmentName]
  };

  const permissions = [
    {
      name: "entitlements permission"
    },
    {
      name: "empty views permission",
      views: []
    },
    {
      name: "views permission",
      views: [viewName]
    }
  ];

  const expectedView = {
    name: discoveredView.name,
    updatedAt: isoDate,
    createdAt: isoDate,
    datasetId,
    status: 'AVAILABLE',
    driftDetails: {}
  };

  beforeEach(() => {
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    metastoreDao.getAllViews.mockResolvedValue([]);
    permissionDao.getLatestPermissions.mockResolvedValue([]);
  });

  describe('getActiveDatasetsForView Tests', () => {
    it('should only get datasets that are still referenced by a view', async () => {
      const name = 'someview';
      const providedDatasets = [
        {datasetId: 'someDataset', status: 'AVAILABLE'},
        {datasetId: 'someOtherDataset', status: 'DELETED'}
      ];
      const expectedDatasets = ['someDataset'];
      metastoreDao.getView.mockResolvedValueOnce(providedDatasets);

      const datasets = await viewService.getActiveDatasetsForView(name);

      expect(datasets).toEqual(expectedDatasets);
      expect(metastoreDao.getView).toBeCalledWith(name);
    });

    it('should throw an error if dao call fails', async () => {
      const name = 'someview';
      const error = new Error('Boom');
      metastoreDao.getView.mockRejectedValueOnce(error);

      await expect(viewService.getActiveDatasetsForView(name)).rejects.toThrow(`An unexpected error occurred when getting dataset for view ${name}`);
    });
  });

  describe('createUpdatedViews tests', () => {
    it('should set view status to DELETED if not present in current views', async () => {
      const currentViews = [];
      metastoreDao.getAllViews.mockResolvedValueOnce([activeView]);
      const updatedView = { ...activeView, status: 'DELETED', updatedAt: isoDate, driftDetails: {} };

      const result = await viewService.createUpdatedViews(currentViews, [datasetWithView]);

      expect(result).toEqual([updatedView]);
    });

    it('should create a new view with status of AVAILABLE', async () => {
      const dataset = { id: datasetId, environmentName };

      const result = await viewService.createUpdatedViews([discoveredView], [dataset]);

      expect(result).toEqual([expectedView]);
    });

    it('should set status of view without permissions to AVAILABLE(new) and DELETED(old) when dataset is replaced', async () => {
      const otherEnvironmentName = 'some.other.datatype';
      const otherDataset = { id: 'other-id', environmentName: otherEnvironmentName };
      const alteredInput = { ...discoveredView, environmentNames: [otherEnvironmentName] };
      metastoreDao.getAllViews.mockResolvedValueOnce([activeView]);
      const oldView = { ...activeView, status: 'DELETED', updatedAt: isoDate, driftDetails: {} };
      const newView = { ...activeView, datasetId: 'other-id', status: 'AVAILABLE', updatedAt: isoDate, driftDetails: {} };

      const result = await viewService.createUpdatedViews([alteredInput], [datasetWithView, otherDataset]);

      expect(result).toEqual([newView, oldView]);
    });

    it('should set status of view with permissions to AVAILABLE(new) and DELETED(old) when dataset is replaced if classifications match', async () => {
      const otherEnvironmentName = 'some.other.datatype';
      const otherClassification = {
        additionalTags: [
          'Another-tag',
          'Some-tag'
        ],
        development: false,
        personalInformation: false,
        countriesRepresented: [
          { name: 'Another-country' },
          { name: 'Some-country' }
        ],
        community: { name: 'Some-community' },
        subCommunity: { name: 'Some-subcommunity' },
        gicp: { name: 'Some-classification' }
      };
      const otherDataset = {
        id: 'other-id',
        environmentName: otherEnvironmentName,
        status: 'AVAILABLE',
        classifications: [otherClassification]
      };
      const alteredInput = { ...discoveredView, environmentNames: [otherEnvironmentName] };
      metastoreDao.getAllViews.mockResolvedValueOnce([activeView]);
      permissionDao.getLatestPermissions.mockResolvedValueOnce(permissions);
      const oldView = { ...activeView, status: 'DELETED', updatedAt: isoDate, driftDetails: {} };
      const newView = { ...activeView, datasetId: 'other-id', status: 'AVAILABLE', updatedAt: isoDate, driftDetails: {} };

      const result = await viewService.createUpdatedViews([alteredInput], [datasetWithView, otherDataset]);

      expect(result).toEqual([newView, oldView]);
    });

    it('should set status of view with permissions to DRIFTED when new dataset is added if classifications do not match', async () => {
      const otherEnvironmentName = 'some.other.datatype';
      const otherClassification = {
        additionalTags: [
          'another-tag',
          'some-tag'
        ],
        development: false,
        personalInformation: false,
        countriesRepresented: [
          { name: 'another-country' },
          { name: 'some-country' }
        ],
        community: { name: 'another-community' },
        subCommunity: { name: 'another-subcommunity' },
        gicp: { name: 'some-classification' }
      };
      const otherDataset = {
        id: 'other-id',
        environmentName: otherEnvironmentName,
        status: 'AVAILABLE',
        classifications: [classification, otherClassification]
      };
      const alteredInput = { ...discoveredView, environmentNames: [environmentName, otherEnvironmentName] };
      metastoreDao.getAllViews.mockResolvedValueOnce([activeView]);
      permissionDao.getLatestPermissions.mockResolvedValueOnce(permissions);
      const driftDetails = {
        type: 'dataset',
        items: [otherDataset.id]
      };
      const updatedView = { ...activeView, status: 'DRIFTED', updatedAt: isoDate, driftDetails };

      const result = await viewService.createUpdatedViews([alteredInput], [datasetWithView, otherDataset]);

      expect(result).toEqual([updatedView]);
    });

    it('should set a previously deleted view status to AVAILABLE if present in current views', async () => {
      const dataset = { id: datasetId, environmentName };
      const deletedView = {
        name: viewName,
        datasetId,
        status: 'DELETED',
        createdAt: isoDate
      };
      metastoreDao.getAllViews.mockResolvedValueOnce([deletedView]);
      const updatedView = { ...deletedView, status: 'AVAILABLE', updatedAt: isoDate, driftDetails: {} };

      const result = await viewService.createUpdatedViews([discoveredView], [dataset]);

      expect(result).toEqual([updatedView]);
    });

    it('should set a previously drifted view status to AVAILABLE if datasets removed', async () => {
      const dataset = { id: datasetId, environmentName };
      const driftedView = {
        name: viewName,
        datasetId,
        status: 'DRIFTED',
        createdAt: '2021-01-01',
        updatedAt: '2021-01-01',
        driftDetails: {
          type: 'dataset',
          items: ['other-id']
        }
      };
      metastoreDao.getAllViews.mockResolvedValueOnce([driftedView]);
      permissionDao.getLatestPermissions.mockResolvedValueOnce(permissions);
      const updatedView = { ...driftedView, status: 'AVAILABLE', updatedAt: isoDate, driftDetails: {} };

      const result = await viewService.createUpdatedViews([discoveredView], [dataset]);

      expect(result).toEqual([updatedView]);
    });
  });

  describe('getViewsWithStatus tests', () => {
    it('should get AVAILABLE status for view if present', async () => {
      const multipleStatuses = [
        { datasetId: 'some-dataset', status: 'DELETED' },
        { datasetId: 'another-dataset', status: 'AVAILABLE' }
      ];
      metastoreDao.getView.mockResolvedValueOnce(multipleStatuses);

      const results = await viewService.getViewsWithStatus(['some-view']);

      expect(metastoreDao.getView).toHaveBeenCalledWith('some-view');
      expect(results).toEqual([{ name: 'some-view', status: 'AVAILABLE' }]);
    });

    it('should get DRIFTED status for view if present', async () => {
      const driftedStatus = [
        { datasetId: 'some-dataset', status: 'DRIFTED' },
        { datasetId: 'another-dataset', status: 'DRIFTED' }
      ];
      metastoreDao.getView.mockResolvedValueOnce(driftedStatus);

      const results = await viewService.getViewsWithStatus(['some-view']);

      expect(metastoreDao.getView).toHaveBeenCalledWith('some-view');
      expect(results).toEqual([{ name: 'some-view', status: 'DRIFTED' }]);
    });

    it('should get DELETED status for view if AVAILABLE and DRIFTED not present', async () => {
      const deletedStatus = [{ datasetId: 'some-dataset', status: 'DELETED' }];
      metastoreDao.getView.mockResolvedValueOnce(deletedStatus);

      const results = await viewService.getViewsWithStatus(['some-view']);

      expect(metastoreDao.getView).toHaveBeenCalledWith('some-view');
      expect(results).toEqual([{ name: 'some-view', status: 'DELETED' }]);
    });
  });

  describe('getDatasetsForView Tests', () => {
    it('should return empty array if view not found', async () => {
      const view = 'db.not_an_edl_view';
      const expected = [];
      metastoreDao.getView.mockResolvedValue([]);
      
      const actual = await viewService.getDatasetsForView(view);

      expect(actual).toEqual(expected);
    });

    it('should not return datasets deleted from view', async () => {
      const view = 'db.some_edl_view';
      const dataset1Id = 'dataset1-id';
      const datasets = [
        {
          datasetId: dataset1Id,
          name: view,
          status: 'AVAILABLE',
          driftDetails: {}
        },
        {
          datasetId: 'dataset2-id',
          name: view,
          status: 'DELETED',
          driftDetails: {}
        }
      ];
      const expected = [dataset1Id];
      metastoreDao.getView.mockResolvedValue(datasets);
      
      const actual = await viewService.getDatasetsForView(view);

      expect(actual).toEqual(expected);
    });

    it('should return drifted datasets for drifted view', async () => {
      const view = 'db.some_edl_view';
      const dataset1Id = 'dataset1-id';
      const driftedDataset1Id = 'drifted-dataset1-id';
      const driftedDataset2Id = 'drifted-dataset2-id';
      const datasets = [
        {
          datasetId: dataset1Id,
          name: view,
          status: 'DRIFTED',
          driftDetails: {
            items: [driftedDataset1Id, driftedDataset2Id]
          }
        }
      ];
      const expected = [dataset1Id, driftedDataset1Id, driftedDataset2Id];
      metastoreDao.getView.mockResolvedValue(datasets);
      
      const actual = await viewService.getDatasetsForView(view);

      expect(actual).toEqual(expected);
    });
  });

  describe('getFullDatasetsForView Test', () => {
    it('should only return details for datasets that are not deleted', async() => {
      const viewRecords = [
        { datasetId: '1', name: 'someview' },
        { datasetId: '2', name: 'someview' }
      ];
      const dataset = { id: '1', status: 'AVAILABLE', version: 1 };
      metastoreDao.getView.mockResolvedValueOnce(viewRecords);
      datasetDao.getLatestDataset.mockReturnValueOnce(dataset);
      datasetDao.getLatestDataset.mockReturnValueOnce(undefined);
  
      const actual = await viewService.getFullDatasetsForView('someview');

      expect(datasetDao.getLatestDataset).toHaveBeenCalledTimes(2);
      expect(actual).toEqual([dataset]);
    });
  });

  describe('getViewDetails Test', () => {
    const sampleView = { 
      id: 'someview',
      name: 'someview',
      isDynamic: true,
      version: 0,
      description: 'someview description',
      fields: [
      ],
      datasetId: 'someDataset'
    };

    const expectedViewDetails = {
      name: 'someview',
      description: 'someview description',
      isDynamic: true,
      fields: [],
      datasets: [
        {
          id: 'someDataset',
          name: 'someDataset',
          phase: 'Enhance',
          version: 1
        }
      ]
    };

    it('should get view details for a view', async () => {
      const name = 'someview';
      const providedDatasets = [
        {datasetId: 'someDataset', status: 'AVAILABLE', name: 'someview'},
        {datasetId: 'someOtherDataset', status: 'DELETED', name: 'someview'}
      ];

      schemaDao.getSchema.mockReturnValue(sampleView);
      metastoreDao.getView.mockReturnValue(providedDatasets);
      datasetDao.getLatestDataset.mockReturnValue({status: 'AVAILABLE', version: 1, id: 'someDataset', name: 'someDataset', phase: 'Enhance'});

      const viewDetails = await viewService.getViewDetails(name);
  
      expect(viewDetails).toEqual(expectedViewDetails);
      expect(metastoreDao.getView).toBeCalledWith(name);
      expect(schemaDao.getSchema).toBeCalledWith(name);

  });

    it('should handle unexpected errors', async () => {
      const error = 'boom';
      schemaDao.getSchema.mockRejectedValueOnce(error);
  
      await expect(viewService.getViewDetails('someview')).rejects.toThrow('An unexpected error occurred when getting details for view someview');
    });
  });

  describe('getViewAvailability Test', () => {

    
    it('should return false if view status  is DRIFTED', async () => {
      const sampleViews = [
        {
          datasetId: 'datasetId-1',
          name: 'view-name',
          driftDetails: {
            type: 'dataset',
            items: ['drifted-datasetId1']
          },
          updatedAt: '2018-07-02T07:56:47.007Z',
          status: 'DRIFTED'
        }
      ];
      datasetDao.getLatestDataset.mockReturnValue({
          status: 'AVAILABLE', 
          version: 1, 
          id: 'datasetId-1', 
          name: 'datasetId-1',
          classifications: [{
            community: { id: "a521b7d4-642c-4524-9c46-e4fa5e836a17" }
          }]

        });
      when(metastoreDao.getView).calledWith('view-name').mockResolvedValue(sampleViews);
      const result = await viewService.getViewAvailability('view-name');
      expect(result).toEqual(false);
    });
    it('should return true if view status  is AVAILABLE', async () => {
      const sampleViews = [
        {
          datasetId: 'datasetId-1',
          name: 'view-name',
          driftDetails: {
          },
          updatedAt: '2018-07-02T07:56:47.007Z',
          status: 'AVAILABLE'
        }
      ];
      when(metastoreDao.getView).calledWith('view-name').mockResolvedValue(sampleViews);
      const result = await viewService.getViewAvailability('view-name');
      expect(result).toEqual(true);
    });

    it('should return true if view not part of toggled communites', async () => {
      const sampleViews = [
        {
          datasetId: 'datasetId-1',
          name: 'view-name',
          driftDetails: {
          },
          updatedAt: '2018-07-02T07:56:47.007Z',
          status: 'AVAILABLE'
        }
      ];
      datasetDao.getLatestDataset.mockReturnValue({
        status: 'AVAILABLE', 
        version: 1, 
        id: 'datasetId-1', 
        name: 'datasetId-1',
        classifications: [{
          community: { id: "a521b7d4-642c-4524-9c46-e4fa5e836a17" }
        },
        {
          subCommunity: { id: "d08c1ca6-0f01-4c77-a127-85c844ec5aa2" }
        }
      ]

      });
      when(metastoreDao.getView).calledWith('view-name').mockResolvedValue(sampleViews);
      const result = await viewService.getViewAvailability('view-name');
      expect(result).toEqual(true);
    });

    it('should return false if view does not exist', async () => {
      when(metastoreDao.getView).calledWith('view-name').mockResolvedValue([]);
      const result = await viewService.getViewAvailability('view-name');
      expect(result).toEqual(false);
    });

    it('should handle unexpected errors', async () => {
      const error = 'boom';
      metastoreDao.getView.mockRejectedValueOnce(error);
  
      await expect(viewService.getViewAvailability('view-name')).rejects.toThrow('An unexpected error occurred when getting details for view view-name.');
    });

    it('Should not fail if view is passed for Get Full Details for View', async() => {
      //given
      const view = {
        name: 'fake-view-name',
        version: '1.0.0',
        id: 'fake-view-id',
        status: 'AVAILABLE',
        datasetId: 'fake-dataset-id-1'
      };

      const dataset = {
        id: 'fake-dataset-id-1',
        name: 'fake-dataset-name'
      }
      when(metastoreDao.getView).calledWith('fake-view-name').mockResolvedValue([view]);
      when(datasetDao.getLatestDataset).calledWith('fake-dataset-id-1', ['AVAILABLE', 'PENDING', 'APPROVED', 'REJECTED']).mockResolvedValue(dataset);
      //when
      const datasets = await viewService.getFullDatasetsForView(view);
      //then
      expect(datasets[0]).toEqual(dataset);
    });
  });
});
