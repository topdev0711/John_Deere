const AWS = require('aws-sdk');
const conf = require('../../conf');
const { Promise } = require('node-fetch');
const Bucket = conf.getConfig().schemasBucket;
const ServerSideEncryption = 'AES256';
const { attachmentsBucket, accountNumber, metaDataBucket, s3Config} = conf.getConfig()
const { CREATED, INTERNAL_SERVER_ERROR } = require('http-status-codes');
let log = require('edl-node-log-wrapper');
const multer = require("multer");
const {PassThrough} = require("stream");

const setLogger = logger => log = logger;
const stringify = schema => JSON.stringify(schema, null, 2);
const isAssumeRoleError = error => error.message.includes('failed to assume role');
const maxRetries = 3; // maximum number of retries
const timeOut = 60000 // 60 sec timeout

AWS.config.update({
  maxRetries: maxRetries, // The number of times to retry failed requests
  retryDelayOptions: {
    base: 200 // The base number of milliseconds to use in the exponential backoff for operation retries
  },
  httpOptions: {
    timeout: timeOut // 60 seconds, adjust as needed
  }
});
async function getAssumedS3(account) {
  if(conf.getConfig().isLocal) return getS3();
  const RoleArn = `arn:aws:iam::${account}:role/enterprise-datalake/edl-storage-account-role`;
  const STS = new AWS.STS();
  const params = { RoleArn, RoleSessionName: 'jdCatalogSession'};

  try {
    log.debug(`assuming role in account: `, RoleArn);
    const response = await STS.assumeRole(params).promise();
    log.debug(`response received: ${JSON.stringify(response)}`);

    const { Credentials: { AccessKeyId, SecretAccessKey, SessionToken } } = response;

    return new AWS.S3({
      accessKeyId: AccessKeyId,
      secretAccessKey: SecretAccessKey,
      sessionToken: SessionToken,
    });
  } catch(error) {
    log.error('failed to assume role with error: ', error.stack);
    throw new Error('failed to assume role');
  }
}

async function bucketVersioned(Bucket, datasetAccount) {
  try {
    log.debug(`getting versioning for bucket: ${Bucket}`);
    const s3 = await getAssumedS3(datasetAccount);
    const versionInfo = await s3.getBucketVersioning({Bucket}).promise();
    log.debug(`got versioning for bucket: ${Bucket}`);
    return versionInfo;
  } catch (e) {
    if (isAssumeRoleError(e)) throw e;
    log.error('failed to get versioning for bucket with error: ', e.stack);
    throw new Error('failed to get versioning for bucket');
  }
}

function getS3() {
  return new AWS.S3(s3Config);
}

async function get(schemaId) {
  const path = `s3://${Bucket}/${schemaId}.json`;
  try {
    log.debug(`getting ${path}`)
    const S3 = getS3();
    const Key = `${schemaId}.json`;
    const response = await S3.getObject({ Bucket, Key }).promise();
    log.debug(`got ${path}`);

    return JSON.parse(response.Body.toString('utf8'));
  } catch (e) {
    log.error(`failed to get schema ID ${schemaId} with error: `, e.stack);
    throw new Error('failed to get schema ID');
  }
}

async function save(obj, key, bucket) {
  const path = `s3://${bucket}/${key}`;
  try {
    log.debug(`saving to ${path} with key : ${key} and bucket : ${bucket || Bucket}`)
    const S3 = getS3();
    const params = {
      Body: stringify(obj),
      Bucket: bucket || Bucket,
      Key: key || `${obj.id}.json`,
      ServerSideEncryption
    };

    const response = await S3.putObject(params).promise();
    log.debug(`saved to ${path}`)
    return response;
  } catch (e) {
    log.error('failed to save to s3 with error: ', e.stack);
    throw new Error('failed to save to s3');
  }
}

async function getContents(bucket, account, token, prefix, Delimiter="") {
  const contents = `s3://${bucket}/${prefix || ''}`;
  try {
    log.info(`getting contents of ${contents}`);
    const S3 = await getAssumedS3(account);

    let params = { Bucket: bucket, Delimiter, MaxKeys: 20 };
    if (token) params = { ...params, ContinuationToken: token};
    if (prefix) params = { ...params, Prefix: prefix};

    log.info('Using parameters: ', params);
    const objects = await S3.listObjectsV2(params).promise();
    log.info(`got contents of ${contents}`);

    return objects;
  } catch (e) {
    if (isAssumeRoleError(e)) throw e;
    log.error('failed to get s3 contents with error: ', e.stack);
    throw new Error('failed to get s3 contents');
  }
}

