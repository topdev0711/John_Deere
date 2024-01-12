import Select from '../../components/Select';
import ReactSelect from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { act } from 'react-dom/test-utils';

configure({ adapter: new Adapter() });

const defaultOptions = [{id: 'id', name: 'name'}];

describe('Select component test suite', () => {
  it('verify component renders with defaults', () => {
    const wrapper = shallow(<Select foo="foo" options={defaultOptions} />)
    const found = wrapper.find(ReactSelect)
    const propKeys = Object.keys(found.props());
    expect(found).toHaveLength(1)
    expect(propKeys.includes('foo')).toBeTruthy()
    expect(propKeys.includes('getOptionLabel')).toBeTruthy()
    expect(propKeys.includes('getOptionValue')).toBeTruthy()
    expect(propKeys.includes('styles')).toBeTruthy()
  })

  it('verify component renders with createable', () => {
    const wrapper = shallow(<Select foo="bar" createable options={defaultOptions} />)
    const found = wrapper.find(CreatableSelect)
    const propKeys = Object.keys(found.props());
    expect(found).toHaveLength(1)
    expect(propKeys.includes('foo')).toBeTruthy()
    expect(propKeys.includes('styles')).toBeTruthy()
  })

  it('verify component styles', () => {
    const wrapper = shallow(<Select createable options={defaultOptions} />)
    const found = wrapper.find(CreatableSelect)
    expect(found.prop('styles').option({}, {})).toEqual({ "backgroundColor": "white" })
    expect(found.prop('styles').option({}, { isSelected: true, isDisabled: false })).toEqual({ "backgroundColor": "#367C2B" })
    expect(found.prop('styles').option({}, { isDisabled: true })).toEqual({ "backgroundColor": "white" })
    expect(found.prop('styles').option({}, { isFocused: true, isDisabled: false })).toEqual({ "backgroundColor": "rgba(50,127,36,.25)" })
    expect(found.prop('styles').control({}, {})).toEqual({ "&:hover": { "borderColor": "#666" }, "borderColor": "#666", "borderRadius": "2px", "boxShadow": 0 })
    expect(found.prop('styles').control({}, { isFocused: true })).toEqual({ "&:hover": { "borderColor": "#666" }, "borderColor": "#666", "borderRadius": "2px", "boxShadow": "0 0 0 .1875rem rgba(50,127,36,.25)" })
  })

  it('verify component label functions', () => {
    const wrapper = shallow(<Select options={defaultOptions} />)
    const found = wrapper.find(ReactSelect)
    expect(found.prop('getOptionLabel')({ name: 'Foo' })).toEqual('Foo')
    expect(found.prop('getOptionValue')({ id: 'Foo' })).toEqual('Foo')
  })

  it('verify sorting based on option names with ALL to the top', () => {
    const options = [
      { id: 'one', name: 'zoo' },
      { id: 'two', name: 'TOO' },
      { id: 'three', name: 'about' },
      { id: 'four', name: 'all' }
    ];
    const wrapper = shallow(<Select options={options} />)
    const found = wrapper.find(ReactSelect)
    expect(found.prop('options')).toEqual([
      { id: 'four', name: 'all' },
      { id: 'three', name: 'about' },
      { id: 'two', name: 'TOO' },
      { id: 'one', name: 'zoo' }
    ]);
  });

  it('verify sorting based on option labels', () => {
    const options = [
      { id: 'one', label: 'zoo' },
      { id: 'two', label: 'TOO' }
    ];
    const wrapper = shallow(<Select options={options} />)
    const found = wrapper.find(ReactSelect)
    expect(found.prop('options')).toEqual([
      { id: 'two', label: 'TOO' },
      { id: 'one', label: 'zoo' }
    ]);
  });

  it('should not sort elements if isSorted is true', () => {
    const options = [
      { id: 'one', label: 'zoo' },
      { id: 'two', label: 'TOO' }
    ];
    const wrapper = shallow(<Select isSorted={true} options={options}/>)
    const found = wrapper.find(ReactSelect)
    expect(found.prop('options')).toEqual([
      { id: 'one', label: 'zoo' },
      { id: 'two', label: 'TOO' }
    ]);
  });

  it('verify button render on isApplication true', () => {
    const wrapper = shallow(<Select isApplication={true} text="Create Application" options={defaultOptions} />)
    const {Menu: Menu} = wrapper.find(ReactSelect).prop('components');
    const menuWrapper= shallow(<Menu selectProps={{...wrapper.props()}}/>)
    const showButton = menuWrapper.find('Button')
    const buttonText = showButton.text()
    expect(buttonText).toMatch('Create Application');
  });

})
