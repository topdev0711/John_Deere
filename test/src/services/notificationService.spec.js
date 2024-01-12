/**
 * @jest-environment node
 */

const AWS_MOCK = require("aws-sdk-mock");
const notificationService = require("../../../src/services/notificationService");
const datasetService = require('../../../src/services/datasetService');
const permissionService = require('../../../src/services/permissionService');
const conf = require("../../../conf");
const confSpy = jest.spyOn(conf, "getConfig");

jest.mock('../../../src/services/datasetService');
jest.mock('../../../src/services/permissionService');

const datasetApi = `${conf.getConfig().baseUrl}/api-external/datasets`;
const permissionApi = `${conf.getConfig().baseUrl}/api-external/permissions`;
const topicArn = conf.getConfig().topicARN;
const edlLocalUser = {username: 'EDL', groups: []}

describe("notification tests", () => {
  beforeEach(() => {
    jest.spyOn(conf, "getConfig").mockReturnValue({ isLocal: false });
  });

  afterEach(() => {
    confSpy.mockReset();
  });

  it("should send notification", async () => {
    const expectedNotificationInfo = "Some-Message-Id";

    AWS_MOCK.mock("SNS", "publish", (params, callback) => {
      callback(undefined, { MessageId: expectedNotificationInfo });
    });

    const actualResponse = await notificationService.sendNotification("");

    expect(actualResponse).toEqual(expectedNotificationInfo);
    AWS_MOCK.restore("SNS", "publish");
  });

  it("should be local", async () => {
    const expectedNotificationInfo = "Some-Message-Id";
    confSpy.mockImplementation(() => ({ isLocal: false }));

    AWS_MOCK.mock("SNS", "publish", (params, callback) => {
      callback(undefined, { MessageId: expectedNotificationInfo });
    });

    const actualResponse = await notificationService.sendNotification("");

    expect(actualResponse).toEqual(expectedNotificationInfo);
    AWS_MOCK.restore("SNS", "publish");
  });

  it('should create a dataset approval message and submit it to SNS', async () => {
    const expectedMessage = JSON.stringify({id: 'some-dataset-id', name: 'some-dataset-name', version: '1', action: 'dataset approved', time: 'some-time', url: datasetApi+'/some-dataset-id/versions/1'});
    const expectedResponse = {Message: expectedMessage, MessageAttributes: {action: {DataType: 'String', StringValue: 'dataset approved'}}, TopicArn: topicArn};
    AWS_MOCK.mock("SNS", "publish", (params, callback) => {
      callback(undefined, {MessageId: params});
    });

    const actualResponse = await notificationService.sendDatasetNotification('some-dataset-id', 'some-dataset-name', '1', 'some-time');

    expect(actualResponse).toEqual(expectedResponse);
    AWS_MOCK.restore("SNS", "publish");
  });

  it('should create a permission approval message and submit it to SNS', async () => {
    const expectedMessage = JSON.stringify({id: 'some-permission-id', version: '1', action: 'permission approved', time: 'some-time', url: permissionApi+'/some-permission-id/versions/1'});
    const expectedResponse = {Message: expectedMessage, MessageAttributes: {action: {DataType: 'String', StringValue: 'permission approved'}}, TopicArn: topicArn};
    AWS_MOCK.mock("SNS", "publish", (params, callback) => { 
      callback(undefined, { MessageId: params });
    });

    const actualResponse = await notificationService.sendPermissionNotification('some-permission-id', '1', 'some-time');

    expect(actualResponse).toEqual(expectedResponse);
    AWS_MOCK.restore("SNS", "publish");
  });

  it('should create different actions for messages and submit it to SNS', async () => {
    const expectedMessage = JSON.stringify({id: 'some-dataset-id',name:'testdelete', version: '1', action: 'delete dataset', time: 'some-time', url: datasetApi+'/some-dataset-id/versions/1', sendEmailFlag: false});
    const expectedResponse = {Message: expectedMessage, MessageAttributes: {action: {DataType: 'String', StringValue: 'delete dataset'}}, TopicArn: topicArn};
    AWS_MOCK.mock("SNS", "publish", (params, callback) => {
      callback(undefined, { MessageId: params });
    });
    const actualResponse = await notificationService.sendDatasetNotification('some-dataset-id', 'testdelete','1', 'some-time', false, 'delete dataset' );
    expect(actualResponse).toEqual(expectedResponse);
    AWS_MOCK.restore("SNS", "publish");
  });
});
