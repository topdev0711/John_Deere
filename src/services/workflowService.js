const apiHelper = require('../utilities/edlApiHelper');
const conf = require('../../conf').getConfig();
let log = require('edl-node-log-wrapper');
const AWS = require('aws-sdk');
const setLogger = logger => {
  log = logger;
  apiHelper.setLogger(logger);
}

const tasksUrl = `${conf.edlWorkflow}/tasks`;
const managedTasksUrl = `${conf.edlWorkflow}/managedtasks`;

async function getCrossAccountAssumeRole(awsAccountNo, awsAccountRegion) {
    try {
      const STS = new AWS.STS();
      const params = { RoleArn : `arn:aws:iam::${awsAccountNo}:role/${conf.serviceAccessRoleArn}`, RoleSessionName: 'jdCatalogSession'};
      log.info(`assuming role in account : `, awsAccountNo , awsAccountRegion);
      const response = await STS.assumeRole(params).promise();
      log.info(`assumed role in account : `, awsAccountNo , awsAccountRegion);
  
      const { Credentials: { AccessKeyId, SecretAccessKey, SessionToken } } = response;
      return new AWS.DMS({ accessKeyId: AccessKeyId, secretAccessKey: SecretAccessKey, sessionToken: SessionToken, region: awsAccountRegion});
      
     } catch(error) {
      throw new Error('failed to assume role with error: '+ error.message);
    }
  }

async function testEndpointConnection(userInput){
  try{
    let Arn;
    if(!userInput.isUpdate){
      log.info(`endpointCreation`)
      Arn = await endpointCreation(userInput)
    }else{
      log.info(`endpointModification`)
      Arn = await endpointModification(userInput)
    }

    return {
      sourceEndPoint : Arn.sourceEndpointArn,
      targetEndPoint : Arn.targetEndpointArn
    };

  }catch (error) {
    log.info(`testEndpointConnection error : ${error}`)
    throw new Error(`${error}.`)
  }
}

async function testConnection({sourceEndPoint, isUpdate, awsAccountRegion, awsAccountNo,replicationInstanceName}){
  try{
    const dms = await getCrossAccountAssumeRole(awsAccountNo, awsAccountRegion)
    const paramsForEndpointArn = {
      Filters: [
        {
          Name: "endpoint-arn", 
          Values: [sourceEndPoint]
        }
      ],
     };
    log.info(`paramsForEndpointArn : ${JSON.stringify(paramsForEndpointArn)}`)
    const params = {
      EndpointArn: sourceEndPoint,
      ReplicationInstanceArn: `arn:aws:dms:${awsAccountRegion}:${awsAccountNo}:rep:${!!replicationInstanceName?replicationInstanceName:conf.replicationInstance}`, 
    };
    if(!isUpdate){
      const testConnectionRes = await dms.testConnection(params).promise();
      log.info(`testConnectionRes: ${JSON.stringify(testConnectionRes)}`)
    }
    
    const testDMSConnection = await dms.waitFor('testConnectionSucceeds',paramsForEndpointArn).promise();
    log.info(`testDMSConnection : ${JSON.stringify(testDMSConnection)}`)

    if(testDMSConnection.Connections[0].Status !== "successful" ){
      throw new Error(`Error while test connecting to EndPoints.`)
    }

    return testDMSConnection.Connections[0];

  }catch(error){
    log.info(`testConnection error : ${error}`)
    throw new Error(`${error}.`)
  }
}

