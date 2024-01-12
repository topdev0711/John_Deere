const collibra = require('../../../src/data/collibraDao');
const referenceService = require('../../../src/services/referenceService');
const notificationService = require('../../../src/services/notificationService');
const datasetDao = require('../../../src/data/datasetDao');
const permissionDao = require('../../../src/data/permissionDao');
const referenceDao = require('../../../src/data/referenceDao');
const { PENDING } = require("../../../src/services/statusService");
const { datasetsCollectionName, permissionsCollectionName } = require('../../../conf').getConfig();

jest.mock('../../../src/data/collibraDao');
jest.mock('../../../src/data/referenceDao');

describe('referenceService tests', () => {
  const communities = [{ name: 'someCommunity', id: '1', approver: 'AWS-GIT-DWIS-DEV' }];
  const businessValues = [{ name: 'someBusinessValues', id: '3' }];
  const categories = [{ name: 'someCategories', id: '5' }];
  const phases = [{ name: 'enhance', id: '6' }, { name: 'raw', id: '8' }, { name: 'model', id: '9' }, { name: 'enhance foo', id: '7' }];
  const technologies = [{ name: 'someTechnologies', id: '7' }];
  const physicalLocations = [{ name: 'somePhysicalLocations', id: '8' }];
  const gicp = [{ name: 'someGicp', id: '10' }];
  const countries = [{ name: 'someCountry', id: '12', label: 'Some Country' }];
  const subCommunities = [{ name: 'subcomm', id: '101' }];
  const approver = 'AWS-GIT-DWIS-DEV';

  function mockAllReferences() {
    collibra.getCommunityNames.mockReturnValue(communities);
    collibra.getBusinessValues.mockReturnValue(businessValues);
    collibra.getCategories.mockReturnValue(categories);
    collibra.getPhases.mockReturnValue(phases);
    collibra.getTechnologies.mockReturnValue(technologies);
    collibra.getPhysicalLocations.mockReturnValue(physicalLocations);
    collibra.getGicp.mockReturnValue(gicp);
    collibra.getCountryCodes.mockReturnValue(countries);
    collibra.getSubCommunities.mockReturnValue(subCommunities);
    collibra.getApprover.mockReturnValue(approver);
  }

  function createDatasets() {
    return [
      {
        id: 'b-testdsid1-kjdfkdjf12',
        version: 3,
        classifications: [
          { community: 'kfdjsfk83-93ifdjh98' }
        ],
        createdAt: '2019-11-12T02:43:21.175Z',
        status: 'AVAILABLE',
        name: 'Test Dataset'
      },
      {
        id: 'b-testdsid1-kjdfkdjf12',
        name: 'Test Dataset',
        version: 1,
        classifications: [
          { community: 'kfdjsfk83-93ifdjh98' },
          { community: 'supplier' }
        ],
        createdAt: '2019-11-10T02:43:21.175Z',
        status: 'AVAILABLE'
      },
      {
        id: 'a-testdsid2-lkjfsdo1',
        name: 'Another Test Dataset',
        version: 1,
        classifications: [
          { community: 'kfdjsfk83-93ifdjh98' },
          { community: 'supplier', subcommunity: 'some-dataset-subcommunity' },
        ],
        createdAt: '2019-11-12T02:43:21.175Z',
        status: 'AVAILABLE'
      },
      {
        id: 'b-testdsid1-kjdfkdjf12',
        name: 'Test Dataset',
        version: 2,
        classifications: [
          { community: 'kfdjsfk83-93ifdjh98' }
        ],
        createdAt: '2019-11-11T02:43:21.175Z',
        status: 'AVAILABLE'
      },
    ]
  }

  function createPermissions() {
    return [
      {
        id: 'testpermid1-kjdfkdjf12',
        name: 'Test Permission',
        version: 1,
        classifications: [
          { community: 'kfdjsfk83-93ifdjh98' }
        ],
        createdAt: '2019-11-10T02:43:21.175Z',
        status: 'AVAILABLE'
      },
      {
        id: 'testpermid2-lkjfsdo1',
        name: 'Another Test Permission',
        version: 1,
        classifications: [
          { community: 'kfdjsfk83-93ifdjh98' },
          { community: 'supplier' }
        ],
        createdAt: '2019-11-12T02:43:21.175Z',
        status: 'AVAILABLE'
      },
      {
        id: 'testpermid1-kjdfkdjf12',
        name: 'Test Permission',
        version: 3,
        classifications: [
          { community: 'kfdjsfk83-93ifdjh98' },
          { community: 'supplier', subcommunity: 'some-permission-subcommunity' },
        ],
        createdAt: '2019-11-12T02:43:21.175Z',
        status: 'AVAILABLE'
      },
      {
        id: 'testpermid1-kjdfkdjf12',
        name: 'Test Permission',
        version: 2,
        classifications: [
          { community: 'kfdjsfk83-93ifdjh98' }
        ],
        createdAt: '2019-11-11T02:43:21.175Z',
        status: 'AVAILABLE'
      },
    ]
  }

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(datasetDao, 'getDatasets').mockResolvedValue(createDatasets());
    jest.spyOn(permissionDao, 'getPermissions').mockResolvedValue(createPermissions());
    jest.spyOn(notificationService, 'sendDatasetNotification').mockImplementation((id, name, version, time) => id);
    jest.spyOn(notificationService, 'sendPermissionNotification').mockImplementation((id, name, version, time) => id);
  });

  it('should return all reference data and only phases raw, enhance', () => {
    mockAllReferences();
    const actualResponse = referenceService.getAllReferenceData();
    const expectedResponse = {
      communities: communities.map(c => {
        return {
          ...c,
          subCommunities: subCommunities
        }
      }),
      businessValues,
      categories,
      phases: [{ name: 'enhance', id: '6' }, { name: 'raw', id: '8' }, { name: 'model', id: '9' }],
      technologies,
      physicalLocations,
      gicp,
      countries
    };
    return expect(actualResponse).toEqual(expectedResponse);
  });

  it('should return a community name', () => {
    mockAllReferences();
    collibra.getCommunityNames.mockReturnValue(communities);
    const actualResponse = referenceService.getName('1');
    expect(actualResponse).toEqual('someCommunity');
  });

  it('should return a subCommunity name', () => {
    mockAllReferences();
    collibra.getCommunityNames.mockReturnValue(communities);
    const actualResponse = referenceService.getName('101');
    expect(actualResponse).toEqual('subcomm');
  });

  it('should return a default name if ID is not found', () => {
    mockAllReferences();
    collibra.getCommunityNames.mockReturnValue(communities);
    const actualResponse = referenceService.getName('foo');
    expect(actualResponse).toEqual('Not Found');
  });

  it('should return a community', () => {
    mockAllReferences();
    collibra.getCommunityNames.mockReturnValue(communities);
    const subCommunities = [{ name: 'Test' }];
    collibra.getSubCommunities.mockReturnValue(subCommunities);
    const actualResponse = referenceService.getValue('1');

    const expectedCommunity = { ...communities[0] };
    expectedCommunity.subCommunities = subCommunities;
    expect(actualResponse).toEqual(expectedCommunity);
  });

  it('should return a non-id value', () => {
    const referenceData = {
      id: '1'
    }
    const actualResponse = referenceService.getValue(referenceData);

    expect(actualResponse).toEqual(referenceData);
  });

  it('should return a non-id name', () => {
    const referenceData = {
      id: '1'
    }
    const actualResponse = referenceService.getName(referenceData);

    expect(actualResponse).toEqual(referenceData);
  });

  it('should return an empty reference for undefined ids for name', () => {
    const referenceData = {
      id: undefined,
      name: 'Not Found',
      label: 'Not Found',
      approver: null
    }
    const actualResponse = referenceService.getName(undefined);

    expect(actualResponse).toEqual(referenceData);
  });

  it('should return an empty reference for undefined ids for value', () => {
    const referenceData = {
      id: undefined,
      name: 'Not Found',
      label: 'Not Found',
      approver: null
    }
    const actualResponse = referenceService.getValue(undefined);

    expect(actualResponse).toEqual(referenceData);
  });

  it('should return a sub community', () => {
    mockAllReferences();
    collibra.getCommunityNames.mockReturnValue(communities);
    const subCommunities = [{ name: 'Test', id: '37465' }];
    collibra.getSubCommunities.mockReturnValue(subCommunities);
    const actualResponse = referenceService.getValue('37465');
    expect(actualResponse).toEqual(subCommunities[0]);
  });

  it('should return a default value if community is not found', () => {
    mockAllReferences();
    collibra.getCommunityNames.mockReturnValue(communities);
    const actualResponse = referenceService.getValue('foo');

    const expectedCommunity = { name: 'Not Found', label: 'Not Found', id: 'foo', approver: null };
    expect(actualResponse).toEqual(expectedCommunity);
  });

  it('should get id for reference field value', () => {
    mockAllReferences();
    const actualResponse = referenceService.getId('communities', 'someCommunity');
    expect(actualResponse).toEqual('1');
  });

  it('should throw an error for when the reference field does not exist', () => {
    mockAllReferences();
    const actualResponse = () => referenceService.getId('communities', 'efg');
    return expect(actualResponse).toThrow('Could not find reference for communities');
  });

  it('should get id for reference that is a subfield', () => {
    mockAllReferences();
    const actualResponse = referenceService.getId('communities', 'someCommunity', 'subCommunities', 'subcomm');
    expect(actualResponse).toEqual('101');
  });

  it('should throw an error for reference subfield value when the reference field does not exist', () => {
    mockAllReferences();
    const actualResponse = () => referenceService.getId('communities', 'someCommunity', 'subCommunities', 'badValue');
    return expect(actualResponse).toThrow('Could not find reference for subCommunities');
  });

  it('should return ids for entitlement field value that has an array of values', () => {
    mockAllReferences();
    const actualResponse = referenceService.getIds('communities', ['someCommunity']);
    expect(actualResponse).toEqual(['1']);
  });

  it('should throw an error for an entitlement field in an array of fields does not exist', () => {
    mockAllReferences();
    const actualResponse = () => referenceService.getIds('communities', ['someCommunity', 'nonexistentCommunity']);
    return expect(actualResponse).toThrow('Could not find reference for communities');
  });

  describe('get all property names', () => {
    it('when object of properties', () => {
      mockAllReferences();
      collibra.getPhases.mockReturnValue(phases);
      collibra.getTechnologies.mockReturnValue(technologies);
      const obj = {
        id: '1234',
        phase: phases[0].id,
        technology: technologies[0].id,
        communities: [communities[0].id]
      };

      const actualNames = referenceService.dereferenceIds(obj, ['phase', 'technology', 'communities']);

      const expectedNames = {
        id: '1234',
        phase: { id: phases[0].id, name: phases[0].name },
        technology: { id: technologies[0].id, name: technologies[0].name },
        communities: [{ id: communities[0].id, name: communities[0].name }]
      };
      expect(actualNames).toEqual(expectedNames);
    });
  });

  describe('update records with specified reference id', () => {
    it('should send a notification to EDL when a reference id is specified including only the latest available records that are impacted', async () => {
      const affectedDataset = createDatasets()[2];
      const affectedPermission = createPermissions()[2];
      const affectedPermission2 = createPermissions()[1];
      const actualResponse = await referenceService.updateReferences('supplier');

      expect(actualResponse).toHaveLength(3);
      expect(actualResponse).toEqual([affectedPermission.id, affectedPermission2.id, affectedDataset.id]);
    });

    it('should only submit impacted datasets if no permissions are affected', async () => {
      const affectedDataset = createDatasets()[2];
      const actualResponse = await referenceService.updateReferences('some-dataset-subcommunity');

      expect(actualResponse).toHaveLength(1);
      expect(actualResponse).toEqual([affectedDataset.id]);
    });

    it('should only submit impacted permissions if no datasets are affected', async () => {
      const affectedPermission = createPermissions()[2];
      const actualResponse = await referenceService.updateReferences('some-permission-subcommunity');

      expect(actualResponse).toHaveLength(1);
      expect(actualResponse).toEqual([affectedPermission.id]);
    });

    it('should respond with an empty string when no records are affected by reference ID', async () => {
      const actualResponse = await referenceService.updateReferences('some-reference');
      expect(actualResponse).toEqual('');
    });

    it('should return dereference approvals', () => {
      mockAllReferences();

      const sampleApprovals = [
        {
          approvedBy: "mm12161",
          approverEmail: "G90_COLLIBRA_APPROVER_SYSTEMS@JohnDeere.com",
          comment: null,
          community: "a521b7d4-642c-4524-9c46-e4fa5e836a17",
          status: PENDING,
          updatedAt: "2021-05-14T13:54:59.771Z"
        }
      ];
      const expectedApprovals = [
        {
          approvedBy: 'mm12161',
          approverEmail: 'G90_COLLIBRA_APPROVER_SYSTEMS@JohnDeere.com',
          comment: null,
          community: {
            id: 'a521b7d4-642c-4524-9c46-e4fa5e836a17',
            name: 'Not Found',
            approver: null
          },
          status: PENDING,
          updatedAt: '2021-05-14T13:54:59.771Z'
        }
      ];

      const result = referenceService.dereferenceApprovals(sampleApprovals);
      expect(result).toEqual(expectedApprovals);
    });
  });

  describe('update community tests', () => {
    const id = 'any-community-id';
    const name = 'any-name';
    const updateRequest = {id};

    it('updates the community information', async () => {
      collibra.getCommunity.mockReturnValue({ id, name });
      await referenceService.updateCommunity(updateRequest);

      const expectedDaoRequest = { id, name };
      expect(referenceDao.updateCommunity).toHaveBeenCalledWith(permissionsCollectionName, expectedDaoRequest);
      expect(referenceDao.updateCommunity).toHaveBeenCalledWith(datasetsCollectionName, expectedDaoRequest);
    });

    it('throws an error when an invalid id is provided', () => {
      const actualResponse = referenceService.updateCommunity(updateRequest);
      return expect(actualResponse).rejects.toThrow(`community does not exist: ${updateRequest.id}`);
    });
  });

  describe ('update subCommunity tests', () => {
    const currentSubCommunityId = 'a302f4cd-eeb1-4258-89d7-6ab0f81af0e2';
    const newCommunityId = 'new-community-id';
    const newCommunityName = 'new-community-name';
    const newSubCommunityId = 'new-subCommunity-id';
    const newSubCommunityName = 'new-subCommunity-name';

    it('should update', async () => {
      collibra.hasSubCommunity.mockReturnValue(true);
      collibra.getSubCommunityFromId.mockReturnValue({ name: newSubCommunityName, communityId: newCommunityId });
      collibra.getCommunity.mockReturnValue({ name: newCommunityName });

      await referenceService.updateSubCommunity({newSubCommunityId, currentSubCommunityId});

      const expectedMoveRequest = { currentSubCommunityId, newCommunityId, newCommunityName, newSubCommunityId, newSubCommunityName };
      expect(referenceDao.updateSubCommunity).toHaveBeenCalledWith(permissionsCollectionName, expectedMoveRequest);
      expect(referenceDao.updateSubCommunity).toHaveBeenCalledWith(datasetsCollectionName, expectedMoveRequest);
    });

    it('should update subCommunity, when no new subCommunity id is provided', async() => {
      const currentSubCommunityName = 'some-permission-subCommunity';

      collibra.hasSubCommunity.mockReturnValue(true);
      collibra.getSubCommunityFromId.mockReturnValue({ name: currentSubCommunityName, communityId: newCommunityId });
      collibra.getCommunity.mockReturnValue({ name: newCommunityName });

      await referenceService.updateSubCommunity({currentSubCommunityId});

      const expectedMoveRequest = { currentSubCommunityId,newCommunityId, newCommunityName, newSubCommunityId:currentSubCommunityId, newSubCommunityName:currentSubCommunityName};
      expect(referenceDao.updateSubCommunity).toHaveBeenCalledWith(permissionsCollectionName, expectedMoveRequest);
      expect(referenceDao.updateSubCommunity).toHaveBeenCalledWith(datasetsCollectionName, expectedMoveRequest);
    });

    it('should throw an error when a subCommunity does not exist', () => {
      collibra.hasSubCommunity.mockReturnValue(false);
      const updateRequest = { currentSubCommunityId };
      const actualResponse = referenceService.updateSubCommunity(updateRequest);
      return expect(actualResponse).rejects.toThrow(`subCommunity does not exist: ${currentSubCommunityId}`);
    });

    it('should throw an error when community does not exist', async () => {
      collibra.hasSubCommunity.mockReturnValue(true);
      collibra.getSubCommunityFromId.mockReturnValue({ name: newSubCommunityName, communityId: newCommunityId });

      const actualResponse = referenceService.updateSubCommunity({newId: newSubCommunityId, currentSubCommunityId});

      return expect(actualResponse).rejects.toThrow(`community does not exist: ${newCommunityId}`);
    });
  });
});
