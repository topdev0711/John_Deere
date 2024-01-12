import CommentHistoryMultipleVersions from '../../components/CommentHistoryMultipleVersions';
import { Button } from 'react-bootstrap';
import { configure, mount, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

const id = 'some-id';
const commentHistory = [
  {
    updatedBy: 'some-user',
    updatedAt: '2021-09-01T12:00:00.000Z',
    comment: 'some-comment'
  }
];

const commentHistory2 = [
  {
    updatedBy: 'any-user',
    updatedAt: '2021-09-01T12:00:00.000Z',
    comment: 'any-comment'
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

const record = {id, version: 1, commentHistory, approvals};
const record2 = {id, version: 2, commentHistory: commentHistory2, approvals};
const records = [record, record2];

const getHistoryButton = history => history.find(Button).filterWhere(b => b.props().id === 'history-button');

describe('CommentHistoryMultipleVersions tests', () => {
  it('should have no button when it is a new permission', () => {
    const history = mount(<CommentHistoryMultipleVersions records={[record]} details={{ loaded: false }}/>);
    expect(getHistoryButton(history)).toHaveLength(0);
  });

  it('should have permission with \'Show More\' button', () => {
    const history = mount(<CommentHistoryMultipleVersions records={records} details={{ loaded: false }}/>);
    const historyButton = getHistoryButton(history);
    expect(historyButton).toHaveLength(1);
    expect(historyButton.text()).toEqual('Show More');
  });

  it('should have permissions with \'Show All Versions\' button', () => {
    const history = mount(<CommentHistoryMultipleVersions records={records} details={{ loaded: true }}/>);
    const historyButton = getHistoryButton(history);
    expect(historyButton).toHaveLength(1);
    expect(historyButton.text()).toEqual('Show All Versions');
  });

  it('should have all permissions and no button', () => {
    const history = mount(<CommentHistoryMultipleVersions records={records} details={{ loaded: true }}/>);
    getHistoryButton(history).simulate('click');
    history.update();
    const historyButton = getHistoryButton(history);
    expect(historyButton).toHaveLength(0);
  });

  it('should have permissions with sorted in descending order', () => {
    const history = mount(<CommentHistoryMultipleVersions records={records} details={{ loaded: true }}/>);
    const commentHistories = history.find('CommentHistory');

    const firstCommentHistoryVersion = commentHistories.at(0).props().version;
    expect(firstCommentHistoryVersion).toEqual(2);

    const secondCommentHistoryVersion = commentHistories.at(1).props().version;
    expect(secondCommentHistoryVersion).toEqual(1);
  });
});
