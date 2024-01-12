const conf = require('../../conf');
const AWS = require('aws-sdk');
const documentService = require('./documentService');
const availabilityConf = require('../../conf').getAvailabilityConf();
const { region, accountNumber, edlWorkflow } = require('../../conf').getConfig();
const apiHelper = require('../utilities/edlApiHelper');
const activeDirectoryDao = require('../data/ldap/activeDirectoryDao');
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  documentService.setLogger(logger);
  apiHelper.setLogger(logger);
  activeDirectoryDao.setLogger(logger);
};

const secondsInDay = 24 * 60 * 60;

async function isS3Available() {
  console.log("Starting S3 Check: ", new Date())
  const s3 = new AWS.S3();
  const buckets = availabilityConf.buckets;
  try {
    await Promise.all(buckets.map(bucket => s3.listObjectsV2({ Bucket: bucket }).promise()));
    console.log("Finish S3 Check: ", new Date())
    return true;
  } catch (error) {
    log.error('Failed to check S3 Availability:', error);
    return false;
  }
}

async function isSNSAvailable() {
  console.log("Starting SNS Check: ", new Date());
  const SNS = new AWS.SNS( {region});
  const topics = availabilityConf.topics;
  try {
    await Promise.all(topics.map(topicArn => SNS.listTagsForResource({ ResourceArn: topicArn.replace('ACCOUNT_NUMBER', accountNumber) }).promise()));
    console.log("Finish SNS Check: ", new Date())
    return true;
  } catch (error) {
    log.error('Failed to check SNS Availability:', error);
    return false;
  }
}

async function isRedisAvailable() {
  try {
    console.log("Starting REDIS Check: ", new Date())
    const availabilityCache = await conf.getRedisCacheManager(secondsInDay);
    const result = await availabilityCache.set("healthy", "true");
    console.log("Finish REDIS Check: ", new Date())
    return result === "OK" || result === "true";
  } catch (error) {
    log.error('Failed to check Redis Availability:', error);
    return false;
  }
}

async function isDocumentDBAvailable() {
  console.log("Starting DocDB Check: ", new Date());
  const result = await documentService.listCollections();
  console.log("Finish DocDB Check: ", new Date());
  return result;
}

async function isDynamoDBAvailable() {
  console.log("Starting Dynamo Check: ", new Date());
  const tableNames = availabilityConf.tables;
  const dynamo = new AWS.DynamoDB({ region });
  try {
    await Promise.all(tableNames.map(tableName => dynamo.describeTable({ TableName: tableName }).promise()));
    console.log("Finish Dynamo Check: ", new Date());
    return true;
  } catch (error) {
    log.error('Failed to check Dynamo Table Availability:', error);
    return false;
  }
}

async function isWorkflowServiceAvailable() {
  console.log("Starting WorkflowService Check: ", new Date());
  const tasksUrl = `${edlWorkflow}/tasks`;
  const datatype = availabilityConf.datatype;
  const queryParameters = `?datatype=${datatype}&trigger=async_ingest_request`;
  try {
    await apiHelper.get(`${tasksUrl}${queryParameters}`);
    console.log("Finish WorkflowService Check: ", new Date());
    return true;
  } catch (error) {
    log.error('Failed to check Dynamo Table Availability:', error);
    return false;
  }
}
async function isWorkflowServiceCurrentState() {
  console.log("Starting WorkflowServiceCurrent Check: ", new Date());
  const tasksUrl = `${edlWorkflow}/tasks`;
  const datatype = availabilityConf.datatype;
  const queryParameters = `?datatype=${datatype}&trigger=current_state`;
  try {
    await apiHelper.get(`${tasksUrl}${queryParameters}`);
    console.log("Finish WorkflowServiceCurrent Check: ", new Date());
    return true;
  } catch (error) {
    log.error('Failed to check Dynamo Table Availability:', error);
    return false;
  }
}

async function isLdapAvailable() {
  console.log("Starting Ldap Check: ", new Date());
  try {
    await activeDirectoryDao.findOwners('Aeops');
    console.log("Finish Ldap Check: ", new Date());
    return true;
  } catch (error) {
    log.error('Failed to check Ldap Availability:', error);
    return false;
  }
}

async function getAvailability() {
  return {
    DocumentDB: await isDocumentDBAvailable(),
    DynamoDB: await isDynamoDBAvailable(),
    SNS: await isSNSAvailable(),
    Workflow: await isWorkflowServiceAvailable(),
    S3: await isS3Available(),
    Redis: await isRedisAvailable(),
    Okta: true,
    Ldap: await isLdapAvailable(),
    workFlowCurrentState: await isWorkflowServiceCurrentState()
  };
}

module.exports = {
  setLogger,
  getAvailability
};
