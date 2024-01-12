// Unpublished Work © 2022 Deere & Company.
import { waitFor } from '@testing-library/react';
import { shallow } from 'enzyme';
import React from 'react';
import { PaginatedDatasetCatalog } from '../../../../components/datasets/search/PaginatedDatasetCatalog';
import { getAllAvailablePermissions, getGroupsPermissions } from '../../../../apis/permissions';
import { getAllAvailableDatasets, getDatasetWithQuery } from '../../../../apis/datasets';
import { getAccessibleDatasets } from '../../../../apis/acls';
import { getSourceDBDetails } from '../../../../apis/lineage';
import { FormControl } from 'react-bootstrap';

jest.mock('../../../../apis/datasets');
jest.mock('../../../../apis/permissions');
jest.mock('../../../../apis/acls');
jest.mock('../../../../apis/lineage');

const datasetHiddenFilters = ['roleType'];
const loggedInUser = { loggedInUser: { groups: [] } };
const togglesValue = {toggles: {"datacatalogui.public_datasets" : true }};

const createDataset = (id = 'id') => {
  return {
    id: id,
    name: 'name-' + id,
    description: 'desc',
    documentation: 'docs',
    phase: { id: 'phaseid', name: 'phase' },
    status: 'AVAILABLE',
    schemas: [],
    linkedSchemas: [],
    classifications: [],
    createdBy: 'user1'
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

const createDataCatalog = () => {
  return <PaginatedDatasetCatalog
    loggedInUser={loggedInUser}
    hidePermissionDetails
    router={{ query: {}, asPath: '/catalog' }}
    loadAccessibleDatasets
    hiddenFilters={datasetHiddenFilters}
    setLoading={() => { }}
    setReloadDatasets={() => { return true }}
    toggles = {togglesValue}/>
}

const defaultDatasets = [createDataset(), { ...createDataset(), name: 'expected result', id: 'id2' }];
describe('PaginatedDatasetCatalog Test Suite', () => {
  const mockDatasets = (datasets) => {
    getAllAvailableDatasets.mockResolvedValue(datasets);
    getDatasetWithQuery.mockResolvedValue(datasets);
  }

  beforeEach(() => {
    getGroupsPermissions.mockResolvedValue([]);
    getAccessibleDatasets.mockResolvedValue([]);
    getAllAvailablePermissions.mockResolvedValue([createPermission()]);
    mockDatasets(defaultDatasets);
    getSourceDBDetails.mockResolvedValue([]);
  });

  const createInitializedCatalogWrapper = async () => {
    const wrapper = shallow(createDataCatalog());
    await wrapper.instance().componentDidMount();
    await waitFor(() => expect(getDatasetWithQuery).toHaveBeenCalledTimes(2));
    wrapper.update();
    return wrapper;
  };

  it('should render for dataset', () => {
    const wrapper = shallow(createDataCatalog());
    expect(wrapper).toBeDefined();
  });

  it('should render correct number of cards from datasets', async () => {
    const wrapper = await createInitializedCatalogWrapper();
    const datasetCards = wrapper.find('DatasetCard');
    expect(datasetCards).toHaveLength(2);
  });

  it('should display filter when toggled', async () => {
    const wrapper = await createInitializedCatalogWrapper();
    const searchBar = wrapper.find(FormControl).filterWhere(fc => fc.props().id === 'catalogSearchBar');
    expect(searchBar.exists).toBeTruthy();
    expect(wrapper.state().showFilter).toBeFalsy();
    wrapper.instance().toggleFilter();
    expect(wrapper.state().showFilter).toBeTruthy();
    wrapper.instance().updateFilters({phase: 'Enhance'});
    await waitFor(() => expect(wrapper.state().filters.phase).toBe('Enhance'));
    expect(wrapper.instance().activeFilters().length).toBe(1);
    wrapper.instance().filterRef.current = {resetState: () => {}}
    wrapper.instance().clearFilters();
    expect(wrapper.instance().activeFilters().length).toBe(0);
  });

  it('should perform api call when search is triggered', async () => {
    const wrapper = await createInitializedCatalogWrapper();
    const searchBar = wrapper.find(FormControl).filterWhere(fc => fc.props().id === 'catalogSearchBar');
    expect(searchBar.exists).toBeTruthy();
  });
});