async function endpointCreation(userInput){
  try{
    const dms = await getCrossAccountAssumeRole(userInput.awsAccountNo, userInput.awsAccountRegion)
    const dbsource = userInput.source.replace(/\s+/g, '');
    var sslModeVar;
    if(userInput.db_details.engine==='postgres' || userInput.db_details.engine==='aurora-postgresql' ){
      sslModeVar='require'
    }else{
      sslModeVar='none'
    }
    const dbsettings =  {
      EngineName: userInput.db_details.engine,
      ServerName: userInput.db_details.server,
      Username: userInput.db_details.username,
      Password: userInput.db_details.password,
      Port: userInput.db_details.port,
      DatabaseName: userInput.db_details.database        
    };
    const source = {
      EndpointIdentifier: `${userInput.taskName}`, 
      EndpointType: 'source',
      ...dbsettings,
      ResourceIdentifier: `${userInput.taskName}`,
      SslMode: sslModeVar,
    }
    const pathName = userInput.phase === "enhance" ? userInput.representation : userInput.taskName;
    const target = {
      EndpointIdentifier: `${userInput.taskName}`, 
      EndpointType: 'target',
      ResourceIdentifier: `${userInput.taskName}`,
      EngineName: 's3',
      S3Settings: {
          AddColumnName: true,
          BucketFolder: `${userInput.phase}/${userInput.datatype}/${pathName}/${dbsource}/`,
          BucketName: `${conf.mdiBucket}-${userInput.awsAccountNo}-${userInput.awsAccountRegion}`,
          IncludeOpForFullLoad: false,
          CdcInsertsOnly: false,
          CdcInsertsAndUpdates: false,
          CdcMaxBatchInterval: 60,
          CompressionType: 'none',
          DataFormat: 'parquet',
          DataPageSize: 1073741824,
          ParquetVersion: "parquet-2-0",
          Rfc4180: false,
          ServiceAccessRoleArn: `arn:aws:iam::${userInput.awsAccountNo}:role/${conf.serviceAccessRoleArn}`
      }
    }
    const describeEndpointBody = {
      roleARN: `arn:aws:iam::${userInput.awsAccountNo}:role/system-roles/edl-cross-replication`,
      region: userInput.awsAccountRegion,
      Name: "endpoint-type",
      Values: ["source"]
    };
    
    const url = `${conf.edlWorkflow}/describe-endpoints`;
    const endpointsResponse = await apiHelper.post(url, describeEndpointBody);

    let existingEndpoint,sourceEndpoint;
    if(!!endpointsResponse.result && endpointsResponse.result.length){
      existingEndpoint = endpointsResponse.result.find(function (el) {
        return el.ServerName === userInput.db_details.server && el.DatabaseName === userInput.db_details.database;
      });
    }
    if(!existingEndpoint){
      sourceEndpoint = await dms.createEndpoint(source).promise();
    }
    const targetEndpoint = await dms.createEndpoint(target).promise();

    return {
      sourceEndpointArn : !!sourceEndpoint ? sourceEndpoint.Endpoint.EndpointArn : existingEndpoint.EndpointArn,
      targetEndpointArn : targetEndpoint.Endpoint.EndpointArn,
    }
  }catch(error){
    log.info(`endpointCreation error: ${error}`)
    throw new Error(`An unexpected error occurred when creating endpoints : ${error}.`)
  }
}

async function endpointModification(userInput){
  try{
    const dms = await getCrossAccountAssumeRole(userInput.awsAccountNo, userInput.awsAccountRegion)
    const dbsettings =  {
      EngineName: userInput.db_details.engine,
      ServerName: userInput.db_details.server,
      Username: userInput.db_details.username,
      Password: userInput.db_details.password,
      Port: userInput.db_details.port,
      DatabaseName: userInput.db_details.database        
    };
    const source = {
      EndpointArn: `${userInput.sourceEndPoint}`, 
      EndpointType: 'source',
      ...dbsettings
    }
    log.info(`Modified Endpoint source : ${source}`) 
    const {Endpoint: {EndpointArn: sourceEndpointArn}} = await dms.modifyEndpoint(source).promise();
    log.info(`Modified Endpoint : ${sourceEndpointArn}`) 

    return {
      sourceEndpointArn,
      targetEndpointArn : userInput.targetEndPoint
    }
  }catch(error){
    log.info(`endpointModifying error: ${error}`)
    throw new Error(`An unexpected error occurred when modifying endpoints :${error}.`)
  }
}

