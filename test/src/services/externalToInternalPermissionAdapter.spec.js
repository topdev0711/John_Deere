const adapter = require('../../../src/services/externalToInternalPermissionAdapter');
const catalogReferenceService = require('../../../src/services/catalogReferenceService');
const permissionService = require('../../../src/services/permissionService');

jest.mock('../../../src/data/permissionDao');
jest.mock('../../../src/services/catalogReferenceService');
jest.mock('../../../src/services/permissionService');

const id = '1234';
const referenceServiceErrorMessage = 'catalogReferenceService error';

const basePermissions = {
  name: "some perm",
  group: "AWS-GIT-DWIS-DEV",
  roleType: "human",
  businessCase: "I really wanna access this data!",
  startDate: "2019-06-24T20:53:15.948Z",
  endDate: "2020-06-24T20:53:15.948Z"
};

const referencedEntitlements = [
  {
    community: 'a7b76f9e-8ff4-4171-9050-3706f1f12188',
    subCommunity: 'd127f360-3e52-4175-8e74-c3d81b88aebf',
    gicp: '14',
    countriesRepresented: ['12'],
    additionalTags: [],
    personalInformation: true,
    development: true
  }
];

const nonReferencedEntitlements = [
  {
    community: "a7b76f9e-8ff4-4171-9050-3706f1f12188",
    subCommunity: "d127f360-3e52-4175-8e74-c3d81b88aebf",
    gicp: "someGicp",
    countriesRepresented: ["hi"],
    additionalTags: ["lm"],
    personalInformation: true,
    development: true
  }
];

const createNonReferencedPermission = () => { return { ...basePermissions, entitlements: nonReferencedEntitlements}};
const createReferencedPermission = () => { return { ...basePermissions, entitlements: referencedEntitlements}};

describe('externalToInternalDatasetAdapter tests', () => {
  afterEach(() => {
    permissionService.getLatestPermission.mockReset();
  })
  it('should replace all values with references in a new permission', async () => {
    const expectedPermission = createReferencedPermission();
    catalogReferenceService.getReferencedPermissionEntitlement.mockReturnValue(referencedEntitlements[0]);
    const permissions = createNonReferencedPermission();
    const actualPermissions = await adapter.adaptNewPermission(permissions);

    expect(actualPermissions).toEqual(expectedPermission);
  });

  it('should throw an error when the request is missing required fields', () => {
    const permissions = createNonReferencedPermission();
    delete permissions.roleType;
    const actualError = adapter.adaptNewPermission(permissions);
    return expect(actualError).rejects.toThrow('child \"roleType\" fails because [\"roleType\" is required]');
  });

  it('should throw an error when unable to get a reference on adapting new permission', () => {
    const expectedPermission = createReferencedPermission();
    catalogReferenceService.getReferencedPermissionEntitlement.mockImplementation(() => { throw new Error(referenceServiceErrorMessage)});
    const permissions = createNonReferencedPermission();
    const actualError = adapter.adaptNewPermission(permissions);
    return expect(actualError).rejects.toThrow(referenceServiceErrorMessage);
  });

  it('should replace all values for references in an existing permission', async () => {
    const version = 4;
    const permission = { ...createNonReferencedPermission(), version: 1 };
    catalogReferenceService.getReferencedPermissionEntitlement.mockReturnValue(referencedEntitlements[0]);
    permissionService.getLatestPermission.mockResolvedValueOnce({ version });
    const actualPermission = await adapter.adaptExistingPermission(id, permission);

    const expectedPermission = { ...createReferencedPermission(), id, version };
    expect(actualPermission).toEqual(expectedPermission);
  });

  it('should throw an error when it is unable to get existing permission info', () => {
    const updateDataset = createNonReferencedPermission();
    const actualError =  adapter.adaptExistingPermission(id, updateDataset);

    return expect(actualError).rejects.toThrow('There is no permission that can be updated with id: 1234');
  });
});
