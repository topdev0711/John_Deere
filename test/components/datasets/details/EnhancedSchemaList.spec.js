import EnhancedSchemaList from '../../../../components/datasets/details/EnhancedSchemaList';
import { mount } from 'enzyme';
import React from 'react';
import { ListGroupItem} from 'react-bootstrap';

const consolidatedSchemas = [{
  id: 'foo--1',
  name: 'foo1',
  versions: ['1.0.0', '1.0,1']
}]

const consolidatedSchema = {
  id: 'foo-1'
}
const setSelectedConsolidatedSchema = () => {}
describe('Enhanced Schema List component test suite', () => {
  afterEach(() => {jest.restoreAllMocks()});

  it('verify component renders one element', () => {
    const wrapper = mount(
      <EnhancedSchemaList
        consolidatedSchemas={consolidatedSchemas}
        selectedConsolidatedSchema={consolidatedSchema}
        setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}
      />
    )
    expect(wrapper.find(ListGroupItem)).toHaveLength(1)
    expect(wrapper).toBeDefined()
  });

  it('verify component renders three element', () => {

    let consolidatedSchemasArr = [ {...consolidatedSchemas[0]}, {...consolidatedSchemas[0], id: 'foo--2', name: 'foo2'}
              , {...consolidatedSchemas[0], id: 'foo--3', name: 'foo3'}];
    console.log(JSON.stringify(consolidatedSchemasArr));
    const wrapper = mount(
      <EnhancedSchemaList
        consolidatedSchemas={consolidatedSchemasArr}
        selectedConsolidatedSchema={consolidatedSchema}
        setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}
      />
    )
    expect(wrapper.find(ListGroupItem)).toHaveLength(3)
    expect(wrapper).toBeDefined()
  });

  it('should default to showing the schemas in alphabetical order', () => {
    let consolidatedSchemasArr = [ {...consolidatedSchemas[0]}, {...consolidatedSchemas[0], id: 'foo--2', name: 'foo2'}
      , {...consolidatedSchemas[0], id: 'foo--3', name: 'foo3'}];
    const wrapper = mount(
      <EnhancedSchemaList
        consolidatedSchemas={consolidatedSchemasArr}
        selectedConsolidatedSchema={consolidatedSchema}
        setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}
      />
    )
    const schemasList = wrapper.find(ListGroupItem)
    expect(schemasList.at(0).find('.schemaListName').text()).toEqual('foo1')
    expect(schemasList.at(1).find('.schemaListName').text()).toEqual('foo2')
    expect(schemasList.at(2).find('.schemaListName').text()).toEqual('foo3')
  });

  it('should show schemas in reverse alphabetical order after pressing sort button', () => {
    let consolidatedSchemasArr = [ {...consolidatedSchemas[0]}, {...consolidatedSchemas[0], id: 'foo--2', name: 'foo2'}
      , {...consolidatedSchemas[0], id: 'foo--3', name: 'foo3'}];
    const wrapper = mount(
      <EnhancedSchemaList
        consolidatedSchemas={consolidatedSchemasArr}
        selectedConsolidatedSchema={consolidatedSchema}
        setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}
      />
    )
    const sortButton = wrapper.find('.schemaSortButton').at(0);
    sortButton.simulate('click');
    const schemasList = wrapper.find(ListGroupItem)
    expect(schemasList.at(0).find('.schemaListName').text()).toEqual('foo3')
    expect(schemasList.at(1).find('.schemaListName').text()).toEqual('foo2')
    expect(schemasList.at(2).find('.schemaListName').text()).toEqual('foo1')
  })

  it('should show schemas in alphabetical order after pressing sort button twice', () => {
    let consolidatedSchemasArr = [ {...consolidatedSchemas[0]}, {...consolidatedSchemas[0], id: 'foo--2', name: 'foo2'}
      , {...consolidatedSchemas[0], id: 'foo--3', name: 'foo3'}];
    const wrapper = mount(
      <EnhancedSchemaList
        consolidatedSchemas={consolidatedSchemasArr}
        selectedConsolidatedSchema={consolidatedSchema}
        setSelectedConsolidatedSchema={setSelectedConsolidatedSchema}
      />
    )
    const sortButton = wrapper.find('.schemaSortButton').at(0);
    sortButton.simulate('click');
    sortButton.simulate('click');
    const schemasList = wrapper.find(ListGroupItem)
    expect(schemasList.at(0).find('.schemaListName').text()).toEqual('foo1')
    expect(schemasList.at(1).find('.schemaListName').text()).toEqual('foo2')
    expect(schemasList.at(2).find('.schemaListName').text()).toEqual('foo3')
  })
})
