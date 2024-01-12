const permissionModel = require('../../../src/model/permissionModel');

describe('permission model', () => {
  const isoDate = new Date().toISOString();

  const validPermission = {
    "id": 'my-permission-id',
    "name": 'New Permission',
    "version": 1,
    "createdBy": 'Scooby',
    "createdAt": isoDate,
    "description": "Some great description",
    "group": "AWS-GIT-DWIS-DEV",
    "roleType": "human",
    "clientId": "1234",
    "businessCase": "I really wanna access this data!",
    "startDate": "2019-06-24T20:53:15.948Z",
    "endDate": "2020-06-24T20:53:15.948Z",
    "entitlements": [
      {
        "community": 'a7b76f9e-8ff4-4171-9050-3706f1f12188',
        "subCommunity": 'd127f360-3e52-4175-8e74-c3d81b88aebf',
        "gicp": '14',
        "countriesRepresented": ['12'],
        "additionalTags": [],
        "personalInformation": true,
        "development": true
      }
    ],
    approvals: [{}],
    commentHistory: [],
    views:['views1', 'views2']
  };

  it('valid permission', () => {
    expect(permissionModel.validate(validPermission)).toBeNull();
  });


  it('is in invalid when a group is not AWS or EDG', () => {
    const invalidGroup = { ...validPermission, group: 'a bad group name'};
    const error = permissionModel.validate(invalidGroup);
    expect(error.message).toEqual('child \"group\" fails because [\"group\" with value \"a bad group name\" fails to match the All AD groups must start with AWS or EDG pattern]');
    expect(error.details[0].name).toEqual('New Permission');
  });

  it('invalid permission', () => {
    const invalidPermission = {...validPermission};
    delete invalidPermission.roleType;

    const error = permissionModel.validate(invalidPermission);

    expect(error.message).toEqual('child \"roleType\" fails because [\"roleType\" is required]');
    expect(error.details[0].name).toEqual('New Permission');
  });

  it('no views but entitlements', () => {
    const permissionWithOutView = {...validPermission, views:[]};
    expect(permissionModel.validate(permissionWithOutView)).toBeNull();
  });

  it('with views but no entitlements', () => {
    const permissionWithOutEntitlements = {...validPermission, entitlements:[]};
    expect(permissionModel.validate(permissionWithOutEntitlements)).toBeNull();
  });

  it('no views and no entitlements', () => {
    const permissionWithOutEntitlementsAndViews = {...validPermission, entitlements:[], views:[]};
    const error = permissionModel.validate(permissionWithOutEntitlementsAndViews);
    expect(error.message).toEqual('Must select at least 1 entitlement or 1 view');
  });

  it('system permission with views', () => {
    const systemPermissionWithViews = {...validPermission,roleType:"system"};
    const error = permissionModel.validate(systemPermissionWithViews);
    expect(error.message).toEqual('System permission can not have views');
  });

  it('system permission with empty views', () => {
    const systemPermissionWithOutViews = {...validPermission,roleType:"system", views:[]};
    expect(permissionModel.validate(systemPermissionWithOutViews)).toBeNull();
  });

}); 
