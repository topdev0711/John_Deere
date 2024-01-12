
// Unpublished Work © 2022 Deere & Company.
import Adapter from 'enzyme-adapter-react-16';
import { configure, mount } from 'enzyme';
import DiagramNode from '../../../components/lineage/DiagramNode';
import { Popover } from 'react-bootstrap';
configure({ adapter: new Adapter() });

describe('DiagramNode test', () => {
    it('should render popover element when hover', async () => {
        const namespace = 'test.namespace';
        const attributes = [{
            label: 'Type',
            value: 'rds'
        }];

        const wrapper = mount(<DiagramNode namespace={namespace} attributes={attributes} />);
        const popover = wrapper.find(Popover);
        expect(popover.exists).toBeTruthy();
    });
});