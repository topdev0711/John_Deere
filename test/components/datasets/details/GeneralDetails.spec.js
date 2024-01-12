import {shallow, mount} from 'enzyme';
import React from 'react';
import {Button, Card} from 'react-bootstrap';
import GeneralDetails from '../../../../components/datasets/details/GeneralDetails';

describe('GeneralDetails test', () => {
  const createDescription = () => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
  const createDataset = () => {
    return {
      application: 'None',
      category: { name: 'transaction' },
      classifications: [],
      custodian: 'any-ad-group',
      dataRecovery: false,
      description: createDescription(),
      documentation: 'some documentation',
      name: 'anyName',
      owner: { name: 'anyOwner'},
      phase: { name: 'Raw' },
      status: '',
      id: 'anyId',
      version: 1
    };
  };

  it('does not have an owner', () => {
    const {owner, ...dataset } = createDataset();
    const details = shallow(<GeneralDetails dataset={dataset}/>);
    expect(details.exists('Owner')).toEqual(false);
  });

  it('displays custodian', () => {
    const details = shallow(<GeneralDetails dataset={createDataset()}/>);
    expect(details.exists('Owner')).toEqual(true);
  });

  it('shows summary of details', () => {
    const details = shallow(<GeneralDetails dataset={createDataset()}/>);
    const className = details.find(Card.Body).prop('className');
    expect(className).toEqual('detail-summary');
  });

  it('shows all details when show more button clicked', () => {
    const details = mount(<GeneralDetails dataset={createDataset()}/>);
    details.find('ExpandDetailsButton').find(Button).simulate('click');

    const className = details.find(Card.Body).prop('className');
    expect(className).toEqual('');
  });

  it('shows summary when show less button clicked', () => {
    const details = mount(<GeneralDetails dataset={createDataset()}/>);
    details.find('ExpandDetailsButton').find(Button).simulate('click');
    details.find('ExpandDetailsButton').find(Button).simulate('click');

    const className = details.find(Card.Body).prop('className');
    expect(className).toEqual('detail-summary');
  });

  it('shows all details when there is little documentation', () => {
    const details = shallow(<GeneralDetails dataset={{...createDataset(), description: ''}}/>);
    const className = details.find(Card.Body).prop('className');
    expect(className).toEqual('');
  });

  it('compares documentation', () => {
    const details = mount(<GeneralDetails dataset={createDataset()} showDiff={true}/>);
    expect(details.exists('#documentation-diff')).toEqual(true);
  });

  it('displays documentation', () => {
    const details = mount(<GeneralDetails dataset={createDataset()} showDiff={false}/>);
    const documentation = details.find('Documentation').find('div');
    expect(documentation.prop('className')).toEqual('markdown');
  });

  it('displays no documentation', () => {
    const details = mount(<GeneralDetails dataset={{...createDataset(), documentation: ''}} showDiff={false}/>);
    const documentation = details.find('Documentation').find('i');
    expect(documentation.text()).toEqual('No additional documentation available.');
  });
});
