import Spacer from '../../components/Spacer';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

describe('Spacer component test suite', () => {
  it('verify component renders with defaults', () => {
    const wrapper = shallow(<Spacer />)
    const found = wrapper.find('div')
    expect(found).toHaveLength(1)
    expect(found.props().style).toEqual({ height: '48px' })
  })
  
  it('verify component renders with custom height', () => {
    const wrapper = shallow(<Spacer height="24px" />)
    const found = wrapper.find('div')
    expect(found).toHaveLength(1)
    expect(found.props().style).toEqual({ height: '24px' })
  })
})
