import { getTables } from '../../../../apis/metastore';
import MetastoreTables from '../../../../components/datasets/details/MetastoreTables';
import {mount} from 'enzyme';
import {waitFor} from '@testing-library/react';

jest.mock('../../../../apis/metastore');

describe('MetastoreTables tests', () => {
  it('should display no edl tables when api call returns no tables', async () => {
    getTables.mockResolvedValue([]);
    const noTablesText = 'No tables defined in metastore'
    const anySchemaId = 'anySchemaId';
    const expectedTable = { schemaId: anySchemaId, tableName: 'table1', versionless: true};

    const wrapper = mount(<MetastoreTables schemaId={anySchemaId} tables={[expectedTable]} />);
    await waitFor(() => expect(getTables).toHaveBeenCalledTimes(1));
    expect(getTables).toHaveBeenCalledWith(expectedTable);
    wrapper.update();
    const actualText = wrapper.find('div').filterWhere(div => div.props().id === 'no-tables').text();
    expect(actualText).toContain(noTablesText);
  });
  it('should display loading tables when api call is running', async () => {
    getTables.mockResolvedValue([]);
    const loadingTablesText = 'Loading...'
    const anySchemaId = 'anySchemaId';
    const expectedTable = { schemaId: anySchemaId, tableName: 'table1', versionless: true};

    const wrapper = mount(<MetastoreTables schemaId={anySchemaId} tables={[expectedTable]} />);
    const actualText = wrapper.find('div').filterWhere(div => div.props().id === 'loading-tables').text();
    expect(actualText).toContain(loadingTablesText);
    await waitFor(() => expect(getTables).toHaveBeenCalledTimes(1));
  });

  it('should display tables', async () => {
    const expectedTables = ['edl.table', 'edl_current.table'];
    getTables.mockResolvedValue(expectedTables);
    const anySchemaId = 'anySchemaId';
    const expectedTable = { schemaId: anySchemaId, tableName: 'table1', versionless: true };
    const wrapper = mount(<MetastoreTables schemaId={anySchemaId} tables={[expectedTable]} />);
    await waitFor(() => expect(getTables).toHaveBeenCalledTimes(1));
    wrapper.update();
    expect(getTables).toHaveBeenCalledWith(expectedTable);
    const metastoreDiv = wrapper.find('ul').filterWhere(ul => ul.props().id === 'metastore-tables-list');

    const tableRecords = metastoreDiv.find('CopyableText');
    expect(tableRecords).toHaveLength(2);
    const actualTables = tableRecords.map(table => table.prop('children'));
    expect(actualTables).toContain('edl.table');
    expect(actualTables).toContain('edl_current.table');
  });

  it('has tables but not for selected schema, then are no tables displayed', async () => {
    const anySchemaId = 'anySchemaId';
    const expectedTable = 'table1';
    const anyTables = [{ schemaId: 'anotherSchemaId', tableName: expectedTable, versionless: true }];

    const wrapper = mount(<MetastoreTables schemaId={anySchemaId} tables={anyTables} />);
    await waitFor(() => expect(getTables).toHaveBeenCalledTimes(0));

    const actualText = wrapper.find('div').filterWhere(div => div.props().id === 'no-tables').text();
    const noTablesText = 'No tables defined in metastore'
    expect(actualText).toContain(noTablesText);
  });
});
