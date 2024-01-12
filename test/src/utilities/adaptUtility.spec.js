/**
 * @jest-environment node
 */

const adaptUtility = require('../../../src/utilities/adaptUtility');
const notificationService = require('../../../src/services/notificationService');
const datasetService = require('../../../src/services/datasetService');
const permissionService = require('../../../src/services/permissionService');
const versionService = require('../../../src/services/versionService');

jest.mock('../../../src/services/notificationService');
jest.mock('../../../src/services/datasetService');
jest.mock('../../../src/services/permissionService');
jest.mock('../../../src/services/versionService');

const datasets = [ 
  {
    id: 'id', 
    name: 'dataset', 
    version: '1', 
    updatedAt: 'some time'
  },
  {
    id: 'id', 
    name: 'dataset', 
    version: '2', 
    updatedAt: 'some time'
  }
];
const permissions = [
  {
    id: 'id', 
    version: '1', 
    updatedAt: 'some time'
  },
  {
    id: 'id', 
    version: '2', 
    updatedAt: 'some time'
  }
];


describe('adaptUtility tests', () => {
  beforeEach(() => {
    notificationService.sendDatasetNotification.mockResolvedValue('Success');
    notificationService.sendPermissionNotification.mockResolvedValue('Success');
    datasetService.getLatestDatasets.mockResolvedValue(datasets);
    permissionService.listAllForStatus.mockResolvedValue(permissions);
  })

  it('should submit notifications for all latest available records', async () => {
    const expectedDataset = datasets[1];
    const expectedPermission = permissions[1];
    versionService.getLatestVersions
      .mockReturnValueOnce([expectedDataset])
      .mockReturnValueOnce([expectedPermission]);

    const results = await adaptUtility.adaptLatestAvailableRecords();
    const successResponse = {
      dataset: 'id',
      version: '2',
      notification: 'Success'
    }

    expect(results).toHaveLength(2);
    expect(results).toContainEqual(successResponse);
    expect(datasetService.getLatestDatasets).toHaveBeenCalledWith();
    expect(permissionService.listAllForStatus).toHaveBeenCalledWith(['AVAILABLE']);
    expect(versionService.getLatestVersions).toHaveBeenCalledWith(datasets);
    expect(versionService.getLatestVersions).toHaveBeenCalledWith(permissions);
    expect(notificationService.sendPermissionNotification).toHaveBeenCalledWith(
      expectedPermission.id, 
      expectedPermission.version, 
      expectedPermission.updatedAt
    );
    expect(notificationService.sendDatasetNotification).toHaveBeenCalledWith(
      expectedDataset.id, 
      expectedDataset.name, 
      expectedDataset.version, 
      expectedDataset.updatedAt
    );
  });

  it('should return error if one recieved',  () => {
    const expectedDataset = datasets[1];
    const expectedPermission = permissions[1];
    versionService.getLatestVersions
      .mockReturnValueOnce([expectedDataset])
      .mockReturnValueOnce([expectedPermission]);
    notificationService.sendPermissionNotification.mockRejectedValueOnce('rejected');

    expect(adaptUtility.adaptLatestAvailableRecords()).rejects.toThrow('rejected');
  });
});