/*** @jest-environment node */
const opensearchDao = require('../../../src/data/opensearchDao');
const datasetSearchService = require('../../../src/services/datasetSearchService');
const conf = require('../../../conf');
const permissionDao = require('../../../src/data/permissionDao');
const viewService = require('../../../src/services/viewService');

jest.mock('../../../src/data/opensearchDao');
jest.mock('../../../src/data/permissionDao');
jest.mock('../../../src/services/viewService');

describe('datasetSearchService tests', () => {
  it('should filter on community when searching for datasets in opensearch', async () => {
    const searchResults = [
      {id: 1, name: 'Stan', version: 1, classifications: [{community: { name: 'CIA-agent' }}]},
      {id: 2, name: 'Francine', version: 1, classifications: [{community: { name: 'homemaker' }}]},
    ];
    const queryParams = {_query : {name: undefined, community: 'cia-agent'}};

    const getSpy = jest.fn().mockResolvedValue([]);
    const setSpy = jest.fn();
    jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue({ get: getSpy, set: setSpy });

    const viewStatus = { name: 'some-view', status: 'AVAILABLE' };
    permissionDao.getLatestPermissions.mockResolvedValueOnce([searchResults[0]]);
    viewService.getViewsWithStatus.mockResolvedValueOnce([viewStatus]);

    const expectedResult = [searchResults[0]];
    opensearchDao.getDatasets.mockResolvedValueOnce(expectedResult);
    const actualResult = await datasetSearchService.findDatasets(queryParams);
    const getDatasetsFunc = jest.spyOn(opensearchDao, 'getDatasets');
    expect(getDatasetsFunc).toHaveBeenCalledWith({communities: ['cia-agent'], "visibility" : "FULL_VISIBILITY"}, 0, 20);
    expect(actualResult).toEqual(expectedResult);
  });
});
