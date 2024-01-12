const conf = require('../../../conf');
const oktaDao = require('../../../src/data/oktaDao');
const activeDirectoryDao = require('../../../src/data/ldap/activeDirectoryDao');
const userService = require('../../../src/services/userService');

jest.mock('../../../src/data/oktaDao');
jest.mock('../../../src/data/ldap/activeDirectoryDao');

describe('User Service Suite', () => {
  const group = 'some group';
  const expectedGroups = [
    {id: 'id', profile: { samAccountName: 'some group', windowsDomainQualifiedName: 'JDNET://' }},
    {id: 'other id', profile: { samAccountName: 'some group', windowsDomainQualifiedName: 'JD://' }}
  ];
  const returnedUsers = [
    {
      profile: {
        displayName: 'Joe',
        email: 'joe@deere.com',
        randomKey: 'something',
        userType: 'salary'
      },
      id: 'something'
    },
    {
      profile: {
        samAccountName: 'appid',
        email: 'appid@deere.com',
        randomKey: 'random'
      },
      id: 'app'
    },
    {
      profile: {
        displayName: 'appid2',
        email: 'appid2@deere.com',
        randomKey: 'random'
      },
      id: 'app2'
    }
  ];
  const expectedUsers = [
    { id: 'something', displayName: 'Joe', email: 'joe@deere.com' },
    { id: 'app', displayName: 'appid (app id)', email: 'appid@deere.com' },
    { id: 'app2', displayName: 'appid2 (app id)', email: 'appid2@deere.com' }
  ];

  beforeEach(() => {
    oktaDao.getGroups.mockResolvedValueOnce(expectedGroups);
    jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue({
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn()
    });
  });

  it('should get users for group', async () => {
    oktaDao.getUsersForGroup.mockResolvedValueOnce(returnedUsers);

    const users = await userService.getUsersForGroup(group);

    expect(users).toEqual(expectedUsers);
    expect(oktaDao.getGroups).toHaveBeenCalledWith(group);
    expect(oktaDao.getUsersForGroup).toHaveBeenCalledWith('id', '?limit=10');
  });

  it('should get users with after query', async () => {
    oktaDao.getUsersForGroup.mockResolvedValueOnce(returnedUsers);
    const query = { after: '1234' };
    const users = await userService.getUsersForGroup(group, query);

    expect(oktaDao.getUsersForGroup).toHaveBeenCalledWith('id', `?limit=10&after=1234`);
  });

  it('should get users with loadFirst query', async () => {
    oktaDao.getUsersForGroup.mockResolvedValueOnce(returnedUsers);
    const query = { loadFirst: true };
    const users = await userService.getUsersForGroup(group, query);

    expect(oktaDao.getUsersForGroup).toHaveBeenCalledWith('id', `?limit=100`);
  });

  it('should not use other queries', async () => {
    oktaDao.getUsersForGroup.mockResolvedValueOnce(returnedUsers);
    const query = { something: '1234' };
    const users = await userService.getUsersForGroup(group, query);

    expect(oktaDao.getUsersForGroup).toHaveBeenCalledWith('id', `?limit=10`);
  });

  it('should get cached users', async () => {
    jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue({
      get: jest.fn().mockResolvedValue(expectedUsers),
      set: jest.fn()
    });
    const users = await userService.getUsersForGroup(group);
    expect(users).toEqual(expectedUsers);
  });

  it('should return an error if a call fails', () => {
    oktaDao.getGroups.mockRejectedValue('Some Error');

    return expect(userService.getUsersForGroup(group)).rejects.toThrow('An unexpected error occurred when retrieving users from Okta.');
  });

  it('should return an error if group does not exist',  () => {
    return expect(userService.getUsersForGroup('group')).resolves.toThrow('group does not exist in Okta.');
  });

  it('gets user info', async () => {
    const userInfo = {mail: 'anyname@JohnDeere.com', name: 'anyName', racfId: 'anyId'};
    activeDirectoryDao.findUserInfo.mockResolvedValue(userInfo);

    const actualUser = await userService.getUserInfo('anyId');

    expect(actualUser).toEqual(userInfo);
  });
});
