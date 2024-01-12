import CommentHistorySingle from '../../components/CommentHistorySingle';
import { configure, mount, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

const id = 'some-id';
const version = 1;
const commentHistory = [
  {
    updatedBy: 'some-user',
    updatedAt: '2021-09-01T12:00:00.000Z',
    comment: 'some-comment'
  }
];

const approvals = [{
  approvedBy: 'other-user',
  approverEmail: 'AWS-GIT-DWIS-DEV@JohnDeere.com',
  comment: null,
  commentHistory: [{ comment: 'rejected due to lack of proper description', status: 'REJECTED', updatedAt: '2021-09-01T12:10:00.000Z', updatedBy: 'other-user' }],
  subCommunity: {
    id: "a302f4cd-eeb1-4258-89d7-6ab0f81af0e2",
    name: "Technical Proficiency",
    approver: "AWS-GIT-DWIS-DEV"
  },
  status: 'REJECTED',
  updatedAt: '2021-09-01T12:10:00.000Z',
  reason: 'rejected due to lack of proper description'
}];

describe('CommentHistorySingle tests', () => {
  it('should create an accordion with history', () => {
    const history = mount(<CommentHistorySingle id={id} version={version}  commentHistory={commentHistory} approvals={approvals}/>);
    const historyDiv = history.find('div').filterWhere(div => div.props().id === 'commentHistory');
    expect(historyDiv.contains('Accordion'))
  });
});
