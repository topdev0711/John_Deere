// Unpublished Work © 2022 Deere & Company.
import {shallow} from 'enzyme';
import React from 'react';
import DetailsTabContent from '../../../../components/datasets/details/DetailsTabContent';
import * as AppContext from '../../../../components/AppState';

describe('DetailTabContent tests', function () {
  const custodian = 'anyCustodian';
  const anyView = {name: 'anyName', id: 'someId', status: 'AVAILABLE', createdAt: '1970'};
  const createDataset = () => ({
    approvals: [],
    custodian,
    classifications: [],
    discoveredSchemas: [],
    discoveredTables: [],
    environmentName: 'any.environment.name',
    phase: {name: 'Enhance'},
    status: 'AVAILABLE',
    views: [anyView]
  });

  const createParams = () => ({
    dataset: createDataset(),
    loggedInUser: {groups: []},
    didClassificationsChange: false,
    didSchemasChange: false,
    retrievedViewPermissions: true,
    retrievedSchemas: true,
    resources: [ 'files', 'schemas', 'views', 'discoveredTables', 'edlUsage', 'sources', 'classifications'],
    allSchemas: [],
    showDiff: false
  });

  afterEach(() => {
   jest.resetAllMocks();
  });


  it('has required card', () => {
    const params = {...createParams(), resources: ['classifications']};
    const detailsNav = shallow(<DetailsTabContent {...params} />);
    const items = detailsNav.find('CardBody');
    expect(items.length).toEqual(1);
  });

  it('has all resources', () => {
    const detailsContent = shallow(<DetailsTabContent {...createParams()} />);
    const items = detailsContent.find('CardBody');
    expect(items.length).toEqual(7);
  });

  it('has file explorer', () => {
    const detailsNav = shallow(<DetailsTabContent {...createParams()} />);
    expect(detailsNav.exists('FileExplorer')).toEqual(true);
  });

  it('has Enhanced schemas', () =>{
    const params = {...createParams(), allSchemas: [{ name: 'anySchema'}]};
    const detailsContent = shallow(<DetailsTabContent {...params} />);
    const content = detailsContent.find('#details-content-schemas');
    expect(content.exists('EnhancedSchemas')).toEqual(true);
  })

  it('has displays no schemas', () => {
    const detailsContent = shallow(<DetailsTabContent {...createParams()} />);
    const content = detailsContent.find('#details-content-schemas');
    expect(content.exists('NoSchemas')).toEqual(true);
  });

  it('no data should be present in schemas tab while retrieving schemas', () => {
    const params = {...createParams(), retrievedSchemas: false};
    const detailsContent = shallow(<DetailsTabContent {...params} />);
    const schemasTab = detailsContent.find('#details-content-schemas');
    expect(schemasTab.exists('Schemas')).toEqual(false);
    expect(schemasTab.exists('NoSchemas')).toEqual(false);
  });

  it('has views', () => {
    const detailsContent = shallow(<DetailsTabContent {...createParams()} />);
    expect(detailsContent.exists('#details-content-views')).toEqual(true);
  });

  it('should display loading while retrieving views permissions', () => {
    const params = {...createParams(), retrievedViewPermissions: false};
    const detailsContent = shallow(<DetailsTabContent {...params} />);
    const viewsTab = detailsContent.find('#details-content-views');
    expect(viewsTab.exists('Loading')).toEqual(true);
  });

  it('has discovered tables', () => {
    const detailsContent = shallow(<DetailsTabContent {...createParams()} />);
    expect(detailsContent.exists('#details-content-discoveredTables')).toEqual(true);
  });

  it('has edlUsage', () => {
    const detailsContent = shallow(<DetailsTabContent {...createParams()} />);
    expect(detailsContent.exists('#details-content-edlUsage')).toEqual(true);
  });

  it('has sources', () => {
    const detailsContent = shallow(<DetailsTabContent {...createParams()} />);
    expect(detailsContent.exists('#details-content-sources')).toEqual(true);
  });

  it('has classifications', () => {
    const detailsContent = shallow(<DetailsTabContent {...createParams()} />);
    expect(detailsContent.exists('#details-content-classifications')).toEqual(true);
  });

  it('should have previous classifications to compare to', () => {
    const classifications = [{name: 'previousClassification'}];
    const latestAvailableVersion = {...createDataset(), classifications};
    const params = {...createParams(), latestAvailableVersion};
    const detailsContent = shallow(<DetailsTabContent {...params} />);
    const classificationDetail = detailsContent.find('ClassificationDetail');
    expect(classificationDetail.prop('prevItems')).toEqual(classifications);
  });

  it('should have no classifications to compare to when there is not an available version of the dataset', () => {
    const detailsContent = shallow(<DetailsTabContent {...createParams()} />);
    const classificationDetail = detailsContent.find('ClassificationDetail');
    expect(classificationDetail.prop('prevItems')).toEqual([]);
  });
});
