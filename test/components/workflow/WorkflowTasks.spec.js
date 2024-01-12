import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import WorkflowTasks from '../../../components/workflow/WorkflowTasks';
import { waitFor } from '@testing-library/react';
import Accordion from "../../../components/Accordion";
import { Card, Spinner, Button} from "react-bootstrap";
import ConfirmationModal from '../../../components/ConfirmationModal';
import { getDataset } from '../../../apis/datasets';
import { getTasks, deleteTask, isManagedIngest, runTaskAdhoc } from '../../../apis/workflow';
import { Dropdown } from "@deere/ux.uxframe-react";


jest.mock('../../../apis/datasets');
jest.mock('../../../apis/workflow');

const tasks = require('./WorkflowTasksSampleTasks.json');
const mockTask = () => getTasks.mockResolvedValue({ ok: true, json: async () => tasks });

const [expectedFirstTask] = tasks;
const { task_definition } = expectedFirstTask;
const complexTask = {
    correlation_id: "af87c754-afcf-4003-a6c3-2f675b685a03",
    task_definition: {
      destination: {
        dataType: "com.deere.enterprise.datalake.enhance.demo_marvel_comic_characters_anon"
      },
      action: {
        operation: {
          name: "anonymization",
          options: {
            fields: [
              {
                name: "anyName",
                format: "pystr",
                seeded: false,
                parameters: {
                  max_chars: 30
                }
              },
              {
                name: "SSN",
                format: "string",
                seeded: true
              }
            ]
          }
        },
        service: "transform"
      },
      trigger: {
        event: "async_ingest_request"
      },
      source: {
        representation: "com.deere.enterprise.datalake.enhance.test_table_name_brian@0.0.1",
        dataType: "com.deere.enterprise.datalake.enhance.demo.marvel.ComicCharacters"
      }
    },
    created_by: "0oap5oqiynKpjlObm0h7",
    created: "2020-03-30T06:24:08.079Z",
    task_hash: "d55d16512a27d67c77c95e69b2891959",
    id: "c93b8d83-f44c-448e-9b7f-32931ba52af6",
    delete_indicator: 0,
    modified: "2020-03-30T06:24:08.079Z",
    event_hash: "668b45e8f9dbfc8724c89b95a94e4546"
  }

