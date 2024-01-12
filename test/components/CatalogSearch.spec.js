import Adapter from 'enzyme-adapter-react-16';
import { configure, shallow, mount } from 'enzyme';
import React from 'react';
import { CatalogSearch } from '../../components/CatalogSearch';
import { FormControl, Card, Button } from 'react-bootstrap';
import { getAllAvailablePermissions, getGroupsPermissions } from '../../apis/permissions';
import { getAllAvailableDatasets } from '../../apis/datasets';
import { getSourceDBDetails, getSourceDBFilters } from '../../apis/lineage';

jest.mock('../../components/SearchFilter.js');
jest.mock('../../apis/datasets');
jest.mock('../../apis/lineage');
jest.mock('../../apis/permissions');

configure({ adapter: new Adapter() });

const datasetHiddenFilters = ['roleType'];
const permissionHiddenFilters = ['phase', 'category', 'custodian', 'myDataset'];
const loggedInUser = {loggedInUser: { groups: []}};

describe('CatalogSearch Test Suite', () => {
  beforeEach(() => {
    getGroupsPermissions.mockResolvedValue([]);
    getAllAvailablePermissions.mockResolvedValue([createPermission()]);
    getAllAvailableDatasets.mockResolvedValue([createDataset()]);
    getSourceDBDetails.mockResolvedValue([{
      database: 'database',
      server: 'server',
      tableName: 'tableName'
    }]);
    getSourceDBFilters.mockResolvedValue({
      databases: ['database'],
      servers: ['server'],
      tableNames: ['tableName']
    });
  });

  it('should render for dataset', () => {
    const wrapper = mount(<CatalogSearch type="Dataset" hidePermissionDetails router={{query: {}}} />);
    expect(wrapper).toBeDefined();
  });

  it('should render for permission', () => {
    const wrapper = mount(<CatalogSearch type="Permission" hideDatasetDetails router={{query: {}}} />);
    expect(wrapper).toBeDefined();
  });

  it('should allow searching of datasets by relevance', async () => {
    const datasets = [createDataset(), { ...createDataset(), name: 'expected result', id: 'id2' }];
    getAllAvailableDatasets.mockResolvedValue(datasets);

    const wrapper = shallow(<CatalogSearch
      type="Dataset"
      loggedInUser={loggedInUser}
      hidePermissionDetails
      router={{query: {}, asPath: '/catalog'}}
      loadAccessibleDatasets
      hiddenFilters={datasetHiddenFilters}
      setLoading={() => {}}
      setReloadDatasets={() => { return true }}
    />);

    await wrapper.instance().componentDidMount();
    await wrapper.instance().componentDidUpdate();

    wrapper.setState({searchCriteria: '\"expected result\"'});
    await wrapper.instance().componentDidUpdate();
    await wrapper.instance().componentDidUpdate();

    const searchBar = wrapper.find(FormControl).filterWhere(fc => fc.props().id === 'catalogSearchBar');
    const results = wrapper.find(Card);

    expect(searchBar.props().placeholder).toEqual('Search 1 datasets');
    expect(results).toHaveLength(1);
    expect(results.at(0).text()).toContain('expected result');
    expect(wrapper.state().isReloadDatasets).toBeFalsy();
  });

  it('should allow searching of permissions by relevance', async () => {
    getAllAvailablePermissions.mockResolvedValue([createPermission(), { ...createPermission(), name: 'expected result', id: 'id2' }]);
    const wrapper = shallow(<CatalogSearch
      loggedInUser={loggedInUser}
      router={{query: {}}}
      type="Permission"
      hideRegisterDataset
      hideRequestAccess
      hideDatasetDetails
      hiddenFilters={permissionHiddenFilters}
    />);

    await wrapper.instance().setAllPermissions();

    wrapper.setState({searchCriteria: '\"expected result\"'});

    const actualPlaceholder = wrapper.find(FormControl).filterWhere(fc => fc.props().id === 'catalogSearchBar').props().placeholder;
    expect(actualPlaceholder).toEqual('Search 1 permissions');

    const actualCards = wrapper.find(Card);
    expect(actualCards).toHaveLength(1);
    expect(actualCards.at(0).text()).toContain('expected result');
  });

  it('should be able to select datasets', async () => {
    const datasets = [
      createDataset(),
      {
        ...createDataset(),
        name: 'expected result',
        id: 'id2'
      }
    ];

    getAllAvailableDatasets.mockResolvedValue(datasets);
    getSourceDBDetails.mockResolvedValue([]);

    const expectedSelectedItem = {
      ...createDataset(),
      relevance: {matches: {}, score: 0},
      filteredOut: false
    };
    const wrapper = shallow(<CatalogSearch
      type="Dataset"
      loggedInUser={loggedInUser}
      hidePermissionDetails
      router={{query: {}, asPath: '/catalog'}}
      loadAccessibleDatasets
      selectable
      hiddenFilters={datasetHiddenFilters}
      setLoading={() => {}}
    />);

    await wrapper.instance().componentDidMount();
    await wrapper.instance().componentDidUpdate();

    // await wrapper.instance().componentDidUpdate();
    // await wrapper.instance().componentDidUpdate();

    const firstItem = wrapper.find('div').filterWhere(d => d.props().id==='id');
    const preventDefault = jest.fn();
    firstItem.simulate('click', {preventDefault});

    expect(wrapper.state().selectedItems).toEqual([expectedSelectedItem]);
  });

  it('should be able to deselect datasets', async () => {
    const datasets = [ createDataset(), { ...createDataset(), name: 'expected result', id: 'id2' }];
    getAllAvailableDatasets.mockResolvedValue(datasets);

    const wrapper = shallow(<CatalogSearch
      type="Dataset"
      loggedInUser={loggedInUser}
      hidePermissionDetails
      router={{query: {}, asPath: '/catalog'}}
      loadAccessibleDatasets
      selectable
      hiddenFilters={datasetHiddenFilters}
      setLoading={() => {}}
    />);

    await wrapper.instance().componentDidMount();
    await wrapper.instance().componentDidUpdate();

    await wrapper.instance().componentDidUpdate();
    await wrapper.instance().componentDidUpdate();


    const firstItem = wrapper.find('div').filterWhere(d => d.props().id==='id');
    const preventDefault = jest.fn();
    firstItem.simulate('click', {preventDefault: preventDefault});
    firstItem.simulate('click', {preventDefault: preventDefault});
    expect(wrapper.state().selectedItems).toEqual([]);
  });

  it('should be able to clear selected datasets', async () => {
    const datasets = [
      createDataset(),
      {
        ...createDataset(),
        name: 'expected result',
        id: 'id2'
      }
    ];

    getAllAvailableDatasets.mockResolvedValue(datasets);

    const wrapper = shallow(<CatalogSearch
      type="Dataset"
      loggedInUser={loggedInUser}
      hidePermissionDetails
      router={{query: {}, asPath: '/catalog'}}
      loadAccessibleDatasets
      selectable
      hiddenFilters={datasetHiddenFilters}
      setLoading={() => {}}
    />);

    await wrapper.instance().componentDidMount();
    await wrapper.instance().componentDidUpdate();

    await wrapper.instance().componentDidUpdate();
    await wrapper.instance().componentDidUpdate();

    const firstItem = wrapper.find('div').filterWhere(d => d.props().id==='id');
    const preventDefault = jest.fn();
    firstItem.simulate('click', {preventDefault: preventDefault});
    const clearSelectedButton = wrapper.find(Button).filterWhere(b => b.props().id === 'clearSelectedItems');
    clearSelectedButton.simulate('click');
    expect(wrapper.state().selectedItems).toEqual([]);
  });

  it('should be able to open details of a dataset', async () => {
    const push = jest.fn();
    const wrapper = shallow(<CatalogSearch
      type="Dataset"
      loggedInUser={loggedInUser}
      hidePermissionDetails
      router={{query: {}, push: push, asPath: '/catalog'}}
      loadAccessibleDatasets
      selectable
      hiddenFilters={datasetHiddenFilters}
      setLoading={() => {}}
    />);

    await wrapper.instance().componentDidMount();
    await wrapper.instance().componentDidUpdate();

    await wrapper.instance().componentDidUpdate();
    await wrapper.instance().componentDidUpdate();

    const cardTitle = wrapper.find(Card.Title).find(Button);
    const preventDefault = jest.fn();
    const stopPropagation = jest.fn();

    cardTitle.simulate('click', {preventDefault: preventDefault, stopPropagation: stopPropagation});
    const expectedURL = '/catalog/datasets/detail?id=' +  createDataset().id;
    expect(push.mock.calls[0][0]).toEqual(expectedURL);
  });

  it('should be able to open details of a human permission', async () => {
    const push = jest.fn();
    getAllAvailableDatasets.mockResolvedValue([]);
    getAllAvailablePermissions.mockResolvedValue([{...createPermission(), group: 'MY_GROUP', roleType: 'human'}]);

    const wrapper = shallow(<CatalogSearch
      loggedInUser={loggedInUser}
      router={{query: {}, push}}
      type="Permission"
      hideRegisterDataset
      hideRequestAccess
      hideDatasetDetails
      hiddenFilters={permissionHiddenFilters}
      setLoading={() => {}}
      setReloadDatasets={() => {}}
    />);

    await wrapper.instance().setAllPermissions();

    const cardTitle = wrapper.find(Card.Title).find(Button);
    cardTitle.simulate('click', {preventDefault: jest.fn(), stopPropagation: jest.fn()});
    const expectedURL = '/catalog/permissions/summary-detail?group=MY_GROUP';
    expect(push.mock.calls[0][0]).toEqual(expectedURL);
    expect(wrapper.state().isReloadDatasets).toBeUndefined();
  });

  it('should be able to open details of a system permission', async () => {
    getAllAvailablePermissions.mockResolvedValue([{...createPermission(), clientId: 'MY_ID', roleType: 'system'}]);
    const push = jest.fn();
    const wrapper = shallow(<CatalogSearch
      router={{query: {}, push: push}}
      type="Permission"
      loggedInUser={loggedInUser}
      hideRegisterDataset
      hideRequestAccess
      hideDatasetDetails
      hiddenFilters={permissionHiddenFilters}
      setLoading={() => {}}
    />);

    await wrapper.instance().setAllPermissions();

    const cardTitle = wrapper.find(Card.Title).find(Button);
    cardTitle.simulate('click', {preventDefault: jest.fn(), stopPropagation: jest.fn()});
    const expectedURL = '/catalog/permissions/summary-detail?clientId=MY_ID';
    expect(push.mock.calls[0][0]).toEqual(expectedURL);
  });

  it('should show which datasets are accessible by user', async () => {
    const datasets = [createDataset(), {...createDataset(), name: 'expected result', id: 'id2', isAccessibleFlag: true}];
    getAllAvailableDatasets.mockResolvedValue(datasets);

    const wrapper = shallow(<CatalogSearch
      type="Dataset"
      loggedInUser={loggedInUser}
      hidePermissionDetails
      router={{query: {}, asPath: '/catalog'}}
      loadAccessibleDatasets
      selectable
      hiddenFilters={datasetHiddenFilters}
      setLoading={() => {}}
    />);

    await wrapper.instance().componentDidMount();
    await wrapper.instance().componentDidUpdate();

    wrapper.setState({userAccessibleDatasets: [datasets[1].id]});

    await wrapper.instance().componentDidUpdate();
    await wrapper.instance().componentDidUpdate();

    const userHasAccess = wrapper.find('div').filterWhere(c => c.props().id === datasets[1].id).find('span').filterWhere(s => s.props().id === 'accessAllowed');
    expect(userHasAccess.text()).toContain('Access Allowed');
  });
  it('should display contains Pii if classifications contains personal information', async () => {
    const classifications = [{ personalInformation: true }]
    const dataset1 = { ...createDataset(), classifications };
    const datasets = [dataset1, {...createDataset(), name: 'expected result', id: 'id2'}];
    getAllAvailableDatasets.mockResolvedValue(datasets);

    const wrapper = shallow(<CatalogSearch
      type="Dataset"
      loggedInUser={loggedInUser}
      hidePermissionDetails
      router={{query: {}, asPath: '/catalog'}}
      loadAccessibleDatasets
      selectable
      hiddenFilters={datasetHiddenFilters}
      setLoading={() => {}}
    />);

    await wrapper.instance().componentDidMount();
    await wrapper.instance().componentDidUpdate();

    expect(wrapper.text()).toContain('Personal Information');
  });
  it('should not display contains Pii if classifications does not contain personal information', async () => {
    const dataset1 = { ...createDataset() };
    const datasets = [dataset1, {...createDataset(), name: 'expected result', id: 'id2'}];
    getAllAvailableDatasets.mockResolvedValue(datasets);

    const wrapper = shallow(<CatalogSearch
      type="Dataset"
      loggedInUser={loggedInUser}
      hidePermissionDetails
      router={{query: {}, asPath: '/catalog'}}
      loadAccessibleDatasets
      selectable
      hiddenFilters={datasetHiddenFilters}
      setLoading={() => {}}
    />);

    await wrapper.instance().componentDidMount();
    await wrapper.instance().componentDidUpdate();

    expect(wrapper.text()).not.toContain('Personal Information');
  });

  it('should show which permissions are accessible by user', async () => {
    const permissions = [{...createPermission(), group: 'AWS-GIT-OTHER'}, {...createPermission(), name: 'expected result', id: 'id2'}];
    getAllAvailablePermissions.mockResolvedValue(permissions);
    getGroupsPermissions.mockResolvedValue([{id: 'id2'}]);
    const wrapper = shallow(<CatalogSearch
      loggedInUser={loggedInUser}
      getUserPermissions={() => [{id: 'id2'}]}
      router={{query: {}}}
      type="Permission"
      hideRegisterDataset
      hideRequestAccess
      hideDatasetDetails
      hiddenFilters={permissionHiddenFilters}
    />);

    await wrapper.instance().setAllPermissions();
    await wrapper.instance().setUserPermissions();

    const hasId = c => c.props().id === permissions[1].id;
    const isMember = s => s.props().id === 'isMember';
    const userIsMember = wrapper.find('div').filterWhere(hasId).find('span').filterWhere(isMember);
    expect(userIsMember.text()).toContain('Member');
  });

  it('should allow filters to be set', async () => {
    const wrapper = shallow(<CatalogSearch
      type="Dataset"
      loggedInUser={loggedInUser}
      hidePermissionDetails
      router={{query: {}}}
      loadAccessibleDatasets
      selectable
      hiddenFilters={datasetHiddenFilters}
    />);

    await wrapper.instance().componentDidMount();

    wrapper.instance().updateFilters(createFilters());
    expect(wrapper.state().filters).toEqual(createFilters());
  });

  it('should allow active filters to be retrieved', async () => {
    const datasets = [
      {
        ...createDataset(),
        roleType: 'roleType',
        category: {id: 'category'},
        classifications: [createClassification()],
        isAccessibleFlag: true
      },
      {
        ...createDataset(),
        name: 'expected result',
        id: 'id2',
        roleType: 'diff',
        category: {id: 'diff'},
        classifications: [createClassification('diff')],
        isAccessibleFlag: false
      }
    ];

    getAllAvailableDatasets.mockResolvedValue(datasets);
    getAllAvailablePermissions.mockResolvedValue([createPermission()]);

    const wrapper = shallow(<CatalogSearch
      type="Dataset"
      loggedInUser={loggedInUser}
      hidePermissionDetails
      router={{query: {}}}
      loadAccessibleDatasets
      selectable
      hiddenFilters={datasetHiddenFilters}
    />);
    await wrapper.instance().componentDidMount();

    wrapper.setState({userAccessibleDatasets: ['id']})
    wrapper.instance().updateFilters({
      countriesRepresented: [{id: 'cr'}],
      community: [{id: 'comm'}],
      gicp: [{id: 'gicp'}],
      category: [{id: 'category'}],
      roleType: [{id: 'roleType'}],
      phase: [{id: 'phaseid'}],
      subCommunity: [{id: 'subcomm'}],
      personalInformation:  [{id: 'pi'}],
      development: [{id: 'dev'}],
      access: [{id: true}]
    });
    const results = datasets.map(wrapper.instance().applyAdditionalFilters);
    expect(results.find(r => r.id === datasets[0].id).filteredOut).toEqual(false);
    expect(results.find(r => r.id === datasets[1].id).filteredOut).toEqual(true);
  });

  it('should show which datasets are myDataset', async () => {
    const datasets = [
      {
        ...createDataset(),
        name: 'not my dataset',
        createdBy: 'username2'
      },
      {
        ...createDataset(),
        name: 'my dataset',
        id: 'id2',
        createdBy: 'username1'
      }
    ];

    getAllAvailableDatasets.mockResolvedValue(datasets);

    const wrapper = shallow(<CatalogSearch
      type="Dataset"
      loggedInUser={loggedInUser}
      hidePermissionDetails
      router={{query: {}, asPath: '/catalog'}}
      loadAccessibleDatasets
      selectable
      hiddenFilters={datasetHiddenFilters}
      setLoading={() => {}}
    />);

    await wrapper.instance().componentDidMount();
    await wrapper.instance().componentDidUpdate();

    wrapper.instance().updateFilters({
      myDataset: [{id: true, name: 'true', createdBy: 'username1'}]
    });

    await wrapper.instance().componentDidUpdate();
    await wrapper.instance().componentDidUpdate();

    const results = wrapper.find(Card).filterWhere(card => card.props().id === 'id2');

    expect(results).toHaveLength(1);
    expect(results.text()).toContain('my dataset');
    expect(results.text()).not.toContain('not my dataset');
  });

  it('should show datasets with selected custodian group', async () => {
    const datasets = [createDataset(), {...createDataset(), name: 'expected result', id: 'id2', custodian: 'some-adGroup'}];
    getAllAvailableDatasets.mockResolvedValue(datasets);

    const wrapper = shallow(<CatalogSearch
      type="Dataset"
      loggedInUser={loggedInUser}
      hidePermissionDetails
      router={{query: {}, asPath: '/catalog'}}
      loadAccessibleDatasets
      selectable
      hiddenFilters={datasetHiddenFilters}
      setLoading={() => {}}
    />);

    await wrapper.instance().componentDidMount();
    await wrapper.instance().componentDidUpdate();

    wrapper.instance().updateFilters({
      custodian: [{id: 'some-adGroup'}]
    });

    await wrapper.instance().componentDidUpdate();
    await wrapper.instance().componentDidUpdate();

    const results = wrapper.find(Card).filterWhere(card => card.props().id === 'id2');

    expect(results).toHaveLength(1);
    expect(results.text()).toContain('expected result');
  });

});

const createClassification = (override) => {
  return {
    community: {id: override || 'comm'},
    subCommunity: {id: override || 'subcomm'},
    countriesRepresented: [{id: override || 'cr'}],
    development:  override || 'dev',
    personalInformation:  override || 'pi',
    gicp: {id: override || 'gicp'}
  }
};

const createFilters = () =>  ({phase: []});

const createDataset = () => {
  return {
    id: 'id',
    name: 'name',
    description: 'desc',
    documentation: 'docs',
    phase: {id: 'phaseid', name: 'phase'},
    status: 'AVAILABLE',
    schemas: [],
    linkedSchemas: [],
    classifications: []
  }
};

const createPermission = () => {
  return {
    id: 'id',
    name: 'name',
    description: 'desc',
    businessCase: 'docs',
    status: 'AVAILABLE',
    group: 'AWS-GIT-DWIS-DEV',
    roleType: 'human',
    startDate: (new Date()).toISOString(),
    endDate: (new Date()).toISOString(),
    entitlements: []
  }
};
