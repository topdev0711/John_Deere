import ApproverComment from "../../components/ApproverComment";
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

describe('ApproverComment test suite', () => {
  const updatedAt = '2021-09-01T12:00:00.000';
  const updatedBy = 'some-user';
  const approvedComment = 'user approved';
  const rejectedComment = 'user rejected';
  const approver = 'some-approver';
  const APPROVED = 'APPROVED';
  const REJECTED = 'REJECTED';

  it('should render comment for approved', () => {
    const wrapper = shallow(<ApproverComment updatedAt={updatedAt} updatedBy={updatedBy} status={APPROVED} approver={approver} comment={approvedComment} />);
    const updateInfo = wrapper.find('div').filterWhere(d => d.props().id === 'updateInfo');
    const approverInfo = wrapper.find('span').filterWhere(s => s.props().id === 'approver');
    const approverComment = wrapper.find('div').filterWhere(d => d.props().id === 'statusComment');

    expect(wrapper).toBeDefined();
    expect(updateInfo.text()).toContain('01 Sep 2021 12:00');
    expect(approverInfo.at(0).text()).toContain(approver);
    expect(approverComment.at(0).text()).toContain('APPROVED: user approved');
  });

  it('should render comment for rejected', () => {
    const wrapper = shallow(<ApproverComment updatedAt={updatedAt} updatedBy={updatedBy} status={REJECTED} approver={approver} comment={rejectedComment} />);
    const updateInfo = wrapper.find('div').filterWhere(d => d.props().id === 'updateInfo');
    const approverInfo = wrapper.find('span').filterWhere(s => s.props().id === 'approver');
    const approverComment = wrapper.find('div').filterWhere(d => d.props().id === 'statusComment');

    expect(wrapper).toBeDefined();
    expect(updateInfo.text()).toContain('01 Sep 2021 12:00');
    expect(approverInfo.at(0).text()).toContain(approver);
    expect(approverComment.at(0).text()).toContain('REJECTED: user rejected');
  });
})