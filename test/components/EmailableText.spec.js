import Adapter from 'enzyme-adapter-react-16';
import { configure, shallow } from 'enzyme';
import EmailableText from '../../components/EmailableText';
import utils from '../../components/utils';
import { Button, OverlayTrigger } from 'react-bootstrap';

configure({ adapter: new Adapter() });

jest.mock('../../components/utils.js')

describe('EmailableText test suite', () => {
  it('should send email to default email address', () => {
    const wrapper = shallow(<EmailableText>some text</EmailableText>)
    const button = wrapper.find(Button).at(0)
    button.simulate('click')
    expect(utils.sendEmail).toHaveBeenCalledWith('mailto:sometext@deere.com')
  })
  it('should send email to provided email address', () => {
    const wrapper = shallow(<EmailableText email="foobar@johndeere.com">some text</EmailableText>)
    const button = wrapper.find(Button).at(0)
    button.simulate('click')
    expect(utils.sendEmail).toHaveBeenCalledWith('mailto:foobar@johndeere.com')
  })

  it('should update tip placement based on prop', () => {
    const expectedPlacement = 'right';
    const wrapper = shallow(<EmailableText email="foobar@johndeere.com" placement={expectedPlacement}>some text</EmailableText>)
    const tip = wrapper.find(OverlayTrigger).filterWhere(tip => tip.props().id === `foobar@johndeere.com-tip-trigger`);
    expect(tip.props().placement).toEqual(expectedPlacement)
  });
})
