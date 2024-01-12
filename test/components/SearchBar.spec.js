import SearchBar from '../../components/SearchBar';
import { configure, shallow, mount } from 'enzyme';
import React from 'react';
import Adapter from 'enzyme-adapter-react-16';
import { FormControl } from 'react-bootstrap';
import { act } from 'react-dom/test-utils'

configure({ adapter: new Adapter() });

describe('SearchBar component test suite', () => {
  it('verify component renders', () => {
    const wrapper = shallow(<SearchBar items={[]} onChange={() => {}} />)
    expect(wrapper).toBeDefined()
  })

  it('verify component filters and sends results', () => {
    const callback = jest.fn()
    const wrapper = mount(<SearchBar items={[{ foo: 'bar' }, { foo: 'baz' }]} onChange={callback} />)
    const input = wrapper.find(FormControl).at(0)
    
    act(() => {
      input.props().onChange({target: {value: 'baz'}})
    })

    expect(input).toHaveLength(1)
    expect(callback).toHaveBeenCalledWith([{foo: 'baz'}], 'baz')
  })
 
})
