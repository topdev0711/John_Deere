
import DropdownSchema from '../../../components/lineage/DropdownSchema';
import Adapter from 'enzyme-adapter-react-16';
import { configure, mount } from 'enzyme';
import Select from '../../../components/Select';
configure({ adapter: new Adapter() });

const schemasList = jest.fn();

describe('DropdownSchema TestSuite', () => {
    it('should select resource when resource is selected from the dropdown', async () => {
        const wrapper = mount(<DropdownSchema schemasList={schemasList} />);
        const resource = wrapper.find(Select).filterWhere(input => input.props().instanceId === 'resource');
        expect(resource.props().instanceId).toEqual('resource');
        
    });

});