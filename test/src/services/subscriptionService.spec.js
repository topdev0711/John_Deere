/**
 * @jest-environment node
 */

const subscriptionService = require('../../../src/services/subscriptionService');
const conf = require('../../../conf').getConfig();
const apiHelper = require('../../../src/utilities/edlApiHelper');
global.fetch = require('jest-fetch-mock');

jest.mock('../../../src/utilities/edlApiHelper');

const subscriptionBody =  {
  "endpoint": "arn:aws:sqs:us-east-1:305463345279:testagqueue",
  "protocol": "sqs",
  "event": "async_ingest_request",
  "owner": "YZA4U85",
  "dataType": [
      "com.deere.enterprise.datalake.enhance.demo.marvel.ComicCharacters"
  ],
  "representation": [
      "com.deere.enterprise.datalake.enhance.demo.marvel.ComicCharacters@0.0.4"
  ]
};
const dataType = 'com.deere.enterprise.datalake.enhance.demo.marvel.ComicCharacters';
const listSubscriptionsResponse = {
  "subscriptions": [
      {
          "id": "01093eea-33f4-4910-9f85-196c11464143",
          "endpoint": "arn:aws:sqs:us-east-1:305463345279:testagqueue",
          "protocol": "sqs",
          "event": "async_ingest_request",
          "owner": "YZA4U85",
          "dataType": [
              "com.deere.enterprise.datalake.enhance.demo.marvel.ComicCharacters"
          ],
          "representation": [
              "com.deere.enterprise.datalake.enhance.demo.marvel.ComicCharacters@0.0.4"
          ]
      }
    ]
  }


describe('workflow tests', () => {
  beforeEach( () => {
    apiHelper.get.mockResolvedValue([]);
  })

  it('should create subcription', async () => {
    const expectedResult = '01093eea-33f4-4910-9f85-196c11464143';
    apiHelper.postWithInternalOktaAdminParams.mockResolvedValueOnce(expectedResult);

    const actualTasks = await subscriptionService.subscribe(subscriptionBody);

    expect(actualTasks).toEqual(expectedResult);
    expect(apiHelper.postWithInternalOktaAdminParams).toBeCalledTimes(1);
  })

  it('should get list of subscription', async () => {
    apiHelper.getWithInternalOktaAdminParams.mockResolvedValueOnce(listSubscriptionsResponse);

    const actualTasks = await subscriptionService.listSubscriptions(dataType);

    expect(actualTasks[0].dataType[0]).toEqual(dataType);
    expect(apiHelper.getWithInternalOktaAdminParams).toBeCalledTimes(1);
  })

  it('should throw an internal error when post api call fails', () => {
    apiHelper.postWithInternalOktaAdminParams.mockRejectedValueOnce(new Error('some error'));
    return expect(subscriptionService.subscribe(subscriptionBody)).resolves.toThrow(new Error('some error'));
  });

  it('should throw an internal error when get api call fails', () => {
    apiHelper.getWithInternalOktaAdminParams.mockRejectedValueOnce(new Error('some error'));
    return expect(subscriptionService.listSubscriptions(dataType)).resolves.toThrow(new Error('some error'));
  });
});
