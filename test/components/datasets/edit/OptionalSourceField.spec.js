// Unpublished Work © 2022 Deere & Company.
import { shallow } from 'enzyme';
import React from 'react';
import {Button} from 'react-bootstrap';
import OptionalSourceField from '../../../../components/datasets/edit/OptionalSourceField';

describe('optional source field tests', () => {
    it('should delete a row from the source', async () => {
        let source = { randomKey: {id: '123', value: 'anyRandomValue'}, uiId: {id: '456'}};
        const setSource = newSource => source = newSource;
        const entry = ['randomKey', {id: '123', value: 'anyRandomValue'}];
        const wrapper = shallow(<OptionalSourceField entry={entry} source={source} setSource={setSource}/>);
        const removeFieldButton = wrapper.find(Button);
        removeFieldButton.simulate('click');
        wrapper.update();
        expect(Object.keys(source).length).toEqual(1);
        expect(source.uiId.id).toEqual('456');
    });

    it('should save a changed key', () => {
        let source = { randomKey: {id: '123', value: 'anyRandomValue'}, uiId: {id: '456'}};
        const setSource = newSource => source = newSource;
        const entry = ['randomKey', {id: '123', value: 'anyRandomValue'}];
        const wrapper = shallow(<OptionalSourceField entry={entry} source={source} setSource={setSource}/>);
        const keyTextBox = wrapper.find('#key-field');
        keyTextBox.simulate('change', {target: {value: 'changedKey'}});
        wrapper.update();
        expect(Object.keys(source).length).toEqual(2);
        expect(Object.keys(source)).toContain('changedKey');
        expect(Object.keys(source)).not.toContain('randomKey');
    });

    it('should save a changed value', () => {
        let source = { randomKey: {id: '123', value: 'anyRandomValue'}, uiId: {id: '456'}};
        const setSource = newSource => source = newSource;
        const entry = ['randomKey', {id: '123', value: 'anyRandomValue'}];
        const wrapper = shallow(<OptionalSourceField entry={entry} source={source} setSource={setSource}/>)
        const valueTextBox = wrapper.find('#value-field');
        valueTextBox.simulate('change', {target: {value: 'changedValue'}});
        wrapper.update();
        expect(Object.keys(source).length).toEqual(2);
        expect(source.randomKey.value).toEqual('changedValue');
    });
});
