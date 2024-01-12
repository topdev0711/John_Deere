const activeDirectoryDao = require('../../../src/data/ldap/activeDirectoryDao');
const approvalService = require('../../../src/services/approvalService');
const conf = require('../../../conf');
const permissionApprovalService = require('../../../src/services/permissionApprovalService');
const { APPROVED, PENDING } = require('../../../src/services/statusService');

const {resetAllWhenMocks} = require('jest-when');

const spyConf = jest.spyOn(conf, 'getConfig');
const getEnvConf = jest.spyOn(conf, 'getEnv');
jest.mock('../../../src/services/approvalService');
jest.mock('../../../src/data/ldap/activeDirectoryDao');

describe('Permission Approval Service Tests', () => {
  const owner = {name: 'user1', email: 'username1@jdnet.deere.com', username: 'username1'};
  const backupOwner = {name: 'user2', email: 'username2@jdnet.deere.com', username: 'username2'};
  const ownerEmails = `${owner.email},${backupOwner.email}`;

  const mockDate = new Date();
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
  const testTime = mockDate.toISOString();
  const getItem = record => record.items;

  function createPermission(updatedBy = 'username1') {
    return {
      items: [{community: {id: '1'}, subCommunity: {id: '1a'}}],
      custodian: 'FamilyGuy',
      roleType: 'human',
      updatedBy
    };
  }

  function createPendingApproval(approverEmail) {
    return {
      status: PENDING,
      approvedBy: null,
      approverEmail,
      comment: null,
      updatedAt: null
    };
  }

  beforeEach(() => {
    resetAllWhenMocks();
    const approvals = [
      {...createPendingApproval("foo@JohnDeere.com"), community: '1'},
      {...createPendingApproval("FamilyGuy@JohnDeere.com"), custodian: 'FamilyGuy'},
    ];
    const record = {...createPermission(), approvals};
    approvalService.addApprovals.mockResolvedValue(record);
    approvalService.pendingApprove.mockReturnValueOnce({ approvedBy: null, status: PENDING, comment: null, updatedAt: null});
  });

  it('should throw error when failed to search active directory', async () => {
    activeDirectoryDao.findOwners.mockRejectedValueOnce('some error');
    const record = createPermission('username3');
    const result = permissionApprovalService.addApprovals(record, null, getItem);
    await expect(result).rejects.toEqual('some error')
  });

  it('should add approvals for a permission with deref community and owners when owners approvers present and approval submitted by non-owner', async () => {
    spyConf.mockImplementation(() => ({isLocal: false}));
    getEnvConf.mockReturnValueOnce('prod');
    activeDirectoryDao.findOwners.mockResolvedValueOnce({owner, backupOwner});
    const record = createPermission('username3');

    const {approvals: actualApprovals} = await permissionApprovalService.addApprovals(record, null, getItem);

    const expectedApprovals = [
      {...createPendingApproval('foo@JohnDeere.com'), community: '1'},
      {...createPendingApproval(ownerEmails), owner: 'user1/user2', commentHistory: []}
    ];

    expect(actualApprovals).toEqual(expectedApprovals);
  });
  it('should auto approve when when permission invalid', async () => {
    const approvals = [
      {...createPendingApproval("foo@JohnDeere.com"), community: '1'},
      {...createPendingApproval("FamilyGuy@JohnDeere.com"), custodian: 'FamilyGuy'},
    ];
    const record = {...createPermission(), approvals};

    record.requestComments = 'EDL Auto Approved - Invalid Permission';
    record.updatedBy = '0oay8xbj7krMjUFds0h7';
    record.status = "PENDING"

    approvalService.addApprovals.mockResolvedValue(record);
    const result = await permissionApprovalService.addApprovals(record, null, getItem);
    expect(result.status).toEqual('APPROVED');
  });
  it('should not auto approve when when permission valid', async () => {
    const approvals = [
      {...createPendingApproval("foo@JohnDeere.com"), community: '1'},
      {...createPendingApproval("FamilyGuy@JohnDeere.com"), custodian: 'FamilyGuy'},
    ];
    const record = {...createPermission(), approvals};

    record.requestComments = 'NO COMMENT';
    record.updatedBy = '0oay8xbj7krMjUFds0h7';
    record.status = "PENDING"

    approvalService.addApprovals.mockResolvedValue(record);
    activeDirectoryDao.findOwners.mockResolvedValueOnce({owner, backupOwner});

    const result = await permissionApprovalService.addApprovals(record, null, getItem);
    expect(result.status).toEqual('PENDING');
  });

  it('should add approvals for a permission with deref community and owners when owners approvers present and approval submitted by owner', async () => {
    activeDirectoryDao.findOwners.mockResolvedValueOnce({owner, backupOwner});
    const record = createPermission();
    const {approvals: actualApprovals} = await permissionApprovalService.addApprovals(record, null, getItem);

    const expectedAppovals = [
      {...createPendingApproval('foo@JohnDeere.com'), community: '1'},
      {
        approvedBy: 'username1',
        approverEmail: 'username1@jdnet.deere.com,username2@jdnet.deere.com',
        comment: 'Auto approved by group owner submission.',
        commentHistory: [
          {
            comment: 'Auto approved by group owner submission.',
            status: 'APPROVED',
            updatedAt: expect.anything(),
            updatedBy: 'username1'
          }
        ],
        reason: 'Auto approved by group owner submission.',
        owner: 'user1/user2',
        status: APPROVED,
        updatedAt: testTime
      }];
    expect(actualApprovals).toEqual(expectedAppovals);
  });
});
