// Unpublished Work © 2021-2022 Deere & Company
import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import Select from 'react-select';
import WorkflowTaskForm from '../../../components/workflow/WorkflowTaskForm';
import {act} from "react-dom/test-utils";
import {waitFor} from "@testing-library/react";
import ValidatedInput from '../../../components/ValidatedInput';
import SchedulerFrequency  from '../../../components/workflow/SchedulerFrequency'
import React from "react";
import { Form,Toast, Button, Collapse } from 'react-bootstrap';
import Accordion from '../../../components/Accordion';
import { getLoggedInUser } from '../../../components/AppState'


jest.mock('../../../apis/sharepoint');

configure({ adapter: new Adapter() });
global.fetch = require('jest-fetch-mock');


const datasetsTaskDefinition = {
    trigger: {
      event: 'edl_datasets',
      dataType: 'com.deere.enterprise.datalake.enhance.demo.marvel.ComicCharacters',
      phase: 'Enhance'
    },
    action: {
      service: 'grant',
      operation: {
        name: 'MODIFY'
      }
    }
  };

const testDataset = {
    id: "testDataset",
    environmentName: "testDataset",
    phase: {name : "enhance"},
    name: "testDataset",
    schemas: [{
        environmentName: "schema1.test",
        name: "schema1",
        id: "schema1Id",
        version: "0.0.1"
    }],
    linkedSchemas: [{
        environmentName: "linkedSchemas.test",
        name: "linkedSchemas",
        id: "linkedSchemasId",
        version: "0.0.1" 
    }]
};



const rawDataset = {
    id: "testDataset",
    environmentName: "testDataset",
    phase: {name : "Raw"},
    name: "testDataset",
    schemas: [],
    linkedSchemas: []
};

const awsTaskCopy = {
    "task_definition": {
      "trigger": {
        "event": "managed_ingest_request",
        "metadata": {
          "phase": "enhance",
          "server": "devledlpostgres1.cgl2p1aonu5i.ap-south-1.rds.amazonaws.com",
          "ingestType": "FULL_LOAD",
          "sourceTable":"public.RDS_POSTGRES_DUMMY_INGEST_DEVL_0_0_176,public.RDS_POSTGRES_DUMMY_INGEST_DEVL_0_0_345",
          "awsAccountNumber": "204840125866",
          "awsAccountRegion": "ap-south-1",
          "sourceDBType": "aws postgres rds",
          "userRoleARN": "arn:aws:iam::204840125866:role/system-roles/edl-cross-replication",
          "transform": "parquet",
          "database": "devledlpostgres1",
          "delimiter": "\t",
          "contentEncoding": "snappy",
          "taskName": "testfailedconst",
          "contentType": "parquet/binary",
          "correlation_id": "7630abb8-84bb-4cc3-890f-bff824901979",
          "created_by": "0oal4x8vrfWNnqRav0h7",
          "vpc_id": "vpc-0eb81632e37c719eb",
          "created": "2022-12-27T04:28:07.817Z",
          "configure_resources": "COMPLETE",
          "replication_instance_name": "edl-mdi-dms-1672129093",
          "account_number": "204840125866",
          "account_hash": "cdb58f724453c7ff838faf83ae2a931c",
          "datacatalog_role_pr_number": "COMPLETE",
          "aws_region": "ap-south-1",
          "role_arn": "arn:aws:iam::204840125866:role/system-roles/edl-cross-replication",
          "account_name": "aws-channel-dss-r1-india-spm-devl",
          "pr_role_status": "COMPLETE",
          "isRIActive": "True",
          "pr_policy_status": "COMPLETE",
          "error_msg": "",
          "id": "df77b052-4226-4795-b38c-783e3440a004",
          "replication_instance_status": "COMPLETE",
          "delete_indicator": 0,
          "modified": "2023-01-14T06:28:51.481Z"
        }
      },
      "source": {
        "representation": "com.deere.enterprise.datalake.enhance.postgres_e2e_10@10.0.0",
        "dataType": "com.deere.enterprise.datalake.enhance.rmtest_postgres_e2e"
      }
    }
  };
  
  const onPremTaskCopy = {
    task_definition: {
      trigger: {
        event: "managed_ingest_request",
        metadata: {
          phase: "enhance",
          server: "devledlpostgres1.cgl2p1aonu5i.ap-south-1.rds.amazonaws.com",
          ingestType: "FULL_LOAD",
          sourceTable: "public.RDS_POSTGRES_DUMMY_INGEST_DEVL_0_0_176",
          sourceDBType: "IBM_zos",
          transform: "parquet",
          database: "devledlpostgres1",
          delimiter: "\t",
          contentEncoding: "snappy",
          taskName: "testfailedconst",
          contentType: "parquet/binary",
          error_msg: "",
          id: "df77b052-4226-4795-b38c-783e3440a004",
          delete_indicator: 0,
        },
      },
      source: {
        representation:
          "com.deere.enterprise.datalake.enhance.postgres_e2e_10@10.0.0",
        dataType: "com.deere.enterprise.datalake.enhance.rmtest_postgres_e2e",
      },
    },
  };

  const taskBody = {
      trigger: {
          event: "async_ingest_request",
      },
      source: {
          dataType: "testDataset",
          representation: "schema1.test@0.0.1",
      },
      destination: {
          dataType: "testDataset",
      },
      action: {
          service: "TRANSFORM",
          operation: {
              name: "CURRENT_STATE",
          },
      },
  }
    const taskBodyDataProfile = {
    trigger: {
      event: "current_state",
    },
    source: {
      dataType: "testDataset",
      representation: "schema1.test@0.0.1",
    },
    destination: {
      dataType: "testDataset",
    },
    action: {
      service: "TRANSFORM",
      operation: {
        name: "DATA_PROFILE",
      },
    },
  };
const managedTaskBody = {
    taskName: 'test-task',
    source: 'IBM_zos',
    phase: 'enhance',
    transform: "parquet",
    datatype: 'testDataset',
    representation: 'schema1.test@0.0.1',
    ingestType: 'FULL_LOAD',
    isView: false,
    db_details: {
        username: 'test-user',
        password: 'test-password',
        server: 'test-server.com',
        port: 3700,
        database: 'Db120',
        udtf: 'R4Z.R4Z2_CDC_UDTF__DB20',
    },
    source_table: [{
        
        schema: 'test-schema',
        tableName: 'TEST-TABLE',
        tableType: 'table',
        columns_to_add: [],
    }],
};

const managedTaskBodyRaw = {
    taskName: 'test-task',
    source: 'IBM_zos',
    phase: 'raw',
    transform: "parquet",
    datatype: 'testDataset',
    representation: '',
    ingestType: 'FULL_LOAD',
    isView: false,
    db_details: {
        username: 'test-user',
        password: 'test-password',
        server: 'test-server.com',
        port: 3700,
        database: 'Db120',
        udtf: 'R4Z.R4Z2_CDC_UDTF__DB20',
    },
    source_table: [{
        
        schema: 'test-schema',
        tableName: 'TEST-TABLE',
        tableType: 'table',
        columns_to_add: [],
    }],
};

jest.mock('../../../components/AppState');
const anyUser = 'loggedInUser';

