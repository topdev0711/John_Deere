const aws = require('aws-sdk');
const conf = require('../../conf');
let log = require('edl-node-log-wrapper');

const setLogger = logger => log = logger;
const {topicARN, baseUrl, snsConfig} = conf.getConfig();
const datasetApi = `${baseUrl}/api-external/datasets`;
const permissionApi = `${baseUrl}/api-external/permissions`;

async function sendPermissionNotification(id, version, time, sendEmailFlag) {
  const action = 'permission approved';
  const url = `${permissionApi}/${id}/versions/${version}`;
  const notificationMessage = {id, version, action, time, url, sendEmailFlag};
  log.info("Going to send approval notification for permission:", notificationMessage);
  return sendNotification(notificationMessage);
}

async function sendDatasetNotification(id, name, version, time, sendEmailFlag, action = 'dataset approved'){
  const notificationMessage = {
    id,
    name,
    version,
    action,
    time,
    url: `${datasetApi}/${id}/versions/${version}`,
    sendEmailFlag
  }
  return sendNotification(notificationMessage);
}

async function sendNotification(message) {
  try {
    const request = {
      Message: JSON.stringify(message),
      MessageAttributes: {
        action: {
          DataType: 'String',
          StringValue: message.action
        }
      },
      TopicArn: topicARN
    };
    const snsClient = new aws.SNS(snsConfig);

    const response = await snsClient.publish(request).promise();
    return response.MessageId;
  } catch (error) {
    log.error('Failed to send notification for message: ', message, error.stack);
  }
}

module.exports = { setLogger, sendNotification, sendDatasetNotification, sendPermissionNotification };