async function deleteTask( taskId, sourceType = '', isManagedTask = false) {
  const url = isManagedTask ? `${managedTasksUrl}/${sourceType}/${taskId}` : `${tasksUrl}/${taskId}`;
  try {
    log.info(`calling DELETE api ${url}`)
    const response = await apiHelper.apiDelete(url);
    log.info(`Received successful response from ${url}`);
    log.debug(response)
    return response;
  } catch (e) {
    log.error(e);
    return new Error(`An unexpected error occurred when deleting tasks id: ${taskId}.`)
  }
}

async function createTask(body, isManagedTask = false) {
  const url = isManagedTask ? `${managedTasksUrl}` : `${tasksUrl}`;
  try {
    log.info(`calling api ${url}`);
    const response = await apiHelper.post(url, body);
    log.info(`Received successful response from ${url}`);
    log.debug(response);
    return response;
  } catch (e) {
    log.error(e);
    return e
  }
}

async function configureMDICrossAccount(body) {
  const url = `${conf.edlWorkflow}/configure-mdi`;
  try {
    const response = await apiHelper.post(url, body);
    return response;
  } catch (e) {
    log.error(e);
    return e
  }
}

async function configureMDECrossAccount(body) {
  const url = `${conf.edlWorkflow}/configure-mds`;
  try {
    return await apiHelper.post(url, body);
  } catch (e) {
    log.error(e);
    return e
  }
}

async function adhocRun( body ) {

  const url = `${conf.edlWorkflow}/adhocrun`
  try {
    const response = await apiHelper.postWithInternalOktaAdminParams(url, body);
    log.info('response is:',response);
    return response;
  } catch (e) {
    log.error(e);
    return e;
  }
}


async function configureMDECrossAccountStatus(params) {
  const url = `${conf.edlWorkflow}/mds-status?accountNumber=${params.accountNumber}&rdsIpAddress=${params.rdsIpAddress}`;
  console.log(url);
  try {
    return await apiHelper.get(url);
  } catch (e) {
    log.error(e);
    return e
  }
}

async function getSharepointToken(body) {
  try {
    const { clientId, clientSecret, tenantId } = body;
    const authUrl = "https://accounts.accesscontrol.windows.net/" + tenantId + "/tokens/OAuth/2/";
    let params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('resource', `00000003-0000-0ff1-ce00-000000000000/deere.sharepoint.com@${tenantId}`);
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    const creds = await fetch(authUrl, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: params
    });
    const tokenData = await creds.json();
    return tokenData

  } catch (e) {
    log.error(e);
    return e
  }
}

async function getSharepointLists(body) {
  try {
    const { sharepointToken, siteUrl } = body;
    const response = await fetch(`${siteUrl}/_api/Web/Lists`, {
            method: 'GET',
            headers: {
                'Authorization': sharepointToken,
                'Accept': 'application/json;odata=nometadata',
                'Content-Type': 'application/json;;odata=nometadata'
            }
        })
      log.info(`getSharepointLists api status : ${JSON.stringify(response.status)}`);
    log.info(`getSharepointLists api URL : ${JSON.stringify(response?.url)}`);
    if (response.status > 200) {
      throw `Failed to get Files and Folders, Error: ${JSON.stringify(response)}`;
    }
    const jsonResponse = await response.json();
    log.info(`getSharepointLists count :  ${(jsonResponse.value.filter(item => item.Hidden === false)).length}`);
    return jsonResponse

  } catch (error) {
    throw error
  }
}

