import DatasetSchemaSelector from '../../../../components/datasets/edit/DatasetSchemaSelector';
import Select from '../../../../components/Select';
import { Modal, Button } from 'react-bootstrap'
import { shallow } from 'enzyme';
import React from 'react'
import { act } from 'react-dom/test-utils'
global.fetch = require('jest-fetch-mock');


const fullDataset1 = {
  id: 'foo',
  version: '1',
  name: 'Foo',
  status: 'AVAILABLE',
  schemas: [{
    id: 'schema1',
    name: 'Schema 1',
    fields: []
  }, {
    id: 'schema3',
    name: 'Schema 3',
    fields: []
  }]
}

const datasets = [{
  id: 'foo',
  version: '1',
  name: 'Foo',
  schemas: ['schema1'],
  phase: { name: 'raw' }
}, {
  id: 'bar',
  version: '1',
  name: 'Bar',
  schemas: ['schema2'],
  phase: { name: 'raw' }
  }, {
  id: 'baz',
  version: '1',
  name: 'Baz',
  schemas: [],
  phase: { name: 'raw' }
}]

describe('Accordion component test suite', () => {
  afterEach(() => {
    fetch.resetMocks()
  })

  it('verify component renders', () => {
    const wrapper = shallow(<DatasetSchemaSelector />)
    expect(wrapper).toBeDefined
  })

  it('verify component renders with datasets', () => {
    const wrapper = shallow(<DatasetSchemaSelector datasets={datasets} />)
    const select = wrapper.find(Select).at(0)
    expect(select.props().options).toHaveLength(2)
    expect(select.props().options[0].name).toEqual('Foo')
    expect(select.props().options[1].name).toEqual('Bar')
  })

  it('verify component fetches schemas', () => {
    const wrapper = shallow(<DatasetSchemaSelector datasets={datasets} />)
    fetch.mockResponse(JSON.stringify(fullDataset1))
    const select = wrapper.find(Select).at(0)

    act(() => {
      select.props().onChange(datasets[0])
    })

    expect(fetch.mock.calls).toHaveLength(1)
    wrapper.setState({ schemas: fullDataset1.schemas })
    const items = wrapper.find(Select)
    expect(wrapper.state().schemas).toEqual(fullDataset1.schemas)
    expect(items.at(1).props().options).toHaveLength(2)
  })

  it('verify component presents schema', () => {
    const wrapper = shallow(<DatasetSchemaSelector datasets={datasets} />)
    fetch.mockResponse(JSON.stringify(fullDataset1))
    const select = wrapper.find(Select).at(0)

    act(() => {
      select.props().onChange(datasets[0])
    })

    wrapper.setState({ schemas: fullDataset1.schemas })

    const items = wrapper.find(Select)

    act(() => {
      items.at(1).props().onChange(fullDataset1.schemas[0])
    })

    expect(wrapper.state().selectedSchema).toEqual(fullDataset1.schemas[0])
  })

  it('verify component notifies parent when selecting schema', () => {
    const callback = jest.fn()
    const wrapper = shallow(<DatasetSchemaSelector datasets={datasets} onSchemaSelected={callback} />)
    fetch.mockResponse(JSON.stringify(fullDataset1))
    const select = wrapper.find(Select).at(0)

    act(() => {
      select.props().onChange(datasets[0])
    })

    wrapper.setState({ schemas: fullDataset1.schemas, showPreview: true, selectedSchema: fullDataset1.schemas[0] })

    act(() => {
      wrapper.find(Button).at(1).props().onClick()
    })

    expect(callback).toHaveBeenCalledWith({dataset: datasets[0], schema: fullDataset1.schemas[0]})
  })

  it('verify component does not display blacklisted schemas', () => {
    const wrapper = shallow(<DatasetSchemaSelector datasets={datasets} blacklist={['schema1']} />)
    fetch.mockResponse(JSON.stringify(fullDataset1))
    const select = wrapper.find(Modal).find(Modal.Body).find(Select).at(0)

    act(() => {
      select.props().onChange(datasets[0])
    })

    expect(fetch.mock.calls).toHaveLength(1)
    wrapper.setState({ schemas: fullDataset1.schemas })
    const items = wrapper.find(Select)
    expect(wrapper.state().schemas).toEqual(fullDataset1.schemas)
    expect(items.at(1).props().options).toHaveLength(1)
  })
})
