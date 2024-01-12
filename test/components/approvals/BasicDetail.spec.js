import BasicDetail from "../../../components/approvals/BasicDetail";
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

describe('BasicDetail test suite', () => {
  const updatedAt = '2021-09-01T12:00:00.000';
  const updatedBy = 'some-user';
  const requestComments = 'some-comment';

  it('should render without requestComments', () => {
    const wrapper = shallow(<BasicDetail updatedAt={updatedAt} updatedBy={updatedBy} />);
    const updateInfo = wrapper.find('div').filterWhere(d => d.props().id === 'updateInfo');
    expect(wrapper).toBeDefined();
    expect(updateInfo.text()).toContain('Last Updated 01 Sep 2021 12:00');
  });

  it('should render with requestComments', () => {
    const wrapper = shallow(<BasicDetail updatedAt={updatedAt} updatedBy={updatedBy} requestComments={requestComments} />);
    const comment = wrapper.find('div').filterWhere(d => d.props().id === 'requestComments');
    expect(wrapper).toBeDefined();
    expect(comment.text()).toContain(requestComments);
  });
})