async function getSharepointFolders(body) {
  try {
    const { sharepointToken, siteUrl, docFolder } = body;
    const response = await fetch(`${siteUrl}/_api/Web/Lists/getbyTitle('${docFolder}')/items?$select=FileLeafRef,FileRef,FileSystemObjectType`, {
            method: 'GET',
            headers: {
                'Authorization': sharepointToken,
                'Accept': 'application/json;odata=nometadata',
                'Content-Type': 'application/json;;odata=nometadata'
            }
        })
        log.info(`getSharepointFolders api status : ${JSON.stringify(response.status)}`);
    log.info(`getSharepointFolders api URL : ${JSON.stringify(response?.url)}`);
   
    if (response.status > 200) {
      throw `Failed to get Files and Folders, Error: ${JSON.stringify(response)}`;
    }
    const jsonResponse = await response.json();
    log.info(`getSharepointFolders api count :  ${(jsonResponse.value.length)}`);
    return jsonResponse

  } catch (error) {
    throw error
  }
}

async function getSharepointFilesFolder(body) {
  try {
    const { sharepointToken, siteUrl, filePath } = body;
    const response = await fetch(`${siteUrl}/_api/Web/GetFolderByServerRelativeUrl('${filePath}')?$expand=Files,Folders`, {
            method: 'GET',
            headers: {
                'Authorization': sharepointToken,
                'Accept': 'application/json;odata=nometadata',
                'Content-Type': 'application/json;;odata=nometadata'
            }
        })
        log.info(`getSharepointFilesFolder api status : ${JSON.stringify(response.status)}`);
    log.info(`getSharepointFilesFolder api URL : ${JSON.stringify(response?.url)}`);
    if (response.status > 200) {
      throw `Failed to get Files and Folders, Error : ${JSON.stringify(response)}`;
    }
    const jsonResponse = await response.json();
    log.info(`getSharepointFilesFolder api count : ${JSON.stringify(jsonResponse.Files.length)}`);
    return jsonResponse

  } catch (error) {
    throw error
  }
}

async function getTasks(datasetEnvName, isManagedTask) {
  try {
    const triggers = ['async_ingest_request','current_state', ...(isManagedTask === 'true' ? ['managed_ingest_request', 'managed_egress_request'] : [])];
    const [asyncTasks,currentTasks, managedIngestTasks = [], managedEgress = []] = await Promise.all(triggers.map((trigger) => apiHelper.get(`${tasksUrl}?datatype=${datasetEnvName}&trigger=${trigger}`)));
    return [...asyncTasks, ...currentTasks, ...managedIngestTasks, ...managedEgress];
  } catch (e) {
    log.error(e);
    throw new Error(`An unexpected error occurred when getting tasks for ${datasetEnvName}.`)
  }
}

async function getRunsForTask(taskId){
  const queryParameters = `/${taskId}/runs`;
  try {
    log.info('getting task: ', taskId);
    return await apiHelper.get(`${tasksUrl}${queryParameters}`);
  } catch (e) {
    log.error(e);
    return new Error(`An unexpected error occurred when getting run history for ${taskId}.`)
  }
}

async function getTask(taskId){
  const queryParameters = `/${taskId}`;
  try {
    log.info('getting task: ', taskId);
    const response = await apiHelper.get(`${tasksUrl}${queryParameters}`);
    log.info(`Results from /Tasks/${taskId}:`, response);
    return response;
  } catch (e) {
    log.error(e);
    return new Error(`An unexpected error occurred when getting task for ${taskId}.`)
  }
}

async function isManagedIngest(custodian) {
  const managedTaskGroups = conf.managedTaskGroups || [];
  const isManagedIngest = managedTaskGroups.includes(custodian);
  log.debug('isManagedIngest  :', isManagedIngest)
  return {isManagedIngest}
}


module.exports = {
  testConnection,
  endpointCreation,
  testEndpointConnection,
  setLogger,
  getSharepointLists,
  getSharepointFolders,
  getSharepointFilesFolder,
  createTask,
  deleteTask,
  getTasks,
  getRunsForTask,
  getTask,
  isManagedIngest,
  getSharepointToken,
  configureMDICrossAccount,
  configureMDECrossAccount,
  configureMDECrossAccountStatus,
  adhocRun
};
