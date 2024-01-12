// Unpublished Work © 2022 Deere & Company.
import { shallow } from 'enzyme';
import enableHooks from 'jest-react-hooks-shallow';
import React from 'react';
import {Button} from 'react-bootstrap';
import SourceForm from '../../../../components/datasets/edit/SourceForm';

enableHooks(jest);

describe('SourceForm tests', () => {
  const defaultSource = () => ({ type: { id: 'abc', value: 'anyType'}, namespace: { id: 'efg', value: 'anyNamespace'}, comments: { id: 'hij', value: 'anyComment'}, uiId: {id: '456'}});

  it('should add a field', () => {
    let sources = [{ randomKey: {id: '123', value: 'anyRandomValue'}, uiId: {id: '456'}}];
    const setSources = newSources => sources = newSources;
    const wrapper = shallow(<SourceForm sources={sources} setSources={setSources} sourceIndex={0}/>);
    expect(Object.keys(sources[0]).length).toEqual(2);
    const addFieldButton = wrapper.find(Button);
    addFieldButton.simulate('click');
    wrapper.update();
    expect(Object.keys(sources[0]).length).toEqual(3);
  });

  it('should have key value header when no additional fields are present', () => {
    let sources = [{...defaultSource(),  anyField: 'anyField'}];
    const setSources = newSources => sources = newSources;
    const wrapper = shallow(<SourceForm sources={sources} setSources={setSources} sourceIndex={0}/>);
    const keyValueHeader = wrapper.find('KeyValueHeader');
    expect(keyValueHeader.length).toEqual(1);
  });

  it('should not have key value header when no additional fields are present', () => {
    let sources = [defaultSource()];
    const setSources = newSources => sources = newSources;
    const wrapper = shallow(<SourceForm sources={sources} setSources={setSources} sourceIndex={0}/>);
    const keyValueHeader = wrapper.find('KeyValueHeader');
    expect(keyValueHeader.length).toEqual(0);
  });
});
