const conf = require('../../../conf');
const confSpy = jest.spyOn(conf, 'getConfig');
const s3 = require('../../../src/data/s3');
const AWS = require('aws-sdk-mock');
const fs = require('fs');
const httpMocks = require('node-mocks-http');
const {upload} = require("../../../src/data/s3");

jest.mock('fs');
jest.mock('busboy');

const sampleContents = {
  Contents: [
    {
      ETag: "\"70ee1738b6b21e2c8a43f3a5ab0eee71\"",
      Key: "happyface.jpg",
      LastModified: '1/1/2000',
      Size: 11,
      StorageClass: "STANDARD"
    },
    {
      ETag: "\"becf17f89c30367a9a44495d62ed521a-1\"",
      Key: "test.jpg",
      LastModified: '1/1/2000',
      Size: 4192256,
      StorageClass: "STANDARD"
    }
  ],
  IsTruncated: true,
  KeyCount: 2,
  MaxKeys: 2,
  Name: "examplebucket",
  NextContinuationToken: "1w41l63U0xa8q7smH50vCxyTQqdxo69O3EmK28Bi5PcROI4wI/EyIJg==",
  Prefix: ""
};

const schema = { id: '1', name: 'schemaName' };
const testConfig = {
  schemasBucket: 'jd-data-catalog-schemas-devl',
  isLocal: false,
  metaDataBucket: 'jd-us01-edl-devl-file-upload-metadata-audit-logs'
}

