const permissionDao = require('../../../src/data/permissionDao');
const documentDao = require('../../../src/data/documentDao');
const dereferencedPermission = require('./permissionsDaoSample-dereferenced-permission.json');

jest.mock('../../../src/data/documentDao');

describe('permissionDao tests', () => {
  beforeEach(() => {
    documentDao.putRecord.mockResolvedValue();
  });

  it('should save a permission', async () => {
    const anyPermission = { name: 'Foo' };
    await permissionDao.savePermission(anyPermission);
    expect(documentDao.putRecord).toBeCalledWith('permissions', anyPermission);
  });

  it('should lock a permission', async () => {
    await permissionDao.lockPermission('Foo', 1, 'user123');
    expect(documentDao.updatePropertyForId).toBeCalledWith('permissions','Foo', 'lockedBy', 'user123', 1);
  });

  it('should unlock a permission', async () => {
    await permissionDao.unlockPermission('Foo', 1);
    expect(documentDao.updatePropertyForId).toBeCalledWith('permissions','Foo', 'lockedBy', null, 1);
  });

  it('should fail when saving a permission', () => {
    documentDao.putRecord.mockRejectedValue('foo');

    const anyPermission = { name: 'Foo' };
    const actualResponse = permissionDao.savePermission(anyPermission);

    return expect(actualResponse).rejects.toMatch('foo');
  });

  it('should get permissions', async () => {
    const returnValue = [
      { ...dereferencedPermission, name: 'foo' },
      { ...dereferencedPermission, name: 'bar' },
      { ...dereferencedPermission, name: 'baz' }
    ];

    const expectedResponse = [
      { ...dereferencedPermission, name: 'foo' },
      { ...dereferencedPermission, name: 'bar' },
      { ...dereferencedPermission, name: 'baz' }
    ];
    const query = {};
    documentDao.getLatestRecords.mockResolvedValue(returnValue);
    const actualResponse = await permissionDao.getPermissions();
    expect(documentDao.getLatestRecords).toHaveBeenCalledWith('permissions', query);
    expect(actualResponse).toStrictEqual(expectedResponse);
  });

  it('should get all permissions', async () => {
    const actualReturn = [
      { ...dereferencedPermission, name: 'foo' },
      { ...dereferencedPermission, name: 'bar' },
      { ...dereferencedPermission, name: 'baz' }
    ];
    const expectedResponse = [
      { ...dereferencedPermission, name: 'foo' },
      { ...dereferencedPermission, name: 'bar' },
      { ...dereferencedPermission, name: 'baz' }
    ];
    const statuses = ['AVAILABLE'];
    const query = {
      statuses,
    };
    documentDao.getLatestRecords.mockResolvedValue(actualReturn);
    const actualResponse = await permissionDao.getPermissions(statuses, null, null);
    expect(documentDao.getLatestRecords).toHaveBeenCalledWith('permissions', query);
    expect(actualResponse).toStrictEqual(expectedResponse);
  });

  it('should get permission versions', async () => {
    const returnValue = [
      { ...dereferencedPermission, name: 'foo' },
      { ...dereferencedPermission, name: 'bar' },
      { ...dereferencedPermission, name: 'baz' }
    ];

    const expectedResponse = [
      { ...dereferencedPermission, name: 'foo' },
      { ...dereferencedPermission, name: 'bar' },
      { ...dereferencedPermission, name: 'baz' }
    ];
    documentDao.getVersions.mockResolvedValue(returnValue);
    const actualResponse = await permissionDao.getPermissionVersions('foo');
    expect(documentDao.getVersions).toHaveBeenCalledWith('permissions', 'foo');
    expect(actualResponse).toStrictEqual(expectedResponse);
  });

  it('should get permission', async () => {
    const returnValue = { ...dereferencedPermission, name: 'foo' };
    const expectedResponse = { ...dereferencedPermission, name: 'foo' };
    documentDao.searchByIdAndVersion.mockResolvedValue(returnValue);
    const actualResponse = await permissionDao.getPermission('id', 1);
    expect(documentDao.searchByIdAndVersion).toHaveBeenCalledWith('permissions', 'id', 1);
    expect(actualResponse).toStrictEqual(expectedResponse);
  });
  it('should get latest permissions', async () => {
    const expected = [{ id: 'some perm' }];
    const statuses = ["AVAILABLE"];
    documentDao.getLatestRecords.mockResolvedValueOnce(expected);

    const result = await permissionDao.getLatestPermissions({ statuses });
    expect(result).toEqual(expected);
    expect(documentDao.getLatestRecords).toHaveBeenCalledWith('permissions', { statuses });
  });

  it('should get latest permission from DocDb', async () => {
    const expected = { id: 'some perm' };
    const statuses = ["AVAILABLE"];
    documentDao.getLatestRecord.mockResolvedValueOnce(expected);

    const result = await permissionDao.getLatestPermission(expected.id, statuses);
    expect(result).toEqual(expected);
    expect(documentDao.getLatestRecord).toHaveBeenCalledWith('permissions', expected.id, statuses);
  });

  it('should get permissions for views', async () => {
    const expected = { id: 'some perm', name: 'some perm for view' };
    const statuses = ["AVAILABLE"];
    const views = ["some-view"];
    documentDao.getPermissionsForViews.mockReturnValueOnce([expected]);

    const result = await permissionDao.getPermissionsForDatasetViews(views);
    expect(result).toEqual([expected]);
    expect(documentDao.getPermissionsForViews).toHaveBeenCalledWith('permissions', views);
  });

  it('should update reference data', async () => {
    const updateRequest = {id:'anyData',name:'anyReference',updateType:'subCommunity'}
    const collection = 'permissions';
    await permissionDao.updateReferenceData(updateRequest);
   expect(documentDao.updateReferenceData).toHaveBeenCalledWith(collection,updateRequest);
  })
});
