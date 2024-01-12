/**
 * @jest-environment node
 */

const workflowService = require('../../../src/services/workflowService');
const conf = require('../../../conf').getConfig();
const apiHelper = require('../../../src/utilities/edlApiHelper');
const dataSetService = require('../../../src/services/datasetService')
const AWS_MOCK = require("aws-sdk-mock");
global.fetch = require('jest-fetch-mock');

jest.mock('../../../src/utilities/edlApiHelper');
jest.mock('../../../src/services/datasetService');

const datatype = 'anyDatatype';
const dataset_id = 'any-dataset-id';
const taskBody =
  {
    trigger: {
      event: "async_ingest_request"
    },
    source: {
      dataType: 'test123',
      representation: 'testrep123'
    },
    destination: {
      dataType: 'test123',
    },
    action:
    {
      service: "TRANSFORM",
          operation: {
      "name": "CURRENT_STATE"
    }
    },
    trigger: {
      event: "current_state"
    },
    source: {
      dataType: 'test123',
      representation: 'testrep123'
    },
    destination: {
      dataType: 'test123',
    },
    action:
    {
      service: "TRANSFORM",
          operation: {
      "name": "DATA_PROFILE"
    }
    }
  };

  const mdeTaskBody = {
    source: {
      dataType: "com.deere.enterprise.datalake.enhance.cdc_test_devl",
      representation: "com.deere.enterprise.datalake.enhance.cdc_test_devl@2.0.0"
    },
    trigger: {
      dbDetails: {
      accountNumber: "362024894964",
      database: "db",
      dbType: "aws postgres rds",
      dbUser: "postgres",
      ipAddress: "10.187.7.208",
      region: "us-east-1",
      server: "serverName"
    },
      event: "managed_egress_request",
      metadata: {
      destinationTable: "public.marvel",
      fullLoadCompleted: false,
      ingestType: "FULL_LOAD",
      phase: "enhance"
    }
  }
}

const managedTaskBody = {
  userid: 'test',
  taskName: 'load1',
  source: 'IBM_zos',
  phase: 'enhance',
  datatype: 'com.deere.enterprise.datalake.enhance.test-dataset',
  representation: 'com.deere.enterprise.datalake.enhance.test-dataset-schema@1.0.0',
  ingestType: 'FULL_LOAD',
  db_details: {
    username: 'test-user',
    password: 'test-passowrd',
    server: 'test-server.com',
    port: '3700',
    database: 'DB234',
    udtf: 'R4Z.R4Z2_CDC_UDTF__DB34',
  },
  source_table: {
    schema: 'TEST',
    tableName: 'MY_TABLE',
    columns_to_add: ['Name', 'Power', 'Combat', 'Total'],
    filter: '',
  },
  advanced_settings: {
    headers: false,
  },
};

const dataset = {
  environmentName: datatype,
  schemas:[]
}

const tasks = [
  {id: "task 1"},
  {id: "task 2"}
];

const managedTasks = [
  {id: "ManagedTask 1"},
  {id: "ManagedTask 2"},
  {id: "MDETaskTest"}
];

