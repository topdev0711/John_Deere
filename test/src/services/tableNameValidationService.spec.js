const tableNameValidationService = require('../../../src/services/tableNameValidationService');
const referenceService = require('../../../src/services/referenceService');
const datasetDao = require('../../../src/data/datasetDao');
const {when, resetAllWhenMocks} = require('jest-when');

jest.mock('../../../src/data/datasetDao');
jest.mock('../../../src/services/referenceService');

describe('table name validation service', () => {
  const phaseId = 'phase-id';

  beforeEach(() => {
    resetAllWhenMocks();
    when(referenceService.getName).calledWith(phaseId).mockResolvedValue('enhance');
  });

  function mockDatasets(datasets) {
    const status = ['PENDING', 'REJECTED', 'APPROVED', 'AVAILABLE'];
    when(datasetDao.getDatasets).calledWith(status).mockResolvedValue(datasets);
  }

  function createSchema(id, name) {
    return { id, name };
  }

  function createTable(schemaId, schemaName, schemaVersion, tableName) {
    return { schemaId, schemaName, schemaVersion, tableName };
  }

  function createDataset(id, tables, schemas) {
    if (!schemas) {
      schemas = tables.map(table => createSchema(table.schemaId, table.schemaName))
    }
    return { id, name: id, phase: phaseId, schemas, tables };
  }

  it('valid new table name', async () => {
    const existingDatasets = [];
    mockDatasets(existingDatasets);
    const dataset = createDataset('dataset-1', [createTable('schema--1', 'schema-name', '1.0.0', 'valid')]);

    const result = await tableNameValidationService.validateTables(dataset);

    expect(result).toBeUndefined();
  });

  it('valid existing table name', async () => {
    const dataset = createDataset('dataset-1', [createTable('schema--1', 'schema-name', '1.0.0', 'valid')]);
    const existingDatasets = [{...dataset}];
    mockDatasets(existingDatasets);

    const result = await tableNameValidationService.validateTables(dataset);

    expect(result).toBeUndefined();
  });

  it('valid table names when just dataset version is updated', async () => {
    const existingDatasets = [
      createDataset('dataset-1', [createTable('schema--1', 'schema-1-name', '1.0.0', 'duplicate-allowed')])
    ];
    mockDatasets(existingDatasets);
    const dataset = createDataset('dataset-1', [
      createTable('schema--2', 'schema-1-name', '1.0.0', 'duplicate-allowed'),
    ]);

    const result = await tableNameValidationService.validateTables(dataset);

    expect(result).toBeUndefined();
  });

  it('duplicate table names across datasets', async () => {
    const existingDatasets = [
      createDataset('dataset-1', [createTable('schema--1', 'schema-1-name', '1.0.0', 'duplicate')])
    ];
    mockDatasets(existingDatasets);
    const dataset = createDataset('dataset-2', [createTable('schema-2', 'schema-2-name', '1.0.0', 'duplicate')]);

    const error = await tableNameValidationService.validateTables(dataset);

    expect(error.details).toContainEqual({ name: 'Invalid table names:', message: 'The table name "duplicate" is already being used in another dataset.' });
  });

  it('duplicate table names across datasets ignorning version', async () => {
    const existingDatasets = [
      createDataset('dataset-1', [createTable('schema--1', 'schema-1-name', '1.0.0', 'duplicate')])
    ];
    mockDatasets(existingDatasets);
    const dataset = createDataset('dataset-2', [createTable('schema-2', 'schema-2-name', '2.0.0', 'duplicate')]);

    const error = await tableNameValidationService.validateTables(dataset);

    expect(error.details).toContainEqual({ name: 'Invalid table names:', message: 'The table name "duplicate" is already being used in another dataset.' });
  });

  it('duplicate table names within dataset', async () => {
    const existingDatasets = [];
    mockDatasets(existingDatasets);
    const dataset = createDataset('dataset-1', [createTable('schema--1', 'schema-1-name', '1.0.0', 'duplicate'), createTable('schema-2', 'schema-2-name', '1.0.0', 'duplicate')])

    const error = await tableNameValidationService.validateTables(dataset);

    expect(error.details).toContainEqual({ name: 'Invalid table names:', message: 'The table name "duplicate_1_0_0" is already being used.' });
  });

  it('table names are not allowed for raw dataset', async () => {
    referenceService.getName.mockResolvedValue('raw');

    const existingDatasets = [];
    mockDatasets(existingDatasets);
    const dataset = createDataset('dataset-1', [createTable('schema--1', 'schema-name', '1.0.0', 'invalid_phase')])

    const error = await tableNameValidationService.validateTables(dataset);

    expect(error.details).toContainEqual({ name: 'Invalid table names:', message: 'Dataset dataset-1 cannot have table names since the phase is not enhance' });
  });

  it('schema versions have mismatching table names', async () => {
    const existingDatasets = [];
    mockDatasets(existingDatasets);
    const schema1 = createSchema('schema--1', 'same-name');
    const schema2 = createSchema('schema--2', 'same-name');
    const table1 = createTable(schema1.id, schema1.name, '1.0.0', 'one');
    const table2 = createTable(schema2.id, schema2.name, '2.0.0', 'two');
    const dataset = createDataset('dataset-1', [table1, table2], [schema1, schema2]);

    const error = await tableNameValidationService.validateTables(dataset);

    expect(error.details).toContainEqual({ name: 'Invalid table names:', message: 'Schemas same-name cannot have different table names across versions.' });
  });

  it('', () => {

  });
});
