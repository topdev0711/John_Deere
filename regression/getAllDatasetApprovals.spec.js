const conf = require('../conf').getConfig();
const datasetApi = `${conf.baseUrl}/api-external/datasets`;
global.fetch = require('node-fetch');

describe('GET all dataset approvals', () => {
  it('should return all pending, rejected, or approved datasets', async () => {
    const expectedValue = {
      id: "AWS",
      name: "AWS"
    };
    const tokenResponse = await fetch(`${conf.oktaOAuthUrl}/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
      body: `client_id=${conf.edlOktaClient}&client_secret=${conf.edlOktaSecret}&grant_type=client_credentials`
    });
    const token = (await tokenResponse.json()).access_token;
    const getDatasetApprovalsResponse = await fetch(`${datasetApi}/approvals`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`}
    });
    const datasetApprovalsResponse = await getDatasetApprovalsResponse.json();
    if(datasetApprovalsResponse.length == 0) {
      console.log('No pending, rejected, or approved datasets to return.');
      expect(datasetApprovalsResponse).toEqual([]);
    } else {
      console.log('At least one dataset is in pending, rejected, or approved status.');
      expect(datasetApprovalsResponse[0].technology).toEqual(expectedValue);
    };
  });
});