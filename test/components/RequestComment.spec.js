import RequestComment from "../../components/RequestComment";
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

describe('RequestComment test suite', () => {
  const updatedAt = '2021-09-01T12:00:00.000';
  const updatedBy = 'some-user';
  const comment = 'some-comment';

  it('should render without comment', () => {
    const wrapper = shallow(<RequestComment updatedAt={updatedAt} updatedBy={updatedBy} />)
    const updateInfo = wrapper.find('div').filterWhere(d => d.props().id === 'updateInfo');
    const requestComment = wrapper.find('div').filterWhere(d => d.props().id === 'requestComment');

    expect(wrapper).toBeDefined();
    expect(updateInfo.text()).toContain('01 Sep 2021 12:00');
    expect(requestComment.text()).toContain('No comments');
  });

  it('should render with comment', () => {
    const wrapper = shallow(<RequestComment updatedAt={updatedAt} updatedBy={updatedBy} comment={comment} />)
    const updateInfo = wrapper.find('div').filterWhere(d => d.props().id === 'updateInfo');
    const requestComment = wrapper.find('div').filterWhere(d => d.props().id === 'requestComment');
    
    expect(wrapper).toBeDefined();
    expect(updateInfo.text()).toContain('01 Sep 2021 12:00');
    expect(requestComment.text()).toContain(comment);
  });

})
