const permissionService = require('../../../src/services/permissionService');
const permissionDao = require('../../../src/data/permissionDao');
const emailService = require('../../../src/services/emailService');
const referenceService = require('../../../src/services/referenceService');
const recordService = require('../../../src/services/recordService');
const versionService = require('../../../src/services/versionService');
const permissionApprovalService = require('../../../src/services/permissionApprovalService');
const notificationService = require('../../../src/services/notificationService');
const permissionModel = require('../../../src/model/permissionModel');
const accessUtility = require('../../../src/utilities/accessUtility');
const viewService = require('../../../src/services/viewService');
const remediationService = require('../../../src/services/remediationService');

const uuid = require('uuid');
const { when, verifyAllWhenMocksCalled, resetAllWhenMocks } = require('jest-when');
const {ALL_STATUSES, AVAILABLE, APPROVED, DELETED, REJECTED} = require("../../../src/services/statusService");

jest.mock('../../../src/data/permissionDao');
jest.mock('../../../src/services/emailService');
jest.mock('../../../src/services/referenceService');
jest.mock('../../../src/services/versionService');
jest.mock('../../../src/services/recordService');
jest.mock('../../../src/services/permissionApprovalService');
jest.mock('../../../src/services/notificationService');
jest.mock('../../../src/model/permissionModel');
jest.mock('../../../src/data/documentDao');
jest.mock('uuid');
jest.mock('../../../src/utilities/accessUtility');
jest.mock('../../../src/services/viewService');
jest.mock('../../../src/services/remediationService');
jest.mock('../../../src/data/remediationDao');

