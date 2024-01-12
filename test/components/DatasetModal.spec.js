import DatasetModal from '../../components/DatasetModal';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { act } from 'react-dom/test-utils'
import React from 'react';
import { Spinner, Button } from 'react-bootstrap';

configure({ adapter: new Adapter() });

jest.mock('next/router')

describe('DatasetModal test suite', () => {
  it('should render without dataset', () => {
    const wrapper = shallow(<DatasetModal />)
    expect(wrapper).toBeDefined()
  })

  it('should handle click', () => {
    const callback = jest.fn()
    const wrapper = shallow(<DatasetModal dataset={{ id: 'foo', version: 1 }} onCancel={callback} />)
    const button = wrapper.find(Button).at(1)
    button.simulate('click')
    expect(callback).toHaveBeenCalled()
  })

  it('should render with dataset and loader', () => {
    const wrapper = shallow(<DatasetModal dataset={{ id: 'foo', version: 1 }} isLoading />)
    expect(wrapper.find(Spinner)).toHaveLength(1)
    expect(wrapper).toBeDefined()
  })
})
