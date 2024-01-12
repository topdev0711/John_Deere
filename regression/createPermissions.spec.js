const conf = require('../conf').getConfig();
const permissionApi = `${conf.baseUrl}/api-external/permissions`;
global.fetch = require('node-fetch');

describe('POST a permission', () => {
  let token;
  let humanId;
  let systemId;
  
  async function getToken() {
    const tokenResponse = await fetch(`${conf.oktaOAuthUrl}/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
      body: `client_id=${conf.edlOktaClient}&client_secret=${conf.edlOktaSecret}&grant_type=client_credentials`
    });
    return (await tokenResponse.json()).access_token;
  } 

  beforeAll(async () => {
    token = await getToken();
  });

  it('should successfully return a permission ID and version for a new permission for a human group (no updates)', async () => {
    const timeStamp = new Date().toUTCString();
    const requestBody = {
      "name": `Testing a New Permission for a Human Group - ${timeStamp}`,
      "requestComments": "No comments",
      "roleType": "human",
      "businessCase": "Regression testing",
      "startDate": "2020-03-01T00:00:00.000Z",
      "group": "AWS-GIT-DWIS-DEV",
      "entitlements": [
        {
          "id": "31a069a2-bf67-464a-81f2-04169cde977b",
          "actions": [
            "Read"
          ],
          "community": "Channel",
          "subCommunity": "Customer",
          "countriesRepresented": [
            "ALL"
          ],
          "gicp": "Personal & Confidential",
          "additionalTags": [
            "New"
          ],
          "development": true,
          "personalInformation": true
        }
      ]
    };
    const response = await fetch(`${permissionApi}/`, {
      credentials: 'same-origin',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });
    const result = await response.json();
    expect(result.id).toBeDefined();
    expect(result.version).toBeDefined();
    expect(response.status).toEqual(200);
  });

  it('should successfully return a permission ID and version for a new permission for a human group (to test updating)', async () => {
    const timeStamp = new Date().toUTCString();
    const requestBody = {
      "name": `Testing a New Permission for a Human Group to Test Updating - ${timeStamp}`,
      "requestComments": "No comments",
      "roleType": "human",
      "businessCase": "Regression testing",
      "startDate": "2020-03-01T00:00:00.000Z",
      "group": "AWS-GIT-DWIS-DEV",
      "entitlements": [
        {
          "id": "31a069a2-bf67-464a-81f2-04169cde977b",
          "actions": [
            "Read"
          ],
          "community": "Channel",
          "subCommunity": "Customer",
          "countriesRepresented": [
            "ALL"
          ],
          "gicp": "Personal & Confidential",
          "additionalTags": [
            "New"
          ],
          "development": true,
          "personalInformation": true
        }
      ]
    };
    const response = await fetch(`${permissionApi}/`, {
      credentials: 'same-origin',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });
    const result = await response.json();
    humanId = result.id;
    expect(result.id).toBeDefined();
    expect(result.version).toBeDefined();
    expect(response.status).toEqual(200);
  });

  it('should successfully return a permission ID and version when adding a permission to a human group that already has at least one permission (update test)', async () => {
    const timeStamp = new Date().toUTCString();
    const requestBody = {
      "id": "79958e5d-bf4a-4f60-b782-db7f07ac22b4",
      "version": 1,
      "name": `Testing a New Permission for an existing Human Group (Update test) - ${timeStamp}`,
      "requestComments": "No comments",
      "roleType": "human",
      "businessCase": "Regression testing",
      "startDate": "2020-03-08T00:00:00.000Z",
      "group": "AWS-GIT-DWIS-DEV",
      "entitlements": [
         {
            "id": "b8674a4a-d305-4479-bbde-1cdad119da57",
            "actions": [
               "Write"
            ],
            "community": "Engineering",
            "subCommunity": "JDES",
            "countriesRepresented": [
               "ALL"
            ],
            "gicp": "Confidential",
            "additionalTags": [],
            "development": true,
            "personalInformation": true
         },
         {
            "id": "ddc30af1-9d7e-4941-8e17-c5fed0e24d41",
            "actions": [
               "Read"
            ],
            "community": "Channel",
            "subCommunity": "Customer",
            "countriesRepresented": [
               "ALL"
            ],
            "gicp": "Personal & Confidential",
            "additionalTags": [
               "New"
            ],
            "development": true,
            "personalInformation": true
         }
      ]
   };
    const response = await fetch(`${permissionApi}/${humanId}`, {
      credentials: 'same-origin',
      method: 'POST',
      headers: {
       'Accept': 'application/json',
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });
    const result = await response.json();
    expect(result.id).toBeDefined();
    expect(result.version).toBeDefined();
    expect(response.status).toEqual(200);
  });

  it('should successfully return a permission ID and version for a new permission for a system ID (no updates)', async () => {
    const timeStamp = new Date().toUTCString();
    const requestBody = {
      "name": `Testing a New Permission for a System ID - ${timeStamp}`,
      "requestComments": "No comments",
      "roleType": "system",
      "businessCase": "Regression testing",
      "startDate": "2020-03-06T06:00:00.000Z",
      "group": "AWS-GIT-DWIS-DEV",
      "clientId": "My-client-ID",
      "entitlements": [
         {
            "id": "f09f15f3-ebab-4e99-aca0-9a5bdd05102c",
            "actions": [
               "Read"
            ],
            "community": "Channel",
            "subCommunity": "Customer",
            "countriesRepresented": [
               "ALL"
            ],
            "gicp": "Highly Confidential",
            "additionalTags": [
               "New"
            ],
            "development": true,
            "personalInformation": true
         }
      ]
   };
    const response = await fetch(`${permissionApi}/`, {
      credentials: 'same-origin',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });
    const result = await response.json();
    expect(result.id).toBeDefined();
    expect(result.version).toBeDefined();
    expect(response.status).toEqual(200);
  });

  it('should successfully return a permission ID and version for a new permission for a system ID (to test updating)', async () => {
    const timeStamp = new Date().toUTCString();
    const requestBody = {
      "name": `Testing a New Permission for a System ID to Test Updating - ${timeStamp}`,
      "requestComments": "No comments",
      "roleType": "system",
      "businessCase": "Regression testing",
      "startDate": "2020-03-06T06:00:00.000Z",
      "group": "AWS-GIT-DWIS-DEV",
      "clientId": "My-client-ID",
      "entitlements": [
          {
            "id": "f09f15f3-ebab-4e99-aca0-9a5bdd05102c",
            "actions": [
               "Read"
            ],
            "community": "Channel",
            "subCommunity": "Customer",
            "countriesRepresented": [
               "ALL"
            ],
            "gicp": "Highly Confidential",
            "additionalTags": [
                "New"
            ],
            "development": true,
            "personalInformation": true
         }
      ]
   };
    const response = await fetch(`${permissionApi}/`, {
      credentials: 'same-origin',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });
    const result = await response.json();
    systemId = result.id;
    expect(result.id).toBeDefined();
    expect(result.version).toBeDefined();
    expect(response.status).toEqual(200);
  });

  it('should successfully return a permission ID and version when adding a permission to a system ID that already has at least one permission (update test)', async () => {
    const timeStamp = new Date().toUTCString();
    const requestBody = {
      "name": `Testing a New Permission for an Existing System ID (Update Test) - ${timeStamp}`,
      "requestComments": "No comments",
      "roleType": "system",
      "businessCase": "Regression testing",
      "startDate": "2020-03-06T06:00:00.000Z",
      "group": "AWS-GIT-DWIS-DEV",
      "clientId": "My-client-ID",
      "entitlements": [
          {
            "id": "f09f15f3-ebab-4e99-aca0-9a5bdd05102c",
            "actions": [
               "Read"
            ],
            "community": "Channel",
            "subCommunity": "Customer", 
            "countriesRepresented": [
               "ALL"
            ],
            "gicp": "Highly Confidential",
            "additionalTags": [
                "New"
            ],
            "development": true,
            "personalInformation": true
         }
      ]
   };
    const response = await fetch(`${permissionApi}/${systemId}`, {
      credentials: 'same-origin',
      method: 'POST',
      headers: {
       'Accept': 'application/json',
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });
    const result = await response.json();
    expect(result.id).toBeDefined();
    expect(result.version).toBeDefined();
    expect(response.status).toEqual(200);
  });
});