const conf = require('../../../conf');
const AWS = require('aws-sdk-mock');
const uuid = require('uuid');
const documentService = require('../../../src/services/documentService');
const availabilityService = require('../../../src/services/availabilityService');
const apiHelper = require('../../../src/utilities/edlApiHelper');
const activeDirectoryDao = require('../../../src/data/ldap/activeDirectoryDao')

jest.mock('../../../src/data/ldap/activeDirectoryDao');
jest.mock('../../../src/services/documentService');
jest.mock('../../../src/utilities/edlApiHelper');

describe('Availability Service Tests', () => {

  let listTagsMock;
  describe('Report Service Availability', () => {
    const listObjectsResponse = {
      Contents: [
        {
          ETag: `"${uuid.v4().replace(/-/g, '')}"`,
          Key: "list1.jpg",
          LastModified: '3/10/2021',
          Size: 11,
          StorageClass: "STANDARD"
        },
        {
          ETag: `"${uuid.v4().replace(/-/g, '')}"`,
          Key: "list2.jpg",
          LastModified: '3/10/2021',
          Size: 12,
          StorageClass: "STANDARD"
        }
      ],
      IsTruncated: true,
      KeyCount: 2,
      MaxKeys: 2,
      Name: "fake-bucket",
      NextContinuationToken: "",
      Prefix: ""
    };

    const listTagsResponse = {
      ResponseMetadata: { RequestId: '2d43539a-8518-52f5-b1ca-0b59b0c51909' },
      Tags: [
        { Key: 'component', Value: 'edl-ingest' },
        { Key: 'Name', Value: 'edl-files-api' }
      ]
    };

    const dynamoResponse = [
      {
        Table:
        {
          TableName: 'jd-data-catalog-datasets',
          TableStatus: 'ACTIVE',
          TableSizeBytes: 60834475,
          ItemCount: 4553,
          TableArn:
            'arn:aws:dynamodb:us-east-1:541843007032:table/jd-data-catalog-datasets',
          TableId: 'b3760ea8-09b0-4c0a-9a0f-e771fcca9c67',
          LatestStreamLabel: '2020-05-28T21:27:34.940',
          LatestStreamArn:
            'arn:aws:dynamodb:us-east-1:541843007032:table/jd-data-catalog-datasets/stream/2020-05-28T21:27:34.940'
        }
      }
    ];


    beforeEach(() => {

      const listObjectsV2Mock = jest.fn((_params, cb) => cb(null, listObjectsResponse));
      AWS.mock('S3', 'listObjectsV2', listObjectsV2Mock);

      listTagsMock = jest.fn((_params, cb) => cb(null, listTagsResponse));
      AWS.mock('SNS', 'listTagsForResource', listTagsMock);
      
      const describeTablesMock = jest.fn((_params, cb) => cb(null, dynamoResponse));
      AWS.mock('DynamoDB', 'describeTable', describeTablesMock);

      jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue({
        get: jest.fn().mockImplementation(() => Promise.resolve({ healthy: 'true' })),
        set: jest.fn().mockImplementation(() => Promise.resolve('OK'))
      });

      apiHelper.get.mockResolvedValue([]);
    });

    afterEach(() => {
      AWS.restore();
    });

    it('Should report S3 buckets availability', async () => {
      //when
      const result = await availabilityService.getAvailability();
      //then
      expect(result.S3).toEqual(true);
    });

    it('Should report Dynamo Tables availability', async () => {
      //when
      const result = await availabilityService.getAvailability();
      //then
      expect(result.DynamoDB).toEqual(true);
    });
    it('Should report DocumentDB collections availability', async () => {
      //given
      documentService.listCollections.mockResolvedValue(true);
      //when
      const result = await availabilityService.getAvailability();
      //then
      expect(result.DocumentDB).toEqual(true);
    });
    it('Should report Redis availability', async () => {
      //when
      const result = await availabilityService.getAvailability();
      //then
      expect(result.Redis).toEqual(true);
    });
    it('Should report SNS availability', async () => {
      //when
      const result = await availabilityService.getAvailability();
      //then
      expect(listTagsMock).toHaveBeenCalledWith({"ResourceArn": "arn:aws:sns:us-east-1:541843007032:JDDataCatalogNotification"}, expect.any(Function));
      expect(result.SNS).toEqual(true);
    });

    it('Should report Workflow availability', async () => {
      //when
      const result = await availabilityService.getAvailability();
      //then
      expect(result.Workflow).toEqual(true);
    });
    it('Should report Ldap availability', async () => {
      activeDirectoryDao.findOwners.mockResolvedValue({})
      //when
      const result = await availabilityService.getAvailability();
      //then
      expect(result.Ldap).toEqual(true);
    });

    it('Should report Okta availability', async () => {
      //when
      const result = await availabilityService.getAvailability();
      //then
      expect(result.Okta).toEqual(true);
    });
  });

  describe('Report Service Unavailability', () => {

    beforeEach(() => {
      const listObjectsV2Mock = jest.fn((_params, cb) => cb('Boom - Unavailable'));
      AWS.mock('S3', 'listObjectsV2', listObjectsV2Mock);

      const listTagsMock = jest.fn((_params, cb) => cb('Boom - Unavailable'));
      AWS.mock('SNS', 'listTagsForResource', listTagsMock);

      const describeTablesMock = jest.fn((_params, cb) => cb('Boom - Unavailable'));
      AWS.mock('DynamoDB', 'describeTable', describeTablesMock);

      jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue({
        get: jest.fn().mockImplementation(() => Promise.resolve({ healthy: 'true' })),
        set: jest.fn().mockImplementation(() => Promise.reject('Boom'))
      });

      apiHelper.get.mockRejectedValue('Boom - Unavailable');
    });

    it('Should report S3 buckets unavailability', async () => {
      //when
      const result = await availabilityService.getAvailability();
      //then
      expect(result.S3).toEqual(false);
    });

    it('Should report Dynamo Tables unavailability', async () => {
      //when
      const result = await availabilityService.getAvailability();
      //then
      expect(result.DynamoDB).toEqual(false);
    });
    it('Should report DocumentDB collections unavailability', async () => {
      //given
      documentService.listCollections.mockResolvedValue(false);
      //when
      const result = await availabilityService.getAvailability();
      //then
      expect(result.DocumentDB).toEqual(false);
    });
    it('Should report Redis unavailability Local', async () => {
      //when
      const result = await availabilityService.getAvailability();
      //then
      expect(result.Redis).toEqual(false);
    });
    it('Should report Redis available Prod Dev', async () => {
      //when
      jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue({
        get: jest.fn().mockImplementation(() => Promise.resolve({ healthy: 'true' })),
        set: jest.fn().mockImplementation(() => Promise.resolve('true'))
      });
      const result = await availabilityService.getAvailability();
      //then
      expect(result.Redis).toEqual(true);
    });
    it('Should report Redis unavailable Prod Dev', async () => {
      //when
      jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue({
        get: jest.fn().mockImplementation(() => Promise.resolve({ healthy: 'true' })),
        set: jest.fn().mockImplementation(() => Promise.resolve('false'))
      });
      const result = await availabilityService.getAvailability();
      //then
      expect(result.Redis).toEqual(false);
    });
    it('Should report SNS unavailability', async () => {
      //when
      const result = await availabilityService.getAvailability();
      //then
      expect(result.SNS).toEqual(false);
    });

    it('Should report Workflow unavailability', async () => {
      //when
      const result = await availabilityService.getAvailability();
      //then
      expect(result.Workflow).toEqual(false);
    });
    it('Should report Ldap unavailability', async () => {
      activeDirectoryDao.findOwners.mockResolvedValue(Promise.reject('Boom'))
      //when
      const result = await availabilityService.getAvailability();
      //then
      expect(result.Ldap).toEqual(false);
    });
  });
});