const managedEgressTask = {
  "id": "mde-id",
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

const managedIngestRequest = {
      "id": "d78eb7af-1e15-44a1-9d27-7642fd49b9bf",
      "correlation_id": "50519f36-7cf7-467a-a24a-4b923f370518",
      "created": "2023-06-09T15:50:51.280Z",
      "created_by": "0oabs575rrRTgPtuE1t7",
      "delete_indicator": 0,
      "event_hash": "b65df3f7096ec439ef39bb9b9a8caefb",
      "modified": "2023-06-09T15:50:51.280Z",
      "task_definition": {
      "source": {
        "dataType": "com.deere.enterprise.datalake.raw.test_mdi_replication_raw",
        "representation": ""
      },
      "trigger": {
        "event": "managed_ingest_request",
        "metadata": {
        "contentEncoding": "snappy",
        "contentType": "parquet/binary",
        "database": "DB239",
        "delimiter": ",",
        "ingestType": "FULL_LOAD",
        "isView": false,
        "phase": "raw",
        "server": "db2t.deere.com",
        "sourceDBType": "IBM_zos",
        "sourceTable": "ADVACTT.ACCT_MISC_INFO_TBL",
        "taskName": "RMTESTPRODISSUE0609",
        "transform": "parquet"
        }
      }
      },
      "task_hash": "30a1cd04a9103ced6426b14ebcd81280"
 }
const mockEgressTask = () =>  getTasks.mockResolvedValue({ ok: true, json: async () => [managedEgressTask] });
const mockmanagedIngestRequest = () => getTasks.mockResolvedValue({ ok: true, json: async () => [managedIngestRequest] });
const mockComplexTask = () => getTasks.mockResolvedValue({ ok: true, json: async () => [complexTask] });
const datasetId = 'fake-datasetId';
const groups =['fake-group1', 'fake-group2'];

configure({ adapter: new Adapter() });

describe('WorkflowTasks tests', () => {
  beforeEach(() => {
    getDataset.mockResolvedValue({id: "fake-datasetId", custodian: "fake-group2", environmentName: "com.deere.enterprise.datalake.enhance.test_dataset", phase: { name:"Enhance" }});
    getTasks.mockResolvedValue({ ok: true, json: async () => []});
    deleteTask.mockResolvedValue({ok: true, text: async () => 'some-Id'});
    isManagedIngest.mockResolvedValue({ok: true, text: async () => {status: false}});
    runTaskAdhoc.mockResolvedValue({ok: true, json: async () => { message: "New Adhoc Run with taskID 9690127e-e9a1-4f80-b12d-694a3fd1be92 has been created successfully"}});
  });

  it('should render a component with a loading spinner', () => {
      const wrapper = shallow(<WorkflowTasks datasetId={datasetId} isCustodian = {true} />);
      const spinner = wrapper.find(Spinner).filterWhere(spinner => spinner.props().id === 'loading').text();
      expect(spinner).toEqual('Loading...');
  });

  it('should render a component with no workflow tasks after no tasks are returned', async () => {
    const wrapper = mount(<WorkflowTasks datasetId={datasetId} groups={groups} />);
    await waitFor(() => expect(getTasks).toHaveBeenCalledTimes(1));
    wrapper.update();
    const text = wrapper.find('div').filterWhere(div => div.props().id === 'emptyResponse').text();
    expect(text).toEqual('No tasks found for this dataset.');
});

  it('should call workflow api', async () => {
    const wrapper = mount(<WorkflowTasks datasetId={datasetId} groups={groups} />);
    await waitFor(() => expect(getTasks).toHaveBeenCalledTimes(1));
    expect(getTasks).toHaveBeenCalled();
  });

  it('should set modal when response from workflow is not an ok', async () => {
    const expectedErrorMessage = 'anyError';
    getTasks.mockResolvedValue({ ok: false, json: async () => ({ error: expectedErrorMessage })});

    const setModal = jest.fn();

    const wrapper = mount(<WorkflowTasks datasetId={datasetId} groups={groups} setModal={setModal} />);
    await waitFor(() => expect(getTasks).toHaveBeenCalledTimes(1));
    wrapper.update();

    const expectedErrorModal = {body: expectedErrorMessage};
    expect(setModal).toHaveBeenCalledWith(expectedErrorModal);
  });

  it('should set modal to error response when call to workflow api is rejected', async () => {
    const expectedErrorMessage = 'anyError';
    getTasks.mockResolvedValue({ ok: false, json: async () => ({ error: expectedErrorMessage })});

    const setModal = jest.fn();

    mount(<WorkflowTasks datasetId={datasetId} groups={groups} setModal={setModal} />);
    await waitFor(() => expect(getTasks).toHaveBeenCalledTimes(1));

    const expectedErrorModal = {body: expectedErrorMessage};
    expect(setModal).toHaveBeenCalledWith(expectedErrorModal);
  });

  it('should display the correct number of tasks from backend', async () => {
    mockTask();

    const wrapper = mount(<WorkflowTasks datasetId={datasetId} groups={groups} />);

    await waitFor(() => expect(getTasks).toHaveBeenCalledTimes(1));
    wrapper.update();

    const actualAccordion = wrapper.find(Accordion);
    expect(actualAccordion.props().items).toHaveLength(tasks.length);
  });

  it('should display correct task information from backend', async () => {
    mockTask();

    const wrapper = mount(<WorkflowTasks datasetId={datasetId} groups={groups} />);

    await waitFor(() => expect(getTasks).toHaveBeenCalledTimes(1));
    wrapper.update();

    const firstCard = wrapper.find(Card).filterWhere(card => card.props().id === expectedFirstTask.id).text();
    expect(firstCard.includes(task_definition.action.operation.name.toUpperCase())).toBeTruthy();
    expect(firstCard.includes(task_definition.source.representation)).toBeTruthy();
    expect(firstCard.includes(task_definition.trigger.event)).toBeTruthy();
    expect(firstCard.includes(task_definition.destination.dataType)).toBeTruthy();
  });

  it('should display correct complex task with fields from backend', async () => {
    mockComplexTask();

    const wrapper = mount(<WorkflowTasks datasetId={datasetId} groups={groups} />);

    await waitFor(() => expect(getTasks).toHaveBeenCalledTimes(1));
    wrapper.update();

    const firstCard = wrapper.find(Card).filterWhere(card => card.props().id === complexTask.id);
    const actualAllCols = firstCard.find("th")
    const actualAllRows = firstCard.find("tr")
    const actualAllCells = firstCard.find("td")

    expect(actualAllCols).toHaveLength(4);
    expect(actualAllCols.at(0).text()).toEqual("Name");

    expect(actualAllRows).toHaveLength(3);

    expect(actualAllCells).toHaveLength(8);
    expect(actualAllCells.at(0).text()).toEqual("anyName");
    expect(actualAllCells.at(3).text()).toEqual(JSON.stringify({max_chars:30}));
  });

  it('should default task info', async () => {
    getTasks.mockResolvedValue({ ok: true, json: async () => [{id: 'id'}]});

    const wrapper = mount(<WorkflowTasks datasetId={datasetId} groups={groups} />);

    await waitFor(() => expect(getTasks).toHaveBeenCalledTimes(1));
    wrapper.update();
    const firstCard = wrapper.find(Card).filterWhere(card => card.props().id === 'id').text();

    expect(firstCard.includes('Action: None')).toBeTruthy();
    expect(firstCard.includes('Source Schema: None')).toBeTruthy();
    expect(firstCard.includes('Trigger: None')).toBeTruthy();
    expect(firstCard.includes('Destination Dataset: None')).toBeTruthy();
  });

  it('should display egress task info', async () => {
    mockEgressTask()

    const wrapper = mount(<WorkflowTasks datasetId={datasetId} groups={groups} />);

    await waitFor(() => expect(getTasks).toHaveBeenCalledTimes(1));
    wrapper.update();
    const firstCard = wrapper.find(Card).filterWhere(card => card.props().id === 'mde-id').text();

    expect(firstCard.includes('Action: MANAGED EGRESS')).toBeTruthy();
    expect(firstCard.includes('Source Schema: com.deere.enterprise.datalake.enhance.egress@1.0.0')).toBeTruthy();
    expect(firstCard.includes('Database Type: aws postgres rds')).toBeTruthy();
    expect(firstCard.includes('Destination Table: public.egressTest')).toBeTruthy();
    expect(firstCard.includes('Ingest Type: FULL_LOAD')).toBeTruthy();
  });

  it('should hide delete task if not custodian', async () => {
    mockComplexTask();
    const groups =['non-custodian-group1', 'non-custodian-group2'];

    const wrapper = mount(<WorkflowTasks datasetId={datasetId} groups={groups} />);

    await waitFor(() => expect(getTasks).toHaveBeenCalledTimes(1));
    wrapper.update();
    const deleteButton = wrapper.find(Dropdown.Menu).props().children.find(button => !!button.props && button.props.id === `delete-task-${complexTask.id}`)

    expect(deleteButton.props.hidden).toBeTruthy();
  });

  it('should not hide delete task if custodian', async () => {
    mockComplexTask();
    const wrapper = mount(<WorkflowTasks datasetId={datasetId} groups={groups} />);
    await waitFor(() => expect(getTasks).toHaveBeenCalledTimes(1));
    wrapper.update();
    const deleteButton = wrapper.find(Dropdown.Menu).props().children.find(button => !!button.props && button.props.id === `delete-task-${complexTask.id}`)
    expect(deleteButton.props.hidden).toBeFalsy();
  });

  it('should have confirmation modal if delete', async () => {

    mockComplexTask();
    const wrapper = mount(<WorkflowTasks datasetId={datasetId} groups={groups}/>);
    await waitFor(() => expect(getTasks).toHaveBeenCalledTimes(1));
    wrapper.update();
    const deleteButton = wrapper.find(Dropdown.Menu).props().children.find(button =>!!button.props && button.props.id === `delete-task-${complexTask.id}`)
    deleteButton.props.onClick();
    wrapper.update();
    const confirmationModal = wrapper.find(ConfirmationModal).filterWhere(modal => modal.props().id === 'workflow-tasks-confirmation');
    expect(confirmationModal.props().show).toBeTruthy();
  });

  it('should call delete task api when modal accept', async () => {

    mockComplexTask();
    const wrapper = mount(<WorkflowTasks datasetId={datasetId} groups={groups} />);
    await waitFor(() => expect(getTasks).toHaveBeenCalledTimes(1));
    wrapper.update();
    const deleteButton = wrapper.find(Dropdown.Menu).props().children.find(button => !!button.props && button.props.id === `delete-task-${complexTask.id}`)
    deleteButton.props.onClick();
    wrapper.update();
    const confirmationModal = wrapper.find(ConfirmationModal).filterWhere(modal => modal.props().id === 'workflow-tasks-confirmation');
    confirmationModal.props().onAccept();
    wrapper.update();
    await waitFor(() => expect(deleteTask).toHaveBeenCalledTimes(1));
  });

  it('should call adhocRunTask api when modal accepts', async () => {

    mockmanagedIngestRequest();
    const wrapper = mount(<WorkflowTasks datasetId={datasetId} groups={groups} />);
    await waitFor(() => expect(getTasks).toHaveBeenCalledTimes(1));
    wrapper.update();
    const adhocRunButton = wrapper.find(Dropdown.Menu).props().children.find(button => !!button.props && button.props.id === `adhoc-run-task-${managedIngestRequest.id}`)
    adhocRunButton.props.onClick();
    wrapper.update();
    const confirmationModal = wrapper.find(ConfirmationModal).filterWhere(modal => modal.props().id === 'workflow-run-adhoc-task-confirmation');
    confirmationModal.props().onAccept();
    wrapper.update();
    await waitFor(() => expect(runTaskAdhoc).toHaveBeenCalledTimes(1));
  });

  it('should not call adhocRunTask api when modal cancels', async () => {

    mockmanagedIngestRequest();
    const wrapper = mount(<WorkflowTasks datasetId={datasetId} groups={groups} />);
    await waitFor(() => expect(getTasks).toHaveBeenCalledTimes(1));
    wrapper.update();
    const adhocRunButton = wrapper.find(Dropdown.Menu).props().children.find(button => !!button.props && button.props.id === `adhoc-run-task-${managedIngestRequest.id}`)
    adhocRunButton.props.onClick();
    wrapper.update();
    const confirmationModal = wrapper.find(ConfirmationModal).filterWhere(modal => modal.props().id === 'workflow-run-adhoc-task-confirmation');
    confirmationModal.props().onCancel();
    wrapper.update();
    await waitFor(() => expect(runTaskAdhoc).toHaveBeenCalledTimes(0));
  });

  it('should display confirmation modal if adhocRun button is clicked', async () => {

    mockmanagedIngestRequest();
    const wrapper = mount(<WorkflowTasks datasetId={datasetId} groups={groups}/>);
    await waitFor(() => expect(getTasks).toHaveBeenCalledTimes(1));
    wrapper.update();
    const adhocRunButton = wrapper.find(Dropdown.Menu).props().children.find(button => !!button.props && button.props.id === `adhoc-run-task-${managedIngestRequest.id}`)
    adhocRunButton.props.onClick();
    wrapper.update();
    const confirmationModal = wrapper.find(ConfirmationModal).filterWhere(modal => modal.props().id === 'workflow-run-adhoc-task-confirmation');
    expect(confirmationModal.props().show).toBeTruthy();
  });



});
