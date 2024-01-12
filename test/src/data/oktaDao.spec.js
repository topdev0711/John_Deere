const oktaDao = require('../../../src/data/oktaDao');
const edlApiHelper = require('../../../src/utilities/edlApiHelper');
const { oktaApiUrl } = require('../../../conf').getConfig();

jest.mock('../../../src/utilities/edlApiHelper');

describe('Okta Dao Test Suite', () => {
  it('should get users from okta', async () => {
    const expectedUsers = [{profile: {displayName: 'Joe', email: 'joe@deere.com'}}];
    edlApiHelper.get.mockResolvedValueOnce(expectedUsers);
    const id = 'id'
    const expectedUserUrl = `${oktaApiUrl}/groups/${id}/users`;
    const users = await oktaDao.getUsersForGroup(id);

    expect(users).toEqual(expectedUsers);
    expect(edlApiHelper.get).toHaveBeenCalledWith(expectedUserUrl, true);
  });

  it('should get users with query from okta', async () => {
    const expectedUsers = [{profile: {displayName: 'Joe', email: 'joe@deere.com'}}];
    edlApiHelper.get.mockResolvedValueOnce(expectedUsers);
    const id = 'id'
    const expectedUserUrl = `${oktaApiUrl}/groups/${id}/users`;
    const query = '?before=1234';
    const users = await oktaDao.getUsersForGroup(id, query);

    expect(users).toEqual(expectedUsers);
    expect(edlApiHelper.get).toHaveBeenCalledWith(expectedUserUrl + query, true);
  });
  it('should get group ids', async () => {
    const expectedGroups = [
      {id: 'id', profile: { samAccountName: 'name',windowsDomainQualifiedName: 'JDNET://' }},
      {id: 'other id', profile: { samAccountName: 'other name',windowsDomainQualifiedName: 'JD://' }}
    ];
    const group = 'some group';
    const expectedGroupUrl = `${oktaApiUrl}/groups?q=${group}`;
    edlApiHelper.get.mockResolvedValueOnce(expectedGroups);

    const groups = await oktaDao.getGroups(group);

    expect(groups).toEqual(expectedGroups);
    expect(edlApiHelper.get).toHaveBeenCalledWith(expectedGroupUrl, true);
  });
});