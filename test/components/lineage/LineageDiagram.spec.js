
import LineageDiagram from '../../../components/lineage/LineageDiagram';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

describe('LineageDiagram test suite', () => {
    it('should render diagram', () => {
      const wrapper = shallow(<LineageDiagram/>)
      expect(wrapper).toBeDefined()
    })
  
  })
  