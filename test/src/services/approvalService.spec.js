const conf = require('../../../conf');
const approvalService = require('../../../src/services/approvalService');
const referenceService = require('../../../src/services/referenceService');
const schemaDao = require('../../../src/data/schemaDao');
const { APPROVED, AVAILABLE, DELETED, PENDING, PENDING_DELETE, REJECTED } = require('../../../src/services/statusService');
const viewService =  require('../../../src/services/viewService');
const { when, resetAllWhenMocks } = require('jest-when');

jest.mock('../../../src/services/referenceService');
jest.mock('../../../src/data/schemaDao');
jest.mock('../../../src/services/viewService');
jest.mock('../../../src/data/ldap/activeDirectoryDao');

describe('approvals', () => {
  const getItems = record => record.items;
  const getClassifications = record => record.classifications;

  const testGroup = 'FamilyGuy';
  const communityId = testGroup;
  const user = {username: 'Stewie', groups: [testGroup]};

  let testTime;
  let jestDateSpy;
  const systemUser = {username: 'EDL', groups: []};

  const pendingEdlSystem = () => ({
    system: "EDL",
    status: PENDING,
    details: null,
    approvedBy: null,
    updatedAt: null,
    commentHistory: []
  });

  const catalogPendingDelete = () => ({
      system: "Catalog",
      status: PENDING_DELETE,
      updatedAt: testTime
    }
  );

  const catalogPendingDeleteWithNullDetails = () => ({
    system: "Catalog",
    status: PENDING_DELETE,
    details: null,
    approvedBy: null,
    updatedAt: null
  });

  const pendingApproval = (approver, approverEmail) =>
    ({
      ...approver,
      commentHistory: [],
      status: PENDING,
      approvedBy: null,
      approverEmail,
      comment: null,
      updatedAt: null
    });
  const pendingCommunity = (community, approverEmail) => pendingApproval({ community }, approverEmail);
  const pendingCustodian = (custodian, approverEmail) => pendingApproval({ custodian }, approverEmail);
  const pendingSubCommunity = (subCommunity, approverEmail) => pendingApproval({ subCommunity }, approverEmail);

  const approvedApproval = (approver, commentHistory, approverEmail) => (
    {
      ...approver,
      reason: 'user approved',
      status: APPROVED,
      approvedBy: user.username,
      commentHistory,
      ...(approverEmail && {approverEmail}),
      updatedAt: testTime
    }
  );
  const approvedCommunity = (community, commentHistory) => approvedApproval({  community }, commentHistory);
  const approvedCustodian = commentHistory =>
    approvedApproval({  custodian: testGroup }, commentHistory, `${testGroup}@JohnDeere.com`);
  const approvedSubCommunity = (subCommunity, commentHistory) => approvedApproval({ subCommunity }, commentHistory);

  const subCommunity1 = {community: '1',subCommunity: '1a'};
  const subCommunity2 = {community: '2',subCommunity: '2a'};

  const createView = classifications => ([{classifications}]);

  beforeEach(() => {
    resetAllWhenMocks();

    const mockDate = new Date();
    jestDateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    testTime = mockDate.toISOString();

    referenceService.getValue.mockImplementation(communityId => {
      return communityId ? {
          id: communityId,
          approver: testGroup
        } : {
          id: communityId,
          name: 'Not Found',
          label: 'Not Found',
          approver: null
        };
    });

    jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue({
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn()
    });
  });

  afterEach(() => {
    jestDateSpy.mockRestore();
  });

  it('should add approvals when subCommunities approvers present', async () => {
    const subCommunity = {id: "2a", name: "Test", communityId: "2", approver: "testGrp"};
    referenceService.getValue.mockReturnValue({approver: 'foo', subCommunities: [subCommunity]});
    const record = { items: [subCommunity2], custodian: testGroup };

    const { approvals: actualApprovals } = await approvalService.addApprovals(record, null, getItems);

    const expectedAppovals = [
      pendingSubCommunity('2a', 'foo@JohnDeere.com'),
      pendingCustodian(testGroup, `${testGroup}@JohnDeere.com`)
    ];
    expect(actualApprovals).toEqual(expectedAppovals);
  });

  it('should add approvals when subCommunities approvers present and adgroup has whitespace', async () => {
    const subCommunity = {id: "2a", name: "Test", communityId: "2", approver: "testGrp" };
    referenceService.getValue.mockReturnValue({approver: 'foo', subCommunities: [subCommunity]});
    const record = { items: [subCommunity2], custodian: 'Family Guy' };

    const { approvals: actualApprovals } = await approvalService.addApprovals(record, null, getItems);

    const expectedApprovals = [
      pendingSubCommunity('2a', 'foo@JohnDeere.com'),
      pendingCustodian('Family Guy', 'FamilyGuy@JohnDeere.com')
    ]
    expect(actualApprovals).toEqual(expectedApprovals);
  });

  it('should add approvals with community and subCommunity when subCommunities approvers present', async () => {
    when(referenceService.getValue).calledWith('1').mockReturnValue({
      approver: 'community1_approver',
      subCommunities: [{id: "1a", name: "WithoutApprover", communityId: "1"}]
    });
    when(referenceService.getValue).calledWith('2').mockReturnValue({
      approver: 'community2_approver',
      subCommunities: [{id: "2a", name: "WithApprover", communityId: "2", approver: "subCOmmunity2_aaprover"}]
    });
    when(referenceService.getValue).calledWith('2a').mockReturnValue(
      {id: "2a", name: "WithApprover", communityId: "2", approver: 'subCOmmunity2_aaprover'}
    );

    const record = {items: [subCommunity1,subCommunity2], custodian: testGroup};

    const { approvals: actualApprovals } = await approvalService.addApprovals(record, null, getItems);

    const expectedApprovals = [
      pendingCommunity('1', 'community1_approver@JohnDeere.com'),
      pendingSubCommunity('2a', 'subCOmmunity2_aaprover@JohnDeere.com'),
      pendingCustodian(testGroup, `${testGroup}@JohnDeere.com`)
    ];
    expect(actualApprovals).toEqual(expectedApprovals);
  });

  it('should add approvals with community approver when subCommunities approvers not present', async () => {
    when(referenceService.getValue).calledWith('1').mockReturnValue({
      approver: 'community1_approver',
      subCommunities: [{id: "1a", name: "WithoutApprover", communityId: "1"}]
    });
    when(referenceService.getValue).calledWith('2').mockReturnValue({
        approver: 'community2_approver',
        subCommunities: [{id: "2a", name: "WithApprover", communityId: "2"}]
      }
    );
    const record = {items: [subCommunity1, subCommunity2], custodian: testGroup}

    const { approvals: actualApprovals } = await approvalService.addApprovals(record, null, getItems);

    const expectedApprovals = [
      pendingCommunity('1', 'community1_approver@JohnDeere.com'),
      pendingCommunity('2','community2_approver@JohnDeere.com'),
      pendingCustodian(testGroup, `${testGroup}@JohnDeere.com`)
    ];
    expect(actualApprovals).toEqual(expectedApprovals);
  });

  it('should add approvals when it has a latest available', async () => {
    referenceService.getValue.mockReturnValue({approver: 'foo'});
    const record = { items: [{community: '1'}, {community: '3'}], custodian: testGroup};
    const latestAvailable = { items: [{community: '2'}, {community: '3'}], custodian: testGroup};
    const { approvals: actualApprovals } = await approvalService.addApprovals(record, latestAvailable, getItems);

    const expectedApprovals = [
      pendingCommunity('2', 'foo@JohnDeere.com'),
      pendingCommunity('3', 'foo@JohnDeere.com'),
      pendingCommunity('1', 'foo@JohnDeere.com'),
      pendingCustodian(testGroup, `${testGroup}@JohnDeere.com`)
    ];
    expect(actualApprovals).toEqual(expectedApprovals);
  });

  it('should add approvals for views only', async () => {
    const view = createView([{ community: {id: "1"}, subCommunity: {id: "2"}}]);
    viewService.getFullDatasetsForView.mockResolvedValue(view);
    const record = {views: ['test.testView'], entitlements: [], custodian: testGroup};

    const { approvals: actualApprovals } = await approvalService.addApprovals(record, null, getClassifications);

    const expectedApprovals = [
      pendingCommunity('1', 'FamilyGuy@JohnDeere.com'),
      pendingCustodian('FamilyGuy', 'FamilyGuy@JohnDeere.com')
    ]
    expect(actualApprovals).toEqual(expectedApprovals);
  });

  it('should add approvals for views and entitlemnts', async () => {
    const view = createView([{community: { id: "1" }, subCommunity: {id: "2"}}])
    viewService.getFullDatasetsForView.mockResolvedValue(view);
    const record = {
      views: ['test.testView'],
      entitlements: [{ community: '1' }, { community: '2' }],
      custodian: testGroup
    };
    const getEntitlements = (record) => record.entitlements;

    const { approvals: actualApprovals } = await approvalService.addApprovals(record, null, getEntitlements);

    const expectedApprovals = [
      pendingCommunity('1', 'FamilyGuy@JohnDeere.com'),
      pendingCommunity('2', 'FamilyGuy@JohnDeere.com'),
      pendingCustodian('FamilyGuy', 'FamilyGuy@JohnDeere.com')
    ];
    expect(actualApprovals).toEqual(expectedApprovals);
  });

  describe('return relevant approvals for a user', () => {
    const user = {username: 'someuser', groups: ['approval-group'], email: 'someuser@jdnet.deere.com'}

    function createApproval(approver = user.groups[0], status = PENDING) {
      return { community: {approver}, status };
    }

    function createOwnerRecord() {
      return {
        approvals: [{
          owner: 'Group Owner/Backup Owner',
          status: PENDING,
          approverEmail: 'someuser@jdnet.deere.com;someuser2.jdnet.deere.com'
        }]
      }
    }

    function createRecord(createdBy = user.username, approvals = [createApproval()], createdAt = '2019-12-17', status = PENDING) {
      return {
        createdBy,
        approvals,
        createdAt,
        status,
        type: 'test'
      }
    }

    const records = [
      {
        ...createRecord(user.username, [createApproval('different-approval-group')]),
        loggedInUserIsCreator: true,
        loggedInUserIsPendingApprover: false
      },
      {
        ...createRecord('some-other-user', [createApproval('different-approval-group')]),
        loggedInUserIsCreator: false,
        loggedInUserIsPendingApprover: false
      }
    ]

    it('should return all records a user created', async () => {
      const expectedResult = [records[0]];
      const result = await approvalService.getUserApprovals(records, user, 'test');
      expect(result).toEqual(expectedResult);
    });

    it('should return cached records', async () => {
      jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue({
        get: jest.fn().mockResolvedValue('some approval'),
        set: jest.fn()
      });
      const result = await approvalService.getUserApprovals([], user, 'test');
      expect(result).toEqual('some approval');
    });

    it('should return all records a user is an approver for', async () => {
      let input = [createRecord('some-other-user')].concat(records[1]);
      input.push(createOwnerRecord())
      const expectedResult = [
        {
          ...input[0],
          loggedInUserIsCreator: false,
          loggedInUserIsPendingApprover: true,
        },
        {
          ...input[2],
          loggedInUserIsCreator: false,
          loggedInUserIsPendingApprover: false,
          loggedInUserIsOwner: true,
          type: 'test'
        }];

      const result = await approvalService.getUserApprovals(input, user, 'test');

      expect(result).toEqual(expectedResult);
    });

    it('should be case insensitive when searching for user approvals', async () => {
      const custodianApproval = pendingCustodian('approval-group'.toUpperCase(), `${testGroup}@JohnDeere.com`);
      const custodianRecord = createRecord('anyCreator', approvals = [custodianApproval], '2019-12-17', PENDING)
      const input = [custodianRecord];
      const expectedResult = [
        {
          ...input[0],
          loggedInUserIsCreator: false,
          loggedInUserIsPendingApprover: true,
        }];

      const result = await approvalService.getUserApprovals(input, user, 'test');

      expect(result).toEqual(expectedResult);
    });

    it('should return results in order of creation', async () => {
      jestDateSpy.mockRestore();
      const olderRecords = [createRecord('some-other-user', [createApproval()], '1995-12-17'), createRecord('some-other-user', [createApproval()], '2000-12-17')];
      const input = records.concat(olderRecords);
      const expectedResult = [
        {...olderRecords[0], loggedInUserIsCreator: false, loggedInUserIsPendingApprover: true},
        {...olderRecords[1], loggedInUserIsCreator: false, loggedInUserIsPendingApprover: true },
        records[0]
      ];
      const result = await approvalService.getUserApprovals(input, user, 'test');

      expect(result).toEqual(expectedResult);
    });

    it('should not return a record if already approved or rejected unless you own the record', async () => {
      const input = [
        createRecord(user.username, [createApproval(user.groups[0], APPROVED)], '2019-12-17', APPROVED),
        createRecord('some-other-user', [createApproval(user.groups[0], APPROVED)], '2019-12-18', APPROVED),
        createRecord(user.username, [createApproval(user.groups[0], REJECTED)], '2019-12-18', REJECTED),
        createRecord('some-other-user', [createApproval(user.groups[0], REJECTED)], '2019-12-19', REJECTED),
      ];
      const expectedResult = [
        {...input[0], loggedInUserIsCreator: true, loggedInUserIsPendingApprover: false},
        {...input[2], loggedInUserIsCreator: true, loggedInUserIsPendingApprover: false}
      ];
      const result = await approvalService.getUserApprovals(input, user, 'test');

      expect(result).toEqual(expectedResult);
    });
  });

  describe('add approvals for a pending delete', () => {
    it('should add a catalog system approval block with status of PENDING DELETE When Latest is null', async () => {
      const record = {classifications: [{community: '1'}], custodian: testGroup};

      const { approvals: actualApprovals } = await approvalService.addApprovalsForDelete(record, getClassifications);

      const expectedApprovals = [
        pendingCommunity('1', 'FamilyGuy@JohnDeere.com'),
        pendingCustodian(testGroup, `${testGroup}@JohnDeere.com`),
        catalogPendingDelete()
      ];
      expect(actualApprovals).toEqual(expectedApprovals);
    });

    it('should add a catalog system approval block with status of PENDING DELETE when latest available', async () => {
      const record = {
        classifications: [{community: '1'}, {community: '3'}],
        custodian: testGroup
      };

      const { approvals: actualApprovals } = await approvalService.addApprovalsForDelete(record, getClassifications);

      const expectedApprovals = [
        pendingCommunity('1', 'FamilyGuy@JohnDeere.com'),
        pendingCommunity('3', 'FamilyGuy@JohnDeere.com'),
        pendingCustodian(testGroup, `${testGroup}@JohnDeere.com`),
          catalogPendingDelete(),
        ];
      expect(actualApprovals).toEqual(expectedApprovals);
    });
  });

  describe('Deref Tests', () => {
    const comment = 'user approved';
    const reason = 'user approved';
    const communityObject = {
      id: communityId,
      name: 'some name',
      approver: testGroup
    };

    const otherCommunityObject = {
      id: 'otherCommunityId',
      name: 'some other name'
    }

    const subCommunityObject = {
      id: 'FamilyGuy',
      name: 'some name',
      approver: testGroup
    };

    it('should handle deref owner', async () => {
      const ownerUser = {
        username: 'Stewie',
        groups: [testGroup],
        email: 'Stewie@jdnet.deere.com'
      };
      const record = {
        version: 1,
        approvals: [
          {
            custodian: testGroup,
            status: PENDING,
            approverEmail: `${testGroup}@JohnDeere.com`,
          },
          {
            owner: 'Group Owner/Backup Owner',
            status: PENDING,
            approverEmail: 'Stewie@jdnet.deere.com;username.jdnet.deere.com'
          }
        ],
        status: PENDING,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted',
        custodian: testGroup
      };

      const approvedRecord = await approvalService.approve(record, ownerUser, null, false);
      const commentHistory = [{ comment, status: APPROVED, updatedAt: testTime, updatedBy: ownerUser.username }];
      const expectedRecord = {
        version: 1,
        approvals: [
          {
            custodian: testGroup,
            reason,
            commentHistory,
            status: APPROVED,
            approvedBy: ownerUser.username,
            approverEmail: `${testGroup}@JohnDeere.com`,
            updatedAt: testTime,
          }, {
            approvedBy: ownerUser.username,
            approverEmail: `${ownerUser.username}@jdnet.deere.com;username.jdnet.deere.com`,
            commentHistory,
            owner: 'Group Owner/Backup Owner',
            reason,
            status: APPROVED,
            updatedAt: testTime
          },
          pendingEdlSystem()
        ],
        status: APPROVED,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted',
        custodian: testGroup
      };

      expect(approvedRecord).toEqual(expectedRecord);
    });

    it('should add a comment to existing commentHistory', async () => {
      const ownerUser = {
        username: 'Stewie',
        groups: [testGroup],
        email: 'Stewie@jdnet.deere.com'
      };

      const rejectedComment =  [{ reason: 'anyComment', status: REJECTED, updatedAt: testTime, updatedBy: ownerUser.username }];
      const record = {
        version: 1,
        approvals: [
          {
            custodian: testGroup,
            status: PENDING,
            approverEmail: `${testGroup}@JohnDeere.com`,
            commentHistory: rejectedComment
          },
          {
            owner: 'Group Owner/Backup Owner',
            status: PENDING,
            approverEmail: 'Stewie@jdnet.deere.com;username.jdnet.deere.com'
          }
        ],
        status: PENDING,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted',
        custodian: testGroup
      };

      const approvedRecord = await approvalService.approve(record, ownerUser, null, false);
      const commentHistory = [{ comment, status: APPROVED, updatedAt: testTime, updatedBy: ownerUser.username }];
      const expectedRecord = {
        version: 1,
        approvals: [
          {
            custodian: testGroup,
            reason,
            commentHistory: [ ...rejectedComment, ...commentHistory],
            status: APPROVED,
            approvedBy: ownerUser.username,
            approverEmail: `${testGroup}@JohnDeere.com`,
            updatedAt: testTime,
          }, {
            approvedBy: ownerUser.username,
            approverEmail: `${ownerUser.username}@jdnet.deere.com;username.jdnet.deere.com`,
            commentHistory,
            owner: 'Group Owner/Backup Owner',
            reason,
            status: APPROVED,
            updatedAt: testTime
          },
          pendingEdlSystem()
        ],
        status: APPROVED,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted',
        custodian: testGroup
      };

      expect(approvedRecord).toEqual(expectedRecord);
    });

    it('should handle deref subcommunity', async () => {
      const record = {
        version: 1,
        approvals: [{
          subCommunity: subCommunityObject,
          status: PENDING
        },
        {
          custodian: testGroup,
          status: PENDING,
          approverEmail: `${testGroup}@JohnDeere.com`,
        }
      ],
        status: PENDING,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted',
        custodian: testGroup
      };

      const approvedRecord = await approvalService.approve(record, user, null, false);
      const commentHistory = [{ comment, status: APPROVED, updatedAt: testTime, updatedBy: user.username }];
      const expectedRecord = {
        version: 1,
        approvals: [{
          subCommunity: subCommunityObject,
          status: APPROVED,
          approvedBy: user.username,
          commentHistory,
          reason,
          updatedAt: testTime
        },
        {
          custodian: testGroup,
          status: APPROVED,
          approvedBy: user.username,
          commentHistory,
          approverEmail: `${testGroup}@JohnDeere.com`,
          updatedAt: testTime,
          reason
        },
          pendingEdlSystem()
        ],
        status: APPROVED,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted',
        custodian: testGroup
      };

      expect(approvedRecord).toEqual(expectedRecord);
    });

    it('should handle deref community ', async () => {
      const record = {
        version: 1,
        approvals: [{
          community: communityObject,
          status: PENDING
        },
        {
          custodian: testGroup,
          status: PENDING,
          approverEmail: `${testGroup}@JohnDeere.com`,
        }
      ],
        status: PENDING,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted',
        custodian: testGroup
      };

      const approvedRecord = await approvalService.approve(record, user, null, false);
      const commentHistory = [{ comment, status: APPROVED, updatedAt: testTime, updatedBy: user.username }];
      const expectedRecord = {
        version: 1,
        approvals: [
          approvedCommunity(communityObject, commentHistory),
          approvedCustodian(commentHistory),
          pendingEdlSystem()
        ],
        status: APPROVED,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted',
        custodian: testGroup
      };

      expect(approvedRecord).toEqual(expectedRecord);
    });

    it('should be granted when deref community and subcommunity has approved', async () => {
      const record = {
        version: 1,
        approvals: [{
          community: communityObject,
          status: PENDING
        },
        {
          subCommunity: {
            id: 'subCommId',
            approver: testGroup
          },
          status: PENDING
        },
        {
          custodian: testGroup,
          status: PENDING,
          approverEmail: `${testGroup}@JohnDeere.com`,
        }
      ],
        status: PENDING,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted',
        custodian: testGroup
      };

      const approvedRecord = await approvalService.approve(record, user, null, false);
      const commentHistory = [{ comment, status: APPROVED, updatedAt: testTime, updatedBy: user.username }];
      const expectedRecord = {
        version: 1,
        approvals: [
          approvedCommunity(communityObject, commentHistory),
          approvedSubCommunity({id: 'subCommId', approver: testGroup}, commentHistory),
          approvedCustodian(commentHistory),
          pendingEdlSystem()
        ],
        status: APPROVED,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted',
        custodian: testGroup
      };

      expect(approvedRecord).toEqual(expectedRecord);
    });

    it('should set record status to rejected if at least one deref approval is rejected', async () => {
      const otherCommunityId = 'some other community';
      const approvedComment = [{ comment, status: APPROVED, updatedAt: testTime, updatedBy: user.username }];

      const record = {
        approvals: [
          {
            community: {
              id: otherCommunityId,
              approver: 'other group'
            },
            reason,
            commentHistory: approvedComment,
            status: APPROVED,
            approvedBy: user.username,
            updatedAt: testTime
          },
          {
            community: {
              id: communityId,
              approver: testGroup
            },
            status: PENDING
          }
        ],
        status: PENDING,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted'
      };
      const rejectedReason = 'rejected'
      const rejectedRecord = await approvalService.reject(record, rejectedReason, user, false);
      const expectedRecord = {
        approvals: [
          approvedCommunity({id: otherCommunityId, approver: 'other group'}, approvedComment),
          {
            community: {
              id: communityId,
              approver: testGroup
            },
            status: REJECTED,
            commentHistory: [{ status: REJECTED, updatedAt: testTime, updatedBy: user.username, comment: rejectedReason }],
            approvedBy: user.username,
            updatedAt: testTime,
            reason: rejectedReason
          }
        ],
        status: REJECTED,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted'
      };
      expect(rejectedRecord).toEqual(expectedRecord);
    });

    it('should be granted when community has approved', async () => {
      const record = {
        version: 1,
        approvals: [{
          community: communityObject,
          status: PENDING
        },
        {
          custodian: testGroup,
          status: PENDING,
          approverEmail: `${testGroup}@JohnDeere.com`,
        }
      ],
        status: PENDING,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted',
        custodian: testGroup
      };

      const approvedRecord = await approvalService.approve(record, user, null, false);
      const commentHistory = [{ comment, status: APPROVED, updatedAt: testTime, updatedBy: user.username }];
      const expectedRecord = {
        version: 1,
        approvals: [
          approvedCommunity(communityObject, commentHistory),
          approvedCustodian(commentHistory),
          pendingEdlSystem()
        ],
        status: APPROVED,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted',
        custodian: testGroup
      };

      expect(approvedRecord).toEqual(expectedRecord);
    });

    it('should be granted when community has approved for drifted view remediation', async () => {
      const record = {
        approvals: [{
          community: communityObject,
          status: PENDING
        },
        {
          custodian: testGroup,
          status: PENDING,
          approverEmail: `${testGroup}@JohnDeere.com`,
        }
      ],
        status: PENDING,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted',
        custodian: testGroup
      };

      const approvedRecord = await approvalService.approve(record, user, null, false);
      const commentHistory = [{ comment, status: APPROVED, updatedAt: testTime, updatedBy: user.username }];
      const expectedRecord = {
        approvals: [
          approvedCommunity(communityObject, commentHistory),
          approvedCustodian(commentHistory)
        ],
        status: APPROVED,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted',
        custodian: testGroup
      };

      expect(approvedRecord).toEqual(expectedRecord);
    });

    it('should be granted when subcommunity has approved', async () => {
    const record = {
      version: 1,
      approvals: [{
        subCommunity: subCommunityObject,
        status: PENDING
      },
      {
        custodian: testGroup,
        status: PENDING,
        approverEmail: `${testGroup}@JohnDeere.com`,
      }
    ],
      status: PENDING,
      updatedAt: 'theTimeOfSubmission',
      updatedBy: 'theUserWhoSubmitted',
      custodian: testGroup
    };

    const approvedRecord = await approvalService.approve(record, user, null, false);
    const commentHistory = [{ comment, status: APPROVED, updatedAt: testTime, updatedBy: user.username }];
    const expectedRecord = {
      version: 1,
      approvals: [
        approvedSubCommunity(subCommunityObject, commentHistory),
        approvedCustodian(commentHistory),
        pendingEdlSystem()
      ],
      status: APPROVED,
      updatedAt: 'theTimeOfSubmission',
      updatedBy: 'theUserWhoSubmitted',
      custodian: testGroup
    };

    expect(approvedRecord).toEqual(expectedRecord);
  });

    it('should throw error when trying to reject something that has already been approved', () => {
      const otherCommunityId = 'some other community';
      const record = {
        approvals: [
          {
            community: communityObject,
            status: APPROVED
          },
          {
            community: {
              id: "another ID",
              name: 'some name',
              approver: testGroup
            },
            status: APPROVED
          },
          {
            community: { id: otherCommunityId, name: 'some other name' },
            status: PENDING
          }
        ],
        status: PENDING
      };

      const invalidRequest = approvalService.reject(record, "not right now", user, false);

      return expect(invalidRequest).rejects.toThrow(new Error(`Cannot reject since this has already been approved.`));
    });

    it('should reject if all approvals are not approved', async () => {
      const otherCommunityId = 'some other community';
      const record = {
        approvals: [
          {
            community: communityObject,
            status: APPROVED
          },
          {
            community: {
              id: "another ID",
              name: 'some name',
              approver: testGroup
            },
            status: PENDING
          },
          {
            community: { id: otherCommunityId, name: 'some other name' },
            status: PENDING
          }
        ],
        status: PENDING
      };
      const rejectComments = "not right now";
      const expectedRecord = {
        ...record,
        approvals: [
          {
            community: communityObject,
            status: APPROVED
          },
          {
            ...record.approvals[1],
            reason: rejectComments,
            approvedBy: user.username,
            updatedAt: testTime,
            commentHistory:  [{ status: REJECTED, updatedAt: testTime, updatedBy: user.username, comment: rejectComments }],
            status: REJECTED
          },
          record.approvals[2],
        ],
        status: REJECTED
      };
      const invalidRequest = await approvalService.reject(record, rejectComments, user, false);

      expect(invalidRequest).toEqual(expectedRecord);
    });

    it('should be rejected when community has rejected', async () => {
      const record = {
        approvals: [{
          community: communityObject,
          status: PENDING
        }],
        status: PENDING,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted'
      };
      const reason = 'rejected';
      const rejectedRecord = await approvalService.reject(record, reason, user, false);
      const expectedRecord = {
        approvals: [{
          community: communityObject,
          status: REJECTED,
          approvedBy: user.username,
          updatedAt: testTime,
          commentHistory: [{ status: REJECTED, updatedAt: testTime, updatedBy: user.username, comment: reason }],
          reason
        }],
        status: REJECTED,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted'
      };

      expect(rejectedRecord).toEqual(expectedRecord);
    });

    it('should be rejected when subCommunity has rejected', async () => {
      const record = {
        approvals: [{
          subCommunity: subCommunityObject,
          status: PENDING
        }],
        status: PENDING,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted'
      };
      const reason = 'rejected';
      const rejectedRecord = await approvalService.reject(record, reason, user, false);
      const expectedRecord = {
        approvals: [{
          subCommunity: subCommunityObject,
          status: REJECTED,
          approvedBy: user.username,
          updatedAt: testTime,
          commentHistory: [{ status: REJECTED, updatedAt: testTime, updatedBy: user.username, comment: reason }],
          reason
        }],
        status: REJECTED,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted'
      };

      expect(rejectedRecord).toEqual(expectedRecord);
    });

    it('should throw error when trying to approve already rejected record', () => {
      const record = {
        approvals: [
          {
            community: communityObject,
            status: PENDING
          },
          {
            community: otherCommunityObject,
            status: REJECTED
          }
        ],
        status: REJECTED
      };

      const invalidRequest = approvalService.approve(record, user, null, false);

      return expect(invalidRequest).rejects.toThrow(new Error(`Cannot edit when in a REJECTED status.`));
    });

    it('should throw error when trying to approve something that is deleted', () => {
      const record = {
        approvals: [
          {
            community: communityObject,
            status: PENDING
          }
        ],
        status: DELETED
      };

      const invalidRequest = approvalService.approve(record, user, null, false);

      return expect(invalidRequest).rejects.toThrow(new Error(`Cannot edit when in a DELETED status.`));
    });

    it('Should add a System Approval upon all community and custodian approvals', async () => {
      const record = {
        version: 1,
        approvals: [{
          community: communityObject,
          status: PENDING
        },
        {
          custodian: testGroup,
          status: PENDING,
          approverEmail: `${testGroup}@JohnDeere.com`
        }],
        status: PENDING,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted'
      };

      const approvedRecord = await approvalService.approve(record, user, null, false);
      const commentHistory = [{ comment, status: APPROVED, updatedAt: testTime, updatedBy: user.username }];
      const expectedRecord = {
        version: 1,
        approvals: [
          approvedCommunity(communityObject, commentHistory),
          approvedCustodian(commentHistory),
          pendingEdlSystem()
        ],
        status: APPROVED,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted'
      };

      expect(approvedRecord).toEqual(expectedRecord);
    });

    it('Should add a System Approval upon all community , subCommunity and custodian approvals', async () => {
      const record = {
        version: 1,
        approvals: [{
          community: communityObject,
          status: PENDING
        },
        {
          subCommunity: subCommunityObject,
          status: PENDING
        },
        {
          custodian: testGroup,
          status: PENDING,
          approverEmail: `${testGroup}@JohnDeere.com`
        }],
        status: PENDING,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted'
      };

      const approvedRecord = await approvalService.approve(record, user, null, false);
      const commentHistory = [{ comment, status: APPROVED, updatedAt: testTime, updatedBy: user.username }];
      const expectedRecord = {
        version: 1,
        approvals: [
          approvedCommunity(communityObject, commentHistory),
          approvedSubCommunity(subCommunityObject, commentHistory),
          approvedCustodian(commentHistory),
          pendingEdlSystem()
        ],
        status: APPROVED,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted'
      };

      expect(approvedRecord).toEqual(expectedRecord);
    });

    it('should allow user to update approval when EDL has the status PENDING DELETE', async () => {
      const record = {
        version: 1,
        approvals: [
          {
            community: communityObject,
            status: PENDING
          },
          {
            custodian: testGroup,
            status: PENDING,
            approverEmail: `${testGroup}@JohnDeere.com`,
          },
          catalogPendingDelete()
        ],
        status: PENDING,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted'
      };

      const commentHistory = [{ comment, status: APPROVED, updatedAt: testTime, updatedBy: user.username }];
      const expectedRecord = {
        version: 1,
        approvals: [
          approvedCommunity(communityObject, commentHistory),
          approvedCustodian(commentHistory),
          catalogPendingDelete(),
          pendingEdlSystem()
        ],
        status: APPROVED,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted'
      };

      const result = await approvalService.approve(record, user, "details", false);
      expect(result).toEqual(expectedRecord);
    });

    it('should reject record when EDL rejects and community approve', async () => {
      const record = {
        version: 1,
        approvals: [
          {
            community: communityObject,
            status: APPROVED
          },
          catalogPendingDeleteWithNullDetails()
        ],
        status: APPROVED,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted'
      };
      const reason = 'rejected';
      const rejectedRecord = await approvalService.reject(record, reason, systemUser, false);

      const expectedRecord = {
        version: 1,
        approvals: [
          {
            community: communityObject,
            status: APPROVED
          },
          catalogPendingDeleteWithNullDetails(),
          {
            system: "EDL",
            status: REJECTED,
            details: null,
            approvedBy: "EDL",
            updatedAt: testTime,
            reason,
            commentHistory: []
          }
        ],
        status: REJECTED,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted'
      };

      expect(rejectedRecord).toEqual(expectedRecord);
    });

    it('should reject record when community rejects and Catalog is PENDING DELETE', async () => {
      const record = {
        approvals: [
          {
            community: communityObject,
            status: PENDING
          },
          catalogPendingDeleteWithNullDetails()
        ],
        status: PENDING,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted'
      };
      const reason = 'rejected';
      const rejectedRecord = await approvalService.reject(record, reason, user, false);
      const expectedRecord = {
        approvals: [
          {
            community: communityObject,
            status: REJECTED,
            commentHistory: [{ status: REJECTED, updatedAt: testTime, updatedBy: user.username, comment: reason }],
            approvedBy: user.username,
            updatedAt: testTime,
            reason
          },
          catalogPendingDeleteWithNullDetails()
        ],
        status: REJECTED,
        updatedAt: 'theTimeOfSubmission',
        updatedBy: 'theUserWhoSubmitted'
      };

      expect(rejectedRecord).toEqual(expectedRecord);
    });

    it('Should update dataset status to DELETED once system approves PENDING DELETE', async () => {
      const record = {
        version: 1,
        approvals: [
          {
            community: communityObject,
            status: APPROVED,
            approvedBy: user.username,
            updatedAt: testTime
          },
          catalogPendingDeleteWithNullDetails()
        ],
        status: APPROVED,
        updatedBy: 'someUser',
        updatedAt: 'testTime'
      };

      const details = 'EDL Details';
      const approvedRecord = await approvalService.approve(record, systemUser, details, false);

      const expectedRecord = {
        version: 1,
        approvals: [
          {
            community: communityObject,
            status: APPROVED,
            approvedBy: user.username,
            updatedAt: testTime
          },
          catalogPendingDeleteWithNullDetails(),
          {
            system: "EDL",
            status: APPROVED,
            details: details,
            approvedBy: systemUser.username,
            updatedAt: testTime,
            commentHistory: []
          }
        ],
        status: DELETED,
        updatedBy: 'someUser',
        updatedAt: 'testTime'
      };

      expect(approvedRecord).toEqual(expectedRecord);
    });

    it('should throw error when EDL approves and while record is still PENDING', () => {
      const record = {
        approvals: [
          {
            community: communityObject,
            status: APPROVED
          },
          {
            community: 'otherCommunityId',
            status: PENDING
          },
          {
            system: 'EDL',
            status: PENDING_DELETE
          }
        ],
        status: PENDING
      };

      const invalidRequest = approvalService.approve(record, {username: 'EDL', groups: []}, null, false);

      return expect(invalidRequest).rejects.toThrow(new Error(`EDL cannot approve since this record is awaiting approvals.`));
    });

    it('should not throw error when EDL approves while record is AVAILABLE', () => {
      const record = {
        approvals: [
          {
            community: communityObject,
            status: APPROVED
          },
          {
            community: otherCommunityObject,
            status: APPROVED
          }
        ],
        status: AVAILABLE
      };

      const details = {
        dataset: {
          name: 'some_name',
          values: [
            {
              name: 'some-name',
              value: 'some-value'
            }
          ]
        },
        schemas: []
      };
      return expect(approvalService.approve(record, {username: 'EDL', groups: []}, details, false)).resolves.toBeDefined();
    });

    it('Should update dataset status to AVAILABLE once system approves', async () => {
      const record = {
        approvals: [
          {
            community: communityObject,
            status: APPROVED,
            approvedBy: user.username,
            updatedAt: testTime
          },
          pendingEdlSystem()
        ],
        status: APPROVED,
        updatedBy: 'someUser',
        updatedAt: 'testTime'
      };

      const details = {
        dataset: {
          name: 'com.deere.enterprise.datalake.datatype',
          values: [
            {
              name: 'S3 Bucket Name',
              value: 'some-bucket'
            },
            {
              name: 'Account',
              value: 'some-account'
            }
          ]
        },
        schemas: []
      };

      const systemUser = {username: 'EDL', groups: []};
      const approvedRecord = await approvalService.approve(record, systemUser, details, false);
      const expectedRecord = {
        approvals: [
          {
            community: communityObject,
            status: APPROVED,
            approvedBy: user.username,
            updatedAt: testTime
          },
          {
            system: "EDL",
            status: APPROVED,
            details: details,
            reason,
            commentHistory: [{ comment, status: APPROVED, updatedAt: testTime, updatedBy: 'EDL' }],
            approvedBy: systemUser.username,
            updatedAt: testTime
          }
        ],
        environmentName: 'com.deere.enterprise.datalake.datatype',
        storageLocation: 'some-bucket',
        storageAccount: 'some-account',
        status: AVAILABLE,
        updatedBy: 'someUser',
        updatedAt: 'testTime'
      };

      expect(approvedRecord).toEqual(expectedRecord);
    });

    it('Should update permission status to AVAILABLE once system approves', async () => {
      const record = {
        approvals: [
          {
            community: communityObject,
            status: APPROVED,
            approvedBy: user.username,
            updatedAt: testTime
          },
          pendingEdlSystem()
        ],
        status: APPROVED,
        updatedBy: 'someUser',
        updatedAt: 'testTime'
      };

      const details = undefined;

      const systemUser = {username: 'EDL', groups: []};
      const approvedRecord = await approvalService.approve(record, systemUser, details, false);
      const expectedRecord = {
        approvals: [
          {
            community: communityObject,
            status: APPROVED,
            approvedBy: user.username,
            updatedAt: testTime
          },
          {
            system: "EDL",
            status: APPROVED,
            details: details,
            reason,
            commentHistory: [{ comment, status: APPROVED, updatedAt: testTime, updatedBy: 'EDL' }],
            approvedBy: systemUser.username,
            updatedAt: testTime
          }
        ],
        status: AVAILABLE,
        updatedBy: 'someUser',
        updatedAt: 'testTime'
      };

      expect(approvedRecord).toEqual(expectedRecord);
    });

    it('Should update dataset/schema/table properties when the Dataset is APPROVED by system', async () => {
      const datasetEnvName = 'com.deere.enterprise.datalake.datatype';
      const storageLocation = 'some-bucket';
      const storageAccount = 'some-account';
      const schemaEnvName = 'com.deere.enterprise.datalake.enhance.some_schema';
      const schema1Id = 'schema1';
      const schema2Id = 'schema2';
      const schema1Version = '1.0.0';
      const schema2Version = '2.0.0';
      const schemaName = 'Some Schema';
      const tableName = 'some_table';
      const schema1 = {
        id: schema1Id,
        name: schemaName
      };
      const schema2 = {
        id: schema2Id,
        name: schemaName
      };
      const detailsSchema1 = {
        id: `${schema1Id}--1`,
        name: `${schemaEnvName}@${schema1Version}`,
        values: [
          {
            name: 'Databricks Table',
            value: `${tableName}_1_0_0`
          }
        ]
      };
      const detailsSchema2 = {
        id: `${schema2Id}--1`,
        name: `${schemaEnvName}@${schema2Version}`,
        values: [
          {
            name: 'Databricks Table',
            value: `${tableName}_2_0_0`
          },
          {
            name: 'Databricks Table',
            value: tableName
          }
        ]
      };
      const table1 = {
        schemaVersion: schema1Version,
        schemaName,
        schemaId: `${schema1Id}--2`,
        tableName
      };
      const table2 = {
        schemaVersion: schema2Version,
        schemaName,
        schemaId: `${schema2Id}--2`,
        tableName
      };
      const updatedTable1 = { ...table1, schemaEnvironmentName: `${schemaEnvName}@${schema1Version}`, versionless: false };
      const updatedTable2 = { ...table2, schemaEnvironmentName: `${schemaEnvName}@${schema2Version}`, versionless: true };
      const record = {
        approvals: [
          {
            community: communityObject,
            status: APPROVED,
            approvedBy: user.username,
            updatedAt: testTime
          },
          {
            system: 'EDL',
            status: PENDING,
            details: null,
            approvedBy: null,
            updatedAt: null
          }
        ],
        status: APPROVED,
        updatedBy: 'someUser',
        updatedAt: 'testTime',
        tables: [table1, table2]
      };

      const details = {
        dataset: {
          name: datasetEnvName,
          values: [
            {
              name: 'S3 Bucket Name',
              value: storageLocation
            },
            {
              name: 'Account',
              value: storageAccount
            }
          ]
        },
        schemas: [detailsSchema1, detailsSchema2]
      };

      const systemUser = {username: 'EDL', groups: []};

      const expectedRecord = {
        approvals: [
          {
            community: communityObject,
            status: APPROVED,
            approvedBy: user.username,
            updatedAt: testTime
          },
          {
            system: 'EDL',
            status: APPROVED,
            details: details,
            approvedBy: systemUser.username,
            updatedAt: testTime,
            reason,
            commentHistory: [
              {
                comment,
                status: APPROVED,
                updatedAt: testTime,
                updatedBy: "EDL"
              }
            ],
          }
        ],
        environmentName: datasetEnvName,
        storageLocation,
        storageAccount,
        status: AVAILABLE,
        updatedBy: 'someUser',
        updatedAt: 'testTime',
        tables: [updatedTable1, updatedTable2]
      };

      schemaDao.getSchema
          .mockReturnValueOnce({ ...schema1 })
          .mockReturnValueOnce({ ...schema2 });

      const approvedRecord = await approvalService.approve(record, systemUser, details, false);

      expect(schemaDao.getSchema.mock.calls[0][0]).toEqual(`${schema1Id}--1`);
      expect(schemaDao.getSchema.mock.calls[1][0]).toEqual(`${schema2Id}--1`);
      expect(schemaDao.saveSchema).toBeCalledWith({ ...schema1, environmentName: schemaEnvName, version: schema1Version });
      expect(schemaDao.saveSchema).toBeCalledWith({ ...schema2, environmentName: schemaEnvName, version: schema2Version });
      expect(schemaDao.saveSchema).toHaveBeenCalledTimes(2);
      expect(approvedRecord).toEqual(expectedRecord);
    });

    it('should throw error when no communities available to approve', () => {
      const record = {
        approvals: [{
          community: otherCommunityObject,
          status: PENDING
        }],
        status: PENDING
      };
      const reason = 'rejected';
      const invalidUser = approvalService.reject(record, reason, user, false);

      return expect(invalidUser).rejects.toThrow(new Error(`user ${user.username} is not authorized to change approval`));
    });

    it('Should update dataset status to REJECTED once system rejected the dataset', async () => {
      const record = {
        approvals: [
          {
            community: communityObject,
            status: APPROVED,
            approvedBy: user.username,
            updatedAt: testTime
          },
          pendingEdlSystem()
        ],
        status: APPROVED,
        updatedBy: 'systemUser',
        updatedAt: 'testTime'
      };

      const reason = 'EDL Rejected';
      const approvedRecord = await approvalService.reject(record, reason, systemUser, false);

      const expectedRecord = {
        approvals: [
          {
            community: communityObject,
            status: APPROVED,
            approvedBy: user.username,
            updatedAt: testTime
          },
          {
            system: "EDL",
            status: REJECTED,
            reason: reason,
            details: null,
            commentHistory: [{ status: REJECTED, updatedAt: testTime, updatedBy: 'EDL', comment: reason }],
            approvedBy: systemUser.username,
            updatedAt: testTime
          }
        ],
        status: REJECTED,
        updatedBy: 'systemUser',
        updatedAt: 'testTime'
      };

      expect(approvedRecord).toEqual(expectedRecord);
    });

    it('should add approvals with deref community and subCommunity when subCommunities approvers present', async () => {
      referenceService.getValue.mockImplementation(commId => {
        if(commId === '1') {
          return {
            approver: 'community1_approver',
            subCommunities: [{
              id: "1a",
              name: "WithoutApprover",
              communityId: "1"
            }]
          }
        }
        if(commId === '2') {
          return {
            approver: 'community2_approver',
            subCommunities: [{
              id: "2a",
              name: "WithApprover",
              communityId: "2",
              approver: "subCOmmunity2_aaprover"
            }]
          }
        }
        if(commId === '2a') {
          return {
            approver: 'subCOmmunity2_aaprover',
            id: "2a",
            name: "WithApprover",
            communityId: "2"
          }
        }
      })

      const result = await approvalService.addApprovals(
        {
          items: [
            {
              community: { id: '1' },
              subCommunity: { id: '1a'}
            },
            {
              community: { id: '2'},
              subCommunity: { id: '2a'}
            }
          ],
          custodian: testGroup
        },
        null,
        record => record.items);

      expect(result).toEqual({
        items: [
          {
            community: { id: '1' },
            subCommunity: { id: '1a' }
          },
          {
            community: { id: '2' },
            subCommunity: { id: '2a' }
          }
        ],
        custodian: testGroup,
        approvals: [
        {
          community: '1',
          commentHistory: [],
          status: PENDING,
          approvedBy: null,
          approverEmail: 'community1_approver@JohnDeere.com',
          comment: null,
          updatedAt: null
        },
        {
          subCommunity: '2a',
          commentHistory: [],
          status: PENDING,
          approvedBy: null,
          approverEmail: 'subCOmmunity2_aaprover@JohnDeere.com',
          comment: null,
          updatedAt: null
        },
        {
          custodian: testGroup,
          commentHistory: [],
          status: PENDING,
          approvedBy: null,
          approverEmail: `${testGroup}@JohnDeere.com`,
          comment: null,
          updatedAt: null
        }]
      });
    });
  });

  describe('getting non custodian approval tests', () => {
    it('should return non-custodian approvals', () => {
      const sampleApprovals = [
        {
          approvedBy: "mm12161",
          approverEmail: "G90_COLLIBRA_APPROVER_SYSTEMS@JohnDeere.com",
          comment: null,
          community: "a521b7d4-642c-4524-9c46-e4fa5e836a17",
          status: PENDING,
          updatedAt: "2021-05-14T13:54:59.771Z"
        },
        {
          "custodian": undefined,
          "approvedBy": null,
          "approverEmail": "undefined@JohnDeere.com",
          "comment": null,
          "status": PENDING,
          "updatedAt": "2021-05-14T13:54:59.771Z"
        }
      ];
      const expectedApprovals = [
        {
          approvedBy: "mm12161",
          approverEmail: "G90_COLLIBRA_APPROVER_SYSTEMS@JohnDeere.com",
          comment: null,
          community: "a521b7d4-642c-4524-9c46-e4fa5e836a17",
          status: PENDING,
          updatedAt: "2021-05-14T13:54:59.771Z"
        }
      ];

      const result = approvalService.getNonCustodianApprovals(sampleApprovals);
      expect(result).toEqual(expectedApprovals);
    });
  });
});
