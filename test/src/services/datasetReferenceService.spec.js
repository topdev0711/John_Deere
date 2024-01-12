/**
 * @jest-environment node
 */

const datasetReferenceService = require('../../../src/services/datasetReferenceService');
const datasetService = require('../../../src/services/datasetService');
const viewService = require('../../../src/services/viewService');
const tableService = require('../../../src/services/tableService');

jest.mock('../../../src/services/datasetService');
jest.mock('../../../src/services/viewService');
jest.mock('../../../src/services/tableService');

describe('datasetReferenceService Tests', () => {
  describe('getReferencedDatasets Tests', () => {
    const dataset1Id = 'dataset1-id';
    const dataset2Id = 'dataset2-id';
    const dataset1EnvName = 'dataset1-env-name';
    const dataset2EnvName = 'dataset2-env-name';
    const dataset1 = {
      id: dataset1Id,
      environmentName: dataset1EnvName
    };
    const dataset2 = {
      id: dataset2Id,
      environmentName: dataset2EnvName
    };

    it('should return datasets for paths if found', async () => {
      const dataset1StorageLocation = 'jd-us01-edl-bucket1';
      const dataset2StorageLocation = 'jd-us01-edl-bucket2';
      const path1 = `${dataset1StorageLocation}-d/subfolder`;
      const path2 = `${dataset2StorageLocation}/subfolder`;
      const path3 = 'not-an-edl-path';
      const metadata = {
        paths: [path1, path2, path3]
      };
      dataset1.storageLocation = dataset1StorageLocation;
      dataset2.storageLocation = dataset2StorageLocation;
      const datasets = [dataset1, dataset2];
      const expected = {
        tables: [],
        views: [],
        paths: [
          {
            name: path1,
            datasets: [{ datasetId: dataset1Id, datasetEnvironmentName: dataset1EnvName }]
          },
          {
            name: path2,
            datasets: [{ datasetId: dataset2Id, datasetEnvironmentName: dataset2EnvName }]
          },
          {
            name: path3,
            datasets: []
          }
        ]
      };
      datasetService.getLatestDatasets.mockResolvedValue(datasets);

      const actual = await datasetReferenceService.getReferencedDatasets(metadata);

      expect(actual).toEqual(expected);
    });

    it('should return datasets for views if found', async () => {
      const view1 = 'db.some_edl_view';
      const view2 = 'db.not_an_edl_view';
      const metadata = {
        views: [view1, view2]
      };
      const datasets = [dataset1, dataset2];
      const datasetIds = [dataset1Id, dataset2Id];
      const expected = {
        tables: [],
        paths: [],
        views: [
          {
            name: view1,
            datasets: [
              { datasetId: dataset1Id, datasetEnvironmentName: dataset1EnvName },
              { datasetId: dataset2Id, datasetEnvironmentName: dataset2EnvName }
            ]
          },
          {
            name: view2,
            datasets: []
          }
        ]
      };
      datasetService.getLatestDatasets.mockResolvedValue(datasets);
      viewService.getDatasetsForView.mockResolvedValueOnce(datasetIds);
      viewService.getDatasetsForView.mockResolvedValueOnce([]);
      datasetService.availableDatasetIds.mockResolvedValueOnce(datasetIds);
      datasetService.availableDatasetIds.mockResolvedValueOnce([]);

      const actual = await datasetReferenceService.getReferencedDatasets(metadata);

      expect(viewService.getDatasetsForView).toHaveBeenCalledTimes(2);
      expect(viewService.getDatasetsForView).toHaveBeenNthCalledWith(1, view1);
      expect(viewService.getDatasetsForView).toHaveBeenNthCalledWith(2, view2);
      expect(actual).toEqual(expected);
    });

    it('should return datasets for discovered tables if found', async () => {
      const table1 = 'db.some_edl_table';
      const table2 = 'db.not_an_edl_table';
      const metadata = {
        tables: [table1, table2]
      };
      const expected = {
        views: [],
        paths: [],
        tables: [
          {
            name: table1,
            datasets: [{ datasetId: dataset1Id, datasetEnvironmentName: dataset1EnvName }]
          },
          {
            name: table2,
            datasets: []
          }
        ]
      };
      datasetService.getLatestDatasets.mockResolvedValue([dataset1]);
      tableService.getDatasetsForTable.mockResolvedValueOnce([dataset1Id]);
      tableService.getDatasetsForTable.mockResolvedValueOnce([]);
      datasetService.availableDatasetIds.mockResolvedValueOnce([dataset1Id]);
      datasetService.availableDatasetIds.mockResolvedValueOnce([]);

      const actual = await datasetReferenceService.getReferencedDatasets(metadata);

      expect(tableService.getDatasetsForTable).toHaveBeenCalledTimes(2);
      expect(tableService.getDatasetsForTable).toHaveBeenNthCalledWith(1, table1);
      expect(tableService.getDatasetsForTable).toHaveBeenNthCalledWith(2, table2);
      expect(actual).toEqual(expected);
    });

    it('should return datasets for enhance tables if found', async () => {
      const enhanceTable1 = 'some_edl_table';
      const enhanceTable2 = 'not_an_edl_table';
      const table1 = `edl.${enhanceTable1}`;
      const table2 = `edl.${enhanceTable2}`;
      const metadata = {
        tables: [table1, table2]
      };
      const enhanceDatasetDetails = {
        datasetId: 'some-dataset-id',
        datasetEnvironmentName: 'some-dataset-name',
        schemaId: 'some-schema-id',
        schemaEnvironmentName: 'some-schema-name'
      };
      const expected = {
        views: [],
        paths: [],
        tables: [
          {
            name: table1,
            datasets: [enhanceDatasetDetails]
          },
          {
            name: table2,
            datasets: []
          }
        ]
      };
      datasetService.getLatestDatasets.mockResolvedValue([]);
      tableService.getDatasetForEnhanceTable.mockReturnValueOnce(enhanceDatasetDetails);
      tableService.getDatasetForEnhanceTable.mockReturnValueOnce({ datasetId: null });
      
      const actual = await datasetReferenceService.getReferencedDatasets(metadata);

      expect(tableService.getDatasetForEnhanceTable).toHaveBeenCalledTimes(2);
      expect(tableService.getDatasetForEnhanceTable).toHaveBeenNthCalledWith(1, enhanceTable1, []);
      expect(tableService.getDatasetForEnhanceTable).toHaveBeenNthCalledWith(2, enhanceTable2, []);
      expect(actual).toEqual(expected);
    });
  });
});
