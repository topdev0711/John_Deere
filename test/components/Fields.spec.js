import { configure, shallow } from 'enzyme';
import Fields from '../../components/Fields';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });
const exampleFields = [{
  name: 'field_a',
  datatype: {name: 'int', id: 'int'},
  attribute: {name: 'None', id: 'None'}
}];

describe('Field component test', () => {
  it('should render', () => {
    const wrapper = shallow(<Fields />);
    expect(wrapper).toBeDefined();
  });

  it('should render fields', () => {
    const wrapper = shallow(<Fields fields={exampleFields}/>);
    expect(wrapper.text()).toContain(exampleFields[0].name);
  });

  it('should specify if Int', () => {
    const wrapper = shallow(<Fields fields={exampleFields}/>);
    const hashId = wrapper.find('FaHashtag');
    expect(hashId).toBeDefined();
  });

  it('should specify if unique id', () => {
    const alteredFields = [{...exampleFields[0], attribute: 'id'}]
    const wrapper = shallow(<Fields fields={alteredFields}/>);
    const hashId = wrapper.find('MdVpnKey');
    expect(hashId).toBeDefined();
  });

  it('should specify if nullable', () => {
    const alteredFields = [{...exampleFields[0], nullable: true}]
    const wrapper = shallow(<Fields fields={alteredFields}/>);
    const hashId = wrapper.find('FaQuestion');
    expect(hashId).toBeDefined();
  });
});