describe('workflow tests', () => {
  beforeEach( () => {
    apiHelper.get.mockResolvedValue([]);
    dataSetService.getDataset.mockResolvedValue(dataset);
  })

  it('should delete a task', async () => {
    const expectedResult = { taskId: '123'};
    const expectedUrl = `${conf.edlWorkflow}/tasks/123`;
    apiHelper.apiDelete.mockResolvedValueOnce(expectedResult);

    const actualTasks = await workflowService.deleteTask(123);

    expect(actualTasks).toEqual(expectedResult);
    expect(apiHelper.apiDelete).toHaveBeenCalledWith(expectedUrl);
  })

  it('should delete a managed ingest task', async () => {
    const expectedResult = { taskId: '123'};
    const expectedUrl = `${conf.edlWorkflow}/managedtasks/IBM_zos/123`;
    apiHelper.apiDelete.mockResolvedValueOnce(expectedResult);

    const actualTasks = await workflowService.deleteTask(123,'IBM_zos', true);

    expect(actualTasks).toEqual(expectedResult);
    expect(apiHelper.apiDelete).toHaveBeenCalledWith(expectedUrl);
  })

  it('should throw an internal error when deleteTask api call fails', () => {
    apiHelper.apiDelete.mockRejectedValueOnce(new Error('some error'));
    return expect(workflowService.deleteTask(123, 'IBM_zos')).resolves.toThrow('An unexpected error occurred when deleting tasks id: 123.');
  })

  it('should create a task', async () => {
    const expectedResult = taskBody;
    const expectedUrl = `${conf.edlWorkflow}/tasks`;
    apiHelper.post.mockResolvedValueOnce(expectedResult);

    const actualTasks = await workflowService.createTask(taskBody);

    expect(actualTasks).toEqual(expectedResult);
    expect(apiHelper.post).toHaveBeenCalledWith(expectedUrl, taskBody);
  });

  it('should create a managed ingest task', async () => {
    const expectedResult = managedTaskBody;
    const expectedUrl = `${conf.edlWorkflow}/managedtasks`;
    apiHelper.post.mockResolvedValueOnce(expectedResult);

    const actualTasks = await workflowService.createTask(taskBody, true);

    expect(actualTasks).toEqual(expectedResult);
    expect(apiHelper.post).toHaveBeenCalledWith(expectedUrl, taskBody);
  });

  it('should create a managed egress task', async () => {
    const expectedResult = mdeTaskBody;
    const expectedUrl = `${conf.edlWorkflow}/tasks`;
    apiHelper.post.mockResolvedValueOnce(expectedResult);

    const actualTasks = await workflowService.createTask(mdeTaskBody);

    expect(actualTasks).toEqual(expectedResult);
    expect(apiHelper.post).toHaveBeenCalledWith(expectedUrl, mdeTaskBody);
  });

  it('should return status true/false for all custodian for managed ingest access', async () => {
    const expectedResult = {isManagedIngest: true};
    const isManagedIngestTask = await workflowService.isManagedIngest('AWS-GIT-DWIS-ADMIN');
    expect(isManagedIngestTask).toEqual(expectedResult);
  });
  it('should create testConnection for source and target when EndpointArn is passed', async () => {
    const testConnectionexpectedResult = {
      "Connection":{
        "ReplicationInstanceArn":"arn:aws:dms:us-east-1:541843007032:rep:edl-mdi-dms",
        "EndpointArn":"arn:aws:dms:us-east-1:541843007032:endpoint:asaskk123-source",
        "Status":"testing",
        "EndpointIdentifier":"asaskk123-source",
        "ReplicationInstanceIdentifier":"edl-mdi-dms"
      }
    };

    const waitFortestConnectionexpectedResult = {
      "Connections":[{
          "ReplicationInstanceArn":"arn:aws:dms:us-east-1:541843007032:rep:edl-mdi-dms",
          "EndpointArn":"arn:aws:dms:us-east-1:541843007032:endpoint:asaskk123-source",
          "Status":"successful",
          "EndpointIdentifier":"asaskk123-source",
          "ReplicationInstanceIdentifier":"edl-mdi-dms"
      }]
    };
    const body = {
      sourceEndPoint :"arn:aws:dms:us-east-1:541843007032:endpoint:asaskk123-source", 
      isUpdate : false,
       awsAccountRegion : "awsAccountRegion",
      awsAccountNo : "awsAccountNo"
    }
    AWS_MOCK.mock("STS", "assumeRole", () => Promise.resolve({ Credentials: { AccessKeyId : "test", SecretAccessKey : "test", SessionToken : "test" } }))
    AWS_MOCK.mock("DMS", "testConnection", () => Promise.resolve(testConnectionexpectedResult))
    AWS_MOCK.mock("DMS", "waitFor", () => Promise.resolve(waitFortestConnectionexpectedResult))
    const endPointTask = await workflowService.testConnection(body);
    expect(endPointTask).toEqual({
      "ReplicationInstanceArn":"arn:aws:dms:us-east-1:541843007032:rep:edl-mdi-dms",
      "EndpointArn":"arn:aws:dms:us-east-1:541843007032:endpoint:asaskk123-source",
      "Status":"successful",
      "EndpointIdentifier":"asaskk123-source",
      "ReplicationInstanceIdentifier":"edl-mdi-dms"
    });
    AWS_MOCK.restore("DMS", "testConnection");
    AWS_MOCK.restore("DMS", "waitFor");
  });

  
  it('should create endPointArn for source and target when userInput is passed', async () => {
  
    const body = {
      db_details : {
        engine : 'postres',
        server : 'postgresqlrds.cn2xcmyfqfwi.us-east-1.rds.amazonaws.com',
        username : 'postgres',
        password : 'RdsAWSEdl2022',
        port : 5432,
        database : 'RdsPostgreSql',
      },
      datatype : 'test_datatype',
      representation : 'test_representation',
      source : 'awspostgresrds',
      taskName : 'dms-schedule',
      awsAccountRegion : 'us-east-1',
      awsAccountNo : '123456789012',
      SslMode: 'require',
    };
    const apibody = {
      roleARN: `arn:aws:iam::123456789012:role/system-roles/edl-cross-replication`,
      region: "us-east-1",
      Name: "endpoint-type",
      Values: ["source"]
    };
    const expectedResult = {
        result: [
            {
                "EndpointIdentifier": "testtaskas6-source",
                "EndpointType": "SOURCE",
                "EngineName": "postgres",
                "EngineDisplayName": "PostgreSQL",
                "Username": "postgres",
                "ServerName": "devledlpostgres1.cgl2p1aonu5i.us-east-1.rds.amazonaws.com",
                "Port": 5432,
                "DatabaseName": "devledlpostgres1",
                "Status": "active",
                "KmsKeyId": "arn:aws:kms:ap-south-1:123456789012:key/0d779b27-721c-4bf2-aa8e-d03acb4fc946",
                "EndpointArn": "arn:aws:dms:ap-south-1:123456789012:endpoint:testtaskas6-source",
                "SslMode": "require",
                "PostgreSQLSettings": {
                    "DatabaseName": "devledlpostgres1",
                    "Port": 5432,
                    "ServerName": "devledlpostgres1.cgl2p1aonu5i.ap-south-1.rds.amazonaws.com",
                    "Username": "postgres"
                }
            }
        ],
        totalEndpoints: 1,
        uniqueEndpoints: 1
    };
    const expectedUrl = `${conf.edlWorkflow}/describe-endpoints`;
    apiHelper.post.mockResolvedValueOnce(expectedResult);
    AWS_MOCK.mock("STS", "assumeRole", () => Promise.resolve({ Credentials: { AccessKeyId : "test", SecretAccessKey : "test", SessionToken : "test" } }))
    AWS_MOCK.mock("DMS", "createEndpoint", () => Promise.resolve({Endpoint: {EndpointArn : "arn:aws:dms:us-east-1:541843007032:endpoint:dms-schedule-source"}}))
    AWS_MOCK.mock("DMS", "createEndpoint", () => Promise.resolve({Endpoint: {EndpointArn : "arn:aws:dms:us-east-1:541843007032:endpoint:dms-schedule-target"}}))
    const endPointTask = await workflowService.endpointCreation(body);
    expect(endPointTask).toEqual({
      sourceEndpointArn : "arn:aws:dms:us-east-1:541843007032:endpoint:dms-schedule-source",
      targetEndpointArn : "arn:aws:dms:us-east-1:541843007032:endpoint:dms-schedule-source"
    });
    expect(apiHelper.post).toHaveBeenCalledWith(expectedUrl, apibody);
  });
  
  it('should throw an internal error when post api call fails', () => {
    apiHelper.post.mockRejectedValueOnce(new Error('some error'));
    return expect(workflowService.createTask(taskBody)).resolves.toThrow(new Error('some error'));
  });

  it('should get an array of task definitions for async ingest trigger only', async () => {
    const expectedResult = [{id: "task 1"}, {id: "task 2"}];
    const expectedAsyncUrl = `${conf.edlWorkflow}/tasks?datatype=${dataset.environmentName}&trigger=async_ingest_request`;
    apiHelper.get.mockResolvedValueOnce(tasks);
    const actualTasks = await workflowService.getTasks(dataset.environmentName, false);
    expect(actualTasks).toEqual(expectedResult);
    expect(apiHelper.get).toHaveBeenNthCalledWith(1, expectedAsyncUrl);
  })

  it('should get an array of task definitions with managed ingest tasks', async () => {

    const expectedResult = [{id: "task 1"}, {id: "task 2"},{id: "ManagedTask 1"},{id: "ManagedTask 2"},{id: "MDETaskTest"}];

    const expectedAsyncUrl = `${conf.edlWorkflow}/tasks?datatype=${dataset.environmentName}&trigger=async_ingest_request`;
    const expectedManagedIngestUrl = `${conf.edlWorkflow}/tasks?datatype=${dataset.environmentName}&trigger=managed_ingest_request`;
    const expectedCurrentcUrl = `${conf.edlWorkflow}/tasks?datatype=${dataset.environmentName}&trigger=current_state`;
    const expectedMDETaskUrl = `${conf.edlWorkflow}/tasks?datatype=${dataset.environmentName}&trigger=managed_egress_request`;
    
    apiHelper.get.mockResolvedValueOnce(tasks).mockResolvedValueOnce(managedTasks);

    const actualTasks = await workflowService.getTasks(dataset.environmentName, "true");

    expect(actualTasks).toEqual(expectedResult);
    expect(apiHelper.get).toHaveBeenNthCalledWith(1, expectedAsyncUrl);
    expect(apiHelper.get).toHaveBeenNthCalledWith(2, expectedCurrentcUrl);
    expect(apiHelper.get).toHaveBeenNthCalledWith(3, expectedManagedIngestUrl);
    expect(apiHelper.get).toHaveBeenNthCalledWith(4, expectedMDETaskUrl);
  })

  it('should be an empty array if the datatype has no tasks', async () => {
    const expectedResult = [];

    const actualTasks = await workflowService.getTasks(dataset.environmentName);

    expect(actualTasks).toEqual(expectedResult);
  })

  it('should throw an internal error when a query parameter is missing', () => {
    dataSetService.getDataset.mockResolvedValue(dataset);
    apiHelper.get.mockRejectedValueOnce(new Error('some error'));

    return expect(workflowService.getTasks(dataset_id)).rejects.toEqual(new Error('An unexpected error occurred when getting tasks for any-dataset-id.'));
  })

  it('should get an array of run history', async () => {
    const expectedResult = [
      {correlation_id: 'correlation_id_1',
      task_id: '1234',
      created_by: 'some-id_1',
      errors: 'Error message_1',
      status: 'COMPLETE_WITH_ERRORS',
      created: '2020-04-10T12:38:45.411Z',
      id: 'some-id_1',
      modified: '2020-04-10T12:38:45.495Z'},
      {correlation_id: 'correlation_id_2',
      task_id: '1234',
      created_by: 'some-id_2',
      status: 'COMPLETE',
      created: '2020-04-10T12:38:45.411Z',
      id: 'some-id_2',
      modified: '2020-04-10T12:38:45.495Z'}];
    const expectedUrl = `${conf.edlWorkflow}/tasks/1234/runs`;
    apiHelper.get.mockResolvedValueOnce(expectedResult);

    const actualTasks = await workflowService.getRunsForTask(1234);

    expect(actualTasks).toEqual(expectedResult);
    expect(apiHelper.get).toHaveBeenCalledWith(expectedUrl);
  })

  it('should be an empty array if the tasks has no run history', async () => {
    const expectedResult = [];

    const actualTasks = await workflowService.getRunsForTask(1234);

    expect(actualTasks).toEqual(expectedResult);
  })

  it('should throw an internal error when a query parameter is missing for Tasks Runs', () => {
    apiHelper.get.mockRejectedValue(new Error('some error'));

    return expect(workflowService.getRunsForTask(1234)).resolves.toThrow(new Error('An unexpected error occurred when getting run history for 1234.'));
  })
  it('should fetch sharepoint token', () => {
    fetch.mockResponse({ status: '200' });

    const body = {
      clientId: "testID",
      clientSecret: "testSecret",
      tenantId: "testTenantId"
    };
    
    let params = new URLSearchParams();

    params.append('grant_type', 'client_credentials');
    params.append('resource', `00000003-0000-0ff1-ce00-000000000000/deere.sharepoint.com@testTenantId`);
    params.append('client_id', 'testID');
    params.append('client_secret', 'testSecret');

    const expectedBody = {
      "body": params,
      "headers": {"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"},
      "method": "POST"
    };
    
    workflowService.getSharepointToken(body);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('https://accounts.accesscontrol.windows.net/testTenantId/tokens/OAuth/2/', expectedBody);
  })

  it('should fetch getSharepointLists', () => {
    fetch.mockResponse({ status: '200' });

    const body = {
      sharepointToken: "sharepointTokentest",
      siteUrl: "siteUrltest"
    };
    
    const expectedBody = {
      method: 'GET',
      headers: {
          'Authorization': 'sharepointTokentest',
          'Accept': 'application/json;odata=nometadata',
          'Content-Type': 'application/json;;odata=nometadata'
      }
    };
    
    workflowService.getSharepointLists(body);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`siteUrltest/_api/Web/Lists`, expectedBody);
  })

  it('should fail to fetch getSharepointLists', () => {
    fetch.mockResponse({ status: '400' });

    const body = {
      sharepointToken: "",
      siteUrl: "siteUrltest"
    };
    
    const expectedBody = {
      method: 'GET',
      headers: {
          'Authorization': '',
          'Accept': 'application/json;odata=nometadata',
          'Content-Type': 'application/json;;odata=nometadata'
      }
    };
    
    workflowService.getSharepointLists(body);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`siteUrltest/_api/Web/Lists`, expectedBody);
  })

  it('should fetch getSharepointFolders', () => {
    fetch.mockResponse({ status: '200' });

    const body = {
      sharepointToken: "sharepointTokentest",
      siteUrl: "siteUrltest",
      docFolder: "docFolder"
    };
    
    const expectedBody = {
      method: 'GET',
      headers: {
          'Authorization': 'sharepointTokentest',
          'Accept': 'application/json;odata=nometadata',
          'Content-Type': 'application/json;;odata=nometadata'
      }
    };
    
    workflowService.getSharepointFolders(body);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`siteUrltest/_api/Web/Lists/getbyTitle('docFolder')/items?$select=FileLeafRef,FileRef,FileSystemObjectType`, expectedBody);
  })

  it('should fail to fetch getSharepointFolders', () => {
    fetch.mockResponse({ status: '404' });

    const body = {
      sharepointToken: "",
      siteUrl: "siteUrltest",
      docFolder: "docFolder"
    };
    
    const expectedBody = {
      method: 'GET',
      headers: {
          'Authorization': '',
          'Accept': 'application/json;odata=nometadata',
          'Content-Type': 'application/json;;odata=nometadata'
      }
    };
    
    workflowService.getSharepointFolders(body);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`siteUrltest/_api/Web/Lists/getbyTitle('docFolder')/items?$select=FileLeafRef,FileRef,FileSystemObjectType`, expectedBody);
  })

  it('should fetch getSharepointFilesFolder', () => {
    fetch.mockResponse({ status: '200' });

    const body = {
      sharepointToken: "sharepointTokentest",
      siteUrl: "siteUrltest",
      filePath: "filePath"
    };
    
    const expectedBody = {
      method: 'GET',
      headers: {
          'Authorization': 'sharepointTokentest',
          'Accept': 'application/json;odata=nometadata',
          'Content-Type': 'application/json;;odata=nometadata'
      }
    };
    
    workflowService.getSharepointFilesFolder(body);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`siteUrltest/_api/Web/GetFolderByServerRelativeUrl('filePath')?$expand=Files,Folders`, expectedBody);
  })

  it('should fetch getSharepointFilesFolder', () => {
    fetch.mockResponse({ status: '404' });

    const body = {
      sharepointToken: "",
      siteUrl: "siteUrltest",
      filePath: "filePath"
    };
    
    const expectedBody = {
      method: 'GET',
      headers: {
          'Authorization': '',
          'Accept': 'application/json;odata=nometadata',
          'Content-Type': 'application/json;;odata=nometadata'
      }
    };
    
    workflowService.getSharepointFilesFolder(body);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`siteUrltest/_api/Web/GetFolderByServerRelativeUrl('filePath')?$expand=Files,Folders`, expectedBody);
  })

  it('should delete a managed ingest task for sharepoint source', async () => {
    const expectedResult = { taskId: '456'};
    const expectedUrl = `${conf.edlWorkflow}/managedtasks/sharepoint/456`;
    apiHelper.apiDelete.mockResolvedValueOnce(expectedResult);

    const actualTasks = await workflowService.deleteTask(456,'sharepoint', true);

    expect(actualTasks).toEqual(expectedResult);
    expect(apiHelper.apiDelete).toHaveBeenCalledWith(expectedUrl);
  })

  it('should throw an internal error when deleteTask api call fails for sharepoint source', () => {
    apiHelper.apiDelete.mockRejectedValueOnce(new Error('some error'));
    return expect(workflowService.deleteTask(456, 'sharepoint')).resolves.toThrow('An unexpected error occurred when deleting tasks id: 456.');
  })

  it('should create cross account edlMDICrossAccountList', async () => {
    const body = {
      "datatype": "testDataset",
      "representation": "schema1.test@0.0.1",
      "source": "aws postgres rds",
      "phase": "enhance",
      "awsAccountNo": "362024894964",
      "awsAccountName": "jdus01ghnscloudcoreinfrastructure",
      "awsAccountRegion": "us-east-2",
      "awsVpcId": "us-east-2",
      "isUpdate":true
    };
    const expectedResult = {"pr_policy_status": 'PENDING',"pr_role_status": 'PENDING',"replication_instance_status": 'PENDING'}
    const expectedUrl = `${conf.edlWorkflow}/configure-mdi`;
    apiHelper.post.mockResolvedValueOnce(expectedResult);

    const actualResult = await workflowService.configureMDICrossAccount(body);

    expect(actualResult).toEqual(expectedResult);
    expect(apiHelper.post).toHaveBeenCalledWith(expectedUrl, body);
  });

  it('should cross account status for mde infra', async () => {
    const params = {accountNumber: '23423542525', rdsIpAddress: '12.33.45.333'};
    const expectedResult = {
      "prStatus": "arn:aws:iam::362024894964:role/system-roles/edl-mds-infra",
      "networkLoadBalancer": "arn:aws:elasticloadbalancing:us-east-1:362024894964:loadbalancer/net/NLB-RDS-edl-mds/bf72cdfc1cc068cf",
      "vpcEndpointService": "COMPLETE",
      "vpcEndpointDNS": "COMPLETE",
      "status": "COMPLETE"
    }
    const expectedUrl = `${conf.edlWorkflow}/mds-status?accountNumber=23423542525&rdsIpAddress=12.33.45.333`;
    apiHelper.get.mockResolvedValueOnce(expectedResult);

    const actualResult = await workflowService.configureMDECrossAccountStatus(params);

    expect(actualResult).toEqual(expectedResult);
    expect(apiHelper.get).toHaveBeenCalledWith(expectedUrl);
  });

  it('should create cross account for mde infra', async () => {
    const body = {"accountNumber":"362024894964","accountName":"aws-ae-edl-ingest-devl",
      "awsRegion":"us-east-1","rdsIpAddress":"10.187.7.217","rdsPort":"5432",
      "subnetIds":["subnet-07b79bf6638842732","subnet-01f54db612ca97367"],
      "vpcId":"vpc-01fa16259e3c620f0","subnetsAzIds":["use1-az1","use1-az2"],"rdsEngine":"postgres"}
    const expectedResult = {
      "prStatus": "arn:aws:iam::362024894964:role/system-roles/edl-mds-infra",
      "networkLoadBalancer": "arn:aws:elasticloadbalancing:us-east-1:362024894964:loadbalancer/net/NLB-RDS-edl-mds/bf72cdfc1cc068cf",
      "vpcEndpointService": "COMPLETE",
      "vpcEndpointDNS": "COMPLETE",
      "status": "COMPLETE"
    }
    const expectedUrl = `${conf.edlWorkflow}/configure-mds`;
    apiHelper.post.mockResolvedValueOnce(expectedResult);
    const actualResult = await workflowService.configureMDECrossAccount(body);
    expect(actualResult).toEqual(expectedResult);
    expect(apiHelper.post).toHaveBeenCalledWith(expectedUrl, body);
  });

  it('should create adhoc Run', async () => {
    const expectedResult = '{"message":"New Adhoc Run with taskID bff3c279-564f-4ccd-9dbe-8a9173cbd31d has been created successfully"}';
    const adhocRunBody= {
      "taskId": " bff3c279-564f-4ccd-9dbe-8a9173cbd31d"}
    apiHelper.postWithInternalOktaAdminParams.mockResolvedValueOnce(expectedResult);

    const actualTasks = await workflowService.adhocRun(adhocRunBody);

    expect(actualTasks).toEqual(expectedResult);
    expect(apiHelper.postWithInternalOktaAdminParams).toBeCalledTimes(1);
  })

  it('should throw an internal error when post api for adhocRun call fails', () => {
    const adhocRunBody= {
      "taskId": " bff3c279-564f-4ccd-9dbe-8a9173cbd31d"}
    apiHelper.postWithInternalOktaAdminParams.mockRejectedValueOnce(new Error('some error'));
    return expect(workflowService.adhocRun(adhocRunBody)).resolves.toThrow(new Error('some error'));
  });

});
