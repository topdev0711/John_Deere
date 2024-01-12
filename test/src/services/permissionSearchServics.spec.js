/*** @jest-environment node */
const opensearchPermissionDao = require('../../../src/data/opensearchPermissionDao');
const permissionSearchService = require('../../../src/services/permissionSearchService');
const conf = require('../../../conf');

jest.mock('../../../src/data/opensearchPermissionDao');

describe('permissionSearchService tests', () => {
  it('should filter on community when searching for permissions in opensearch', async () => {
    const searchResults = [
      {id: 'AWS-GIT-DWIS-DEV', roleType: 'human', permissions: [{entitlements: [{community: {name: 'Systems'}}]}]},
      {id: 'AWS-GIT-DWIS-ADMIN', roleType: 'system', permissions: [{entitlements: [{community: {name: 'Demo'}}]}]},
    ];
    const queryParams = {_query : {searchTerm: 'Systems'}};

    const getSpy = jest.fn().mockResolvedValue([]);
    const setSpy = jest.fn();
    jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue({ get: getSpy, set: setSpy });

    const expectedResult = [searchResults[0]];
    opensearchPermissionDao.getPermissions.mockResolvedValueOnce(expectedResult);
    const actualResult = await permissionSearchService.findPermissions(queryParams);
    const getPermissionsFunc = jest.spyOn(opensearchPermissionDao, 'getPermissions');
    expect(getPermissionsFunc).toHaveBeenCalledWith({searchTerm: 'Systems'}, 0, 20);
    expect(actualResult).toEqual(expectedResult);
  });
});