const s3Storage = {
  _handleFile(req, file, cb) {
    const datasetAccount = req.body.datasetAccount;
    getAssumedS3(datasetAccount)
        .then((s3) => {
          const pass = new PassThrough();
          const params = {
            Bucket: req.body.datasetBucket,
            Key: req.body.path === 'Root' ? file.originalname : `${req.body.path}/${file.originalname}`.substring(1),
            Body: pass,
            ContentType: file.mimetype,
            ServerSideEncryption
          };

          s3.upload(params, (err, data) => {
            if (err) {
              log.error("Error occurred while uploading document in s3 upload : ", err.stack)
              cb(err);
            } else {
              cb(null, {
                bucket: data.Bucket,
                key: data.Key,
                location: data.Location,
              });
            }
          });

          file.stream.pipe(pass);
        })
        .catch((err) => {
          log.error('Error occurred while uploading document:', err.stack);
          throw err;
        })
  },

  _removeFile(req, file, cb) {
    cb(null);
  },
};

const upload = multer({ storage: s3Storage });
function multerUploadFile(req, res) {
  let bucket, datasetName, filePath, fileSize, datasetAccount, isAttachment;
  function handleField(fieldName, val) {
    if (fieldName === 'datasetBucket') bucket = val;
    if (fieldName === 'environmentName') datasetName = val;
    if (fieldName === 'path') filePath = val;
    if (fieldName === 'fileSize') fileSize = val;
    if (fieldName === 'datasetAccount') datasetAccount = val;
    if (fieldName === 'isAttachment') {
      isAttachment = val;
      if (isAttachment) {
        bucket = attachmentsBucket;
        datasetAccount = accountNumber;
      }
    }
  }

  for (const fieldName in req.body) {
    handleField(fieldName, req.body[fieldName]);
  }

  const file = req.file;
  const fileName = file.originalname

  if (!file) {
    res.status(400).json({ success: false, error: { message: 'No file provided' } });
    return;
  }

  try {
    log.info(`Successfully uploaded file ${fileName} to ${bucket}.`);
    if (!isAttachment) {
      const metaData = {
        id: fileName,
        user: req.user.username,
        timestamp: new Date(),
        size: fileSize,
        path: `s3://${bucket}/${fileName}`
      }
      save(metaData, `${datasetName}/${fileName}.json`, metaDataBucket).then((result) => log.info('meta data uploaded, response : ', JSON.stringify(result)));
    }
    log.info('upload completed successfully');
    res.status(CREATED);
    res.end();
  } catch (err) {
    log.error('An unexpected error occurred while uploading with error: ', err.stack);
    res.status(INTERNAL_SERVER_ERROR).json({ success: false, error: { message: `upload file ${err.message}` } });
    res.end();
  }

}

async function deleteAll(Bucket, Key, s3, datasetName) {
  const path = `s3://${Bucket}/${Key}`;
  try {
    log.debug(`getting objects to delete from ${path}`);
    const listedObjects = await s3.listObjectsV2({Bucket, Prefix: Key}).promise();
    log.debug(`got objects to delete from ${path}`);

    if (listedObjects.Contents.length === 0) return;

    const deleteParams = {Bucket, Delete: {Objects: []}};
    const metaDataBucket = conf.getConfig().metaDataBucket;
    const deleteMetadataParam = {Bucket: metaDataBucket, Delete: {Objects: []}};

    log.debug(`deleting objects for ${datasetName}`);

    listedObjects.Contents.forEach(({Key}) => {
      deleteParams.Delete.Objects.push({Key});
      deleteMetadataParam.Delete.Objects.push({Key: `${datasetName}/${Key}.json`})
    });

    const s3MetadataClient = getS3();

    await s3.deleteObjects(deleteParams).promise();
    await s3MetadataClient.deleteObjects(deleteMetadataParam).promise();
    if (listedObjects.IsTruncated) await deleteAll(Bucket, Key, s3);
    log.debug(`deleted objects for ${datasetName}`);

    return "success";
  } catch (e) {
    log.error('failed to delete objects for dataset with error: ', e.stack);
    throw new Error('failed to delete objects for dataset');
  }
}

async function deleteS3Object({Bucket, Key, datasetAccount, environmentName}) {
  const path = `s3://${Bucket}/${Key}`
  try {
    log.debug(`deleting ${path}`);
    const s3 = await getAssumedS3(datasetAccount);
    const response = await deleteAll(Bucket, Key, s3, environmentName);
    log.debug(`deleting ${path}`);
    return response;
  } catch (e) {
    if (isAssumeRoleError(e)) throw e;
    log.error('failed to delete s3 object with error: ', e.stack);
    throw new Error('failed to delete s3 object');
  }
}

