import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import WorkflowTaskRuns from '../../../components/workflow/WorkflowTaskRuns';
import { waitFor } from '@testing-library/react';
import { Spinner, Table } from "react-bootstrap";
import { getTask, getRunHistory } from '../../../apis/workflow';

jest.mock('../../../apis/workflow');

const egress_task = {
    "id": "2816f220-9844-4d68-b149-3cd914d3bc8c",
    "correlation_id": "f040b2aa-4039-43ef-a4c1-a60c8a0f77dc",
    "created": "2023-07-17T05:43:34.946Z",
    "created_by": "0oal4x8vrfWNnqRav0h7",
    "delete_indicator": 0,
    "event_hash": "b43203cdc1474d95d17aa29effd610f1",
    "modified": "2023-07-17T05:43:34.946Z",
    "task_definition": {
     "source": {
      "dataType": "com.deere.enterprise.datalake.enhance.egresstest",
      "representation": "com.deere.enterprise.datalake.enhance.egress@1.0.0"
     },
     "trigger": {
      "dbDetails": {
       "accountNumber": "362024894964",
       "database": "RdsPostgreSql",
       "dbType": "aws postgres rds",
       "dbUser": "postgres",
       "ipAddress": "10.187.7.217",
       "password": "abc123",
       "region": "test",
       "server": "jdbc:postgresql://postgresqlrds.cn2xcmyfqfwi.us-east-1.rds.amazonaws.com/RdsPostgreSql"
      },
      "event": "managed_egress_request",
      "metadata": {
       "destinationTable": "public.egressTest",
       "fullLoadCompleted": false,
       "ingestType": "FULL_LOAD",
       "phase": "enhance"
      }
     }
    },
    "task_hash": "28fa0739d55c04f4fbae1b6f4bbb77d3"
};

const taskDetailFileType = {
    id: "2816f220-9844-4d68-b149-3cd914d3bc8c",
    correlation_id: "08eb8322-a05a-4c45-835e-eb3476428ad6",
    task_definition: {
        trigger: { 
            event:"managed_ingest_request",
            metadata: {            
                phase: "raw",
                sourceDBType: "Sharepoint",
                sharepoint_details: {                
                    tenantId: "39b03722-b836-496a-85ec-850f0957ca6b",
                    displayType: "file",
                    siteUrl: "https://deere.sharepoint.com/sites/aeops",
                    sourceFiles: "/sites/aeops/Shared Documents/AWS Budget/AWS_Budget_Notifications.xlsx,/sites/aeops/Shared Documents/AWS Budget/EDLBudgetReset.xlsx",
                    docFolder: "Documents"
                }
            }
        }
    },
    source: {          
            representation:"",
            dataType:"com.deere.enterprise.datalake.raw.abc_publish_testing"
            },
    created_by: "0oab61no9hmKkuuMA0h7",
    created: "2022-01-31T12:41:08.754Z",
    task_hash: "923bacc702a658edae3d138cbfa373ae",
    delete_indicator:"0",
    modified: "2022-01-31T12:41:08.754Z",
    event_hash: "7000cc87af4efda702c4dde0623b3398"
  };
  const taskDetailListType = {
    id: "2816f220-9844-4d68-b149-3cd914d3bc8c",
    correlation_id: "08eb8322-a05a-4c45-835e-eb3476428ad6",
    task_definition: {
        trigger: { 
            event:"managed_ingest_request",
            metadata: {            
                phase: "raw",
                sourceDBType: "Sharepoint",
                sharepoint_details: {                
                    tenantId: "39b03722-b836-496a-85ec-850f0957ca6b",
                    displayType: "list",
                    siteUrl: "https://deere.sharepoint.com/sites/aeops",
                    sourceFiles: "Form Templates,Links,SNOW Map",
                    docFolder: ""
                }
            }
        }
    },
    source: {          
            representation:"",
            dataType:"com.deere.enterprise.datalake.raw.abc_publish_testing"
            },
    created_by: "0oab61no9hmKkuuMA0h7",
    created: "2022-01-31T12:41:08.754Z",
    task_hash: "923bacc702a658edae3d138cbfa373ae",
    delete_indicator:"0",
    modified: "2022-01-31T12:41:08.754Z",
    event_hash: "7000cc87af4efda702c4dde0623b3398"
  };  
const runs = [
  {
    id: "bb7a7f01-02cc-4c33-b582-15910cc50ba6",
    correlation_id: "920cef67-c3c6-4180-9cba-2cdebdf083e9",
    task_id: "2816f220-9844-4d68-b149-3cd914d3bc8c",
    request_id:"bb7a7f01-02cc-4c33-b582-15910cc50ba6",
    created_by: "0oab61no9hmKkuuMA0h7",
    errors: "",
    status:"COMPLETE",
    created: "2022-02-21T13:27:37.024Z",
    modified:"2022-02-21T13:29:17.580Z"
  },
  {
    id: "sdsad-02cc-4c33-b582-15910cc50ba6",
    correlation_id: "920cef67-c3c6-4180-9cba-2cdebdf083e9",
    task_id: "2816f220-9844-4d68-b149-3cd914d3bc8c",
    request_id:"bb7a7f01-02cc-4c33-b582-15910cc50ba6",
    created_by: "0oab61no9hmKkuuMA0h7",
    errors: "",
    status:"FAIL",
    created: "2022-02-21T13:27:37.024Z",
    modified:"2022-02-21T13:29:17.580Z"
  }     
];
const mockTask = (runTask) => getTask.mockResolvedValue({ok: true, json: async () => runTask});
const mockRun = (runDetail) => getRunHistory.mockResolvedValue({ ok: true, json: async () => runDetail });

