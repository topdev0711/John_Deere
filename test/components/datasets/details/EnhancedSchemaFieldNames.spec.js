import EnhancedSchemaFieldNames from '../../../../components/datasets/details/EnhancedSchemaFieldNames';
import { mount, shallow } from 'enzyme';
import React from 'react';

const selectedSchema = {
  id: "id1",
  fields: [{"attribute": "id", "name": "field1", nullable: true, datatype: "short"}]
};

describe('Enhanced Schema Field Names component test suite', () => {
  afterEach(() => {jest.restoreAllMocks()});

  it('is blank when there is no selected schema', () => {
    const enhanceSchemaFieldNames = shallow(<EnhancedSchemaFieldNames />)
    expect(enhanceSchemaFieldNames.exists('div')).toEqual(false);
  });

  it('is blank when there is an error in schema', () => {
    const enhanceSchemaFieldNames = shallow(<EnhancedSchemaFieldNames selectedSchema={{error: 'some error'}}/>)
    expect(enhanceSchemaFieldNames.exists('div')).toEqual(false);
  });

  it('verify component renders one element', () => {
    const wrapper = mount(<EnhancedSchemaFieldNames selectedSchema={selectedSchema}/>)
    const table = wrapper.find('table');
    const row = table.find('tr')
    expect(row).toHaveLength(2);
    expect(wrapper).toBeDefined();
  });

  it('verify component renders three element', () => {
    const fieldsArr = [ {...selectedSchema.fields[0]}, {...selectedSchema.fields[0], name: 'field2'}, {...selectedSchema.fields[0], name: 'field3'}];
    const finalOutput = { id: 'id1', fields: fieldsArr}
    const wrapper = mount(<EnhancedSchemaFieldNames selectedSchema={finalOutput}/>)
    const table = wrapper.find('table');
    const row = table.find('tr')
    expect(row).toHaveLength(4);
    expect(wrapper).toBeDefined();
  });
});
