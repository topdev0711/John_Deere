import CommentHistory from '../../components/CommentHistory';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

const communityPendingApproval = {
  approvedBy: null,
  approverEmail: 'AWS-GIT-DWIS-DEV@JohnDeere.com',
  comment: null,
  commentHistory: [],
  community: {
    approver: 'AWS-GIT-DWIS-DEV',
    id: 'a521b7d4-642c-4524-9c46-e4fa5e836a17',
    name: 'Systems'
  },
  status: 'PENDING',
  updatedAt: null
};

const communityRejectedApproval = {
  approvedBy: 'other-user',
  approverEmail: 'AWS-GIT-DWIS-DEV@JohnDeere.com',
  comment: null,
  commentHistory: [{ comment: 'rejected due to lack of proper description', status: 'REJECTED', updatedAt: '2021-09-01T12:10:00.000Z', updatedBy: 'other-user' }],
  community: {
    approver: 'AWS-GIT-DWIS-DEV',
    id: 'a521b7d4-642c-4524-9c46-e4fa5e836a17',
    name: 'Systems'
  },
  status: 'REJECTED',
  updatedAt: '2021-09-01T12:10:00.000Z',
  reason: 'rejected due to lack of proper description'
};

const subCommunityRejectedApproval = {
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
};

const custodianRejectedApproval = {
  approvedBy: 'other-user',
  approverEmail: 'AWS-GIT-DWIS-ADMIN@JohnDeere.com',
  comment: null,
  commentHistory: [{ comment: 'rejected due to lack of proper description', status: 'REJECTED', updatedAt: '2021-09-01T12:10:00.000Z', updatedBy: 'other-user' }],
  custodian: 'AWS-GIT-DWIS-ADMIN',
  status: 'REJECTED',
  updatedAt: '2021-09-01T12:10:00.000Z',
  reason: 'rejected due to lack of proper description'
};

const groupOwnerApproval = {
  approvedBy: 'another-user',
  approverEmail: 'another-user@deere.com,some-other-user@deere.com',
  comment: 'Auto approved by group owner submission.',
  commentHistory: [{ status: 'APPROVED', updatedBy: 'lrn1o2m', updatedAt: '2021-09-01T17:10:56.152Z', comment: 'Auto approved by group owner submission.' }],
  owner: 'owner/backup-owner',
  status: 'APPROVED',
  updatedAt: '2021-09-01T12:10:00.000Z',
  reason: 'Auto approved by group owner submission.'
};

describe('CommentHistory test suite', () => {
  const commentHistory = [
    {
      updatedBy: 'some-user',
      updatedAt: '2021-09-01T12:00:00.000Z',
      comment: 'some-comment'
    }
  ];
  const datasetRejectedApprovalsWithCommunity = [communityRejectedApproval, custodianRejectedApproval];
  const datasetRejectedApprovalsWithSubCommunity = [subCommunityRejectedApproval, custodianRejectedApproval];
  const permissionApprovals = [communityPendingApproval, groupOwnerApproval];


  it('should render commentHistory for rejected dataset with community', () => {
    const wrapper = mount(<CommentHistory commentHistory={commentHistory} approvals={datasetRejectedApprovalsWithCommunity} />);
    const requestComment = wrapper.find('div').filterWhere(s => s.props().id === 'requestComment');
    const approverInfo = wrapper.find('span').filterWhere(s => s.props().id === 'approver');
    const statusComment = wrapper.find('div').filterWhere(s => s.props().id === 'statusComment');

    expect(requestComment.text()).toContain('some-comment');
    expect(approverInfo.at(0).text()).toContain('Community: Systems');
    expect(approverInfo.at(1).text()).toContain('AD Group: AWS-GIT-DWIS-ADMIN');
    expect(statusComment.at(0).text()).toContain('REJECTED: rejected due to lack of proper description');
    expect(statusComment.at(1).text()).toContain('REJECTED: rejected due to lack of proper description');
  });

  it('should render commentHistory for rejected dataset with sub-community', () => {
    const wrapper = mount(<CommentHistory commentHistory={commentHistory} approvals={datasetRejectedApprovalsWithSubCommunity} />);
    const requestComment = wrapper.find('div').filterWhere(s => s.props().id === 'requestComment');
    const approverInfo = wrapper.find('span').filterWhere(s => s.props().id === 'approver');
    const statusComment = wrapper.find('div').filterWhere(s => s.props().id === 'statusComment');

    expect(requestComment.text()).toContain('some-comment');
    expect(approverInfo.at(0).text()).toContain('SubCommunity: Technical Proficiency');
    expect(approverInfo.at(1).text()).toContain('AD Group: AWS-GIT-DWIS-ADMIN');
    expect(statusComment.at(0).text()).toContain('REJECTED: rejected due to lack of proper description');
    expect(statusComment.at(1).text()).toContain('REJECTED: rejected due to lack of proper description');
  });

  it('should render commentHistory for pending and owner auto-approved permission', () => {
    const wrapper = mount(<CommentHistory commentHistory={commentHistory} approvals={permissionApprovals} />);
    const requestComment = wrapper.find('div').filterWhere(s => s.props().id === 'requestComment');
    const approverInfo = wrapper.find('span').filterWhere(s => s.props().id === 'approver');
    const statusComment = wrapper.find('div').filterWhere(s => s.props().id === 'statusComment');

    expect(requestComment.text()).toContain('some-comment');
    expect(approverInfo.at(0).text()).toContain('Owner: owner/backup-owner');
    expect(statusComment.at(0).text()).toContain('APPROVED: Auto approved by group owner submission.');
  });

  it('should return commentHistory empty array for if commentHistory is undefined', () => {
    const wrapper = mount(<CommentHistory commentHistory={null} approvals={permissionApprovals} />);
    const requestComment = wrapper.find('div').filterWhere(s => s.props().id === 'requestComment');
    const approverInfo = wrapper.find('span').filterWhere(s => s.props().id === 'approver');
    const statusComment = wrapper.find('div').filterWhere(s => s.props().id === 'statusComment');

    expect(requestComment.length).toEqual(0);
    expect(approverInfo.at(0).text()).toContain('Owner: owner/backup-owner');
    expect(statusComment.at(0).text()).toContain('APPROVED: Auto approved by group owner submission.');
  });

  it('should return approvals empty array for if approvals is undefined', () => {
    const wrapper = mount(<CommentHistory commentHistory={commentHistory} approvals={null} />);
    const requestComment = wrapper.find('div').filterWhere(s => s.props().id === 'requestComment');
    const approverInfo = wrapper.find('span').filterWhere(s => s.props().id === 'approver');

    expect(requestComment.text()).toContain('some-comment');
    expect(approverInfo.length).toEqual(0);
  });
});