describe('workflow form tests', () => {
    beforeEach(() => {
      fetch.resetMocks();
      getLoggedInUser.mockReturnValue({username: anyUser});
    });
    it("should display action dropdown and contain options", async () => {
      const wrapper = mount(
        <WorkflowTaskForm dataset={testDataset} enableDataProfile={true} />
      );
      const currentStateAction = {
        value: "current state",
        label: "current state",
      };
      const managedIngestAction = {
        value: "managed ingest",
        label: "managed ingest",
      };
      const dataProfileAction = {
        value: "data profile",
        label: "data profile",
      };
      const managedEgressAction = {
        value: "managed egress",
        label: "managed egress",
      };
      const actionOptions = [
        currentStateAction,
        dataProfileAction,
        managedEgressAction,
        managedIngestAction
      ];
      const actionsSelector = wrapper
        .find(Select)
        .filterWhere((select) => select.props().id === `actionSelector`);
      expect(actionsSelector.props().options).toEqual(actionOptions);
    });

    it("should display action dropdown and contain options with managed ingest", async () => {
      const wrapper = mount(
        <WorkflowTaskForm dataset={testDataset} enableDataProfile={true} />
      );
      const currentStateAction = {
        value: "current state",
        label: "current state",
      };
      const managedIngestAction = {
        value: "managed ingest",
        label: "managed ingest",
      };
      const dataProfileAction = {
        value: "data profile",
        label: "data profile",
      };
      const managedEgressAction = {
        value: "managed egress",
        label: "managed egress",
      };
      const actionOptions = [
        currentStateAction,
        dataProfileAction,
        managedEgressAction,
        managedIngestAction,
      ];
      const actionsSelector = wrapper
        .find(Select)
        .filterWhere((select) => select.props().id === `actionSelector`);
      expect(actionsSelector.props().options).toEqual(actionOptions);
    });
    it('should display onPremise oracle source option only if it is enabled', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={testDataset} enableManagedIngestRdsTask ={true} />);
        const IBMZOSOption = { value: 'IBM_zos', label: 'IBM DB2 for z/OS' };
        const OnPremMSSQL = { value: 'MSSQL', label: 'On Premise Microsoft SQL' };
        const OnPremOracle = { value: 'Oracle', label: 'On Premise Oracle' };
        const PostgresRdsOption = { value: 'aws postgres rds', label: 'AWS Postgres' };
        const MsSqlOption = { value: 'aws mssql', label: 'AWS Microsoft SQL' };
        const MySqlOption = { value: 'aws mysql', label: 'AWS MYSQL' };
        const expected = [MsSqlOption,MySqlOption, PostgresRdsOption, IBMZOSOption,OnPremMSSQL,OnPremOracle];
        
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();

        const sourceSchemaOptions = testDataset.schemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
        const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
        act(() => {sourceSchemaSelector.prop('onChange')(sourceSchemaOptions[0])});
        wrapper.update();

        const received = wrapper.find(Select).filterWhere(select => select.props().id === `dbTypeSelector`);
        expect(received).toHaveLength(1);
        expect(received.props().options).toEqual(expected);

    });

    it('should display AWS Microsoft SQL RDS source option for all AD Groups for enhance', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={testDataset} enableManagedIngestRdsTask ={true} />);
        const IBMZOSOption = { value: 'IBM_zos', label: 'IBM DB2 for z/OS' };
        const OnPremMSSQL = { value: 'MSSQL', label: 'On Premise Microsoft SQL' };
        const OnPremOracle = { value: 'Oracle', label: 'On Premise Oracle' };
        const MsSqlOption = { value: 'aws mssql', label: 'AWS Microsoft SQL' };
        const MySqlOption = { value: 'aws mysql', label: 'AWS MYSQL' };
        const PostgresRdsOption = { value: 'aws postgres rds', label: 'AWS Postgres' };
        const expected = [MsSqlOption,MySqlOption,PostgresRdsOption,IBMZOSOption,OnPremMSSQL,OnPremOracle];
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();
        const sourceSchemaOptions = testDataset.schemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
        const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
        act(() => {sourceSchemaSelector.prop('onChange')(sourceSchemaOptions[0])});
        wrapper.update();
        const received = wrapper.find(Select).filterWhere(select => select.props().id === `dbTypeSelector`);
        expect(received).toHaveLength(1);
        expect(received.props().options).toEqual(expected);
    });

    it('should display PostgresSQL RDS source option for all AD Groups', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={testDataset} enableManagedIngestRdsTask ={true} />);
        const IBMZOSOption = { value: 'IBM_zos', label: 'IBM DB2 for z/OS' };
        const OnPremMSSQL = { value: 'MSSQL', label: 'On Premise Microsoft SQL' };
        const OnPremOracle = { value: 'Oracle', label: 'On Premise Oracle' };
        const PostgresRdsOption = { value: 'aws postgres rds', label: 'AWS Postgres' };
        const MsSqlOption = { value: 'aws mssql', label: 'AWS Microsoft SQL' };
        const MySqlOption = { value: 'aws mysql', label: 'AWS MYSQL' };
        const expected = [MsSqlOption, MySqlOption,PostgresRdsOption, IBMZOSOption,OnPremMSSQL,OnPremOracle];
        
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();

        const sourceSchemaOptions = testDataset.schemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
        const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
        act(() => {sourceSchemaSelector.prop('onChange')(sourceSchemaOptions[0])});
        wrapper.update();

        const received = wrapper.find(Select).filterWhere(select => select.props().id === `dbTypeSelector`);
        expect(received).toHaveLength(1);
        expect(received.props().options).toEqual(expected);

    });

    it("should display managed ingest and managed egress action dropdown if mdi is enabled for raw", async () => {
      const wrapper = mount(<WorkflowTaskForm dataset={rawDataset} />);
      const managedIngestAction = {
        value: "managed ingest",
        label: "managed ingest",
      };
      const managedEgressAction = {
        value: "managed egress",
        label: "managed egress",
      };
      const actionOptions = [managedEgressAction, managedIngestAction];
      const actionsSelector = wrapper
        .find(Select)
        .filterWhere((select) => select.props().id === `actionSelector`);
      expect(actionsSelector.props().options).toEqual(actionOptions);
    });

    it('should display managed ingest action dropdown if copy task is true', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={testDataset}  copyingTask={true} task={awsTaskCopy}/>);
        const managedIngestAction = { value: 'managed ingest', label: 'managed ingest' };
        const actionsSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        expect(actionsSelector.props().value).toEqual(managedIngestAction);
    });

    it('should display data ingest action dropdown if copy task is true', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={testDataset}  copyingTask={true} task={awsTaskCopy}/>);
        const dataIngestedTrigger = { value: 'data ingested', label: 'data ingested' };
        const triggerSelector = wrapper.find(Select).filterWhere(select => select.props().id === `triggerSelector`);
        expect(triggerSelector.props().value).toEqual(dataIngestedTrigger)
    });

    it('should display Data Source dropdown if copy task is true as selected', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={testDataset}  copyingTask={true} task={awsTaskCopy}/>);
        const dbTypeValue = [{ value: awsTaskCopy.task_definition.trigger.metadata.sourceDBType, label: "AWS Postgres" }]
        const dbTypeSelectorControl = wrapper.find(Select).filterWhere(c => c.props().id === 'dbTypeSelector');
        expect(dbTypeSelectorControl.props().value).toEqual(dbTypeValue)
    });

    it("should populate AWS details if it is AWS Copy Task and Enable Configure Mdi", async () => {
      const wrapper = mount(
        <WorkflowTaskForm
          dataset={testDataset}
          copyingTask={true}
          task={awsTaskCopy}
        />
      );
      const dbTypeSelectorControl = wrapper
        .find(Select)
        .filterWhere((c) => c.props().id === "dbTypeSelector");
      act(() => {
        dbTypeSelectorControl.prop("onChange")({
          value: "aws postgres rds",
          label: "AWS Postgres RDS",
        });
      });
      wrapper.update();
      const validatedInputs = wrapper.find(ValidatedInput);
      const awsAccountName = validatedInputs.filterWhere(
        (input) => input.props().id === `awsAccountName`
      );
      const awsAccountNumber = validatedInputs.filterWhere(
        (input) => input.props().id === `awsAccountNo`
      );
      const awsAccountRegion = validatedInputs.filterWhere(
        (input) => input.props().id === `awsAccountRegion`
      );
      const awsAccountVpcID = validatedInputs.filterWhere(
        (input) => input.props().id === `awsAccountVPC`
      );
      expect(awsAccountName.props().defaultValue).toEqual(
        awsTaskCopy.task_definition.trigger.metadata.account_name
      );
      expect(awsAccountNumber.props().defaultValue).toEqual(
        awsTaskCopy.task_definition.trigger.metadata.account_number
      );
      expect(awsAccountRegion.props().defaultValue).toEqual(
        awsTaskCopy.task_definition.trigger.metadata.aws_region
      );
      expect(awsAccountVpcID.props().defaultValue).toEqual(
        awsTaskCopy.task_definition.trigger.metadata.vpc_id
      );
      const configureMDIButton = wrapper
        .find({ children: "Configure MDI" })
        .at(0);
      expect(configureMDIButton.props().disabled).toEqual(false);
    });

    it('should display trigger dropdown and contain options', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={testDataset} />);
        const dataIngestedTrigger = { value: 'data ingested', label: 'data ingested' };
        const triggerOptions = [dataIngestedTrigger];
        const triggerSelector = wrapper.find(Select).filterWhere(select => select.props().id === `triggerSelector`);
        expect(triggerSelector.props().options).toEqual(triggerOptions);
    });

    it('should display source schema dropdown and contain options', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={testDataset} />);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'current state', label: 'current state' })});
        wrapper.update();
        const allSchemas = [...testDataset.linkedSchemas, ...testDataset.schemas]
        const sourceSchemaOptions = allSchemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
        const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
        expect(sourceSchemaSelector.props().options).toEqual(sourceSchemaOptions);
    });

    it('wont display source schema on the create Task Form for raw dataset', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={rawDataset} setCreatingTask={() => true} setRefreshTasks={() => false}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();
        const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
        expect(sourceSchemaSelector).toHaveLength(0);
    });

    it('should display Database Source dropdown for managed ingest action and disable createTask button ', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={testDataset} setCreatingTask={() => true} setRefreshTasks={() => false}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();

        const sourceSchemaOptions = testDataset.schemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
        const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
        act(() => {sourceSchemaSelector.prop('onChange')(sourceSchemaOptions[0])});
        wrapper.update();
        const dbTypeSelectorControl = wrapper.find(Select).filterWhere(c => c.props().id === 'dbTypeSelector');
        const createTaskButton = wrapper.find({children: "Create Task"}).at(0);
        expect(dbTypeSelectorControl).toHaveLength(1);
        expect(createTaskButton.props().disabled).toEqual(true);
    });

    it('should display Database Source dropdown for managed ingest action and disable createTask button for raw ', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={rawDataset} setCreatingTask={() => true} setRefreshTasks={() => false}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();

        const dbTypeSelectorControl = wrapper.find(Select).filterWhere(c => c.props().id === 'dbTypeSelector');
        const createTaskButton = wrapper.find({children: "Create Task"}).at(0);
        expect(dbTypeSelectorControl).toHaveLength(1);
        expect(createTaskButton.props().disabled).toEqual(true);
    });

    it('should enable createTask button on select of databse source for managed ingest action', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={testDataset} setCreatingTask={() => true} setRefreshTasks={() => false}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();

        const sourceSchemaOptions = testDataset.schemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
        const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
        act(() => {sourceSchemaSelector.prop('onChange')(sourceSchemaOptions[0])});
        wrapper.update();
        const dbTypeSelectorControl = wrapper.find(Select).filterWhere(c => c.props().id === 'dbTypeSelector');
        act(() => {dbTypeSelectorControl.prop('onChange')({ value: 'IBM_zos', label: 'IBM DB2 for z/OS' })});
        wrapper.update();
        const createTaskButton = wrapper.find({children: "Create Task"}).at(0);

        expect(createTaskButton.props().disabled).toEqual(false);
    });

    it('should disable createTask button on select of databse source as aws postgres rds', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={testDataset} setCreatingTask={() => true} setRefreshTasks={() => false}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();

        const sourceSchemaOptions = testDataset.schemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
        const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
        act(() => {sourceSchemaSelector.prop('onChange')(sourceSchemaOptions[0])});
        wrapper.update();
        const dbTypeSelectorControl = wrapper.find(Select).filterWhere(c => c.props().id === 'dbTypeSelector');
        act(() => {dbTypeSelectorControl.prop('onChange')({ value: 'aws postgres rds', label: 'AWS Postgres RDS' })});
        wrapper.update();
        const createTaskButton = wrapper.find({children: "Create Task"}).at(0);

        expect(createTaskButton.props().disabled).toEqual(true);
    });

    it('should show other managed ingest task field and enable testConnection button on select of aws postgres rds databse source for managed ingest action', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={testDataset} setCreatingTask={() => true} setRefreshTasks={() => false} showConfigureMDI={() => true}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();

        const sourceSchemaOptions = testDataset.schemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
        const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
        act(() => {sourceSchemaSelector.prop('onChange')(sourceSchemaOptions[0])});
        wrapper.update();

        const dbTypeSelectorControl = wrapper.find(Select).filterWhere(c => c.props().id === 'dbTypeSelector');
        act(() => {dbTypeSelectorControl.prop('onChange')({ value: 'aws postgres rds', label: 'AWS Postgres RDS' })});
        wrapper.update();

        const awsAccountNo = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountNo');
        const awsAccountName = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountName');
        const awsAccountRegion = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountRegion');
        const awsAccountVPC = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountVPC');
        act(() => {
            awsAccountName.prop('onBlur')({target:{value:'devl'}});
            awsAccountNo.prop('onBlur')({target:{value:'123456789012'}});
            awsAccountRegion.prop('onBlur')({target:{value:'us-east-1'}});
            awsAccountVPC.prop('onBlur')({target:{value:'vpc-882698ef'}});
        });
        wrapper.update();
        const configureMDIButton = wrapper.find({children: "Configure MDI"}).at(0);
        configureMDIButton.simulate('click');
        wrapper.update();

        const dbTaskName = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'mdiTaskName');
        const dbUserNameControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbUserName');
        const dbPasswordControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbPassword');
        const dbServerControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbServer');
        const dbPortControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbPort');
        const dbLocationControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbLocation');

        act(() => {
            dbTaskName.prop('onBlur')({target:{value:'task-name'}});
            dbUserNameControl.prop('onBlur')({target:{value:'test-user'}});
            dbPasswordControl.prop('onBlur')({target:{value:'test-password'}});
            dbServerControl.prop('onBlur')({target:{value:'test-server.com'}});
            dbPortControl.prop('onBlur')({target:{value:3700}});
            dbLocationControl.prop('onBlur')({target:{value:'Db120'}});
        });

        wrapper.update();
        const testConnectionButton = wrapper.find({children: "Test Connection"}).at(0);
        expect(testConnectionButton.props().disabled).toEqual(false);
    });
    it("should enable Configure Mdi button", async () => {
      const wrapper = mount(
        <WorkflowTaskForm
          dataset={testDataset}
          setCreatingTask={() => true}
          setRefreshTasks={() => false}
          showConfigureMDI={() => true}
        />
      );
      const actionSelector = wrapper
        .find(Select)
        .filterWhere((select) => select.props().id === `actionSelector`);
      act(() => {
        actionSelector.prop("onChange")({
          value: "managed ingest",
          label: "managed ingest",
        });
      });
      wrapper.update();

      const sourceSchemaOptions = testDataset.schemas.map(
        ({ environmentName, name, version }) => ({
          value: `${environmentName}@${version}`,
          label: `${name}@${version}`,
        })
      );
      const sourceSchemaSelector = wrapper
        .find(Select)
        .filterWhere((select) => select.props().id === `sourceSchemaSelector`);
      act(() => {
        sourceSchemaSelector.prop("onChange")(sourceSchemaOptions[0]);
      });
      wrapper.update();

      const dbTypeSelectorControl = wrapper
        .find(Select)
        .filterWhere((c) => c.props().id === "dbTypeSelector");
      act(() => {
        dbTypeSelectorControl.prop("onChange")({
          value: "aws postgres rds",
          label: "AWS Postgres RDS",
        });
      });
      wrapper.update();

      const awsAccountNo = wrapper
        .find(ValidatedInput)
        .filterWhere((c) => c.props().id === "awsAccountNo");
      const awsAccountName = wrapper
        .find(ValidatedInput)
        .filterWhere((c) => c.props().id === "awsAccountName");
      const awsAccountRegion = wrapper
        .find(ValidatedInput)
        .filterWhere((c) => c.props().id === "awsAccountRegion");
      const awsAccountVPC = wrapper
        .find(ValidatedInput)
        .filterWhere((c) => c.props().id === "awsAccountVPC");
      act(() => {
        awsAccountName.prop("onBlur")({ target: { value: "devl" } });
        awsAccountNo.prop("onBlur")({ target: { value: "123456789012" } });
        awsAccountRegion.prop("onBlur")({ target: { value: "us-east-1" } });
        awsAccountVPC.prop("onBlur")({ target: { value: "vpc-882698ef" } });
      });
      wrapper.update();
      const configureMDIButton = wrapper
        .find({ children: "Configure MDI" })
        .at(0);
      expect(configureMDIButton.props().disabled).toEqual(false);
    });
    it('should validate account details and not enable configure mdi button if filled is missing', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={rawDataset} setCreatingTask={() => true} setRefreshTasks={() => false}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();
        const dbTypeSelectorControl = wrapper.find(Select).filterWhere(c => c.props().id === 'dbTypeSelector');
        act(() => {dbTypeSelectorControl.prop('onChange')({ value: 'aws postgres rds', label: 'AWS Postgres RDS' })});
        wrapper.update();

        const awsAccountNo = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountNo');
        const awsAccountName = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountName');
        const awsAccountRegion = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountRegion');
        const awsAccountVPC = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountVPC');
        act(() => {
            awsAccountName.prop('onBlur')({target:{value:'devl'}});
            awsAccountNo.prop('onBlur')({target:{value:'123456789012'}});
            awsAccountRegion.prop('onBlur')({target:{value:'us-east-1'}});
            awsAccountVPC.prop('onBlur')({target:{value:''}});
        });
        wrapper.update();
        const configureMDIButton = wrapper.find({children: "Configure MDI" }).at(0);
        expect(configureMDIButton.props().disabled).toEqual(true);
    });
    it('should call fetch api on click of test connection button', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={testDataset} setCreatingTask={() => true} setRefreshTasks={() => false} showConfigureMDI={() => true}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();

        const sourceSchemaOptions = testDataset.schemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
        const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
        act(() => {sourceSchemaSelector.prop('onChange')(sourceSchemaOptions[0])});
        wrapper.update();

        const dbTypeSelectorControl = wrapper.find(Select).filterWhere(c => c.props().id === 'dbTypeSelector');
        act(() => {dbTypeSelectorControl.prop('onChange')({ value: 'aws postgres rds', label: 'AWS Postgres' })});
        wrapper.update();

        const awsAccountNo = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountNo');
        const awsAccountName = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountName');
        const awsAccountRegion = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountRegion');
        const awsAccountVPC = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountVPC');
        act(() => {
            awsAccountName.prop('onBlur')({target:{value:'devl'}});
            awsAccountNo.prop('onBlur')({target:{value:'123456789012'}});
            awsAccountRegion.prop('onBlur')({target:{value:'us-east-1'}});
            awsAccountVPC.prop('onBlur')({target:{value:'awsAccountVPC'}});
        });
        wrapper.update();
        const configureMDIButton = wrapper.find({children: "Configure MDI"}).at(0);
        configureMDIButton.simulate('click');
        wrapper.update();

        const dbTaskName = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'mdiTaskName');
        const dbUserNameControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbUserName');
        const dbPasswordControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbPassword');
        const dbServerControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbServer');
        const dbPortControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbPort');
        const dbLocationControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbLocation');

        act(() => {
            dbTaskName.prop('onBlur')({target:{value:'task-name'}});
            dbUserNameControl.prop('onBlur')({target:{value:'test-user'}});
            dbPasswordControl.prop('onBlur')({target:{value:'test-password'}});
            dbServerControl.prop('onBlur')({target:{value:'test-server.com'}});
            dbPortControl.prop('onBlur')({target:{value:3700}});
            dbLocationControl.prop('onBlur')({target:{value:'Db120'}});
        });
        wrapper.update();
        const testConnectionButton = wrapper.find({children: "Test Connection"}).at(0);
        testConnectionButton.simulate('click');
        wrapper.update();
        const body = {
            db_details : {
              engine : 'postgres',  
              server : 'test-server.com',
              username : 'test-user',
              password : 'test-password',
              port : 3700,
              database : 'Db120',
            },
            datatype : "testDataset",
            representation : "schema1.test@0.0.1",
            source : "aws postgres rds",
            taskName : "task-name",
            isUpdate : false,
            sourceEndPoint : "",
            targetEndPoint : "",
            awsAccountRegion : 'us-east-1',
            awsAccountNo : '123456789012',
            phase:"enhance"
          };
            
        const createParams = {
            credentials: 'same-origin',
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
            'Content-Type': 'application/json'
          }
        };
        expect(fetch).toHaveBeenCalledWith(`/api/create-endpoint`, createParams);   
    });

    it("should enable createTask button on select of database source for managed ingest action for raw ", async () => {
      const wrapper = mount(
        <WorkflowTaskForm
          dataset={rawDataset}
          setCreatingTask={() => true}
          setRefreshTasks={() => false}
        />
      );
      const actionSelector = wrapper
        .find(Select)
        .filterWhere((select) => select.props().id === `actionSelector`);
      act(() => {
        actionSelector.prop("onChange")({
          value: "managed ingest",
          label: "managed ingest",
        });
      });
      wrapper.update();

      const dbTypeSelectorControl = wrapper
        .find(Select)
        .filterWhere((c) => c.props().id === "dbTypeSelector");
      act(() => {
        dbTypeSelectorControl.prop("onChange")({
          value: "IBM_zos",
          label: "IBM DB2 for z/OS",
        });
      });
      wrapper.update();
      const createTaskButton = wrapper.find({ children: "Create Task" }).at(0);

      expect(createTaskButton.props().disabled).toEqual(false);
    });

    it('should show other managed ingest task field and enable createTask button on select of IBM zos db2 databse source for managed ingest action', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={testDataset} setCreatingTask={() => true} setRefreshTasks={() => false}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();

        const sourceSchemaOptions = testDataset.schemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
        const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
        act(() => {sourceSchemaSelector.prop('onChange')(sourceSchemaOptions[0])});
        wrapper.update();

        const dbTypeSelectorControl = wrapper.find(Select).filterWhere(c => c.props().id === 'dbTypeSelector');
        act(() => {dbTypeSelectorControl.prop('onChange')({ value: 'IBM_zos', label: 'IBM DB2 for z/OS' })});
        wrapper.update();
        const dbUserNameControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbUserName');
        const dbPasswordControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbPassword');
        const dbServerControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbServer');
        const dbPortControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbPort');
        const dbLocationControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbLocation');

        expect(dbUserNameControl).toHaveLength(1);
        expect(dbPasswordControl).toHaveLength(1);
        expect(dbServerControl).toHaveLength(1);
        expect(dbPortControl).toHaveLength(1);
        expect(dbLocationControl).toHaveLength(1);
    });

    it('should show scheduler fields for managed ingest', async () => {
        const wrapper = mount(<SchedulerFrequency schedulerDetails={(x,y) =>{}} isInValid ={(x) => false} />);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === 'frequency');
        act(() => {actionSelector.prop('onChange')({ value: 'daily', label: 'daily' })});
        wrapper.update();

        const startTimeControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'starttime');
        const startDateControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'startdate');
        const everyNHoursControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'everyNHours');
        const endDateControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'endDate');
       
        expect(startTimeControl).toHaveLength(1);
        expect(startDateControl).toHaveLength(1);
        expect(everyNHoursControl).toHaveLength(1);
        expect(endDateControl).toHaveLength(1);
    });

    it('should show other managed ingest task field and enable createTask button on select of IBM zos db2 databse source for managed ingest action for raw', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={rawDataset} setCreatingTask={() => true} setRefreshTasks={() => false}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();

        const dbTypeSelectorControl = wrapper.find(Select).filterWhere(c => c.props().id === 'dbTypeSelector');
        act(() => {dbTypeSelectorControl.prop('onChange')({ value: 'IBM_zos', label: 'IBM DB2 for z/OS' })});
        wrapper.update();
        const dbUserNameControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbUserName');
        const dbPasswordControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbPassword');
        const dbServerControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbServer');
        const dbPortControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbPort');
        const dbLocationControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbLocation');

        expect(dbUserNameControl).toHaveLength(1);
        expect(dbPasswordControl).toHaveLength(1);
        expect(dbServerControl).toHaveLength(1);
        expect(dbPortControl).toHaveLength(1);
        expect(dbLocationControl).toHaveLength(1);
    });


    it('should validate managed ingest task and throw invalid message when create task is clicked', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={testDataset} setCreatingTask={() => true} setRefreshTasks={() => false}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();

        const sourceSchemaOptions = testDataset.schemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
        const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
        act(() => {sourceSchemaSelector.prop('onChange')(sourceSchemaOptions[0])});
        wrapper.update();
        const dbTypeSelector = wrapper.find(Select).filterWhere(select => select.props().id === `dbTypeSelector`);
        act(() => {dbTypeSelector.prop('onChange')({ value: 'IBM_zos', label: 'IBM DB2 for z/OS' })});
        wrapper.update();
        const addTableButton = wrapper.find(Button).filterWhere(btn => btn.props().id === `addSourceTable`)
        addTableButton.simulate('click');
        wrapper.update();
        const createTaskButton = wrapper.find({children: "Create Task"}).at(0);
        createTaskButton.simulate('click');
        wrapper.update();
        const validatedInputs = wrapper.find(ValidatedInput)
        expect(validatedInputs).toHaveLength(9);
        expect(validatedInputs.filterWhere(input => input.props().id === `mdiTaskName`).props().isInvalid).toEqual(false)
        expect(validatedInputs.filterWhere(input => input.props().id === `dbUserName`).props().isInvalid).toEqual(true)
        expect(validatedInputs.filterWhere(input => input.props().id === `dbPassword`).props().isInvalid).toEqual(true)
        expect(validatedInputs.filterWhere(input => input.props().id === `dbServer`).props().isInvalid).toEqual(true)
        expect(validatedInputs.filterWhere(input => input.props().id === `dbPort`).props().isInvalid).toEqual(true)
        expect(validatedInputs.filterWhere(input => input.props().id === `dbLocation`).props().isInvalid).toEqual(true)
        expect(validatedInputs.filterWhere(input => input.props().id === `dbSchemaName`).props().isInvalid).toEqual(true)
        expect(validatedInputs.filterWhere(input => input.props().id === `dbTableName`).props().isInvalid).toEqual(true)
        const toast = wrapper.find(Toast); 
        expect(toast.props().hidden).toEqual(false);  
    });
    
    it('should validate managed ingest task and throw invalid message when create task is clicked for raw Dataset', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={rawDataset} setCreatingTask={() => true} setRefreshTasks={() => false}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();

        const dbTypeSelector = wrapper.find(Select).filterWhere(select => select.props().id === `dbTypeSelector`);
        act(() => {dbTypeSelector.prop('onChange')({ value: 'IBM_zos', label: 'IBM DB2 for z/OS' })});
        wrapper.update();
        const addTableButton = wrapper.find(Button).filterWhere(btn => btn.props().id === `addSourceTable`)
        addTableButton.simulate('click');
        wrapper.update();
        const createTaskButton = wrapper.find({children: "Create Task"}).at(0);
        createTaskButton.simulate('click');
        wrapper.update();
        const validatedInputs = wrapper.find(ValidatedInput)
        expect(validatedInputs).toHaveLength(9);
        expect(validatedInputs.filterWhere(input => input.props().id === `mdiTaskName`).props().isInvalid).toEqual(false)
        expect(validatedInputs.filterWhere(input => input.props().id === `dbUserName`).props().isInvalid).toEqual(true)
        expect(validatedInputs.filterWhere(input => input.props().id === `dbPassword`).props().isInvalid).toEqual(true)
        expect(validatedInputs.filterWhere(input => input.props().id === `dbServer`).props().isInvalid).toEqual(true)
        expect(validatedInputs.filterWhere(input => input.props().id === `dbPort`).props().isInvalid).toEqual(true)
        expect(validatedInputs.filterWhere(input => input.props().id === `dbLocation`).props().isInvalid).toEqual(true)
        expect(validatedInputs.filterWhere(input => input.props().id === `dbSchemaName`).props().isInvalid).toEqual(true)
        expect(validatedInputs.filterWhere(input => input.props().id === `dbTableName`).props().isInvalid).toEqual(true)
        const toast = wrapper.find(Toast); 
        expect(toast.props().hidden).toEqual(false);  
    });

    it('should show column select field if all columns is unchecked for managed ingest', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={testDataset} setCreatingTask={() => true} setRefreshTasks={() => false}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();

        const sourceSchemaOptions = testDataset.schemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
        const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
        act(() => {sourceSchemaSelector.prop('onChange')(sourceSchemaOptions[0])});
        wrapper.update();
        const dbTypeSelector = wrapper.find(Select).filterWhere(select => select.props().id === `dbTypeSelector`);
        act(() => {dbTypeSelector.prop('onChange')({ value: 'IBM_zos', label: 'IBM DB2 for z/OS' })});
        wrapper.update();

        const addTableButton = wrapper.find(Button).filterWhere(btn => btn.props().id === `addSourceTable`)
        addTableButton.simulate('click');
        wrapper.update();

        const checkbox = wrapper.find(Form.Check).filterWhere(checkbox => checkbox.props().id === 'all-columns-check');
        act(() => {checkbox.prop('onChange')({target: {checked: false}})});
        wrapper.update();
        const validatedInputs = wrapper.find(ValidatedInput)
        expect(validatedInputs).toHaveLength(10);
        expect(validatedInputs.filterWhere(input => input.props().id === `dbColumns`).props().placeholder).toEqual('Type Source Column and press enter...');
    });

    it('should show column select field if all columns is unchecked for managed ingest for raw ', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={rawDataset} setCreatingTask={() => true} setRefreshTasks={() => false}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();

        const dbTypeSelector = wrapper.find(Select).filterWhere(select => select.props().id === `dbTypeSelector`);
        act(() => {dbTypeSelector.prop('onChange')({ value: 'IBM_zos', label: 'IBM DB2 for z/OS' })});
        wrapper.update();

        const addTableButton = wrapper.find(Button).filterWhere(btn => btn.props().id === `addSourceTable`)
        addTableButton.simulate('click');
        wrapper.update();

        const checkbox = wrapper.find(Form.Check).filterWhere(checkbox => checkbox.props().id === 'all-columns-check');
        act(() => {checkbox.prop('onChange')({target: {checked: false}})});
        wrapper.update();
        const validatedInputs = wrapper.find(ValidatedInput)
        expect(validatedInputs).toHaveLength(10);
        expect(validatedInputs.filterWhere(input => input.props().id === `dbColumns`).props().placeholder).toEqual('Type Source Column and press enter...');
    });

    it('should show table filter optional field if all optional button is clicked for managed ingest', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={testDataset} setCreatingTask={() => true} setRefreshTasks={() => false}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();

        const sourceSchemaOptions = testDataset.schemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
        const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
        act(() => {sourceSchemaSelector.prop('onChange')(sourceSchemaOptions[0])});
        wrapper.update();
        const dbTypeSelector = wrapper.find(Select).filterWhere(select => select.props().id === `dbTypeSelector`);
        act(() => {dbTypeSelector.prop('onChange')({ value: 'IBM_zos', label: 'IBM DB2 for z/OS' })});
        wrapper.update();

        const collapseButton = wrapper.find(Button).filterWhere(btn => btn.props().id === `openadvancesettings`);
        collapseButton.simulate('click');
        wrapper.update();
        const collapseComponent = wrapper.find(Collapse).filterWhere(collapse => collapse.props().id === `advancedSettingsCollapse`);
        expect(collapseComponent.props().in).toEqual(true)
    });

    it('should validate managed ingest task and call create task api when create task is clicked with all required values', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={testDataset} setCreatingTask={() => true} setRefreshTasks={() => false}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();

        const sourceSchemaOptions = testDataset.schemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
        const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
        act(() => {sourceSchemaSelector.prop('onChange')(sourceSchemaOptions[0])});
        wrapper.update();
        const dbTypeSelector = wrapper.find(Select).filterWhere(select => select.props().id === `dbTypeSelector`);
        act(() => {dbTypeSelector.prop('onChange')({ value: 'IBM_zos', label: 'IBM DB2 for z/OS' })});
        wrapper.update();

        const addTableButton = wrapper.find(Button).filterWhere(btn => btn.props().id === `addSourceTable`)
        addTableButton.simulate('click');
        wrapper.update();
        
        const validatedInputs = wrapper.find(ValidatedInput);
        const taskNameInput = validatedInputs.filterWhere(input => input.props().id === `mdiTaskName`);
        const userNameInput = validatedInputs.filterWhere(input => input.props().id === `dbUserName`);
        const passwordInput = validatedInputs.filterWhere(input => input.props().id === `dbPassword`);
        const serevrInput = validatedInputs.filterWhere(input => input.props().id === `dbServer`);
        const portInput = validatedInputs.filterWhere(input => input.props().id === `dbPort`);
        const dbLocationInput = validatedInputs.filterWhere(input => input.props().id === `dbLocation`);
        const schemaNameInput = validatedInputs.filterWhere(input => input.props().id === `dbSchemaName`);
        act(() => {
            taskNameInput.prop('onBlur')({target:{value:'test-task'}});
            userNameInput.prop('onBlur')({target:{value:'test-user'}});
            passwordInput.prop('onBlur')({target:{value:'test-password'}});
            serevrInput.prop('onBlur')({target:{value:'test-server.com'}});
            portInput.prop('onBlur')({target:{value:3700}});
            dbLocationInput.prop('onBlur')({target:{value:'Db120'}});
            schemaNameInput.prop('onBlur')({target:{value:'test-schema'}});
            
        });
        wrapper.update();
        const tableNameInput = wrapper.find(ValidatedInput).filterWhere(input => input.props().id === `dbTableName`);
        act(() => {
            tableNameInput.prop('onBlur')({target:{value:'TEST-TABLE'}});
        })
        wrapper.update();
        const createTaskButton = wrapper.find({children: "Create Task"}).at(0);
        createTaskButton.simulate('click');
        wrapper.update();
        const toast = wrapper.find(Toast); 
        expect(toast.props().hidden).toEqual(true);
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        wrapper.update();
        const createParams = {
            "credentials": "same-origin",
            "headers": {"Content-Type": "application/json"}, "method": "POST",
            "body": JSON.stringify(managedTaskBody)
        };
        expect(fetch).toHaveBeenCalledWith(`/api/managedtasks/`, createParams);    
    });

    it('should validate managed ingest task and call create task api when create task is clicked with all required values for raw', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={rawDataset} setCreatingTask={() => true} setRefreshTasks={() => false}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();

        const dbTypeSelector = wrapper.find(Select).filterWhere(select => select.props().id === `dbTypeSelector`);
        act(() => {dbTypeSelector.prop('onChange')({ value: 'IBM_zos', label: 'IBM DB2 for z/OS' })});
        wrapper.update();
        const addTableButton = wrapper.find(Button).filterWhere(btn => btn.props().id === `addSourceTable`)
        addTableButton.simulate('click');
        wrapper.update();
        
        const validatedInputs = wrapper.find(ValidatedInput);
        const taskNameInput = validatedInputs.filterWhere(input => input.props().id === `mdiTaskName`);
        const userNameInput = validatedInputs.filterWhere(input => input.props().id === `dbUserName`);
        const passwordInput = validatedInputs.filterWhere(input => input.props().id === `dbPassword`);
        const serevrInput = validatedInputs.filterWhere(input => input.props().id === `dbServer`);
        const portInput = validatedInputs.filterWhere(input => input.props().id === `dbPort`);
        const dbLocationInput = validatedInputs.filterWhere(input => input.props().id === `dbLocation`);
        const schemaNameInput = validatedInputs.filterWhere(input => input.props().id === `dbSchemaName`);
        act(() => {
            taskNameInput.prop('onBlur')({target:{value:'test-task'}});
            userNameInput.prop('onBlur')({target:{value:'test-user'}});
            passwordInput.prop('onBlur')({target:{value:'test-password'}});
            serevrInput.prop('onBlur')({target:{value:'test-server.com'}});
            portInput.prop('onBlur')({target:{value:3700}});
            dbLocationInput.prop('onBlur')({target:{value:'Db120'}});
            schemaNameInput.prop('onBlur')({target:{value:'test-schema'}});
        });
        wrapper.update();
        const tableNameInput = wrapper.find(ValidatedInput).filterWhere(input => input.props().id === `dbTableName`);
        act(() => {
            tableNameInput.prop('onBlur')({target:{value:'TEST-TABLE'}});
        })
        wrapper.update();
        const createTaskButton = wrapper.find({children: "Create Task"}).at(0);
        createTaskButton.simulate('click');
        wrapper.update();
        const toast = wrapper.find(Toast); 
        expect(toast.props().hidden).toEqual(true);
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        wrapper.update();
        const createParams = {
            "credentials": "same-origin",
            "headers": {"Content-Type": "application/json"}, "method": "POST",
            "body": JSON.stringify(managedTaskBodyRaw)
        };
        expect(fetch).toHaveBeenCalledWith(`/api/managedtasks/`, createParams);    
    });

    it('should validate managed ingest task and call create task api when create task when schedule is checked and unchecked and is clicked with all required values for raw', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={rawDataset} setCreatingTask={() => true} setRefreshTasks={() => false} enableManagedIngestTask={true}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();

        const dbTypeSelector = wrapper.find(Select).filterWhere(select => select.props().id === `dbTypeSelector`);
        act(() => {dbTypeSelector.prop('onChange')({ value: 'IBM_zos', label: 'IBM DB2 for z/OS' })});
        wrapper.update();

        
        const addTableButton = wrapper.find(Button).filterWhere(btn => btn.props().id === `addSourceTable`)
        addTableButton.simulate('click');
        wrapper.update();
        
        const validatedInputs = wrapper.find(ValidatedInput);
        const taskNameInput = validatedInputs.filterWhere(input => input.props().id === `mdiTaskName`);
        const userNameInput = validatedInputs.filterWhere(input => input.props().id === `dbUserName`);
        const passwordInput = validatedInputs.filterWhere(input => input.props().id === `dbPassword`);
        const serevrInput = validatedInputs.filterWhere(input => input.props().id === `dbServer`);
        const portInput = validatedInputs.filterWhere(input => input.props().id === `dbPort`);
        const dbLocationInput = validatedInputs.filterWhere(input => input.props().id === `dbLocation`);
        const schemaNameInput = validatedInputs.filterWhere(input => input.props().id === `dbSchemaName`);
        act(() => {
            taskNameInput.prop('onBlur')({target:{value:'test-task'}});
            userNameInput.prop('onBlur')({target:{value:'test-user'}});
            passwordInput.prop('onBlur')({target:{value:'test-password'}});
            serevrInput.prop('onBlur')({target:{value:'test-server.com'}});
            portInput.prop('onBlur')({target:{value:3700}});
            dbLocationInput.prop('onBlur')({target:{value:'Db120'}});
            schemaNameInput.prop('onBlur')({target:{value:'test-schema'}});
        });
        wrapper.update();
        const tableNameInput = wrapper.find(ValidatedInput).filterWhere(input => input.props().id === `dbTableName`);
        act(() => {
            tableNameInput.prop('onBlur')({target:{value:'TEST-TABLE'}});
        })
        wrapper.update();
        const openAdvancedSettingsButton = wrapper.find(Button).filterWhere(btn => btn.props().id === `openadvancesettings`)
        openAdvancedSettingsButton.simulate('click');
        wrapper.update();
        const checkbox = wrapper.find(Form.Check).filterWhere(checkbox => checkbox.props().id === 'schedule');
        act(() => {
            checkbox.prop('onClick')(false);
        })
        wrapper.update();
        const frequencySelector = wrapper.find(Select).filterWhere(select => select.props().id === `frequency`);
        act(() => {frequencySelector.prop('onChange')({ value: 'daily', label: 'Daily' })});
        wrapper.update();
        const checkbox1 = wrapper.find(Form.Check).filterWhere(checkbox1 => checkbox1.props().id === 'schedule');
        act(() => {
            checkbox1.prop('onClick')(false);
        })
        wrapper.update();
        const createTaskButton = wrapper.find({children: "Create Task"}).at(0);
        createTaskButton.simulate('click');
        wrapper.update();
        const toast = wrapper.find(Toast); 
        expect(toast.props().hidden).toEqual(true);
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        wrapper.update();
        const createParams = {
            "credentials": "same-origin",
            "headers": {"Content-Type": "application/json"}, "method": "POST",
            "body": JSON.stringify(managedTaskBodyRaw)
        };
        expect(fetch).toHaveBeenCalledWith(`/api/managedtasks/`, createParams);    
    });

    it('verify component removes source table ', () => {
        const wrapper = mount(<WorkflowTaskForm dataset={rawDataset} setCreatingTask={() => true} setRefreshTasks={() => false}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();
        const dbTypeSelector = wrapper.find(Select).filterWhere(select => select.props().id === `dbTypeSelector`);
        act(() => {dbTypeSelector.prop('onChange')({ value: 'IBM_zos', label: 'IBM DB2 for z/OS' })});
        wrapper.update();
        const addTableButton = wrapper.find(Button).filterWhere(btn => btn.props().id === `addSourceTable`)
        addTableButton.simulate('click');
        wrapper.update();
        const sourceTables = wrapper.find(Accordion).filterWhere(accordion => accordion.props().id === 'sourceTableAccordion');
        expect(sourceTables.props().items.length).toEqual(1);
        expect(sourceTables.length).toEqual(1);
        
        const removeButton = wrapper.find(Button).at(2);
        removeButton.simulate('click');
        wrapper.update();
        const yes = wrapper.find(Button).filterWhere(button => button.props().variant === 'primary').at(0);
        yes.simulate('click');
        wrapper.update();
        const accordian = wrapper.find(Accordion).filterWhere(accordion => accordion.props().id === 'sourceTableAccordion');
        expect(accordian.length).toEqual(0);
      })

      it('verify add source table is disabled after one item is added ', () => {
        const wrapper = mount(<WorkflowTaskForm dataset={testDataset} setCreatingTask={() => false} copyingTask = {false} setCopyingTask={() => false}  setRefreshTasks={() => false}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();
        const sourceSchemaOptions = testDataset.schemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
        const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
        act(() => {sourceSchemaSelector.prop('onChange')(sourceSchemaOptions[0])});
        wrapper.update();
        const dbTypeSelector = wrapper.find(Select).filterWhere(select => select.props().id === `dbTypeSelector`);
        act(() => {dbTypeSelector.prop('onChange')({ value: 'IBM_zos', label: 'IBM DB2 for z/OS' })});
        wrapper.update();
        const addTableButton = wrapper.find(Button).filterWhere(btn => btn.props().id === `addSourceTable`)
        addTableButton.simulate('click');
        wrapper.update();
        const addButton = wrapper.find(Button).filterWhere(btn => btn.props().id === `addSourceTable`)
        expect(addButton.props().disabled).toEqual(true);
      })

      it('should call fetch api on click of configure MDI button', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={testDataset} setCreatingTask={() => true} setRefreshTasks={() => false}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
        wrapper.update();

        const sourceSchemaOptions = testDataset.schemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
        const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
        act(() => {sourceSchemaSelector.prop('onChange')(sourceSchemaOptions[0])});
        wrapper.update();

        const dbTypeSelectorControl = wrapper.find(Select).filterWhere(c => c.props().id === 'dbTypeSelector');
        act(() => {dbTypeSelectorControl.prop('onChange')({ value: 'aws postgres rds', label: 'AWS Postgres RDS' })});
        wrapper.update();

        const awsAccountNo = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountNo');
        const awsAccountName = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountName');
        const awsAccountRegion = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountRegion');
        const awsAccountVPC = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountVPC');
        act(() => {
            awsAccountName.prop('onBlur')({target:{value:'jdus01ghnscloudcoreinfrastructure'}});
            awsAccountNo.prop('onBlur')({target:{value:'362024894964'}});
            awsAccountRegion.prop('onBlur')({target:{value:'us-east-2'}});
            awsAccountVPC.prop('onBlur')({target:{value:'us-east-2'}});
        });
        wrapper.update();
        const configureMDIButton = wrapper.find({children: "Configure MDI"}).at(0);
        configureMDIButton.simulate('click');
        wrapper.update();
        const body = {
            "datatype": "testDataset",
            "representation": "schema1.test@0.0.1",
            "source": "aws postgres rds",
            "phase": "enhance",
            "awsAccountNumber": "362024894964",
            "awsAccountName": "jdus01ghnscloudcoreinfrastructure",
            "awsAccountRegion": "us-east-2",
            "awsVpcId": "us-east-2",
            "isUpdate":true
          };
        const createParams = {
            credentials: 'same-origin',
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
            'Content-Type': 'application/json'
          }
        };
        expect(fetch).toHaveBeenCalledWith(`/api/configure-mdi`, createParams);   
    });

      it('should call fetch api on click of configure MDE button', async () => {
        const wrapper = mount(<WorkflowTaskForm dataset={testDataset} setCreatingTask={() => true} setRefreshTasks={() => false}/>);
        const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
        act(() => {actionSelector.prop('onChange')({ value: 'managed egress', label: 'managed egress' })});
        wrapper.update();

        const sourceSchemaOptions = testDataset.schemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
        const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
        act(() => {sourceSchemaSelector.prop('onChange')(sourceSchemaOptions[0])});
        wrapper.update();

          const dbTypeSelectorControl = wrapper.find(Select).filterWhere(c => c.props().id === 'dbTypeSelector');
          act(() => {
              dbTypeSelectorControl.prop('onChange')({value: 'aws postgres rds', label: 'AWS Postgres RDS'})
          });
          wrapper.update();

          const awsAccountNo = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountNo');
          const awsAccountName = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountName');
          const awsAccountRegion = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountRegion');
          const awsAccountVPC = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountVPC');
          const awsSubnetIDs = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'subnetIDs');
          const awsSubnetAZ = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'subnetAvailabilityZoneID');
          const rdsIPAddress = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'ipAddress');
          const rdsPort = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'rdsPort');
          const rdsEndpoint = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'rdsEndpoint');
          act(() => {
              awsAccountName.prop('onBlur')({target: {value: 'jdus01ghnscloudcoreinfrastructure'}});
              awsAccountNo.prop('onBlur')({target: {value: '362024894964'}});
              awsAccountRegion.prop('onBlur')({target: {value: 'us-east-2'}});
              awsAccountVPC.prop('onBlur')({target: {value: 'vpc-2'}});
              awsSubnetAZ.prop('onBlur')({target: {value: 'us-east-2a'}});
              awsSubnetIDs.prop('onBlur')({target: {value: 'subnet-1'}});
              rdsIPAddress.prop('onBlur')({target: {value: '10.5.14.15'}});
              rdsPort.prop('onBlur')({target: {value: '5432'}});
              rdsEndpoint.prop('onBlur')({target: {value: 'abs.com'}});
          });
          wrapper.update();
        const configureMDEButton = wrapper.find({children: "Configure MDE"}).at(0);
        configureMDEButton.simulate('click');
        wrapper.update();
        const createParams = {
            credentials: 'same-origin',
            method: 'GET',
            headers: {
            'Content-Type': 'application/json'
          }
        };
        expect(fetch).toHaveBeenCalledWith(`/api/mds-status?accountNumber=362024894964&rdsIpAddress=10.5.14.15`, createParams);
    });
    it('should show all trigger options and only aws db types for managed egress', async () => {
      const wrapper = mount(<WorkflowTaskForm dataset={testDataset} setCreatingTask={() => true} setRefreshTasks={() => false}/>);
      const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
      act(() => {actionSelector.prop('onChange')({ value: 'managed egress', label: 'managed egress' })});
      const dataIngestedTrigger = { value: "data ingested", label: "data ingested" };
      const triggerSelector = wrapper.find(Select).filterWhere(select => select.props().id === `triggerSelector`);
      expect(triggerSelector.props().value).toEqual(dataIngestedTrigger);
      wrapper.update();

      const sourceSchemaOptions = testDataset.schemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
      const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
      act(() => {sourceSchemaSelector.prop('onChange')(sourceSchemaOptions[0])});
      wrapper.update();

      const dbTypeSelectorControl = wrapper.find(Select).filterWhere(c => c.props().id === 'dbTypeSelector');
      act(() => {dbTypeSelectorControl.prop('onChange')({ value: 'aws postgres rds', label: 'AWS Postgres RDS' })});
      wrapper.update();

      const configureMDEButton = wrapper.find({children: "Configure MDE"}).at(0);
      expect(configureMDEButton.prop('disabled')).toBe(true);

      const awsAccountNo = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountNo');
      const awsAccountName = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountName');
      const awsAccountRegion = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountRegion');
      const awsAccountVPC = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountVPC');
      const awsSubnetIDs = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'subnetIDs');
      const awsSubnetAZ = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'subnetAvailabilityZoneID');
      const rdsIPAddress = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'ipAddress');
      const rdsPort = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'rdsPort');
      const rdsEndpoint = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'rdsEndpoint');
      act(() => {
        awsAccountName.prop('onBlur')({target:{value:'jdus01ghnscloudcoreinfrastructure'}});
        awsAccountNo.prop('onBlur')({target:{value:'362024894964'}});
        awsAccountRegion.prop('onBlur')({target:{value:'us-east-2'}});
        awsAccountVPC.prop('onBlur')({target:{value:'vpc-2'}});
        awsSubnetAZ.prop('onBlur')({target:{value:'us-east-2a'}});
        awsSubnetIDs.prop('onBlur')({target:{value:'subnet-1'}});
        rdsIPAddress.prop('onBlur')({target:{value:'10.5.14.15'}});
        rdsPort.prop('onBlur')({target:{value:'5432'}});
        rdsEndpoint.prop('onBlur')({target:{value:'abs.com'}});
      });
      wrapper.update();
      const configureMDEButtonEnabled = wrapper.find({children: "Configure MDE"}).at(0);
      expect(configureMDEButtonEnabled.prop('disabled')).toBe(false);
    });

    it('create Task button should be disabled if testConnection fails to create endpoint', async () => {
      const wrapper = mount(<WorkflowTaskForm dataset={testDataset} setCreatingTask={() => true} setRefreshTasks={() => false} showConfigureMDI={() => true}/>);
      const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
      act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
      wrapper.update();

      const sourceSchemaOptions = testDataset.schemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
      const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
      act(() => {sourceSchemaSelector.prop('onChange')(sourceSchemaOptions[0])});
      wrapper.update();

      const dbTypeSelectorControl = wrapper.find(Select).filterWhere(c => c.props().id === 'dbTypeSelector');
      act(() => {dbTypeSelectorControl.prop('onChange')({ value: 'aws postgres rds', label: 'AWS Postgres RDS' })});
      wrapper.update();

      const awsAccountNo = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountNo');
      const awsAccountName = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountName');
      const awsAccountRegion = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountRegion');
      const awsAccountVPC = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountVPC');
      act(() => {
        awsAccountName.prop('onBlur')({target:{value:'devl'}});
        awsAccountNo.prop('onBlur')({target:{value:'123456789012'}});
        awsAccountRegion.prop('onBlur')({target:{value:'us-east-1'}});
        awsAccountVPC.prop('onBlur')({target:{value:'vpc-882698ef'}});
      });
      wrapper.update();
      const configureMDIButton = wrapper.find({children: "Configure MDI"}).at(0);
      configureMDIButton.simulate('click');
      wrapper.update();

      const dbTaskName = wrapper
        .find(ValidatedInput)
        .filterWhere((c) => c.props().id === "mdiTaskName");
      const dbUserNameControl = wrapper
        .find(ValidatedInput)
        .filterWhere((c) => c.props().id === "dbUserName");
      const dbPasswordControl = wrapper
        .find(ValidatedInput)
        .filterWhere((c) => c.props().id === "dbPassword");
      const dbServerControl = wrapper
        .find(ValidatedInput)
        .filterWhere((c) => c.props().id === "dbServer");
      const dbPortControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbPort');
      const dbLocationControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbLocation');

      act(() => {
        dbTaskName.prop('onBlur')({target:{value:'task-name'}});
        dbUserNameControl.prop('onBlur')({target:{value:'test-user'}});
        dbPasswordControl.prop('onBlur')({target:{value:'test-password'}});
        dbServerControl.prop('onBlur')({target:{value:'test-server.com'}});
        dbPortControl.prop('onBlur')({target:{value:3700}});
        dbLocationControl.prop('onBlur')({target:{value:'Db120'}});
      });

      wrapper.update();
      const testConnectionButton = wrapper.find({children: "Test Connection"}).at(0);
      expect(testConnectionButton.props().disabled).toEqual(false);
      fetch.mockImplementationOnce(() =>
        Promise.resolve({
          json: () => Promise.resolve({ status: 500}),
        }));
      testConnectionButton.simulate('click');
      const body = {
        db_details: {
          server: "test-server.com",
          username: "test-user",
          password: "test-password",
          port: 3700,
          database: "Db120",
        },
        datatype: "testDataset",
        representation: "schema1.test@0.0.1",
        source: "aws postgres rds",
        taskName: "task-name",
        isUpdate: false,
        sourceEndPoint: "",
        targetEndPoint: "",
        awsAccountRegion: "us-east-1",
        awsAccountNo: "123456789012",
        phase: "enhance",
      };
      const createParams = {
        credentials: 'same-origin',
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json'
        }
      };
      expect(fetch).toHaveBeenCalledWith(`/api/create-endpoint`, createParams);
      const createTaskButton = wrapper.find({children: "Create Task"}).at(0);
      expect(createTaskButton.props().disabled).toEqual(true);
    });

    it('create Task button should be disabled if testConnection fails to test endpoint', async () => {
      const wrapper = mount(<WorkflowTaskForm dataset={testDataset} setCreatingTask={() => true} setRefreshTasks={() => false} showConfigureMDI={() => true}/>);
      const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
      act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
      wrapper.update();

      const sourceSchemaOptions = testDataset.schemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
      const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
      act(() => {sourceSchemaSelector.prop('onChange')(sourceSchemaOptions[0])});
      wrapper.update();

      const dbTypeSelectorControl = wrapper.find(Select).filterWhere(c => c.props().id === 'dbTypeSelector');
      act(() => {dbTypeSelectorControl.prop('onChange')({ value: 'aws postgres rds', label: 'AWS Postgres RDS' })});
      wrapper.update();

      const awsAccountNo = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountNo');
      const awsAccountName = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountName');
      const awsAccountRegion = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountRegion');
      const awsAccountVPC = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'awsAccountVPC');
      act(() => {
        awsAccountName.prop('onBlur')({target:{value:'devl'}});
        awsAccountNo.prop('onBlur')({target:{value:'123456789012'}});
        awsAccountRegion.prop('onBlur')({target:{value:'us-east-1'}});
        awsAccountVPC.prop('onBlur')({target:{value:'vpc-882698ef'}});
      });
      wrapper.update();
      const configureMDIButton = wrapper.find({children: "Configure MDI"}).at(0);
      configureMDIButton.simulate('click');
      wrapper.update();

      const dbTaskName = wrapper
      .find(ValidatedInput)
      .filterWhere((c) => c.props().id === "mdiTaskName");
      const dbUserNameControl = wrapper
      .find(ValidatedInput)
      .filterWhere((c) => c.props().id === "dbUserName");
      const dbPasswordControl = wrapper
      .find(ValidatedInput)
      .filterWhere((c) => c.props().id === "dbPassword");
      const dbServerControl = wrapper
      .find(ValidatedInput)
      .filterWhere((c) => c.props().id === "dbServer");
      const dbPortControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbPort');
      const dbLocationControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbLocation');

      act(() => {
        dbTaskName.prop('onBlur')({target:{value:'task-name'}});
        dbUserNameControl.prop('onBlur')({target:{value:'test-user'}});
        dbPasswordControl.prop('onBlur')({target:{value:'test-password'}});
        dbServerControl.prop('onBlur')({target:{value:'test-server.com'}});
        dbPortControl.prop('onBlur')({target:{value:3700}});
        dbLocationControl.prop('onBlur')({target:{value:'Db120'}});
      });

      wrapper.update();
      const testConnectionButton = wrapper.find({children: "Test Connection"}).at(0);
      expect(testConnectionButton.props().disabled).toEqual(false);
      fetch.mockResponses(
        [
          JSON.stringify([{ name: 'naruto', average_score: 79 }]),
          { status: 200 }
        ],
        [
          JSON.stringify([{ name: 'bleach', average_score: 68 }]),
          { status: 500 }
        ]
      )
      testConnectionButton.simulate('click');
      const body = {
        "db_details": {
          "server": "test-server.com",
          "username": "test-user",
          "password": "test-password",
          "port": 3700,
          "database": "Db120"
        },
        "datatype": "testDataset",
        "representation": "schema1.test@0.0.1",
        "source": "aws postgres rds",
        "taskName": "task-name",
        "isUpdate": false,
        "sourceEndPoint": "",
        "targetEndPoint": "",
        "awsAccountRegion": "us-east-1",
        "awsAccountNo": "123456789012",
        "phase": "enhance"
      };
      const createParams = {
        credentials: 'same-origin',
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json'
        }
      };
      expect(fetch).toHaveBeenCalledWith(`/api/create-endpoint`, createParams);

      const createTaskButton = wrapper.find({children: "Create Task"}).at(0);

      expect(createTaskButton.props().disabled).toEqual(true);
    });

    it('should render properly', async () => {
      const wrapper = mount(<WorkflowTaskForm dataset={testDataset} setCreatingTask={() => true} setRefreshTasks={() => false} showConfigureMDI={() => true}/>);
      const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
      act(() => {actionSelector.prop('onChange')({ value: 'managed egress', label: 'managed egress' })});
      wrapper.update();

      const sourceSchemaOptions = testDataset.schemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
      const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
      act(() => {sourceSchemaSelector.prop('onChange')(sourceSchemaOptions[0])});
      wrapper.update();

      const dbTypeSelectorControl = wrapper.find(Select).filterWhere(c => c.props().id === 'dbTypeSelector');
      act(() => {dbTypeSelectorControl.prop('onChange')({ value: 'aws postgres rds', label: 'AWS Postgres RDS' })});
      wrapper.update();

      const dbUserNameControl = wrapper.find(ValidatedInput).filterWhere((c) => c.props().id === "dbUserName");
      const dbPasswordControl = wrapper.find(ValidatedInput).filterWhere((c) => c.props().id === "dbPassword");
      const dbLocationControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbLocation');
      const taskNameInput = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'mdiTaskName');
      const serevrInput = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbServer');
      const portInput = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'dbPort');
      expect(dbUserNameControl.props().id).toBeDefined()
      expect(dbPasswordControl.props().id).toBeDefined()
      expect(dbLocationControl.props().id).toBeDefined()
      expect(taskNameInput.length).toEqual(0);
      expect(serevrInput.length).toEqual(0);
      expect(portInput.length).toEqual(0);
      console.log(wrapper.debug())
    });

    it('should put UDTF when taskname and db2 config details are filled' , async () => {
      const wrapper = mount(<WorkflowTaskForm dataset={rawDataset} setCreatingTask={() => true} setRefreshTasks={() => false} enableManagedIngestTask={true}/>);
      const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
      act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
      wrapper.update();

      const dbTypeSelector = wrapper.find(Select).filterWhere(select => select.props().id === `dbTypeSelector`);
      act(() => {dbTypeSelector.prop('onChange')({ value: 'IBM_zos', label: 'IBM DB2 for z/OS' })});
      wrapper.update();

      
      const addTableButton = wrapper.find(Button).filterWhere(btn => btn.props().id === `addSourceTable`)
      addTableButton.simulate('click');
      wrapper.update();
      
      const validatedInputs = wrapper.find(ValidatedInput);
      const taskNameInput = validatedInputs.filterWhere(input => input.props().id === `mdiTaskName`);
      const userNameInput = validatedInputs.filterWhere(input => input.props().id === `dbUserName`);
      const passwordInput = validatedInputs.filterWhere(input => input.props().id === `dbPassword`);
      const serevrInput = validatedInputs.filterWhere(input => input.props().id === `dbServer`);
      const portInput = validatedInputs.filterWhere(input => input.props().id === `dbPort`);
      const dbLocationInput = validatedInputs.filterWhere(input => input.props().id === `dbLocation`);
      const schemaNameInput = validatedInputs.filterWhere(input => input.props().id === `dbSchemaName`);
      act(() => {
          taskNameInput.prop('onBlur')({target:{value:'test-task'}});
          userNameInput.prop('onBlur')({target:{value:'test-user'}});
          passwordInput.prop('onBlur')({target:{value:'test-password'}});
          serevrInput.prop('onBlur')({target:{value:'test-server.com'}});
          portInput.prop('onBlur')({target:{value:3700}});
          dbLocationInput.prop('onBlur')({target:{value:'Db230'}});
          schemaNameInput.prop('onBlur')({target:{value:'test-schema'}});
      });
      wrapper.update();
      const dbLocationControl = wrapper.find(Form.Label).filterWhere(c => c.props().dataTestId==='udtf-function-new');
      expect(dbLocationControl.props().children).toEqual('R4Z.R4Z2_CDC_UDTF__DB30');
    });

    it("should populate AWS details if it is AWS Copy Task and display two tables", async () => {
      const wrapper = mount(
        <WorkflowTaskForm
          dataset={testDataset}
          copyingTask={true}
          task={awsTaskCopy}
          setRefreshTasks={() => false}
          setCreatingTask={() => false}
          setCopyingTask={() => true} 
        />
      );

      wrapper.update();
      const actionSelector = wrapper.find(Select).filterWhere(select => select.props().id === `actionSelector`);
      act(() => {actionSelector.prop('onChange')({ value: 'managed ingest', label: 'managed ingest' })});
      wrapper.update();
      const sourceSchemaOptions = testDataset.schemas.map(({environmentName, name, version}) => ({value: `${environmentName}@${version}`, label: `${name}@${version}`}));
      const sourceSchemaSelector = wrapper.find(Select).filterWhere(select => select.props().id === `sourceSchemaSelector`);
      act(() => {sourceSchemaSelector.prop('onChange')(sourceSchemaOptions[0])});
      wrapper.update();
      const dbTypeSelector = wrapper.find(Select).filterWhere(select => select.props().id === `dbTypeSelector`);
      act(() => {dbTypeSelector.prop('onChange')({ value: 'IBM_zos', label: 'IBM DB2 for z/OS' })});
      wrapper.update();
      const sourceTables = wrapper.find(Accordion).filterWhere(accordion => accordion.props().id === 'sourceTableAccordion');
      expect(sourceTables.props().items.length).toEqual(2);
      expect(sourceTables.length).toEqual(1);
    })
});
