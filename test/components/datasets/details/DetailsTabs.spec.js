// Unpublished Work © 2022 Deere & Company.
import {shallow} from 'enzyme';
import React from 'react';
import DetailsTabs from "../../../../components/datasets/details/DetailsTabs";

describe('DetailsTabs tests', () => {
  const createDataset = () => ({
    approvals:[],
    linkedSchemas: [],
    schemas: [],
    classifications: [],
    discoveredSchemas: [],
    discoveredTables: [],
    phase: { name: 'Enhance'},
    status: 'AVAILABLE',
  });

  const createParams = () => ({
    dataset: createDataset(),
    loggedInUser : { groups: []},
    didClassificationsChange: false,
    didSchemasChange: false,
    retrievedViewPermissions: true,
    retrievedSchemas: true,
    allSchemas: [],
    showDiff: false
  });

  it('should hava a files default key', () => {
    const dataset  = {...createDataset(), phase: {name: 'raw'}};
    const params = {...createParams(), dataset };
    const detailsTabs = shallow(<DetailsTabs {...params} />);
    const container = detailsTabs.find('TabContainer');
    expect(container.prop('defaultActiveKey')).toEqual('files');
  });

  it('should have a schemas default key', () => {
    const detailsTabs = shallow(<DetailsTabs {...createParams()} />);
    const container = detailsTabs.find('TabContainer');
    expect(container.prop('defaultActiveKey')).toEqual('schemas');
  });

  it('should have a classifications default key', () => {
    const dataset  = {...createDataset(), phase: {name: 'raw'}, status: 'PENDING'};
    const params = {...createParams(), dataset };
    const detailsTabs = shallow(<DetailsTabs {...params} />);
    const container = detailsTabs.find('TabContainer');
    expect(container.prop('defaultActiveKey')).toEqual('classifications');
  });

  it('should be retrieving datasets', () => {
    const detailsTabs = shallow(<DetailsTabs {...createParams()} />);
    const detailsTabsNav = detailsTabs.find('DetailsTabsNav');
    expect(detailsTabsNav.prop('retrievedSchemas')).toEqual(false);
  });

  it('should be retrieving views permissions', () => {
    const detailsTabs = shallow(<DetailsTabs {...createParams()} />);
    const detailsTabsNav = detailsTabs.find('DetailsTabsNav');
    expect(detailsTabsNav.prop('retrievedViewPermissions')).toEqual(false);
  });

  it('should have required raw resources', () => {
    const dataset = {...createDataset(), phase:{name:'raw'}, status: 'PENDING'};
    const params = { ...createParams(), dataset };
    const detailsTabs = shallow(<DetailsTabs {...params} />);
    const detailsTabsNav = detailsTabs.find('DetailsTabsNav');
    const expectedResources = ['classifications'];
    expect(detailsTabsNav.prop('resources')).toEqual(expectedResources);
  });

  it('should have all raw resources', () => {
    const dataset = {...createDataset(), phase:{name:'raw'}, environmentName: 'anyName', views: [{}], discoveredTables: [{}], sources: [{}]};
    const params = { ...createParams(), dataset };
    const detailsTabs = shallow(<DetailsTabs {...params} />);
    const detailsTabsNav = detailsTabs.find('DetailsTabsNav');
    const expectedResources = ['files', 'views', 'discoveredTables', 'edlUsage', 'sources', 'classifications'];
    expect(detailsTabsNav.prop('resources')).toEqual(expectedResources);
  });

  it('should have required enhance resources', () => {
    const detailsTabs = shallow(<DetailsTabs {...createParams()} />);
    const detailsTabsNav = detailsTabs.find('DetailsTabsNav');
    const expectedResources = ['schemas', 'classifications'];
    expect(detailsTabsNav.prop('resources')).toEqual(expectedResources);
  });

  it('should have all enhance resources', () => {
    const dataset = {...createDataset(), environmentName: 'anyName', views: [{}], discoveredTables: [{}], sources: [{}]};
    const params = { ...createParams(), dataset };
    const detailsTabs = shallow(<DetailsTabs {...params} />);
    const detailsTabsNav = detailsTabs.find('DetailsTabsNav');
    const expectedResources = ['schemas', 'views', 'discoveredTables', 'edlUsage', 'sources', 'classifications'];
    expect(detailsTabsNav.prop('resources')).toEqual(expectedResources);
  });
});
