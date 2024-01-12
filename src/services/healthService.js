const conf = require('../../conf');
const datasetService = require('../services/datasetService');
const AWS = require('aws-sdk');
const { jdCatalogNotificationDlq, dynamoMonitorId } = require('../../conf').getConfig();
let log = require("edl-node-log-wrapper");

const setLogger = logger => {
  log = logger;
  datasetService.setLogger(logger);
}

const secondsInDay = 24 * 60 * 60;

async function checkRedisHealth() {
  try {
    const healthCache = await conf.getRedisCacheManager(secondsInDay);
    const result = await healthCache.set("healthy", "true");
    return result === "OK" || result === "true";
  } catch {
    return false
  }
}

async function checkDynamoHealth(id) {
  try {const dataset = await datasetService.getDataset(false, id); return dataset.id === id;} catch {return false}
}

async function checkEdlAdapterHealth() {
  const sqs = new AWS.SQS({ apiVersion: '2012-11-05', region: 'us-east-1' });
  const queueUrl = jdCatalogNotificationDlq;
  try{
    const response = await sqs.getQueueAttributes({
      QueueUrl: queueUrl,
      AttributeNames:['ApproximateNumberOfMessages']
    }).promise();
    return response.Attributes.ApproximateNumberOfMessages === '0'
  } catch { return false }
}

async function checkHealth() {
    const id = dynamoMonitorId;
    return {
        'Dynamo': await checkDynamoHealth(id),
        'Redis': await checkRedisHealth(),
        'EdlAdapter': await checkEdlAdapterHealth()
    };
}

module.exports = { setLogger, checkHealth };
