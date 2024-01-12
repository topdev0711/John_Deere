import LineageGraph from '../../../components/lineage/LineageGraph';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

jest.mock('next/router')

describe('LineageGraph test suite', () => {
  it('should render', () => {
    const wrapper = shallow(<LineageGraph graph={{nodes: [{id: '1@1', label: '1', group: 1}], edges: []}} allDatasets={[]} />)
    expect(wrapper).toBeDefined()
  })

})