const datasetId = 'f28ed6e6-5e4f-4e73-b204-b00b5b1cf777';
const taskId ='2816f220-9844-4d68-b149-3cd914d3bc8c';

configure({ adapter: new Adapter() });

describe('WorkflowTasks Runs tests', () => {
  beforeEach(() => {
    getTask.mockResolvedValue({ok: true, json: async () => {}});
    getRunHistory.mockResolvedValue({ok: true, json: async () => []});
  });

  it('should render a component with a loading spinner', () => {
      const wrapper = shallow(<WorkflowTaskRuns taskId={taskId} datasetId={datasetId} />);
      const spinner = wrapper.find(Spinner).filterWhere(spinner => spinner.props().id === 'loading').text();
      expect(spinner).toEqual('Loading...');
  });
    
  it('should render a component with no runs after no run history are returned', async () => {
    mockTask(taskDetailListType);    
    mockRun([]);
    const wrapper = mount(<WorkflowTaskRuns taskId={taskId} datasetId={datasetId} />);
    await waitFor(() => expect(getRunHistory).toHaveBeenCalledTimes(1));
    wrapper.update();
    const text = wrapper.find('div').filterWhere(div => div.props().id === 'emptyResponse').text();
    expect(text).toEqual('No run history found for this task.');
  });

  it('should call workflow api to getTask detail', async () => {
    const wrapper = mount(<WorkflowTaskRuns taskId={taskId} datasetId={datasetId} />);
    await waitFor(() => expect(getTask).toHaveBeenCalledTimes(1));
    expect(getTask).toHaveBeenCalled();
  });

  it('should call workflow api to getRunHistory detail', async () => {
    const wrapper = mount(<WorkflowTaskRuns taskId={taskId} datasetId={datasetId} />);
    await waitFor(() => expect(getRunHistory).toHaveBeenCalledTimes(1));
    expect(getRunHistory).toHaveBeenCalled();
  });

  it('should contain Sharepoint detail of list type', async () => {
    mockTask(taskDetailListType);
    const wrapper = mount(<WorkflowTaskRuns taskId={taskId} datasetId={datasetId} />);
    await waitFor(() => expect(getTask).toHaveBeenCalledTimes(1));
    wrapper.update();
    const sourceFiles = taskDetailListType.task_definition.trigger.metadata.sharepoint_details.sourceFiles;
    const siteUrl = taskDetailListType.task_definition.trigger.metadata.sharepoint_details.siteUrl;
    //expect(wrapper.text()).toContain(`Sharepoint Lists: ${sourceFiles}`);
    expect(wrapper.text().includes(`Location: ${siteUrl}`)).toBeTruthy();
    expect(wrapper.text().includes(`Sharepoint Lists: ${sourceFiles}`)).toBeTruthy();
  });

  it('should contain Sharepoint detail of file type', async () => {
    mockTask(taskDetailFileType);
    const wrapper = mount(<WorkflowTaskRuns taskId={taskId} datasetId={datasetId} />);
    await waitFor(() => expect(getTask).toHaveBeenCalledTimes(1));
    wrapper.update();
    const docFolder = taskDetailFileType.task_definition.trigger.metadata.sharepoint_details.docFolder;
    const siteUrl = taskDetailFileType.task_definition.trigger.metadata.sharepoint_details.siteUrl;
    //expect(wrapper.text()).toContain(`Document Library: ${docFolder}`);
    expect(wrapper.text().includes(`Location: ${siteUrl}`)).toBeTruthy();
    expect(wrapper.text().includes(`Document Library: ${docFolder}`)).toBeTruthy();
  });

  it('should display the correct number of runs from backend', async () => {
    mockTask(taskDetailListType);    
    mockRun(runs);
    const wrapper = mount(<WorkflowTaskRuns taskId={taskId} datasetId={datasetId} />);
    await waitFor(() => expect(getRunHistory).toHaveBeenCalledTimes(1));
    wrapper.update();
    const noRows = wrapper.find(Table).find('tbody').find('tr');
    expect(noRows).toHaveLength(runs.length);
  });

  it('should contain some MDE Task details', async () => {
    mockTask(egress_task);
    const wrapper = mount(<WorkflowTaskRuns taskId={taskId} datasetId={datasetId} />);
    await waitFor(() => expect(getTask).toHaveBeenCalledTimes(1));
    wrapper.update();
    const trigger = egress_task.task_definition.trigger.event
    const schema = egress_task.task_definition.source.representation
    const targetTable = egress_task.task_definition.trigger.metadata.destinationTable
    expect(wrapper.text().includes(`Trigger: ${trigger}`)).toBeTruthy();
    expect(wrapper.text().includes(`EDL Schema: ${schema}`)).toBeTruthy();
    expect(wrapper.text().includes(`Table: ${targetTable}`)).toBeTruthy();
  });

});
