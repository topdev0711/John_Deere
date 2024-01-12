import Accordion from '../../components/Accordion';
import { Accordion as ReactAccordion, Button, Col, Dropdown, DropdownButton, FormControl} from 'react-bootstrap'
import Adapter from 'enzyme-adapter-react-16';
import { configure, shallow, mount } from 'enzyme';
import Card from 'react-bootstrap/Card';
import React from 'react'
import SearchBar from '../../components/SearchBar';

configure({ adapter: new Adapter() });

const example = {
    items: [{
        id: 1,
        header: 'Foo:',
        body: 'bar',
        onRemove: () => {}
    },
    {
        id: 2,
        header: 'Foo2:',
        body: 'bar1',
        deleteDisabled: true
    },
    {
        id: 3,
        header: 'Foo2:',
        body: 'bar1'
    }]
}


describe('Accordion component test suite', () =>{
    it('verify component renders', () => {
        const wrapper = shallow(<Accordion />)
        expect(wrapper).toBeDefined
    })
        
    it('Accordion initalizes with input parameters', () => {    
        const wrapper = mount(<Accordion items={example.items}/>)
        const headers= wrapper.find(Card.Header)
        const bodies = wrapper.find(Card.Body)
        expect(headers).toHaveLength(3)
        expect(headers.at(0).text()).toMatch(/Foo:/)
        expect(bodies).toHaveLength(3)
        expect(bodies.at(0).text()).toEqual('bar')
    })
        
    it('Accordion initalizes with actions dropdown', () => {    
        const handler = jest.fn()
        const wrapper = shallow(<Accordion items={[{
            id: 1,
            header: 'Foo:',
            body: 'bar',
            actions: [{ text: 'Delete', icon: 'Icon', handler }]
        }]}/>)
        const button = wrapper.find(Button)
        expect(button).toHaveLength(1)
        button.at(0).simulate('click')
        expect(handler).toHaveBeenCalledTimes(1)
    })
        
    it('Accordion initalizes with header accessory', () => {    
        const wrapper = shallow(<Accordion items={[{
            id: 1,
            header: 'Foo:',
            body: 'bar',
            headerAccessory: 'baz',
            actions: []
        }]}/>)
        const accessory = wrapper.find('span').filterWhere(item => item.props().testlocator === 'headerAccessory')
        expect(accessory.at(0).text()).toEqual('baz')
    })

    it('Accordion expands and collapses', () => {
        const setActive = jest.fn()
        const useStateSpy = jest.spyOn(React, "useState")
        useStateSpy.mockImplementation(init => [init, setActive])
        const wrapper = mount(<Accordion items={example.items}/>)
        const toggle = wrapper.find(ReactAccordion.Toggle)
        toggle.at(0).simulate("click")
        const headers = wrapper.find(Card.Header)

        expect(setActive).toHaveBeenCalledTimes(1)
        expect(setActive).toHaveBeenCalledWith(1)
        expect(headers.at(0).text()).toMatch(/Foo:/)
    })

    it('Accordion filtering works', () => {
        const wrapper = mount(
            <Accordion 
                filterable 
                items={example.items.concat(example.items).map((item, i) => {
                    const newItem = {...item, id: i}
                    return {
                        ...newItem,
                        filterContent: newItem
                    }
                })} 
            />
        )
        let toggles = wrapper.find(ReactAccordion.Toggle)

        expect(toggles).toHaveLength(6)
        
        const searchBar = wrapper.find(SearchBar).find(FormControl)
        
        searchBar.simulate('change', { target: { value: 'Foo:' }})
        
        toggles = wrapper.find(ReactAccordion.Toggle)
        expect(toggles).toHaveLength(2)
    })

    it('Accordion filtering works', () => {
        const wrapper = mount(
            <Accordion 
                filterable 
                items={example.items.map((item) => {
                    const newItem = {...item}
                    return {
                        ...newItem,
                        filterContent: newItem
                    }
                })} 
            />
        )
        
        const firstDiv = wrapper.find('div').at(0)
        
        expect(firstDiv.props().hidden).toEqual(true)
    })
})