async function downloadFile(Bucket , Key, account) {
  const path = `s3://${Bucket}/${Key}`
  try {
    log.debug(`downloading ${path}`);
    const s3 = await getAssumedS3(account);
    const params = { Bucket , Key };
    const response = s3.getObject(params).promise();
    log.debug(`downloaded ${path}`);
    return response;
  } catch (e) {
    if (isAssumeRoleError(e)) throw e;
    log.error('failed to download file with error: ', e.stack);
    throw new Error('failed to download file');
  }
}

async function moveFile(Bucket, OldKey, NewKey, datasetAccount) {
  const oldPath = `s3://${Bucket}/${OldKey}`;
  const newPath = `s3://${Bucket}/${NewKey}`;

  try {
    const s3 = await getAssumedS3(datasetAccount);
    const listObjectsResponse = await s3.listObjectsV2({ Bucket, Prefix: OldKey }).promise();
    const deleteParams = {Bucket, Delete: { Objects: [] }};
    if (listObjectsResponse.Contents.length) {
      log.debug(`moving ${oldPath} to ${newPath}`);
      await Promise.all(listObjectsResponse.Contents.map((async (file) => {
        deleteParams.Delete.Objects.push( {Key : `${file.Key}`} );
        return s3.copyObject({Bucket, CopySource: `${Bucket}/${file.Key}`, Key: `${file.Key}`.replace(OldKey, NewKey), ServerSideEncryption}).promise();
      })));
      log.debug(`moved ${oldPath} to ${newPath}`);
    }
    log.debug(`after move deleting files from ${oldPath} to ${newPath}`);
    const deleteResponse = await s3.deleteObjects(deleteParams).promise();
    log.debug(`after move deleted files from ${oldPath} to ${newPath}`);
    return deleteResponse;

  }
  catch(e) {
    if (isAssumeRoleError(e)) throw e;
    log.error('failed to move file with error: ', e.stack);
    throw new Error('failed to move file');
  }
}

async function copyObjects(Bucket, sourceObjects, destination) {
  const path = `s3://${Bucket}/${destination}`;
  const S3 = getS3();
  try {
    log.debug(`copying objects to ${path}`);
    await Promise.all(sourceObjects.map(object => {
      return S3.copyObject({
        Bucket,
        CopySource: `${Bucket}/${object.key}`,
        Key: `${destination}/${object.fileName}`,
        ServerSideEncryption}).promise();
    }));
    log.debug(`copied objects to ${path}`);
  }
  catch(e) {
    log.error('failed to copy objects with error: ', e.stack);
    throw new Error('failed to copy objects');
  }
}

async function saveAttachmentLocal(Key, attachmentsBucket, fileData) {
  const path = `s3://${Bucket}/${Key}`;
  const params = {Body: fileData, Bucket: attachmentsBucket, Key, ServerSideEncryption};
  log.debug(`saving attachment to ${path}`);
  return uploadToS3(params)
}

function uploadToS3(params) {
  return new Promise((resolve, reject) => {
    const S3 = getS3();
    S3.putObject(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

async function deleteAttachment(bucket, key) {
  const path = `s3://${bucket}/${key}`;
  const S3 = getS3();
  const deleteParams = { Bucket: bucket, Delete: { Objects: [{ Key: `${key}` }] } };

  try {
    log.debug(`deleting attachment ${path}`);
    const response = await S3.deleteObjects(deleteParams).promise();
    log.debug(`deleted attachment ${path}`);
    return response;
  } catch (e) {
    log.error('failed to delete attachment with error: ', e.stack);
    throw new Error('failed to delete attachment');
  }
}

async function getFile(Bucket, Key) {
  const path = `s3://${Bucket}/${Key}`;
  const S3 = getS3();
  try {
    log.debug(`getting file: ${path}`);
    const response = await S3.getObject({ Bucket, Key }).promise();
    log.debug(`got file: ${path}`);
    return JSON.parse(response.Body.toString('utf8'));
  } catch (e) {
    log.error('failed to get file with error: ', e.stack);
    throw new Error('failed to get file');
  }
}

module.exports = {
  setLogger,
  get,
  getContents,
  getFile,
  save,
  upload,
  deleteS3Object,
  bucketVersioned,
  downloadFile,
  moveFile,
  saveAttachmentLocal,
  deleteAttachment,
  copyObjects,
  multerUploadFile
}
