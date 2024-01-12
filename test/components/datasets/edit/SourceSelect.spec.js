// Unpublished Work © 2022 Deere & Company.
import { shallow } from 'enzyme';
import React from 'react';
import SourceSelect from '../../../../components/datasets/edit/SourceSelect';

describe('SourceSelect tests', () => {
  it('should change to selected type', () => {
    let source = { randomKey: {id: '123', value: 'anyRandomValue'}, uiId: {id: '456'}};
    const setSource = newSource => source = newSource;
    const entry = ['randomKey', {id: '123', value: 'anyRandomValue'}];
    const wrapper = shallow(<SourceSelect entry={entry} source={source} setSource={setSource}/>);
    const selector = wrapper.find('#source-selector');
    selector.simulate('change', {value: 'changedValue'});
    wrapper.update();

    expect(source.randomKey.value).toEqual('changedValue');
  });

  it('should select a manually entered type', () => {
    let source = { randomKey: {id: '123', value: 'anyRandomValue'}, uiId: {id: '456'}};
    const setSource = newSource => source = newSource;
    const entry = ['randomKey', {id: '123', value: 'anyRandomValue'}];
    const wrapper = shallow(<SourceSelect entry={entry} source={source} setSource={setSource}/>);
    const selector = wrapper.find('#source-selector');
    selector.simulate('createOption', 'changedValue');
    wrapper.update();

    expect(source.randomKey.value).toEqual('changedValue');
  });
});