describe("s3 Test Suite", () => {
  const assumeRoleResponse = {
    Credentials: {
      AccessKeyId: 'key',
      SecretAccessKey: 'secret',
      SessionToken: 'token'
    }
  };

  const listObjectRespone = {
    Contents: [{
      Bucket: 'my-bucket',
      Key: 'key/test.txt'
    }]
  };

  beforeEach(() => {
    confSpy.mockImplementation(() => testConfig);
  });

  afterEach(() => {
    AWS.restore();
  });

  it('should save to s3', async () => {
    const saveMock = jest.fn((_params, cb) => cb())
    AWS.mock('S3', 'putObject', saveMock);

    await s3.save(schema);

    const expectedCall = {
      Body: JSON.stringify(schema, null, 2),
      Bucket: 'jd-data-catalog-schemas-devl',
      Key: `${schema.id}.json`,
      ServerSideEncryption: 'AES256'
    };

    return expect(saveMock.mock.calls[0][0]).toEqual(expectedCall);
  });

  it('should throw error if save rejects', () => {
    AWS.mock('S3', 'putObject', (_params, cb) => cb(new Error('Boom')));
    return expect(s3.save(schema)).rejects.toThrow('failed to save to s3');
  });

  it("should get schema from s3", async () => {
    const expectedValue = { hello: 'world' };
    AWS.mock('S3', 'getObject', (_params, cb) => {
      cb(null, {
        Body: Buffer.from(JSON.stringify(expectedValue))
      });
    });

    const schema = await s3.get('schemaName');
    expect(schema).toEqual(expectedValue);
  });

  it('should throw error if S3 rejects get', () => {
    AWS.mock('S3', 'getObject', (_params, cb) => cb(new Error('Boom')));
    return expect(s3.get('some bucket')).rejects.toThrow('failed to get schema ID');
  });

  it("should get file from s3", async () => {
    const expectedValue = { hello: 'world' };
    AWS.mock('S3', 'getObject', (_params, cb) => {
      cb(null, {
        Body: Buffer.from(JSON.stringify(expectedValue))
      });
    });

    const schema = await s3.get('bucket','path');
    expect(schema).toEqual(expectedValue);
  });

  it('should throw error if S3 rejects get file', () => {
    AWS.mock('S3', 'getObject', (_params, cb) => cb(new Error('Boom')));
    return expect(s3.get('bucket','path')).rejects.toThrow('failed to get schema ID');
  });

  describe("bucket contents", () => {
    let listObject;
    let assumeRole;

    beforeEach(() => {
      listObject = jest.fn((_params, cb) => cb(null, sampleContents));
      AWS.mock('S3', 'listObjectsV2', listObject)

      assumeRole = jest.fn((_params, cb) => cb(null, assumeRoleResponse));
      AWS.mock('STS', 'assumeRole', assumeRole);
    })

    it('should read locally if env isLocal', async () => {
      confSpy.mockImplementation(() => ({ isLocal: true }));

      fs.readFileSync.mockReturnValue(Buffer.from(JSON.stringify(sampleContents)));
      const result = await s3.getContents('some bucket');
      expect(listObject).toHaveBeenCalled();
      expect(result).toEqual(sampleContents);
    });

    it('should get contents of a bucket', async () => {
      const account = 'some-account';
      const expectedParams = {
        RoleArn: `arn:aws:iam::${account}:role/enterprise-datalake/edl-storage-account-role`,
        RoleSessionName: 'jdCatalogSession'
      };
      const expectedListParams = {
        Bucket: 'some bucket',
        MaxKeys: 20,
        Delimiter: ''
      };

      const contents = await s3.getContents('some bucket', account);
      expect(assumeRole).toHaveBeenCalledWith(expectedParams, expect.any(Function));
      expect(listObject).toHaveBeenCalledWith(expectedListParams, expect.any(Function));
      expect(contents).toEqual(sampleContents);
    });

    it('should get contents of a bucket with delimiter', async () => {
      const account = 'some-account';
      const expectedParams = {
        RoleArn: `arn:aws:iam::${account}:role/enterprise-datalake/edl-storage-account-role`,
        RoleSessionName: 'jdCatalogSession'
      };
      const expectedListParams = {
        Bucket: 'some bucket',
        MaxKeys: 20,
        Delimiter: '/'
      };

      const contents = await s3.getContents('some bucket', account,'','', '/');
      expect(assumeRole).toHaveBeenCalledWith(expectedParams, expect.any(Function));
      expect(listObject).toHaveBeenCalledWith(expectedListParams, expect.any(Function));
      expect(contents).toEqual(sampleContents);
    });

    it('should get contents of a bucket under prefix', async () => {
      const account = 'some-account';
      const expectedListParams = {
        Bucket: 'some bucket',
        MaxKeys: 20,
        Delimiter: '',
        Prefix: 'prefix'
      };

      const contents = await s3.getContents('some bucket', account, '', 'prefix');
      expect(listObject).toHaveBeenCalledWith(expectedListParams, expect.any(Function));
      expect(contents).toEqual(sampleContents);
    });

    it('should get contents of a bucket using continuation token provided', async () => {
      const account = 'some-account';
      const expectedListParams = {
        Bucket: 'some bucket',
        MaxKeys: 20,
        Delimiter: '/',
        ContinuationToken: 'token'
      };

      const contents = await s3.getContents('some bucket', account, 'token', '', '/');
      expect(listObject).toHaveBeenCalledWith(expectedListParams, expect.any(Function));
      expect(contents).toEqual(sampleContents);
    });

    it('should get contents of a bucket using continuation token provided and prefix', async () => {
      const account = 'some-account';
      const expectedListParams = {
        Bucket: 'some bucket',
        MaxKeys: 20,
        Delimiter: '/',
        Prefix: 'prefix',
        ContinuationToken: 'token'
      };

      const contents = await s3.getContents('some bucket', account, 'token', 'prefix', '/');
      expect(listObject).toHaveBeenCalledWith(expectedListParams, expect.any(Function));
      expect(contents).toEqual(sampleContents);
    });

    it('should throw error if STS rejects', () => {
      AWS.remock('STS', 'assumeRole', (_params, cb) => cb(new Error('Boom')));
      const expectedError = 'failed to assume role';
      return expect(s3.getContents('some-bucket', 'some-account')).rejects.toThrow(expectedError);
    });

    it('should throw error if S3 rejects list', () => {
      AWS.remock('S3', 'listObjectsV2', (_params, cb) => cb(new Error('Boom')));
      const expectedError = 'failed to get s3 contents'
      return expect(s3.getContents('some bucket', 'some-account')).rejects.toThrow(expectedError);
    });
  });

  describe('upload stream', () => {
    const mockedEventMap = {};
    beforeEach(() => {
      confSpy.mockImplementation(() => testConfig);
    });

    it('should upload file to s3', async () => {
      const buffer = Buffer.from('This is a test file content');
      const file = {
        originalname: 'test-file.txt',
        mimetype: 'text/plain',
        buffer,
        stream: {
          pipe: jest.fn(),
        },
      };

      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/datasets/upload-file',
        body: {
          datasetBucket: 'test-bucket',
          path: 'test-folder',
        },
        file,
      });

      const res = httpMocks.createResponse();
      upload.single('file')(req, res, (err) => {
        expect(err).toBeUndefined();
        expect(res.statusCode).toBe(200);
      });
    });
  });

  describe('delete s3 objects', () => {

    it('should delete objects from bucket and metadatabucket', async () => {
      const account = 'some-account';
      const expectedParams = {
        RoleArn: `arn:aws:iam::${account}:role/enterprise-datalake/edl-storage-account-role`,
        RoleSessionName: 'jdCatalogSession'
      };
      const assumeRole = jest.fn((_params, cb) => cb(null, assumeRoleResponse));
      AWS.mock('STS', 'assumeRole', assumeRole);

      const params = {
        Bucket: 'my-bucket',
        Key: '/key',
        datasetAccount: account,
        environmentName: 'data'
      };
      const listCall = jest.fn((_params, cb) => cb(null, listObjectRespone));
      AWS.mock('S3', 'listObjectsV2', listCall);

      const deleteCall = jest.fn((_params, cb) => cb(null, 'success'));
      AWS.mock('S3', 'deleteObjects', deleteCall);

      await s3.deleteS3Object(params);

      const expectedListObjectsParams = {
        Bucket: params.Bucket,
        Prefix: params.Key
      };
      const expectedDeleteObjectsParams = {
        Bucket: params.Bucket,
        Delete: { Objects: [{Key: 'key/test.txt'}] }
      };
      const expectedMetadataDeleteObjectsParams = {
        Bucket: 'jd-us01-edl-devl-file-upload-metadata-audit-logs',
        Delete: { Objects: [{Key: 'data/key/test.txt.json'}] }
      };
      expect(assumeRole).toHaveBeenCalledWith(expectedParams, expect.any(Function));
      expect(listCall).toHaveBeenCalledWith(expectedListObjectsParams, expect.any(Function));
      expect(deleteCall).toHaveBeenNthCalledWith(1,expectedDeleteObjectsParams, expect.any(Function));
      expect(deleteCall).toHaveBeenNthCalledWith(2,expectedMetadataDeleteObjectsParams, expect.any(Function));
      expect(deleteCall).toHaveBeenCalledTimes(2);
    });
  });

  describe('download stream', () => {

    it('should download file from s3', async () => {
      const account = 'some-account';
      const expectedParams = {
        RoleArn: `arn:aws:iam::${account}:role/enterprise-datalake/edl-storage-account-role`,
        RoleSessionName: 'jdCatalogSession'
      };
      const assumeRole = jest.fn((_params, cb) => cb(null, assumeRoleResponse));
      AWS.mock('STS', 'assumeRole', assumeRole);
      const params = {
        Bucket: 'my-bucket',
        Key: '/key'
      };
      const downloadCall = jest.fn((_params, cb) => cb());
      AWS.mock('S3', 'getObject', downloadCall);

      await s3.downloadFile(params.Bucket, params.Key,account);

      const expectedDownloadParams = {
        Bucket: params.Bucket,
        Key: params.Key
      };
      expect(assumeRole).toHaveBeenCalledWith(expectedParams, expect.any(Function));
      expect(downloadCall).toHaveBeenCalledWith(expectedDownloadParams, expect.any(Function));

    })
  });


  describe('move rename file', () => {
    let assumeRole;

    const listResponse ={
      Contents:[
        { Key : 'oldkey' },
      ]
    };

    beforeEach(() => {
      assumeRole = jest.fn((_params, cb) => cb(null, assumeRoleResponse));
      AWS.mock('STS', 'assumeRole', assumeRole);
    });

    it('should move file to new location', async () => {
      const account = 'some-account';
      const expectedParams = {
        RoleArn: `arn:aws:iam::${account}:role/enterprise-datalake/edl-storage-account-role`,
        RoleSessionName: 'jdCatalogSession'
      };

      const copyParams = {
        Bucket: 'my-bucket',
        CopySource: 'my-bucket/oldkey',
        Key: 'newkey',
        ServerSideEncryption: 'AES256',
      };
      const deleteParams = {
        Bucket:'my-bucket',
        Delete: { Objects: [
          {Key : 'oldkey'},
        ] }
      }
      const params = {
        Bucket: 'my-bucket',
        Oldkey: `oldkey`,
        Key: 'newkey',
        ServerSideEncryption: 'AES256'
      };

      const copyObjectCall = jest.fn((_params, cb) => cb());
      AWS.mock('S3', 'copyObject', copyObjectCall);
      const deleteObjectsCall = jest.fn((_params, cb) => cb());
      AWS.mock('S3', 'deleteObjects', deleteObjectsCall);
      const listObjectsV2Mock = jest.fn((_params,cb)=>cb(null, listResponse));
      AWS.mock('S3','listObjectsV2',listObjectsV2Mock);

      await s3.moveFile(params.Bucket, params.Oldkey, params.Key, account);

      expect(assumeRole).toHaveBeenCalledWith(expectedParams, expect.any(Function));
      expect(copyObjectCall).toHaveBeenCalledWith(copyParams, expect.any(Function));
      expect(deleteObjectsCall).toHaveBeenCalledWith(deleteParams, expect.any(Function));
      expect(listObjectsV2Mock).toHaveBeenCalledWith({
        Bucket:'my-bucket',
        Prefix: 'oldkey'
      }, expect.any(Function));

    })

    it('rename/move fails if copyObject throws error', async () => {
      const account = 'some-account';
      const listObjectsV2Mock = jest.fn((_params,cb)=>cb(null, listResponse));
      AWS.mock('S3','listObjectsV2',listObjectsV2Mock);
      const params = {
        Bucket: 'my-bucket',
        Oldkey: `/oldkey`,
        Key: '/newkey',
        ServerSideEncryption: 'AES256'
      };
      AWS.mock('S3', 'copyObject', (_params, cb) => cb(new Error('error')));
      const expectedError = 'failed to move file';
      await expect(s3.moveFile(params.Bucket, params.Oldkey, params.Key, account)).rejects.toThrowError(expectedError);
    })

    it('rename/move fails if deleteObjects fails', async () => {
      const account = 'some-account';
      const listObjectsV2Mock = jest.fn((_params,cb)=>cb(null, listResponse));
      AWS.mock('S3','listObjectsV2',listObjectsV2Mock);
      const copyObjectCall = jest.fn((_params, cb) => cb());
      AWS.mock('S3', 'copyObject', copyObjectCall);
      const params = {
        Bucket: 'my-bucket',
        Oldkey: `/oldkey`,
        Key: '/newkey',
        ServerSideEncryption: 'AES256'
      };
      AWS.mock('S3', 'deleteObjects', (_params, cb) => cb(new Error('error')));
      const expectedError = 'failed to move file'
      await expect(s3.moveFile(params.Bucket, params.Oldkey, params.Key, account)).rejects.toThrowError(expectedError);
    })

    it('rename/move fails if listObjectsV2 throws error', async () => {
      const account = 'some-account';
      const params = { Bucket: 'my-bucket', Oldkey: `/oldkey`, Key: '/newkey', ServerSideEncryption: 'AES256' };
      AWS.mock('S3', 'listObjectsV2', (_params, cb) => cb(new Error('error')));
      const expectedError = 'failed to move file';
      await expect(s3.moveFile(params.Bucket, params.Oldkey, params.Key, account)).rejects.toThrowError(expectedError);
    });
  });

  describe('upload/edit/delete attachments', () => {

    afterEach(() => {
      AWS.restore();
    });

    it('should copy objects from one s3 location to another', async () => {
      const bucket = "my-bucket"
      const sourceObjects = [
        {
          key: "testkey1",
          fileName: "testfile1"
        }
      ]
      const destination = "datasetlocation"
      const copyParams = {
        Bucket: 'my-bucket',
        CopySource: 'my-bucket/testkey1',
        Key: 'datasetlocation/testfile1',
        ServerSideEncryption: 'AES256',
      };

      const copyObjectCall = jest.fn((_params, cb) => cb());
      AWS.mock('S3', 'copyObject', copyObjectCall);

      await s3.copyObjects(bucket, sourceObjects, destination);

      expect(copyObjectCall).toHaveBeenCalledWith(copyParams, expect.any(Function));
    })

    it('should throw error when copying files fails', async () => {
      const bucket = "my-bucket";
      const sourceObjects = [{ key: "testkey1", fileName: "testfile1" }];
      const destination = "datasetlocation";

      AWS.mock('S3', 'copyObject', (_params, cb) => cb(new Error('error')));
      const expectedError = 'failed to copy objects';
      await expect(s3.copyObjects(bucket, sourceObjects, destination)).rejects.toThrowError(expectedError);
    })

    it('should delete object from staged s3 location', async () => {
      const bucket = "my-bucket";
      const fileName = "testfile1";
      const key = `staged/uuid/${fileName}`;
      const deleteParams = { Bucket: 'my-bucket', Delete: { Objects: [ { Key: 'staged/uuid/testfile1' }]}};

      const deleteObjectsCall = jest.fn((_params, cb) => cb());
      AWS.mock('S3', 'deleteObjects', deleteObjectsCall);

      await s3.deleteAttachment(bucket, key);

      expect(deleteObjectsCall).toHaveBeenCalledWith(deleteParams, expect.any(Function));
    });

    it('should save attachments locally', async () => {
      const key = 'my-key';
      const bucket = 'my-bucket';
      const buff1 = Buffer.alloc(10);
      const buff2 = Buffer.alloc(14);
      const fileData = Buffer.concat([buff1, buff2]);

      const saveMock = jest.fn((_params, cb) => cb())
      AWS.mock('S3', 'putObject', saveMock);

      await s3.saveAttachmentLocal(key, bucket, fileData);

      const expectedCall = {
        Body: fileData,
        Bucket: 'my-bucket',
        Key: 'my-key',
        ServerSideEncryption: 'AES256'
      };

      return expect(saveMock.mock.calls[0][0]).toEqual(expectedCall);
    });

    it('should throw error if save locally rejects', () => {
      const key = 'my-key';
      const bucket = 'my-bucket';
      const buff1 = Buffer.alloc(10);
      const buff2 = Buffer.alloc(14);
      const fileData = Buffer.concat([buff1, buff2]);

      AWS.mock('S3', 'putObject', (_params, cb) => cb(new Error('Boom')));
      const expectedError = 'Boom';
      return expect(s3.saveAttachmentLocal(key, bucket, fileData)).rejects.toThrow(expectedError);
    });
  });
});
