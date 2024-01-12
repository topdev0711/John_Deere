const tableService = require('../../../src/services/tableService');
const metastoreDao = require('../../../src/data/metastoreDao');

jest.mock('../../../src/data/metastoreDao');

describe('tableService Tests', () => {
  describe('getDatasetForEnhanceTable Tests', () => {
    const datasetId = 'dataset-id';
    const datasetEnvironmentName = 'dataset-env-name';
    const tableName = 'some_edl_table';
    const schema1Id = 'schema1-id';
    const schema2Id = 'schema2-id';
    const schema1EnvName = 'schema1-env-name';
    const schema2EnvName = 'schema2-env-name';
    const schema1Version = '1.0.0';
    const datasetTable1 = {
      schemaVersion: schema1Version,
      schemaId: schema1Id,
      tableName,
      schemaEnvironmentName: schema1EnvName,
      versionless: false
    };
    const datasetTable2 = {
      schemaVersion: '2.0.0',
      schemaId: schema2Id,
      tableName,
      schemaEnvironmentName: schema2EnvName,
      versionless: true
      };
    const dataset = {
      id: datasetId,
      environmentName: datasetEnvironmentName,
      tables: [datasetTable1, datasetTable2]
    };

    it('should return null for datasetId if table not found', () => {
      const table = 'not_an_edl_table';
      const expected = { datasetId: null };
      
      const actual = tableService.getDatasetForEnhanceTable(table, [dataset]);

      expect(actual).toEqual(expected);
    });

    it('should return details for versioned table', () => {
      const table = `${tableName}_${schema1Version.replace(/\./g, '_')}`;
      const expected = {
        datasetId,
        datasetEnvironmentName,
        schemaId: schema1Id,
        schemaEnvironmentName: schema1EnvName
      };
      
      const actual = tableService.getDatasetForEnhanceTable(table, [dataset]);

      expect(actual).toEqual(expected);
    });

    it('should return details for versionless table', () => {
      const table = tableName;
      const expected = {
        datasetId,
        datasetEnvironmentName,
        schemaId: schema2Id,
        schemaEnvironmentName: schema2EnvName
      };
      
      const actual = tableService.getDatasetForEnhanceTable(table, [dataset]);

      expect(actual).toEqual(expected);
    });
  });

  describe('getDatasetsForTable Tests', () => {
    it('should return empty array if table not found', async () => {
      const table = 'db.not_an_edl_table';
      const expected = [];
      metastoreDao.getTable.mockResolvedValue([]);
      
      const actual = await tableService.getDatasetsForTable(table);

      expect(actual).toEqual(expected);
    });

    it('should return recent datasets only if table found', async () => {
      const table = 'db.some_edl_table';
      const dataset1Id = 'dataset1-id';
      const dataset2Id = 'dataset2-id';
      const datasets = [
        {
          datasetId: dataset1Id,
          name: table,
          updatedAt: '2021-08-20T17:12:01.284Z'
        },
        {
          datasetId: dataset2Id,
          name: table,
          updatedAt: '2021-08-20T16:12:01.284Z'
        },
        {
          datasetId: 'dataset3-id',
          name: table,
          updatedAt: '2021-08-20T16:12:01.283Z'
        }
      ];
      const expected = [dataset1Id, dataset2Id];
      metastoreDao.getTable.mockResolvedValue(datasets);
      
      const actual = await tableService.getDatasetsForTable(table);

      expect(actual).toEqual(expected);
    });
  });
});
