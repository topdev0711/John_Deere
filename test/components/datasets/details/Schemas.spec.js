import { Schemas } from '../../../../components/datasets/details/Schemas';
import { mount, shallow } from 'enzyme';
import React from 'react';
import { act, waitFor } from '@testing-library/react';
import {Modal, Nav} from 'react-bootstrap';
import SearchBar from '../../../../components/SearchBar';
import { getDataset } from '../../../../apis/datasets';
global.fetch = require('jest-fetch-mock');

jest.mock('../../../../apis/datasets');

const items = [{
  id: 'foo--1',
  name: 'schema',
  version: '1.0.0',
  description: 'desc',
  documentation: 'docs',
  partitions: [],
  fields: [{
    name: 'field_a',
    datatype: {name: 'int', id: 'int'},
    attribute: {name: 'None', id: 'None'}
  }]
}]

const views = [{
  id: 'schema',
  name: 'schema',
  status: "AVAILABLE"
}]

const datasetIds = ['id']

describe('Schemas component test suite', () => {
  beforeEach(() => fetch.mockResponse(JSON.stringify(datasetIds)));
  afterEach(() => {
    jest.restoreAllMocks();
    fetch.resetMocks();
  });

  it('verify component renders', () => {
    const wrapper = mount(
      <Schemas
        schemas={items}
        tables={[{schemaId: items[0].id, schemaVersion: items[0].version, tableName: 'foo_bar'}]}
        changeDetectedCallback={() => {}}
      />
    )
    expect(wrapper.find(Nav.Link)).toHaveLength(1)
    expect(wrapper).toBeDefined()
  });

  it('verify component renders with diffs', () => {
    const wrapper = mount(
      <Schemas
        schemas={[...items, {...items[0], id: 'id--3'}]}
        prevSchemas={[{...items[0], description: 'desc2', testing: true}, {...items[0], id: 'bar--1'}]}
        changeDetectedCallback={() => {}}
        showDiff
      />
    )
    expect(wrapper.find(Nav.Link)).toHaveLength(3)
    expect(wrapper).toBeDefined()
  });

  it('should only render view related fields if view is passed in', () => {
    const wrapper = shallow(<Schemas schemas={items} isViews={true}/>);

    const [ view ] = items;
    const viewNavLinkText = wrapper.find(Nav.Link).filterWhere(nav => nav.props().id === view.id).text();
    const navTabsText = wrapper.find(Nav).filterWhere(nav => nav.props().id === `${view.id}tabs`).text();
    expect(viewNavLinkText).not.toContain(view.version);
    expect(navTabsText).not.toContain('Documentation')
  });

  it('should render view with Drifted', () => {
    const items = [{
      id: 'view-1',
      name: 'view-1',
      status: 'DRIFTED',
      fields: [{
        name: 'field_a',
        datatype: {name: 'int', id: 'int'},
        attribute: {name: 'None', id: 'None'}
      }]
    }];

    const wrapper = shallow(<Schemas schemas={items} isViews={true}/>);
    const [ view ] = items;
    const viewNavLink = wrapper.find(Nav.Link).filterWhere(nav => nav.props().id === view.id)
    viewNavLink.simulate('click');
    expect(viewNavLink.text()).toContain('Drifted');
  });

  it('should render documentation and version if not a view', () => {
    const wrapper = shallow(<Schemas schemas={items} isViews={false}/>);

    const [ view ] = items;
    const viewNavLinkText = wrapper.find(Nav.Link).filterWhere(nav => nav.props().id === view.id).text();
    const navTabsText = wrapper.find(Nav).filterWhere(nav => nav.props().id === `${view.id}tabs`).text();
    expect(viewNavLinkText).toContain(view.version);
    expect(navTabsText).toContain('Documentation')
  });

  it('should not render EDL Usage if not included in schema', () => {
    const wrapper = shallow(<Schemas schemas={items} isViews={false}/>);
    const [ schema ] = items;
    const navTabsText = wrapper.find(Nav).filterWhere(nav => nav.props().id === `${schema.id}tabs`).text();

    expect(navTabsText).not.toContain('EDL Usage')
  });

  it('should show dynamic view', async () => {
    const schema = items[0];
    const schemas = [{...schema, isDynamic: true}];
    fetch.mockResponseOnce(JSON.stringify(schemas[0]));
    const wrapper = shallow(<Schemas schemas={schemas} isViews={true} />);
    const viewNavLink = wrapper.find(Nav.Link).at(0);
    viewNavLink.simulate("click");

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    await wrapper.update();

    const dynamicFields = wrapper.find('#dynamicFields');

    expect(dynamicFields).toHaveLength(1)
  });

  it('should render EDL Usage if Environment Name is included in schema', () => {
    const schema = {...items[0], environmentName: "Some env"};

    const wrapper = shallow(<Schemas schemas={[schema]} isViews={false}/>);

    const navTabsText = wrapper.find(Nav).filterWhere(nav => nav.props().id === `${schema.id}tabs`).text();

    expect(navTabsText).toContain('EDL Usage')
  });

  it('should set displayedSchemas based on SearchBar but use schemas to filter on', async () => {
    const schemas = [...new Array(10)].map((item, index) => ({ ...items[0], id: index, name: 'Schema' + index }));
    const schemaIds = schemas.map(({ id }) => (id));
    const wrapper = shallow(<Schemas schemas={schemas} isViews={false}/>);

    const searchBar = wrapper.find(SearchBar);
    await act(async () => {await searchBar.props().onChange([schemas[0]]);});
    wrapper.update();
    const navItems = wrapper.find(Nav.Link).filterWhere(item => schemaIds.includes(item.props().id));

    expect(searchBar.props().items).toEqual(schemas);
    expect(navItems.length).toEqual(1);
  });

  it('should set displayedSchemas based on SearchBar but use schemas to filter on with table names', async () => {
    const schemas = [...new Array(10)].map((item, index) => ({ ...items[0], id: index, name: 'Schema' + index, }));
    const schemaIds = schemas.map(({ id }) => (id));
    const tables = [...new Array(10)].map((item, index) => ({schemaId: index, tableName: 'table_name', schemaVersion: '0.0.' + index}));
    const wrapper = shallow(<Schemas schemas={schemas} isViews={false} tables={tables}/>);

    const schemasWithTableNames = schemas.map(schema => ({ ...schema, tableName: 'table_name_0_0_' + schema.id}));

    const searchBar = wrapper.find(SearchBar);
    await act(async () => {await searchBar.props().onChange([schemasWithTableNames[0]]);});
    wrapper.update();
    const navItems = wrapper.find(Nav.Link).filterWhere(item => schemaIds.includes(item.props().id));

    expect(searchBar.props().items).toEqual(schemasWithTableNames);
    expect(navItems.length).toEqual(1);
  });

  describe('add datasets to views tests', () => {
    const testDataset = { id: 'id', name: 'dataset', version: 1, phase: {name: 'Enhance'}};

    it('should asynchronously load datasets for selected views', async () => {
      getDataset.mockResolvedValue({...testDataset});

      const wrapper = mount(<Schemas schemas={views} isViews={true}/>);

      const viewNavLink = wrapper.find('NavLink').filterWhere(item => item.props().id === views[0].id);
      viewNavLink.simulate('click');

      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
      await wrapper.update();

      expect(fetch).toHaveBeenCalledWith(
        `/api/views/${views[0].name}/datasets`,
        {"credentials": "same-origin", "headers": {"Content-Type": "application/json"}, "method": "GET"}
      );
      expect(fetch).toHaveBeenCalledWith(
        `/api/schemas/${views[0].id}`,
        {"credentials": "same-origin", "headers": {"Content-Type": "application/json"}, "method": "GET"}
      );
    });

    it('should display associated datasets for a view', async () => {
      getDataset.mockResolvedValue({...testDataset});

      const wrapper = mount(<Schemas schemas={views} isViews={true}/>);

      const viewNavLink = wrapper.find('NavLink').filterWhere(item => item.props().id === views[0].id);
      viewNavLink.simulate('click');

      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
      await wrapper.update();

      const datasetsNav = wrapper.find('NavLink').filterWhere(link => link.props().eventKey === `datasets-${views[0].id}`);
      datasetsNav.simulate('click');

      await wrapper.update();

      const datasets = wrapper.find('ListedDatasets').filterWhere(list => list.props().type === 'views');
      expect(datasets.props().displayedDatasets).toEqual([testDataset]);
    });

    it('should handle a returned error from metastoreService', async () => {
      fetch.mockResponse(JSON.stringify({error: 'some error'}), {status: '400'});

      const wrapper = mount(<Schemas schemas={views} isViews={true}/>);

      const viewNavLink = wrapper.find('NavLink').filterWhere(item => item.props().id === views[0].id);
      viewNavLink.simulate('click');

      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
      await wrapper.update();

      const notifyModal = wrapper.find('.notify-modal').find(Modal.Body);
      expect(notifyModal.text()).toEqual('some error');
    });


    it('should handle a failed call to metastoreService', async () => {
      fetch.mockResponseOnce(JSON.stringify({error: 'some error'}), {status: '400'});
      fetch.mockRejectOnce(JSON.stringify({message: 'some error'}), {status: '400'});

      const wrapper = mount(<Schemas schemas={views} isViews={true}/>);

      const viewNavLink = wrapper.find('NavLink').filterWhere(item => item.props().id === views[0].id);
      viewNavLink.simulate('click');

      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
      await wrapper.update();

      const notifyModal = wrapper.find('.notify-modal').find(Modal.Body);
      expect(notifyModal.text()).toEqual('some error');
    });

    it('should only render discovered table related fields if discovered table is passed in', () => {
      const wrapper = shallow(<Schemas schemas={items} isDiscoveredTables={true}/>);
      const [discoveredTables] = items;
      const discoveredTablesNavLinkText = wrapper.find(Nav.Link).filterWhere(nav => nav.props().id === discoveredTables.id).text();

      const discoveredTablesTabsText = wrapper.find(Nav).filterWhere(nav => nav.props().id === `${discoveredTables.id}tabs`).text();
      expect(discoveredTablesNavLinkText).not.toContain(discoveredTables.version);
      expect(discoveredTablesTabsText).toContain('Structure');
    });

  });
})
