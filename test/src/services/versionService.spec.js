const versionService = require('../../../src/services/versionService');

describe('version service', () => {
  const anyUser = 'anyUser';
  const anyVersionType = 'anyVersionType';
  const expectedErrorMessage = `${anyVersionType} update not allowed.`;
  const createVersion = (status, version = 1) => { return { status, version, approvals: [] }};
  const assertValid = (status, version = 1) => {
    const updatedVersion = createVersion('AVAILABLE');
    const allVersions = [updatedVersion];
    const actualValue = versionService.allowedToUpdate(allVersions, updatedVersion);
    expect(actualValue).toEqual(undefined);
  };

  it('allowed to update available', () => assertValid('AVAILABLE'));

  it('allowed to update pending', () => assertValid('PENDING'));

  it('allowed to update rejected', () => assertValid('REJECTED'));

  it('not allowed to update when all versions deleted', () => {
    const updatedVersion = createVersion('DELETED');
    const allVersions = [updatedVersion, updatedVersion];
    const actualValue = () => versionService.allowedToUpdate(allVersions, updatedVersion, anyUser, anyVersionType);
    expect(actualValue).toThrowError(expectedErrorMessage);
  });

  it('not allowed to update available version if another pending version exists', () => {
    const updatedVersion = createVersion('AVAILABLE');
    const allVersions = [updatedVersion, createVersion('PENDING', 2)];
    const actualValue = () => versionService.allowedToUpdate(allVersions, updatedVersion, anyUser, anyVersionType);
    expect(actualValue).toThrowError(expectedErrorMessage);
  });

  it('not allowed to update available version if another rejected version exists', () => {
    const updatedVersion = createVersion('AVAILABLE');
    const allVersions = [updatedVersion, createVersion('REJECTED', 2)];
    const actualValue = () => versionService.allowedToUpdate(allVersions, updatedVersion, anyUser, anyVersionType);
    expect(actualValue).toThrowError(expectedErrorMessage);
  });

  it('not allowed to update available version if another approved version exists', () => {
    const updatedVersion = createVersion('AVAILABLE');
    const allVersions = [updatedVersion, createVersion('APPROVED', 2)];
    const actualValue = () => versionService.allowedToUpdate(allVersions, updatedVersion, anyUser, anyVersionType);
    expect(actualValue).toThrowError(expectedErrorMessage);
  });

  it('not allowed to update old available version', () => {
    const firstVersion = createVersion('AVAILABLE');
    const secondVersion = createVersion('AVAILABLE', 2);
    const allVersions = [firstVersion, secondVersion];
    const actualValue = () => { versionService.allowedToUpdate(allVersions, firstVersion, anyUser, anyVersionType) };
    expect(actualValue).toThrowError(expectedErrorMessage);
  });

  it('allowed to update old available version if latest deleted', () => {
    const firstVersion = createVersion('AVAILABLE');
    const secondVersion = createVersion('DELETED', 2);
    const allVersions = [firstVersion, secondVersion];
    const actualValue = versionService.allowedToUpdate(allVersions, firstVersion);
    expect(actualValue).toEqual(undefined);
  });

  it('not allowed to update a version that is approved', () => {
    const updatedVersion = createVersion('APPROVED');
    const allVersions = [updatedVersion];
    const actualValue = () => versionService.allowedToUpdate(allVersions, updatedVersion, anyUser, anyVersionType);
    expect(actualValue).toThrowError(expectedErrorMessage);
  });

  it('not allowed to update a pending version if any approver has approved', () =>{
    const updatedVersion = createVersion('PENDING');
    updatedVersion.approvals = [{status: 'APPROVED'}];
    const allVersions = [updatedVersion];
    const actualValue = () => versionService.allowedToUpdate(allVersions, updatedVersion, anyUser, anyVersionType);
    expect(actualValue).toThrowError(expectedErrorMessage);
  });

  it('not allowed to update a pending version if you are not the creator', () => {
    const updatedVersion = createVersion('PENDING');
    updatedVersion.createdBy = 'Shaggy';
    const allVersions = [updatedVersion];
    const actualValue = () => versionService.allowedToUpdate(allVersions, updatedVersion, anyUser, anyVersionType);
    expect(actualValue).toThrowError(expectedErrorMessage);
  });

  it('allowed to update an available version when you are not the creator', () => {
    const updatedVersion = createVersion('AVAILABLE');
    updatedVersion.createdBy = 'Shaggy';
    const allVersions = [updatedVersion];
    const actualValue = versionService.allowedToUpdate(allVersions, updatedVersion, 'Scooby');
    expect(actualValue).toEqual(undefined);
  });

  it('version should be increased by one taking into account deleted versions when available', () => {
    const updatedVersion = createVersion('AVAILABLE', 1);
    const allVersions = [updatedVersion, createVersion('DELETED', 2)];
    const actualVersion = versionService.calculateVersion(allVersions, updatedVersion);
    const expectedVersion = 3;
    expect(actualVersion).toEqual(expectedVersion);
  });

  it('version should NOT be increased when status NOT available', () => {
    const updatedVersion = createVersion('PENDING', 1);
    const allVersions = [updatedVersion];
    const actualVersion = versionService.calculateVersion(allVersions, updatedVersion);
    const expectedVersion = updatedVersion.version;
    expect(actualVersion).toEqual(expectedVersion);
  });

  it('get latest non-deleted version', () => {
    const expectedVersion = createVersion('AVAILABLE', 1);
    const allVersions = [expectedVersion, createVersion('DELETED', 2)];
    const latestVersion = versionService.getLatestNonDeletedVersion(allVersions);
    expect(latestVersion).toEqual(expectedVersion);
  });

  it('get latest available version', () => {
    const expectedVersion = createVersion('AVAILABLE', 1);
    const allVersions = [expectedVersion, createVersion('PENDING', 2)];
    const latestVersion = versionService.getLatestAvailableVersion(allVersions);
    expect(latestVersion).toEqual(expectedVersion);
  });

  it('should handle undefined input', () => {
    expect(versionService.getLatestAvailableVersion([])).toEqual();
  });

  it('should fail if there are no previous versions', () => {
    const actualVersion = () => { versionService.allowedToUpdate([], createVersion('PENDING'), anyUser, anyVersionType) };
    expect(actualVersion).toThrowError(expectedErrorMessage);
  });

  it('should should fail if the latest available record is lockedBy another user', () => {
    const versions = [{...createVersion('AVAILABLE', 1), lockedBy: { username: 'someOtherUser' }}];
    const newRecord = {...createVersion('PENDING', 2), createdBy: 'user'};
    const actualVersion = () => { versionService.allowedToUpdate(versions, newRecord, anyUser, anyVersionType) };
    expect(actualVersion).toThrowError(expectedErrorMessage);
  });

  it('should should pass if the latest available record is lockedBy another user', () => {
    const versions = [{...createVersion('AVAILABLE', 1), lockedBy: 'user'}];
    const newRecord = {...createVersion('PENDING', 2), createdBy: 'user'};
    const actualVersion = () => { versionService.allowedToUpdate(versions, newRecord, anyUser, anyVersionType) };
    expect(actualVersion).toThrowError(expectedErrorMessage);
  });

  describe('get latest version tests', () => {
    it('should return only the latest items', () => {
      const datasets = createDatasets();
      const permissions = createPermissions();
      const expectedResponse = [datasets[2],datasets[0], permissions[2], permissions[1]];
      const actualResponse =  versionService.getLatestVersions(createDatasets().concat(createPermissions()));
      expect(actualResponse).toEqual(expectedResponse);
    });

    function createDatasets() {
      return [
        {
          id: 'b-testdsid1-kjdfkdjf12',
          version: 3,
          classifications: [
            {community: 'kfdjsfk83-93ifdjh98'}
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
            {community: 'kfdjsfk83-93ifdjh98'},
            {community: 'supplier'}
          ],
          createdAt: '2019-11-10T02:43:21.175Z',
          status: 'AVAILABLE'
        },
        {
          id: 'a-testdsid2-lkjfsdo1',
          name: 'Another Test Dataset',
          version: 1,
          classifications: [
            {community: 'kfdjsfk83-93ifdjh98'},
            {community: 'supplier', subcommunity: 'some-dataset-subcommunity'},
          ],
          createdAt: '2019-11-12T02:43:21.175Z',
          status: 'AVAILABLE'
        },
        {
          id: 'b-testdsid1-kjdfkdjf12',
          name: 'Test Dataset',
          version: 2,
          classifications: [
            {community: 'kfdjsfk83-93ifdjh98'}
          ],
          createdAt: '2019-11-11T02:43:21.175Z',
          status: 'AVAILABLE'
        },
      ]
    };

    function createPermissions() {
      return [
        {
          id: 'testpermid1-kjdfkdjf12',
          name: 'Test Permission',
          version: 1,
          classifications: [
            {community: 'kfdjsfk83-93ifdjh98'}
          ],
          createdAt: '2019-11-10T02:43:21.175Z',
          status: 'AVAILABLE'
        },
        {
          id: 'testpermid2-lkjfsdo1',
          name: 'Another Test Permission',
          version: 1,
          classifications: [
            {community: 'kfdjsfk83-93ifdjh98'},
            {community: 'supplier'}
          ],
          createdAt: '2019-11-12T02:43:21.175Z',
          status: 'AVAILABLE'
        },
        {
          id: 'testpermid1-kjdfkdjf12',
          name: 'Test Permission',
          version: 3,
          classifications: [
            {community: 'kfdjsfk83-93ifdjh98'},
            {community: 'supplier', subcommunity: 'some-permission-subcommunity'},
          ],
          createdAt: '2019-11-12T02:43:21.175Z',
          status: 'AVAILABLE'
        },
        {
          id: 'testpermid1-kjdfkdjf12',
          name: 'Test Permission',
          version: 2,
          classifications: [
            {community: 'kfdjsfk83-93ifdjh98'}
          ],
          createdAt: '2019-11-11T02:43:21.175Z',
          status: 'AVAILABLE'
        },
      ]
    };
  });
});
