const conf = require('../conf').getConfig();
const datasetApi = `${conf.baseUrl}/api-external/datasets`;
global.fetch = require('node-fetch');

describe('POST a dataset', () => {
  let token;
  
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

  it('should successfully return a dataset ID and version for a new raw dataset with no schemas', async () => {
    const timeStamp = new Date().toUTCString();
    const requestBody = {
      "name": `Regression Testing - Simple Raw Dataset - ${timeStamp}`,
      "description": "Simple raw dataset for regression testing with no schemas",
      "requestComments": "No comments",
      "documentation": "_Documentation **needs** to be added_",
      "custodian": "AWS-GIT-DWIS-DEV",
      "sourceDatasets": [],
      "category": "Master",
      "phase": "Raw",
      "technology": "AWS",
      "physicalLocation": "us-east-1",
      "linkedSchemas": [],
      "deletedSchemas": [],
      "tables": [],
      "schemas": [],
      "classifications": [
         {
           "id": "1255d7f5-db98-4833-be80-23f8e669e7cf",
           "community": "Channel",
           "subCommunity": "Account AOR",
           "gicp": "Personal & Confidential",
           "countriesRepresented": [],
           "personalInformation": false,
           "development": false,
           "additionalTags": []
         }   
      ]
    };
    const response = await fetch(`${datasetApi}/`, {
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

  it('should successfully return a dataset ID and version for a new enhance dataset with no schemas', async () => {
    const timeStamp = new Date().toUTCString();
    const requestBody = {
      "name": `Regression Testing - Simple Enhance Dataset - ${timeStamp}`,
      "description": "Simple enhance dataset for regression testing with no schemas",
      "requestComments": "No comments",
      "documentation": "_Documentation **needs** to be added_",
      "custodian": "AWS-GIT-DWIS-DEV",
      "sourceDatasets": [],
      "category": "Master",
      "phase": "Enhance",
      "technology": "AWS",
      "physicalLocation": "us-east-1",
      "linkedSchemas": [],
      "deletedSchemas": [],
      "tables": [],
      "schemas": [],
      "classifications": [
         {
            "id": "51775312-ec3e-44b1-ac9c-50d345db718e",
            "community": "Channel",
            "subCommunity": "Customer",
            "gicp": "Personal & Confidential",
            "countriesRepresented": [],
            "personalInformation": false,
            "development": false,
            "additionalTags": []
          }
      ]
    };
    const response = await fetch(`${datasetApi}/`, {
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

  it('should successfully return a dataset ID and version for a new enhance dataset with a new schema', async () => {
    const timeStamp = new Date().toUTCString();
    const requestBody = {
      "name": `Regression Testing - Enhance Dataset with a New Schema - ${timeStamp}`,
      "description": "Creating an enhance dataset for regression testing with a new schema",
      "requestComments": "No comments",
      "documentation": "_Documentation **needs** to be added_",
      "custodian": "AWS-GIT-DWIS-DEV",
      "sourceDatasets": [],
      "category": "Master",
      "phase": "Enhance",
      "technology": "AWS",
      "physicalLocation": "us-east-1",
      "linkedSchemas": [],
      "deletedSchemas": [],
      "tables": [],
      "schemas": [
        {
           "id": "d7e49571-0ea0-4984-a706-311693cecc8d",
           "name": "Regression Testing - My New Schema",
           "version": "1.0.0",
           "description": "New schema for my enhance dataset",
           "documentation": "_Documentation **needs** to be added_",
           "partitionedBy": [
              "Number"
           ],
           "testing": true,
           "fields": [
              {
                 "name": "ID",
                 "attribute": "id",
                 "datatype": "int",
                 "description": "Unique ID",
                 "nullable": false
              },
              {
                 "name": "Number",
                 "attribute": "None",
                 "datatype": "int",
                 "description": "Alternate number used for secondary ID",
                 "nullable": false
              },
              {
                 "name": "Name",
                 "attribute": "None",
                 "datatype": "string",
                 "description": "Optional name information",
                 "nullable": true
              }
           ]
        }
     ],
      "classifications": [
         {
            "id": "51775312-ec3e-44b1-ac9c-50d345db718e",
            "community": "Channel",
            "subCommunity": "Customer",
            "gicp": "Personal & Confidential",
            "countriesRepresented": [],
            "personalInformation": false,
            "development": false,
            "additionalTags": []
          }
      ]
    };
    const response = await fetch(`${datasetApi}/`, {
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

  it('should successfully return a dataset ID and version for a new enhance dataset with a new schema and a linked schema', async () => {
    const timeStamp = new Date().toUTCString();
    const requestBody = {
      "name": `Regression Testing - Enhance Dataset with a New Schema and a Linked Schema - ${timeStamp}`,
      "description": "Creating an enhance dataset for regression testing with a new schema and a linked schema",
      "requestComments": "No comments",
      "documentation": "_Documentation **needs** to be added_",
      "custodian": "AWS-GIT-DWIS-DEV",
      "sourceDatasets": [],
      "category": "Master",
      "phase": "Enhance",
      "technology": "AWS",
      "physicalLocation": "us-east-1",
      "linkedSchemas": ["d7e49571-0ea0-4984-a706-311693cecc8d--1"],
      "deletedSchemas": [],
      "tables": [],
      "schemas": [
        {
           "id": "d7e49571-0ea0-4984-a706-311693cecc8d",
           "name": "Regression Testing - My New Schema",
           "version": "1.0.0",
           "description": "New schema for my enhance dataset",
           "documentation": "_Documentation **needs** to be added_",
           "partitionedBy": [
              "Number"
           ],
           "testing": true,
           "fields": [
              {
                 "name": "ID",
                 "attribute": "id",
                 "datatype": "int",
                 "description": "Unique ID",
                 "nullable": false
              },
              {
                 "name": "Number",
                 "attribute": "None",
                 "datatype": "int",
                 "description": "Alternate number used for secondary ID",
                 "nullable": false
              },
              {
                 "name": "Name",
                 "attribute": "None",
                 "datatype": "string",
                 "description": "Optional name information",
                 "nullable": true
              }
           ]
        }
     ],
      "classifications": [
         {
            "id": "51775312-ec3e-44b1-ac9c-50d345db718e",
            "community": "Channel",
            "subCommunity": "Customer",
            "gicp": "Personal & Confidential",
            "countriesRepresented": [],
            "personalInformation": false,
            "development": false,
            "additionalTags": []
          }
      ]
    };
    const response = await fetch(`${datasetApi}/`, {
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