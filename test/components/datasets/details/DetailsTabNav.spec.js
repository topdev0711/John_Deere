// Unpublished Work © 2022 Deere & Company.
import {shallow} from 'enzyme';
import React from 'react';
import DetailsTabsNav from '../../../../components/datasets/details/DetailsTabsNav';

describe('DetailsTabNav tests', () => {
  const createDataset = () => ({
    classifications: [{ name: 'anyClassification'}],
    discoveredSchemas: [{name: 'anyDiscoveredSchema'}],
    discoveredTables: [{name: 'anyDiscoveredTable'}],
    environmentName: 'any.environment.name',
    phase: {name: 'Enhance'},
    sources: [{ name: 'anySource'}],
    status: 'AVAILABLE',
    views: [{name: 'anyView'}]
  });

  const createParams = () => ({
    dataset: createDataset(),
    didClassificationsChange: false,
    didSchemasChange: false,
    retrievedViewPermissions: true,
    retrievedSchemas: true,
    resources: [ 'files', 'schemas', 'views', 'discoveredTables', 'edlUsage', 'sources', 'classifications'],
    allSchemas: [{name: 'anySchemas'}],
    showDiff: false
  });

  it('has required navs', () => {
    const params = {...createParams(), resources: ['classifications']};
    const detailsNav = shallow(<DetailsTabsNav {...params} />);
    const items = detailsNav.find('NavItem');
    expect(items.length).toEqual(1);
  });

  it('has all resources', () => {
    const detailsNav = shallow(<DetailsTabsNav {...createParams()} />);
    const items = detailsNav.find('NavItem');
    expect(items.length).toEqual(7);
  });

  it('displays files nav', () => {
    const detailsNav = shallow(<DetailsTabsNav {...createParams()} />);
    const nav = detailsNav.find('#files-nav');
    expect(nav.text()).toEqual('Files');
  });

  it('displays schemas nav', () => {
    const detailsNav = shallow(<DetailsTabsNav {...createParams()} />);
    const nav = detailsNav.find('#schemas-nav');
    expect(nav.text()).toEqual('Schemas (2)');
    expect(nav.exists('ChangeIndicator')).toEqual(false);
  });

  it('should not displays schema count when it is zero' , () => {
    const dataset = { ...createDataset(), discoveredSchemas: [] };
    const params = { ...createParams(), allSchemas: [], dataset};
    const detailsNav = shallow(<DetailsTabsNav {...params} />);
    const nav = detailsNav.find('#schemas-nav');
    expect(nav.text()).toEqual('Schemas ');
  });

  it('should not have schema change indicator when not comparing two versions of dataset', () => {
    const params = {...createParams(), didSchemasChange: true, allSchemas: [{name: 'anySchema'}]};
    const detailsNav = shallow(<DetailsTabsNav {...params} />);
    const nav = detailsNav.find('#schemas-nav');
    expect(nav.exists('ChangeIndicator')).toEqual(false);
  });

  it('should have schema change indicator', () => {
    const params = {...createParams(), showDiff: true, didSchemasChange: true, allSchemas: [{name: 'anySchema'}]};
    const detailsNav = shallow(<DetailsTabsNav {...params} />);
    const nav = detailsNav.find('#schemas-nav');
    expect(nav.exists('ChangeIndicator')).toEqual(true);
  });

  it('should have schema spinner while retrieving schema data', () => {
    const params = {...createParams(), retrievedSchemas: false};
    const detailsNav = shallow(<DetailsTabsNav {...params} />);
    const nav = detailsNav.find('#schemas-nav');
    expect(nav.exists('Spinner')).toEqual(true);
  });

  it('displays views nav', () => {
    const detailsNav = shallow(<DetailsTabsNav {...createParams()} />);
    const nav = detailsNav.find('#views-nav');
    expect(nav.text()).toEqual('Views (1)');
  });

  it('should have views spinner while retrieving view permissions', () => {
    const params = {...createParams(), retrievedViewPermissions: false};
    const detailsNav = shallow(<DetailsTabsNav {...params} />);
    const nav = detailsNav.find('#views-nav');
    expect(nav.exists('Spinner')).toEqual(true);
  });

  it('displays discoveredTables nav', () => {
    const detailsNav = shallow(<DetailsTabsNav {...createParams()} />);
    const nav = detailsNav.find('#discoveredTables-nav');
    expect(nav.text()).toEqual('Tables (1)');
  });

  it('displays edlUsage nav', () => {
    const detailsNav = shallow(<DetailsTabsNav {...createParams()} />);
    const nav = detailsNav.find('#edlUsage-nav');
    expect(nav.text()).toEqual('EDL Usage');
  });

  it('displays sources nav', () => {
    const detailsNav = shallow(<DetailsTabsNav {...createParams()} />);
    const nav = detailsNav.find('#sources-nav');
    expect(nav.text()).toEqual('Sources (1)');
  });

  it('displays classifications nav', () => {
    const detailsNav = shallow(<DetailsTabsNav {...createParams()} />);
    const nav = detailsNav.find('#classifications-nav');
    expect(nav.text()).toEqual('Classifications (1)');
  });

  it('should have classification change indicator', () => {
    const params = {...createParams(), showDiff: true, didClassificationsChange: true};
    const detailsNav = shallow(<DetailsTabsNav {...params} />);
    const classificationsNav = detailsNav.find('#classifications-nav');
    expect(classificationsNav.exists('ChangeIndicator')).toEqual(true);
  });

  it('should not have classification change indicator when not comparing two versions of dataset', () => {
    const detailsNav = shallow(<DetailsTabsNav {...createParams()} />);
    const nav = detailsNav.find('#classifications-nav');
    expect(nav.exists('ChangeIndicator')).toEqual(false);
  });

  it('should not have classification change indicator when the classifications for both datasets are identical', () => {
    const params = {...createParams(), showDiff: true};
    const detailsNav = shallow(<DetailsTabsNav {...params} />);
    const nav = detailsNav.find('#classifications-nav');
    expect(nav.exists('ChangeIndicator')).toEqual(false);
  });
});