describe('permissionService tests', () => {
  const now = new Date();
  const oneYearFromNow = new Date(now.getFullYear() + 1, 1, 1, 1, 0, 0, 0);
  const user = 'Stewie';
  const isoDate = '2018-07-02T07:56:47.007Z';
  const testTime = new Date(isoDate).getTime();
  const permissionId = '1234';

  const ownerApproval = {
    approvedBy: 'username1',
    approverEmail: 'username1@jdnet.deere.com,username2@jdnet.deere.com',
    comment: 'Auto approved by group owner submission.',
    owner: 'user1/user2',
    status: 'APPROVED',
    updatedAt: testTime
  }

  afterEach(() => {
    permissionDao.getPermissionVersions.mockReset();
  })

  beforeEach(() => {
    resetAllWhenMocks();
    emailService.sendEmails.mockResolvedValue();
    notificationService.sendPermissionNotification.mockResolvedValue('Just a value');
    referenceService.getValue.mockReturnValue({
      approver: user
    });
    uuid.v4.mockReturnValue(permissionId);
    recordService.addAuditFields.mockImplementation(record => record);
    permissionApprovalService.addApprovals.mockImplementation(record => {
      if (record.approvals) {
        record.approvals.push(ownerApproval);
        return record;
      }
      return { ...record, ...{ approvals: [community, ownerApproval] } };
    });
    recordService.mergeAuditFields.mockImplementation((_existingRecord, updatedRecord) => updatedRecord);
    permissionModel.validate.mockReturnValue(null);
    versionService.getLatestAvailableVersion.mockReturnValue(createPermission());
    accessUtility.getUniqueGovernance.mockImplementation(val => val);
    viewService.getViewsWithStatus.mockResolvedValue([]);
  });

  function createApproval(status = 'PENDING') {
    return {
      community: '24',
      approverEmail: 'email@123.com',
      status
    };
  };

  function createEntitlement() {
    return {
      community: "1",
      subCommunity: "4",
      gicp: "14",
      id: "2345",
      countriesRepresented: ["12"],
      additionalTags: [],
      personalInformation: true,
      development: true
    };
  }
  function createPermission() {
    return {
      "id": permissionId,
      "name": "some perm",
      "version": 1,
      "createdBy": user,
      "createdAt": isoDate,
      "updatedBy": user,
      "requestComments": "Some test comments",
      "description": "Some great description",
      "group": "AWS-GIT-DWIS-DEV",
      "roleType": "human",
      "businessCase": "I really wanna access this data!",
      "startDate": now,
      "endDate": oneYearFromNow,
      "entitlements": [createEntitlement()],
      approvals: [createApproval()],
      views: []
    };
  }
  const permission = createPermission();
  function createDereferencedPermission(derefTest = false) {
    return {
      ...permission,
      entitlements: [
        {
          "actions": undefined,
          "id": "2345",
          "additionalTags": [],
          "personalInformation": true,
          "development": true,
          'community': derefTest ? { id: "10", name: "system" } : "1",
          'subCommunity': derefTest ? { id: "11", name: "demo" } : '4',
          'countriesRepresented': derefTest ? [{ id: "12", name: "US" }, { id: "13", name: "CA" }] : ["12"],
          'gicp': derefTest ? { id: "14", name: "classified" } : "14"
        }
      ],
      approvals: [
        {
          community: {
            id: derefTest ? "10" : "24",
            name: derefTest ? "Name" : "24",
            approver: derefTest ? "DooScooby" : "24"
          },
          approverEmail: 'email@123.com',
          status: 'PENDING'
        }
      ]
    };
  }
  const expectedRemediationsApprovals = [
    {
      name: 'View1',
      approvals: [
        {
          approvedBy: 'mm12161',
          approverEmail: 'G90_COLLIBRA_APPROVER_FINANCIAL_SERVICES@JohnDeere.com',
          comment: null,
          community: {
            id: '4d8d917d-5c87-43b7-a495-38c46b6f4ee1',
            name: 'Financial Services',
            approver: 'G90_COLLIBRA_APPROVER_FINANCIAL_SERVICES'
          },
          status: 'APPROVED',
          updatedAt: '2021-05-14T13:54:59.771Z'
        }],
      status: 'PENDING',
      createdAt: '2021-05-14T13:54:59.771Z',
      createdBy: 'dp11317',
      updatedAt: '2021-05-14T13:54:59.771Z',
      updatedBy: 'dp11317'
    }];

  describe('get permission tests', () => {
    it('should get latest from docdb', async () => {
      const expected = [{ id: 'some perm' }];
      permissionDao.getLatestPermissions.mockResolvedValueOnce(expected);
      const results = await permissionService.getLatestPermissions();
      expect(results).toEqual(expected);
    });

    it('should get latest from docdb for all statuses', async () => {
      const expected = [{ id: 'some perm' }];
      permissionDao.getLatestPermissions.mockResolvedValueOnce(expected);
      const results = await permissionService.getLatestPermissions({ statuses: ["DELETED"] });
      expect(results).toEqual(expected);
      expect(permissionDao.getLatestPermissions).toHaveBeenCalledWith({ statuses: ["DELETED"] });
    });

    it('should get permissions', async () => {
      const expected = [
        { id: 1, version: 1, status: 'AVAILABLE', roleType: 'human', group: 'Foobar' },
        { id: 1, version: 1, status: 'AVAILABLE', roleType: 'system', clientId: 'Barbaz' },
      ];
      permissionDao.getLatestPermissions.mockResolvedValue(expected);

      const results = await permissionService.listAllForStatus({ status: ['FOO'] });

      expect(results).toEqual([
        { ...expected[0], name: 'Foobar Permission' },
        { ...expected[1], name: 'Barbaz Permission' }
      ]);

      const expectedQuery = { statuses: ['FOO'], roleTypes: ['human'] };
      expect(permissionDao.getLatestPermissions).toBeCalledWith(expectedQuery);
    });

    it('should only return latest Available permissions filtering by name', async () => {
      const searchResults = [
        { id: 1, status: 'AVAILABLE', name: 'hello', version: 1, views: ['some-view'] },
        { id: 1, status: 'AVAILABLE', name: 'world', version: 2 },
        { id: 1, status: 'DELETED', name: 'helloWorld', version: 3 }
      ];
      const queryParams = { status: ['AVAILABLE', 'DELETED'], name: 'hello', };
      const viewStatus = { name: 'some-view', status: 'AVAILABLE' };
      permissionDao.getLatestPermissions.mockResolvedValueOnce([searchResults[0]]);
      viewService.getViewsWithStatus.mockResolvedValueOnce([viewStatus]);

      const actualPermission = await permissionService.searchForPermission(queryParams);

      expect(actualPermission).toEqual([{ ...searchResults[0], views: [viewStatus] }]);

      const expectedQuery = { statuses: ['AVAILABLE', 'DELETED'], name: 'hello', roleTypes: ['human'] };
      expect(permissionDao.getLatestPermissions).toBeCalledWith(expectedQuery);
    });

    it('should throw an error when "start" is not provide along with "dateFilter"', () => {
      const searchResults = [
        { id: 1, status: 'AVAILABLE', name: 'hello', version: 1 },
        { id: 1, status: 'AVAILABLE', name: 'world', version: 2 },
        { id: 1, status: 'DELETED', name: 'helloWorld', version: 3 }
      ];

      let queryParams = {
        status: ['AVAILABLE', 'DELETED'],
        name: 'hello',
        dateFilter: 'updatedAt'
      };
      const expectedError = new Error('Must include a "start" in query parameters along with "dateFilter".');
      const results = permissionService.searchForPermission(queryParams);
      return expect(results).rejects.toThrow(expectedError.message);
    });

    it('get a permission with name defaulting', async () => {
      const existingPermission = { ...createPermission(), name: undefined };
      permissionDao.getPermission.mockResolvedValue(existingPermission);
      referenceService.dereferenceIds.mockReturnValue(existingPermission.entitlements[0]);
      referenceService.getValue.mockReturnValue(existingPermission.approvals[0].community);

      const actualPermission = await permissionService.getPermission(existingPermission.id, existingPermission.version);
      expect(actualPermission).toEqual({ ...existingPermission, name: existingPermission.group + ' Permission' });
    });

    it('get a permission with approvals defaulting', async () => {
      const existingPermission = { ...createPermission(), name: undefined };
      delete existingPermission.approvals;
      permissionDao.getPermission.mockResolvedValue(existingPermission);
      referenceService.dereferenceIds.mockReturnValue(existingPermission.entitlements[0]);
      referenceService.getValue.mockReturnValue();

      const actualPermission = await permissionService.getPermission(existingPermission.id, existingPermission.version);
      expect(actualPermission).toEqual({ ...existingPermission, name: existingPermission.group + ' Permission' });
    });

    it('get a system permission with name defaulting', async () => {
      const existingPermission = { ...createPermission(), name: undefined, roleType: 'system', clientId: 'Foo' };
      permissionDao.getPermission.mockResolvedValue(existingPermission);
      referenceService.dereferenceIds.mockReturnValue(existingPermission.entitlements[0]);
      referenceService.getValue.mockReturnValue(existingPermission.approvals[0].community);

      const actualPermission = await permissionService.getPermission(existingPermission.id, existingPermission.version);
      expect(actualPermission).toEqual({ ...existingPermission, name: existingPermission.clientId + ' Permission' });
    });

    it('should get latest version of permission', async () => {
      const versions = [
        { id:'any id', version: 1, name: 'anyName', status: AVAILABLE},
        { id:'any id', version: 2, name: 'anyName', status: APPROVED},
        { id:'any id', version: 3, name: 'anyName', status: DELETED}
      ];

      permissionDao.getPermissionVersions.mockResolvedValueOnce(versions);
      const actualPermission = await permissionService.getPermission('anyId', 'latest', ALL_STATUSES);
      expect(actualPermission).toEqual({ id:'any id', version: 3, name: 'anyName', status: DELETED});
    });

    it('should get latest available version of permission', async () => {
      const versions = [
        { id:'any id', version: 1, name: 'anyName', status: AVAILABLE},
        { id:'any id', version: 2, name: 'anyName', status: APPROVED},
        { id:'any id', version: 3, name: 'anyName', status: DELETED}
      ];

      permissionDao.getPermissionVersions.mockResolvedValueOnce(versions);
      const actualPermission = await permissionService.getPermission('anyId', 'latest', AVAILABLE);
      expect(actualPermission).toEqual( { id:'any id', version: 1, name: 'anyName', status: AVAILABLE});
    });

    it('should get previous version of permission', async () => {
      const versions = [
        { id:'any id', version: 1, name: 'anyName', status: AVAILABLE},
        { id:'any id', version: 2, name: 'anyName', status: APPROVED},
        { id:'any id', version: 3, name: 'anyName', status: DELETED}
      ];

      permissionDao.getPermissionVersions.mockResolvedValueOnce(versions);
      const actualPermission = await permissionService.getPermission('anyId', 'previous', ALL_STATUSES);
      expect(actualPermission).toEqual({ id:'any id', version: 2, name: 'anyName', status: APPROVED});
    });

    it('should get sort in ascending order', async () => {
      const versions = [
        { id:'any id', version: 4, name: 'anyName', status: AVAILABLE},
        { id:'any id', version: 2, name: 'anyName', status: APPROVED},
        { id:'any id', version: 3, name: 'anyName', status: REJECTED},
        { id:'any id', version: 1, name: 'anyName', status: DELETED}
      ];

      permissionDao.getPermissionVersions.mockResolvedValueOnce(versions);
      const actualPermission = await permissionService.getPermission('anyId', 'previous', ALL_STATUSES);
      expect(actualPermission).toEqual({ id:'any id', version: 3, name: 'anyName', status: REJECTED});
    });

    it('should get latest available version of permission', async () => {
      const versions = [
        { id:'any id', version: 1, name: 'anyName', status: AVAILABLE},
        { id:'any id', version: 2, name: 'anyName', status: APPROVED},
        { id:'any id', version: 3, name: 'anyName', status: AVAILABLE},
        { id:'any id', version: 4, name: 'anyName', status: DELETED}
      ];

      permissionDao.getPermissionVersions.mockResolvedValueOnce(versions);
      const actualPermission = await permissionService.getPermission('anyId', 'previous', AVAILABLE);
      expect(actualPermission).toEqual( { id:'any id', version: 1, name: 'anyName', status: AVAILABLE});
    });

    it('should throw error when there is no latest available version of permission', () => {
      const versions = [
        { id:'any id', version: 2, name: 'anyName', status: APPROVED},
        { id:'any id', version: 3, name: 'anyName', status: DELETED}
      ];

      permissionDao.getPermissionVersions.mockResolvedValueOnce(versions);
      const actualPermission = permissionService.getPermission('anyId', 'latest', AVAILABLE);
      return expect(actualPermission).rejects.toThrow( 'There are no permissions for id: anyId that have status of AVAILABLE');
    });

    it('should throw error when there is not a previous version of permission', () => {
      const versions = [
        { id:'any id', version: 1, name: 'anyName', status: AVAILABLE},
        { id:'any id', version: 2, name: 'anyName', status: APPROVED},
        { id:'any id', version: 3, name: 'anyName', status: DELETED}
      ];

      permissionDao.getPermissionVersions.mockResolvedValueOnce(versions);
      const actualPermission = permissionService.getPermission('anyId', 'previous', AVAILABLE);
      return expect(actualPermission).rejects.toThrow( 'There are no previous permissions for id: anyId that have status of AVAILABLE');
    });

    it('get the latest available permission when no version provided', async () => {
      const previousVersion = createPermission();
      const latestVersion = createPermission();
      latestVersion.version = 2;
      const allVersions = [previousVersion, latestVersion];
      permissionDao.getPermissionVersions.mockResolvedValueOnce(allVersions);
      permissionDao.getLatestPermission.mockResolvedValueOnce(latestVersion);
      referenceService.dereferenceIds.mockImplementationOnce(val => val);
      const expectedComm = latestVersion.approvals[0].community;
      referenceService.getValue.mockReturnValue({ id: expectedComm, name: expectedComm, approver: expectedComm });
      referenceService.dereferenceIds.mockReturnValue(latestVersion.entitlements[0]);

      const actualPermission = await permissionService.getPermission(permissionId);
      const expectedPermission = createPermission();
      expectedPermission.version = 2;

      expect(actualPermission).toEqual(expectedPermission);
    });

    it('get all effective permissions from docDb', async () => {
      const existingPermission1 = {
        ...createPermission(),
        startDate: '2029-01-29T19:49:02.024Z',
        endDate: '2030-01-29T19:49:02.024Z'
      };
      const existingPermission2 = {
        ...createPermission(),
        startDate: '2000-01-29T19:49:02.024Z',
        endDate: '2010-01-29T19:49:02.024Z'
      };
      const existingPermission3 = {
        ...createPermission(),
        startDate: '2000-01-29T19:49:02.024Z',
        endDate: '2050-01-29T19:49:02.024Z'
      };
      const existingPermission4 = {
        ...createPermission(), startDate: '2000-01-29T19:49:02.024Z'
      };
      delete existingPermission4.endDate
      permissionDao.getLatestPermissions.mockResolvedValueOnce([existingPermission1, existingPermission2, existingPermission3, existingPermission4]);

      const actualPermissions = await permissionService.listAllForStatus({ onlyEffective: 'true' });

      verifyAllWhenMocksCalled();
      expect(actualPermissions).toEqual([existingPermission3, existingPermission4]);
    });

    it('get all permissions', async () => {
      const existingPermission1 = {
        ...createPermission(),
        startDate: '2029-01-29T19:49:02.024Z',
        endDate: '2030-01-29T19:49:02.024Z'
      };
      const existingPermission2 = {
        ...createPermission(),
        startDate: '2000-01-29T19:49:02.024Z',
        endDate: '2010-01-29T19:49:02.024Z'
      };
      const existingPermission3 = {
        ...createPermission(),
        startDate: '2000-01-29T19:49:02.024Z',
        endDate: '2050-01-29T19:49:02.024Z'
      };
      const existingPermission4 = { ...createPermission(), startDate: '2000-01-29T19:49:02.024Z' };
      delete existingPermission4.endDate
      permissionDao.getLatestPermissions.mockResolvedValueOnce([existingPermission1, existingPermission2, existingPermission3, existingPermission4]);


      const actualPermissions = await permissionService.listAllForStatus({ onlyEffective: false });

      verifyAllWhenMocksCalled();
      expect(actualPermissions).toEqual([existingPermission1, existingPermission2, existingPermission3, existingPermission4]);
    });

    it('should return permissions for approval', async () => {
      const expectedPermissionsApprovals = ['PENDING', 'REJECTED', 'APPROVED'].map(status => {
        return {
          ...createPermission(),
          status,
          approvals: [{ ...createApproval(), community: { approver: 'Stewie', id: undefined, name: undefined } }]
        };
      });

      const expectedApprovals = [...expectedPermissionsApprovals, ...expectedRemediationsApprovals];

      permissionDao.getLatestPermissions.mockResolvedValueOnce(expectedPermissionsApprovals);
      permissionApprovalService.getUserApprovals.mockImplementation(item => item);
      remediationService.getPendingRemediations.mockResolvedValue(expectedRemediationsApprovals);

      const actualApprovals = await permissionService.findAllForApproval(user);
      expect(actualApprovals).toEqual(expectedApprovals);
      expect(permissionApprovalService.getUserApprovals).toHaveBeenCalledWith(expectedApprovals, user, 'Permission');
    });

    it('should get all versions of a permission', async () => {
      const version1 = createPermission();
      const version2 = { ...createPermission(), version: 2 };
      const version3 = { ...createPermission(), version: 3 };
      const expectedVersions = [version1, version2, version3];
      permissionDao.getPermissionVersions.mockResolvedValueOnce(expectedVersions);

      const actualVersions = await permissionService.getAllPermissionVersions("anyId");
      expect(actualVersions).toEqual(expectedVersions);
    });
  });

  describe('save permission', () => {
    it('should save', async () => {
      const existingPermission = createPermission();
      await setupAndVerifyIndexing(existingPermission, async () => {
        await permissionService.savePermission(existingPermission, user, testTime);
        expect(recordService.addAuditFields).toBeCalled();
        expect(permissionApprovalService.addApprovals).toBeCalled();
        expect(permissionDao.savePermission).toBeCalledWith(deref(existingPermission));
        expect(emailService.sendEmails).toBeCalled();
        expect(emailService.sendEmails).toBeCalledWith(['email@123.com', 'username1@jdnet.deere.com,username2@jdnet.deere.com'], 'Permission Pending', deref(existingPermission), 'approver', 'permission');
        expect(notificationService.sendPermissionNotification).not.toHaveBeenCalled();
      });
    });
    it('should save and auto approve', async () => {
      const existingPermission = createPermission();
      existingPermission.status = 'APPROVED'
      await setupAndVerifyIndexing(existingPermission, async () => {
        await permissionService.savePermission(existingPermission, user, testTime);
        expect(recordService.addAuditFields).toBeCalled();
        expect(permissionApprovalService.addApprovals).toBeCalled();
        expect(permissionDao.savePermission).toBeCalledWith(deref(existingPermission));
        expect(emailService.sendEmails).toBeCalled();
        expect(emailService.sendEmails).toBeCalledWith(['email@123.com', 'username1@jdnet.deere.com,username2@jdnet.deere.com'], 'Permission Pending', deref(existingPermission), 'approver', 'permission');
        expect(notificationService.sendPermissionNotification).toBeCalledWith(permissionId, 1, testTime);
      });
    });

    it('should save without entitlements', async () => {
      const existingPermission = { ...createPermission(), entitlements: [] };
      await setupAndVerifyIndexing(existingPermission, async () => {
        await permissionService.savePermission(existingPermission, user, testTime);
        expect(recordService.addAuditFields).toBeCalled();
        expect(permissionApprovalService.addApprovals).toBeCalled();
        expect(permissionDao.savePermission).toBeCalledWith(deref(existingPermission));
        expect(emailService.sendEmails).toBeCalled();
        expect(emailService.sendEmails).toBeCalledWith(['email@123.com', 'username1@jdnet.deere.com,username2@jdnet.deere.com'], 'Permission Pending', deref(existingPermission), 'approver', 'permission');
      });
    });

    it('should save without views', async () => {
      const existingPermission = { ...createPermission(), views: [] };
      await setupAndVerifyIndexing(existingPermission, async () => {
        await permissionService.savePermission(existingPermission, user, testTime);
        expect(recordService.addAuditFields).toBeCalled();
        expect(permissionApprovalService.addApprovals).toBeCalled();
        expect(permissionDao.savePermission).toBeCalledWith(deref(existingPermission));
        expect(emailService.sendEmails).toBeCalled();
        expect(emailService.sendEmails).toBeCalledWith(['email@123.com', 'username1@jdnet.deere.com,username2@jdnet.deere.com'], 'Permission Pending', deref(existingPermission), 'approver', 'permission');
      });
    });

    it('should save without actions', async () => {
      const basePerm = createPermission();
      const existingPermission = {
        ...basePerm, entitlements: basePerm.entitlements.map(e => {
          return {
            ...e,
            actions: ["read"]
          }
        })
      };
      await setupAndVerifyIndexing(existingPermission, async () => {
        await permissionService.savePermission(existingPermission, user, testTime);
        expect(recordService.addAuditFields).toBeCalled();
        expect(permissionApprovalService.addApprovals).toBeCalled();
        expect(permissionDao.savePermission).toBeCalledWith(deref({ ...existingPermission, entitlements: existingPermission.entitlements.map(e => ({ ...e, actions: undefined })) }));
        expect(emailService.sendEmails).toBeCalled();
      });
    });

    it('should save without whitespace on name', async () => {
      const existingPermission = {
        ...createPermission(),
        name: '        some name           '
      };
      const commentHistory = [{ comment: "Some test comments", updatedAt: testTime, updatedBy: user },];
      const expectedPermission = {
        ...existingPermission,
        commentHistory,
        name: 'some name',
        entitlements: existingPermission.entitlements.map(e => ({ ...e, actions: undefined })),
        approvals: expect.anything()
      };
      referenceService.dereferenceIds.mockImplementation(record => record);
      referenceService.getValue.mockImplementation(id => id);
      await permissionService.savePermission(existingPermission, user, testTime);
      expect(permissionDao.savePermission).toBeCalledWith(expectedPermission);
    });

    it('should save with entitlement ids', async () => {
      const existingPermission = createPermission();
      existingPermission.entitlements = existingPermission.entitlements.map(e => ({ ...e, id: undefined }));
      referenceService.dereferenceIds.mockImplementation(record => record);
      referenceService.getValue.mockImplementation(id => ({ id, name: id, approver: id }));
      await permissionService.savePermission(existingPermission, user, testTime);
      expect(permissionDao.savePermission).toBeCalledWith(deref({
        ...existingPermission,
        entitlements: existingPermission.entitlements.map(e => ({ ...e, id: '1234' }))
      }));
    });

    it('should fail with duplicate entitlement ids', () => {
      const existingPermission = createPermission();
      existingPermission.entitlements = [
        { ...existingPermission.entitlements[0], id: '1234' },
        { ...existingPermission.entitlements[0], id: '1234' }
      ];
      referenceService.dereferenceIds.mockImplementation(record => record);
      referenceService.getValue.mockImplementation(id => id);
      return expect(permissionService.savePermission(existingPermission, user, testTime)).rejects.toThrow('Each entitlement must have a unique ID');
    });

    describe('when saving', () => {
      it('should reject when missing required field', () => {
        const badPermission = createPermission();
        permissionModel.validate.mockReturnValue(new Error('bad stuff'));

        const saveResult = permissionService.savePermission(badPermission, user, testTime);

        return expect(saveResult).rejects.toThrow('bad stuff');
      });

      it('should return an error when latest permission is locked by another user', () => {
        const permission = { ...createPermission(), lockedBy: 'some other user' };
        permissionDao.getLatestPermission.mockResolvedValueOnce(permission);
        const result = permissionService.savePermission(permission, 'user');
        return expect(result).rejects.toThrow(`Cannot save a permission that is locked by another user. Locked by ${permission.lockedBy}`)
      });

      it('should throw an error when a system permission client id already belongs to another group', () => {
        const existingPermission = { ...createPermission(), roleType: 'system', clientId: 'Foo', status: 'AVAILABLE' };
        const anotherPermission = { ...createPermission(), roleType: 'system', clientId: 'Foo', id: 'some-other-id', group: 'some-other-group', status: 'AVAILABLE' };
        permissionDao.getPermissions.mockResolvedValue([existingPermission, anotherPermission]);
        versionService.getLatestAvailableVersion.mockReturnValueOnce(existingPermission).mockReturnValueOnce(anotherPermission);

        const actualPermission = permissionService.savePermission(existingPermission, user, testTime);

        return expect(actualPermission).rejects.toThrow('Client id cannot be in multiple groups, Foo is already a member of groups: some-other-group');
      });
    });

    describe('when updating', () => {
      it('should update reference data', async () => {
        const updateRequest = {id:'anyData',name:'anyReference',updateType:'subCommunity'}
        await permissionService.updateReferenceData(updateRequest);
       expect(permissionDao.updateReferenceData).toHaveBeenCalledWith(updateRequest);
      })

      it('should update and create new permission version', async () => {
        const latest = {
          entitlements: [
            {
              community: { id: 'some community' },
              subCommunity: { id: 'some sub' },
              id: 'id'
            }
          ]
        };

        permissionDao.getPermissionVersions.mockResolvedValueOnce([]);
        permissionDao.getLatestPermission.mockResolvedValueOnce(latest);
        versionService.allowedToUpdate.mockReturnValueOnce(true);
        versionService.calculateVersion.mockReturnValueOnce(2);
        referenceService.dereferenceIds.mockImplementation(val => val)
        referenceService.getValue.mockImplementationOnce(val => ({ approver: 'Stewie' }))

        const updatedPermission = createPermission();

        await permissionService.updatePermission(permissionId, 1, updatedPermission, user, testTime);

        const commentHistory = [{ comment: "Some test comments", updatedAt: testTime, updatedBy: user },];
        const expectedPermission = { ...createPermission(), version: 2, status: 'PENDING', commentHistory };
        expectedPermission.approvals[0].commentHistory = [];
        expectedPermission.approvals.push({ ...ownerApproval });
        const updatedDs = deref(expectedPermission);
        updatedDs.approvals[0].community = {
          approver: "Stewie",
          id: undefined,
          name: undefined,
        };
        updatedDs.approvals[0].commentHistory = [];

        expect(permissionApprovalService.addApprovals).toHaveBeenCalledWith(expectedPermission, latest, expect.anything());
        expect(versionService.allowedToUpdate).toBeCalled();
        expect(versionService.calculateVersion).toBeCalled();
        expect(permissionDao.savePermission).toBeCalledWith(updatedDs);
      });

      it('should update existing permission version', async () => {
        const commentHistory = [{ comment: "Some test comments", updatedAt: testTime, updatedBy: user },];
        const expectedPermission = { ...createPermission(), status: 'PENDING', commentHistory };
        await setupAndVerifyIndexing(expectedPermission, async () => {
          permissionDao.getPermissionVersions.mockResolvedValueOnce([]);
          versionService.allowedToUpdate.mockReturnValue(true);
          versionService.calculateVersion.mockReturnValue(1);
          const updatedPermission = createPermission();
          await permissionService.updatePermission(permissionId, 1, updatedPermission, user, testTime);
          expectedPermission.approvals.push(ownerApproval);
          expect(permissionDao.savePermission).toBeCalledWith(deref(expectedPermission));
        });
      });

      it('should throw error when not allowed to update', () => {
        const errorMessage = 'Some error';
        permissionDao.getPermissionVersions.mockResolvedValueOnce([]);
        versionService.allowedToUpdate.mockImplementationOnce(() => {
          throw new Error(errorMessage)
        });

        const updateResult = permissionService.updatePermission(permissionId, 1, createPermission(), user, testTime);
        return expect(updateResult).rejects.toThrow(errorMessage)
      });

      it('should update without whitespace on name', async () => {
        const existingPermission = {
          ...createPermission(),
          name: '        some name           '
        };
        const expectedPermission = {
          name: 'some name',
        };
        permissionDao.getLatestPermission.mockResolvedValueOnce();
        referenceService.dereferenceIds.mockImplementation(record => record);
        referenceService.getValue.mockImplementation(id => id);
        await permissionService.updatePermission(permissionId, 1, existingPermission, user, testTime);
        expect(permissionDao.savePermission).toBeCalledWith(expect.objectContaining(expectedPermission));
      });
      it('should add approvals from previous available version entitlements', async () => {
        const availablePermission = createPermission();
        permissionDao.getPermissionVersions.mockResolvedValueOnce([availablePermission]);
        permissionDao.getLatestPermissions.mockResolvedValueOnce(availablePermission);
        permissionDao.getLatestPermission.mockResolvedValueOnce(availablePermission);
        versionService.allowedToUpdate.mockReturnValue(true);
        versionService.calculateVersion.mockReturnValue(2);

        const updatedPermission = createPermission();

        await permissionService.updatePermission(permissionId, 1, updatedPermission, user, testTime);
        expect(permissionApprovalService.addApprovals.mock.calls[0][0]).toEqual(updatedPermission);
        expect(permissionApprovalService.addApprovals.mock.calls[0][1]).toEqual(availablePermission);
      });
    });

    describe('should delete', () => {
      function setupDelete(status = 'PENDING') {
        const permissionToDelete = createPermission();
        permissionToDelete.status = status;
        permissionToDelete.createdBy = user;
        when(permissionDao.getPermission).calledWith(permissionId, 1).mockResolvedValue(deref(permissionToDelete));
        return permissionToDelete;
      }

      it('pending permission', async () => {
        const commentHistory = [{ comment: "Some test comments", updatedAt: new Date(testTime).toISOString(), updatedBy: user }];
        const expectedPermission = { ...setupDelete(), status: 'DELETED', updatedAt: new Date(testTime).toISOString(), commentHistory };
        await setupAndVerifyIndexing(expectedPermission, async () => {
          await permissionService.deletePermission(permissionId, 1, user, testTime);
          expect(permissionDao.savePermission).toBeCalledWith(deref(expectedPermission));
        });
      });

      it('be blocked for an approved permission', () => {
        setupDelete('APPROVED');

        const deleteResult = permissionService.deletePermission(permissionId, 1, user, testTime);

        return expect(deleteResult).rejects.toThrow('Cannot delete a permission with a status of APPROVED.');
      });

      it('be blocked for an available permission', () => {
        setupDelete('AVAILABLE');

        const deleteResult = permissionService.deletePermission(permissionId, 1, user, testTime);

        return expect(deleteResult).rejects.toThrow('Cannot delete a permission with a status of AVAILABLE.');
      });

      it('be blocked when not creator of permission', () => {
        const permissionToDelete = setupDelete();

        const deleteResult = permissionService.deletePermission(permissionId, 1, "Meg", testTime);

        return expect(deleteResult).rejects.toThrow('Meg is not authorized to delete permission');
      });
    });

    describe('when updating approvals', () => {
      it('should approve', async () => {
        await setupAndVerifyIndexing({ ...createPermission(), status: 'APPROVED' }, async () => {
          const permission = createPermission();
          const derefPerm = deref(permission);
          when(permissionDao.getPermission).calledWith(permissionId, 1).mockResolvedValue(derefPerm);
          derefPerm.status = 'APPROVED';
          when(permissionApprovalService.approve).calledWith(derefPerm, user, testTime).mockResolvedValue(derefPerm);
          await permissionService.approvePermission(permissionId, 1, user, testTime);
          expect(permissionDao.savePermission).toBeCalledWith(derefPerm);
          expect(notificationService.sendPermissionNotification).toBeCalledWith(permissionId, 1, testTime, true);
          expect(emailService.sendEmails).toBeCalledWith(['Stewie@deere.com'], 'Permission Approved', derefPerm, 'requester', 'Permission');
        });
      });

      it('should approve with community and subCommunity approvers', async () => {
        const permissionWithStewards = createPermission();
        permissionWithStewards.approvals.push({
          subCommunity: '24',
          approverEmail: 'email@123.com',
          status: 'PENDING'
        })
        await setupAndVerifyIndexing({ ...permissionWithStewards, status: 'APPROVED' }, async () => {
          const permission = permissionWithStewards;
          const derefPerm = deref(permission);
          when(permissionDao.getPermission).calledWith(permissionId, 1).mockResolvedValue(derefPerm);
          derefPerm.status = 'APPROVED';
          when(permissionApprovalService.approve).calledWith(derefPerm, user, testTime).mockResolvedValue(derefPerm);
          await permissionService.approvePermission(permissionId, 1, user, testTime);
          expect(permissionDao.savePermission).toBeCalledWith(derefPerm);
          expect(notificationService.sendPermissionNotification).toBeCalledWith(permissionId, 1, testTime, true);
          expect(emailService.sendEmails).toBeCalledWith(['Stewie@deere.com'], 'Permission Approved', derefPerm, 'requester', 'Permission');
        });
      });

      it('should reject with community and subCommunity approvers', async () => {
        const permissionWithStewards = createPermission();
        permissionWithStewards.approvals.push({
          subCommunity: '24',
          approverEmail: 'email@123.com',
          status: 'PENDING'
        })
        await setupAndVerifyIndexing(permissionWithStewards, async () => {
          const reason = 'reject reason';
          const permission = permissionWithStewards;
          const derefPerm = deref(permission);
          when(permissionDao.getPermission).calledWith(permissionId, 1).mockResolvedValue(derefPerm);
          when(permissionApprovalService.reject).calledWith(derefPerm, reason, user, testTime).mockResolvedValue(derefPerm);

          await permissionService.rejectPermission(permissionId, 1, reason, user, testTime);

          expect(permissionDao.savePermission).toBeCalledWith(derefPerm);
          expect(emailService.sendEmails).toBeCalledWith(['Stewie@deere.com'], 'Permission Rejected', derefPerm, 'requester', 'Permission');
        });
      });

      it('should reject', async () => {
        await setupAndVerifyIndexing(createDereferencedPermission(), async () => {
          const reason = 'reject reason';
          const permission = createDereferencedPermission();
          when(permissionDao.getPermission).calledWith(permissionId, 1).mockResolvedValue(permission);
          when(permissionApprovalService.reject).calledWith(permission, reason, user, testTime).mockResolvedValue(permission);

          await permissionService.rejectPermission(permissionId, 1, reason, user, testTime);

          expect(permissionDao.savePermission).toBeCalledWith(createDereferencedPermission());
          expect(emailService.sendEmails).toBeCalledWith(['Stewie@deere.com'], 'Permission Rejected', permission, 'requester', 'Permission');
        });
      });
    });

    it('should lock permission', async () => {
      permissionDao.getPermission.mockResolvedValue({ lockedBy: null, status: 'AVAILABLE' });
      permissionDao.getLatestPermission.mockResolvedValue({ lockedBy: null, status: 'AVAILABLE', version: 1 });

      await permissionService.lockPermission('Foo', 1, 'user123');
      expect(permissionDao.lockPermission).toBeCalledWith('Foo', 1, 'user123');
    });

    it('should lock permission that is locked by same user', async () => {
      permissionDao.getPermission.mockResolvedValue({ lockedBy: 'user123' });

      expect(permissionService.lockPermission('Foo', 1, 'user123')).resolves.toEqual();
    });

    it('should unlock permission', async () => {
      permissionDao.getPermission.mockResolvedValue({ lockedBy: 'some user' });

      await permissionService.unlockPermission('Foo', 1, 'some user');
      expect(permissionDao.unlockPermission).toBeCalledWith('Foo', 1);
    });

    it('should not lock permission that is already locked', () => {
      permissionDao.getLatestPermission.mockResolvedValueOnce({ lockedBy: 'some user', version: 1, status: 'AVAILABLE' });
      const result = permissionService.lockPermission('Foo', 1, 'user123');
      return expect(result).rejects.toThrow('Cannot lock a permission that is already locked. Locked by some user')
    });

    it('should throw error when unlocking permission locked by other user', () => {
      permissionDao.getPermission.mockResolvedValueOnce({ lockedBy: 'different user', status: 'AVAILABLE' });
      const result = permissionService.unlockPermission('Foo', 1, 'user123');
      return expect(result).rejects.toThrow('Cannot unlock another user\'s locked permission. Locked by different user');
    });

    it('should throw an error when locking a non-available permission', () => {
      permissionDao.getPermission.mockResolvedValue({ status: 'Pending', lockedBy: null });
      permissionDao.getLatestPermission.mockReturnValueOnce({ version: 1 });

      const result = permissionService.lockPermission('Foo', 1, 'user123');
      return expect(result).rejects.toThrow('Only available permissions are lockable.');
    });

    it('should throw an error when locking a non-available permission', () => {
      permissionDao.getPermission.mockResolvedValue({ status: 'AVAILABLE', lockedBy: null });
      permissionDao.getLatestPermission.mockReturnValueOnce({ version: 2 });

      const result = permissionService.lockPermission('Foo', 1, 'user123');
      return expect(result).rejects.toThrow('You can only lock the most recent non-deleted permission version. The latest version is 2');
    });

    it('should return permissions for views', () => {
      const searchResults = [
        { id: 1, status: 'AVAILABLE', name: 'hello', version: 1, views: ['some-view'] },
        { id: 1, status: 'AVAILABLE', name: 'world', version: 2 },
        { id: 1, status: 'DELETED', name: 'helloWorld', version: 3, views: ['my-view'] }
      ];
      const views = ['my-view'];
      permissionDao.getPermissionsForDatasetViews.mockReturnValueOnce([searchResults[3]]);

      const permissions = permissionService.getPermissionsForDatasetViews(views);

      expect(permissionDao.getPermissionsForDatasetViews).toBeCalled();
      expect(permissions).toEqual([searchResults[3]]);
    });

    it('should return empty permissions for views when not matching', () => {
      const searchResults = [
        { id: 1, status: 'AVAILABLE', name: 'hello', version: 1, views: ['some-view'] },
        { id: 1, status: 'AVAILABLE', name: 'world', version: 2 },
        { id: 1, status: 'DELETED', name: 'helloWorld', version: 3, views: ['my-view'] }
      ];
      const views = ['not-matching-view'];
      permissionDao.getPermissionsForDatasetViews.mockReturnValueOnce([]);

      const permissions = permissionService.getPermissionsForDatasetViews(views);

      expect(permissionDao.getPermissionsForDatasetViews).toBeCalled();
      expect(permissions).toEqual([]);
    });

    it('should return empty permissions for views not present in the input', () => {
      const searchResults = [
        { id: 1, status: 'AVAILABLE', name: 'hello', version: 1, views: ['some-view'] },
        { id: 1, status: 'AVAILABLE', name: 'world', version: 2 },
        { id: 1, status: 'DELETED', name: 'helloWorld', version: 3, views: ['my-view'] }
      ];
      const views = [];
      permissionDao.getPermissionsForDatasetViews.mockReturnValueOnce([]);

      const permissions = permissionService.getPermissionsForDatasetViews(views);

      expect(permissionDao.getPermissionsForDatasetViews).toBeCalledTimes(0);
      expect(permissions).toEqual([]);
    });
  });

  async function setupAndVerifyIndexing(perm, fn) {
    const existingPermission = perm;
    when(referenceService.dereferenceIds).calledWith(existingPermission.entitlements[0], [
      'community', 'subCommunity', 'gicp', 'countriesRepresented'
    ]).mockImplementation(record => record);

    when(referenceService.getValue).calledWith(existingPermission.approvals[0].community).mockImplementation(id => ({
      id,
      approver: id,
      name: id
    }));
    await fn();
    expect(permissionDao.savePermission).toBeCalledWith(deref(existingPermission));
  }

  function deref(item) {
    return {
      ...item,
      entitlements: item.entitlements.map(e => ({ ...e, actions: undefined })),
      approvals: item.approvals.map(a => ({
        ...a,
        ...(!a.custodian && a.subCommunity && typeof a.subCommunity === 'string') && {
          subCommunity: {
            approver: a.subCommunity,
            id: a.subCommunity,
            name: a.subCommunity
          }
        },
        ...(!a.custodian && a.community && typeof a.community === 'string') && {
          community: {
            approver: a.community,
            id: a.community,
            name: a.community
          }
        }
      }))
    }
  }
});
