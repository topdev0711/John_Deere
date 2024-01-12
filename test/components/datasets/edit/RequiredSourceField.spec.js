// Unpublished Work © 2022 Deere & Company.
import { shallow } from 'enzyme';
import React from 'react';
import RequiredSourceField from '../../../../components/datasets/edit/RequiredSourceField';

describe('optional source field tests', () => {
  it('should save a changed value', () => {
    let source = { randomKey: {id: '123', value: 'anyRandomValue'}, uiId: {id: '456'}};
    const setSource = newSource => source = newSource;
    const entry = ['randomKey', {id: '123', value: 'anyRandomValue'}];
    const requiredSourceField = shallow(<RequiredSourceField entry={entry} source={source} setSource={setSource} sources={[source]}/>);
    const valueTextBox = requiredSourceField.find('#value-field');
    valueTextBox.simulate('change', {target: {value: 'changedValue'}});
    requiredSourceField.update();
    expect(Object.keys(source).length).toEqual(2);
    expect(source.randomKey.value).toEqual('changedValue');
  });

  it('should not update when duplicate namespace', () => {
    let source = { namespace: {id: '123', value: 'anyRandomValue'}, uiId: {id: '456'}};
    const otherSource = {...source, namespace: {id: 'xyz', value:'abc'}};
    const setSource = newSource => source = newSource;
    const entry = ['namespace', {id: '123', value: 'anyRandomValue'}];
    const requiredSourceFields = shallow(<RequiredSourceField entry={entry} source={source} setSource={setSource} sources={[source, otherSource]}/>);
    const valueTextBox = requiredSourceFields.find('#value-field');
    valueTextBox.simulate('change', {target: {value: 'abc'}});
    requiredSourceFields.update();
    console.info(requiredSourceFields.debug());

    expect(Object.keys(source).length).toEqual(2);
    expect(source.namespace.value).toEqual('anyRandomValue');
    expect(requiredSourceFields.find('#duplicate-namespace').text()).toEqual('cannot have duplicate namespace');
  });

  it('should update a namespace', () => {
    let source = { namespace: {id: '123', value: 'anyRandomValue'}, uiId: {id: '456'}};
    const setSource = newSource => source = newSource;
    const entry = ['namespace', {id: '123', value: 'anyRandomValue'}];
    const requiredSourceFields = shallow(<RequiredSourceField entry={entry} source={source} setSource={setSource} sources={[source]}/>);
    const valueTextBox = requiredSourceFields.find('#value-field');
    valueTextBox.simulate('change', {target: {value: 'changedValue'}});
    requiredSourceFields.update();
    expect(Object.keys(source).length).toEqual(2);
    expect(source.namespace.value).toEqual('changedValue');
  });
});
