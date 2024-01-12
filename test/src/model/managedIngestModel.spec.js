const managedIngestModel = require('../../../src/model/managedIngestModel');

describe('managedIngestModel tests', () => {
  const validManagedIngestTask = {
    taskName: 'load1',
    source: 'IBM_zos',
    phase: 'enhance',
    transform: "csv",
    datatype: 'com.deere.enterprise.datalake.enhance.test-dataset',
    representation: 'com.deere.enterprise.datalake.enhance.test-dataset-schema@1.0.0',
    ingestType: 'FULL_LOAD',
    isView: true ,
    db_details: {
      username: 'test-user',
      password: 'test-passowrd',
      server: 'test-server.com',
      port: '3700',
      database: 'DB234',
      udtf: 'R4Z.R4Z2_CDC_UDTF__DB34',
    },
    source_table: [{
      
      schema: 'TEST',
      tableName: 'MY_TABLE',
      tableType: 'table',
      columns_to_add: ['Name', 'Power', 'Combat', 'Total'],
    }]
  };

  const sharepointSchedule =
  {

    "source": "Sharepoint",
    "phase": "raw",
    "datatype": "com.deere.enterprise.datalake.raw.sharepointtest",
    "ingestType": "FULL_LOAD",
    "sharepoint_details": {
      "clientId": "cb967cd4-d251-4bfa-8ac5-6b92de98b22d",
      "clientSecret": "d3VbzMuvD2Ho+7aPxflOJZFiuSgBPGdAev68314FKWw=",
      "siteUrl": "https://deere.sharepoint.com/sites/edlingest",
      "tenantId": "39b03722-b836-496a-85ec-850f0957ca6b",
      "displayType": "file",
      "selectedItems": "Document.docx",
      "docFolder": "Shared Documents/test"
    },
    "schedule": {
      "frequency": "daily",
      "startTime": "11:30",
      "startDate": "2022-03-14",
      "everyNHours": "0",
      "endDate": "2022-03-15"
    }
  }

  it('should be a valid ManagedIngestTask', async () => {
    const actualResponse = await managedIngestModel.validateMDITask(validManagedIngestTask);
    expect(actualResponse).toBeNull();
  });

  it('should be a valid SharepointTask', async () => {
    const actualResponse = await managedIngestModel.validateSharepointTask(sharepointSchedule);
    expect(actualResponse).toBeNull();
  });

  it('should be a valid ManagedIngestTask with schedule', async () => {
    const schedule = {
      frequency: 'weekly',
      startTime: '22:00',
      dayOfWeek: 'SUN',
      endDate: '2022-7-3'
    };
    validManagedIngestTask.schedule = schedule;
    const actualResponse = await managedIngestModel.validateMDITask(validManagedIngestTask);
    expect(actualResponse).toBeNull();
  });

  it('should be a invalid ManagedIngestTask with schedule', async () => {
    const schedule = {
      frequency: 'daily',
      startTime: '22:00',
      dayOfWeek: 'SUN',
      endDate: '2022-7-3'
    };
    validManagedIngestTask.schedule = schedule;
    const error = await managedIngestModel.validateMDITask(validManagedIngestTask);
    expect(error.message).toEqual('child \"schedule\" fails because [child \"startDate\" fails because [\"startDate\" is required]]');
    expect(error.details[0].name).toEqual('New Managed Ingest Task');
  });

  it('should be invalid ManagedIngestTask', async () => {
    delete validManagedIngestTask.schedule;
    const invalidManagedTask = { ...validManagedIngestTask };
    delete invalidManagedTask.taskName;
    const error = await managedIngestModel.validateMDITask(invalidManagedTask);
    expect(error.message).toEqual('child \"taskName\" fails because [\"taskName\" is required]');
    expect(error.details[0].name).toEqual('New Managed Ingest Task');
  });

  it('ManagedIngestTask name contains invalid characters', async () => {
    const invalidManagedTask = { ...validManagedIngestTask };
    invalidManagedTask['taskName'] = 'name+with/invalid#characters';
    const error = await managedIngestModel.validateMDITask(invalidManagedTask);
    expect(error.message).toEqual('child \"taskName\" fails because [\"taskName\" with value \"name+with/invalid#characters\" fails to match the cannot contain special characters pattern]');
  });

  it('should be invalid ManagedIngestTask when source_table is empty', async () => {
    delete validManagedIngestTask.schedule;
    const invalidManagedTask = { ...validManagedIngestTask };
    invalidManagedTask.source_table = [];
    const error = await managedIngestModel.validateMDITask(invalidManagedTask);
    expect(error.message).toEqual('child \"source_table\" fails because [\"source_table\" does not contain 1 required value(s)]');
    expect(error.details[0].name).toEqual('New Managed Ingest Task');
  });
});
