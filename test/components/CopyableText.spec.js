import React from 'react';
import Adapter from 'enzyme-adapter-react-16';
import { configure, shallow, mount } from 'enzyme';
import CopyableText from '../../components/CopyableText';
import utils from '../../components/utils';
import { Button } from 'react-bootstrap';

configure({ adapter: new Adapter() });

describe('CopyableText test suite', () => {
  beforeAll(() => {
  })

  afterEach(() => {
  })

  it('should render with children', () => {
    const wrapper = shallow(<CopyableText>some text</CopyableText>)
    expect(wrapper).toBeDefined()
  })
  
  it('should handle click', () => {
    const callback = jest.fn()
    jest.spyOn(React, 'useState').mockImplementation(init => [init, callback])
    const setAttrSpy = jest.fn()
    const selectSpy = jest.fn()
    const elementSpy = jest.fn().mockImplementation( () => ({
      setAttribute: setAttrSpy,
      select: selectSpy
    }))
    const docSpy = {
      createElement: elementSpy,
      body: { appendChild: jest.fn(), removeChild: jest.fn() },
      execCommand: jest.fn()
    }
    jest.spyOn(utils, 'getDocument').mockReturnValue(docSpy)
    const wrapper = shallow(<CopyableText>some text</CopyableText>)
    wrapper.find(Button).at(0).simulate('click')
    expect(callback).toBeCalledWith(true)
    expect(docSpy.createElement).toBeCalledWith('input')
    expect(docSpy.body.appendChild).toBeCalledTimes(1)
    expect(setAttrSpy.mock.calls[0][0]).toEqual('value')
    expect(setAttrSpy.mock.calls[0][1]).toEqual('some text')
    expect(selectSpy).toBeCalledTimes(1)
    expect(docSpy.execCommand).toBeCalledWith('copy')
    expect(docSpy.body.removeChild).toBeCalledTimes(1)
  })
})
