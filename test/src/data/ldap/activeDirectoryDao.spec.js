const activeDirectoryDao = require('../../../../src/data/ldap/activeDirectoryDao');
const ldap = require('../../../../src/data/ldap/ldapClient')
const { when, resetAllWhenMocks } = require('jest-when');

jest.mock('../../../../src/data/ldap/ldapClient');

const adGroupName = 'any-group';
const adGroupFilter = `(&(samaccountname=${adGroupName})(objectclass=group))`;
const anyName= 'Any Name';
const anyUsername = 'any123';
const anotherName = 'Another Name';
const anotherUsername = 'another123';
const differentName = 'Different name';
const differentUsername = 'different123';
const JohnDeereGroupManagedBy1 = `CN=${anotherName},OU=Corporate-90,OU=Standard,OU=JDUsers,DC=jdnet,DC=deere,DC=com`;
const JohnDeereGroupManagedBy2 = `CN=${differentName},OU=Corporate-90,OU=Standard,OU=JDUsers,DC=jdnet,DC=deere,DC=com`;
const ownerNames = ['managedBy', 'JohnDeereGroupManagedBy1', 'JohnDeereGroupManagedBy2'];
const ownerAttributes = ['mail', 'sAMAccountName'];
const owner = { name: anyName, email: `${anyUsername}@deere.com`, username: anyUsername };
const backupOwner = { name: anotherName, email: `${anotherUsername}@deere.com`, username: anotherUsername };
const backupOwner1 = { name: differentName, email: `${differentUsername}@deere.com`, username: differentUsername };

function createGroupResponse() {
  return {
    dn: 'CN=any-group,OU=Security,OU=JDGroups,DC=jdnet,DC=deere,DC=com',
    controls: [],
    managedBy: `CN=${anyName},OU=Corporate-90,OU=Standard,OU=JDUsers,DC=jdnet,DC=deere,DC=com`,
  };
}

function createDetailedResponse(name, mail, sAMAccountName) {
  return [{
    dn:`CN=${name},OU=Corporate-90,OU=Standard,OU=JDUsers,DC=jdnet,DC=deere,DC=com`,
    controls:[],
    sAMAccountName,
    mail
  }];
}
describe('activeDirectory tests', () => {

  beforeEach(() => {
    when(ldap.search).calledWith(`(cn=${anyName})`, ownerAttributes).mockResolvedValueOnce(createDetailedResponse(anyName, `${anyUsername}@deere.com`, anyUsername));
    when(ldap.search).calledWith(`(cn=${anotherName})`, ownerAttributes).mockResolvedValueOnce(createDetailedResponse(anotherName, `${anotherUsername}@deere.com`, anotherUsername));
    when(ldap.search).calledWith(`(cn=${differentName})`, ownerAttributes).mockResolvedValueOnce(createDetailedResponse(differentName, `${differentUsername}@deere.com`, differentUsername));
  })

  afterEach(() => {
    resetAllWhenMocks();
    jest.resetAllMocks();
  });

  it('should have primary owner only', async () => {
    when(ldap.search).calledWith(adGroupFilter, ownerNames).mockResolvedValueOnce([createGroupResponse()]);

    const actual = await activeDirectoryDao.findOwners(adGroupName);

    expect(ldap.search).toHaveBeenCalledTimes(2);
    expect(actual).toEqual({ owner });
  });

  it('should have a backup', async () => {
    when(ldap.search).calledWith(adGroupFilter, ownerNames).mockResolvedValueOnce([{ ...createGroupResponse(), JohnDeereGroupManagedBy1 }]);

    const actual = await activeDirectoryDao.findOwners(adGroupName);

    expect(ldap.search).toHaveBeenCalledTimes(3);
    expect(actual).toEqual( { owner, backupOwner });
  });

  it('should have two backups', async () => {
    when(ldap.search).calledWith(adGroupFilter, ownerNames).mockResolvedValueOnce([{ ...createGroupResponse(), JohnDeereGroupManagedBy1, JohnDeereGroupManagedBy2 }]);

    const actual = await activeDirectoryDao.findOwners(adGroupName);

    expect(ldap.search).toHaveBeenCalledTimes(4);
    expect(actual).toEqual({ owner, backupOwner, backupOwner1 });
  });

  it('should thrown an exception when ldap client fails', () => {
    const expectedError = new Error('foo');
    const actual = ldap.search.mockRejectedValueOnce(expectedError);
    return expect(actual).rejects.toThrow(expectedError.message);
  });

  it('finds user info', async () => {
    const userId = 'anyUserId';
    const name = "anyName";
    const mail = 'anyName@JohnDeere.com';
    ldap.searchArray.mockResolvedValueOnce([{sAMAccountName: userId, cn: name, mail}]);

    const actualUser = await activeDirectoryDao.findUserInfo('anyId')

    expect(actualUser).toEqual({mail, name, userId});
  });

  it('does not find user info',  () => {
    ldap.searchArray.mockResolvedValueOnce([{}]);
    const actualUser = activeDirectoryDao.findUserInfo('anyId');
    return expect(actualUser).rejects.toThrow('Racf ID not found');
  });
});
