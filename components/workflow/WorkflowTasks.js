import React, {useState, useEffect} from 'react';
import Router from 'next/router';
import {Card, Button, Table, Spinner, Toast} from 'react-bootstrap';
import ConfirmationModal from '../ConfirmationModal';
import WorkflowTaskForm from './WorkflowTaskForm';
import Accordion from '../Accordion';
import {MdAdd, MdDeleteForever, MdHelpOutline, MdDirectionsRun, MdFileCopy, MdRunCircle} from 'react-icons/md';
import Spacer from '../Spacer';
import utils from '../utils';
import {getDataset} from '../../apis/datasets';
import {getTasks, deleteTask, deleteManagedIngestTask, isManagedIngest, runTaskAdhoc} from '../../apis/workflow';
import { Dropdown } from "@deere/ux.uxframe-react";
import ProgressIndicator from "./ProgressIndicator";

const styles = {
  header: {display: 'block'},
  detail: {display: 'block', paddingBottom: '5px'}
};

const WorkflowTasks = ({datasetId = '', groups = [], setModal = () => {}}) => {
  const [tasks, setTasks] = useState([]);
 
  const [isLoading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [refreshTasks, setRefreshTasks] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [copyingTask, setCopyingTask] = useState(false);
  const [isCustodian, setIsCustodian] = useState(false);
  const [enableManagedIngestRdsTask, setEnableManagedIngestRdsTask] = useState(false);
  const [enableDataProfile, setEnableDataProfile] = useState(false);
  const [dataset, setDataset] = useState({});
  const [adhocRunTaskModal, setAdhocRunTaskModal] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState();
  const [currentTaskName, setCurrentTaskName] = useState();
  const [showToast, setShowToast] = useState(false);
  const [isSpinning, setSpinning] = useState(false);
  const [toastInfo, setToastInfo] = useState({
    message: '', 
    header: '', 
    status: ''
  });

  const allServers = ['Sharepoint']

  function onAddTaskClick() {
    setCreatingTask(true);
  }

  async function onCopyTaskClick(taskId) {
    Router.push(`/workflow/details?taskId=${taskId}&datasetId=${datasetId}`);
    }

  async function onDeleteTaskClick(id, sourceType, isManagedIngest) {
    setLoading(true)
    const response = isManagedIngest ? await deleteManagedIngestTask(id, sourceType) : await deleteTask(id);
    if (response.ok) return setRefreshTasks(true);
    else return setModal({body: await response.text()})
  }


  async function adhocRunClick(id) { 
    setSpinning(true);
    const response = await runTaskAdhoc(id);
    const task = (currentTaskName === undefined ? currentTaskId : currentTaskName);
    if (response.ok) {
      setToastInfo({ header: "ADHOC RUN STATUS", message: `Run got triggered for task: '${task}'. Please review the Runs`, status: "SUCCESS" });
    }
    else {
      setToastInfo({ header: "ADHOC RUN STATUS", message: `Triggering of Run for task: ${task} Failed with Error ${await response.text()}`, status: "FAILED" });
    };
    setShowToast(true);
    setSpinning(false);
    return;
  }

  const errorHandler = (error = {}, taskErr = false) => {
    setTasks([]);
    setLoading(false);
    const err = taskErr ? error : JSON.parse(error);
    console.error('Error ', err);
    setModal({body: taskErr ? error : err.message});
  }

  const adHocRunsFunction =(taskId,taskName)=>{
    setAdhocRunTaskModal(true);
    setCurrentTaskId(taskId);
    setCurrentTaskName(taskName);
  }

  useEffect(() => {
    const setWorkflowTaskDetails = async () => {
      try {
        const dataType = await getDataset(datasetId);
        setIsCustodian(utils.isCustodian(dataType.custodian, groups));
        const isManagedTaskRDS = await isManagedIngest(dataType.custodian);
        setEnableManagedIngestRdsTask(isManagedTaskRDS.isManagedIngest);
        const isShowDataProfile = await isManagedIngest(dataType.custodian);
        setEnableDataProfile(isShowDataProfile.isManagedIngest);
        setDataset(dataType);
      } catch (e) {
        errorHandler(e);
      }
    };
    setWorkflowTaskDetails();
  }, [groups]);

  useEffect(() => {
    async function loadTasks() {
      if (!isLoading) setLoading(true);
      if (refreshTasks) setRefreshTasks(false);
      try {
        const response = await getTasks(dataset.environmentName, true);
        if (response.ok) {
          const newTasks = await response.json();
          setTasks(newTasks);
          setLoading(false);
        } else {
          const err = await response.json();
          errorHandler(err.error, true);
        }
      } catch (e) {
        errorHandler(e);
      }
    }

    if (dataset.environmentName) loadTasks();
  }, [dataset, refreshTasks, setCreatingTask]);

  return (
    <>
      {!isLoading && !creatingTask && !copyingTask &&
        <div key={`${datasetId}-workflow-tasks`}>
          <ConfirmationModal
            id={'workflow-tasks-confirmation'}
            show={!!deleteModal}
            showAcceptOnly={(deleteModal || {}).showAcceptOnly}
            acceptButtonText={(deleteModal || {}).acceptButtonText}
            body={(deleteModal || {}).body}
            onCancel={() => setDeleteModal(null)}
            onAccept={() => {
              setDeleteModal(null);
              deleteModal.onAccept()
            }}
          />
           <ConfirmationModal
            id={'workflow-run-adhoc-task-confirmation'}
            title='Adhoc Run'
            show={adhocRunTaskModal}
            showAcceptOnly = {false}
            acceptButtonText='Run Now'
            cancelButtonText='Cancel'
            body={(
              <div>
                <div>Are you sure you want to Run this task?</div>
              </div>
            )}
            onCancel={() => setAdhocRunTaskModal(false)}
            onAccept={() => {
              setAdhocRunTaskModal(false);
              adhocRunClick(currentTaskId);
            }}
          />
          <div className="float-right" style={{marginTop: '-55px'}}>
            <Button
              size="sm"
              variant="outline-primary"
              href="https://confluence.deere.com/display/EDAP/Walk-throughs"
              target="_blank"
            >
              <MdHelpOutline size="15"/>&nbsp;
              Help
            </Button>
          </div>
          <Spacer height="10px"/>
          <Card>
            {
              isSpinning && <ProgressIndicator overlay={true} />
            }
            <Card.Body>
            <span className="float-right">
              {
                isCustodian &&
                <Button
                  onClick={onAddTaskClick}
                  size="sm"
                  variant="outline-primary">
                  <MdAdd/> Add Task
                </Button>
              }  
            </span>
              <h3>Workflow Tasks</h3>
              <hr/>
              <Accordion
                filterable
                key={`${datasetId}-task-accordion`}
                items={tasks.map((task, i) => {
                  const {task_definition: definition = {}, id} = task;
                  const {action = {}, source = {}, trigger = {}, destination = {}} = definition;
                  const fields = (action.operation && action.operation.options && action.operation.options.fields) || [];
                  const [columns = [], rows = []] = fields.reduce(([cols, rows], field) => [[...cols, ...Object.keys(field)], [...rows, Object.values(field)]], [[], []]);
                  const uniqueColumns = [...new Set(columns)];
                  const isManagedIngest = trigger.event === 'managed_ingest_request';
                  const isManagedEgress = trigger.event === 'managed_egress_request';
                  const souceDBType = isManagedIngest ? trigger.metadata.sourceDBType : '';
                  const isSourceType = trigger && trigger.metadata ? trigger.metadata.sourceDBType === 'Sharepoint' : 'None';
                  const isFileType = trigger && trigger.metadata && trigger.metadata.sharepoint_details ? trigger.metadata.sharepoint_details.displayType === 'file' : 'None';
                  const isListType = trigger && trigger.metadata && trigger.metadata.sharepoint_details ? trigger.metadata.sharepoint_details.displayType === 'list' : 'None';
                  const scheduleFrequency = trigger && trigger.metadata && trigger.metadata.schedule && trigger.metadata.schedule.frequency;
                  const everyNHours = trigger && trigger.metadata && trigger.metadata.schedule && trigger.metadata.schedule.everyNHours;
                  const endDate = trigger && trigger.metadata && trigger.metadata.schedule && trigger.metadata.schedule.endDate;
                  const taskName = trigger?.metadata?.taskName || trigger?.metadata?.onPremTaskName;
                  return {
                    id,
                    filterContent: task,
                    header: (
                      <>
                        <span style={styles.header} className="text-muted small"><b>Action:</b> <i>{isManagedIngest ? 'MANAGED INGEST' : (action?.operation?.name ? action.operation.name.toUpperCase() : (isManagedEgress? 'MANAGED EGRESS' : 'None'))}</i></span>
                        <span style={styles.header} className="text-muted small"><b>{dataset.phase.name.toLowerCase() === 'enhance' ? 'Source Schema:' : (isManagedIngest ? (isSourceType ? '' : 'Task Name') : '')}</b> <i>{dataset.phase.name.toLowerCase() === 'enhance' ? (source && source.representation ? source.representation : 'None') : (isManagedIngest ? (trigger && trigger.metadata ? (!!(trigger.metadata.taskName) ? trigger.metadata.taskName : trigger.metadata.onPremTaskName) : 'None') : '')}</i></span>
                      </>
                    ),
                    body: (
                      <>
                        <div className="text-muted float-right">
                          <Dropdown className="text-muted float-right" hidden={!isCustodian}>
                              <Dropdown.Toggle variant="outline-primary" id="dropdown-basic-2">
                                  Actions
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                  <Dropdown.Item  id={`run-history-${id}`}
                                                  hidden={!isCustodian}
                                                  variant="outline-success"
                                                  size="sm"
                                                  onClick={() => Router.push(`/workflow/runs?taskId=${task.id}&datasetId=${datasetId}`)}> <MdDirectionsRun/> View runs
                                  </Dropdown.Item>
                                  {isManagedIngest && !allServers.includes(souceDBType)?(
                                    <Dropdown.Item
                                      id={`copy-task-${id}`}
                                      hidden={!isCustodian}
                                      variant="outline-success"
                                      size="sm"
                                      onClick={() => onCopyTaskClick(task.id)}>
                                        <MdFileCopy/> Copy
                                  </Dropdown.Item>):""}
                                  {isManagedIngest ?(
                                  <Dropdown.Item  id={`adhoc-run-task-${id}`}
                                                  hidden={!isCustodian}
                                                  variant="outline-success"
                                                  size="sm"
                                                  onClick={() => adHocRunsFunction(id,taskName)}> <MdRunCircle/> Run now
                                  </Dropdown.Item>):""}
                                  <Dropdown.Item  hidden={!isCustodian}
                                                  variant="outline-success"
                                                  size="sm"
                                                  onClick={() => setDeleteModal({
                                                  onAccept: async () => onDeleteTaskClick(id, souceDBType, isManagedIngest),
                                                  acceptButtonText: 'Delete Task',
                                                  body: (
                                                    <div>
                                                      <div>Are you sure you want to delete this task?</div>
                                                    </div>
                                                  )
                                                  })} id={`delete-task-${id}`}> <MdDeleteForever/>Remove
                                  </Dropdown.Item>
                              </Dropdown.Menu>
                          </Dropdown>
                        </div>
                        {isManagedIngest ? (
                          <>
                            {isSourceType ? (
                              <>
                            <span style={styles.detail} className="text-muted small">
                              <b>Database Type:</b> <i>{trigger && trigger.metadata ? trigger.metadata.sourceDBType : 'None'}</i>
                            </span>
                                <span style={styles.detail} className="text-muted small">
                              <b>Location:</b> <i>{trigger && trigger.metadata ? trigger.metadata.sharepoint_details.siteUrl : 'None'}</i>
                            </span>
                                {isFileType ? (
                                  <span style={styles.detail} className="text-muted small">
                              <b>Document Library:</b> <i>{trigger && trigger.metadata ? trigger.metadata.sharepoint_details.docFolder : 'None'}</i>
                            </span>
                                ) : (<></>)
                                }
                                {isListType ? (
                                    <span style={styles.detail} className="text-muted small">
                            <b>Sharepoint Lists:</b> <i>{trigger && trigger.metadata ? trigger.metadata.sharepoint_details.sourceFiles : 'None'}</i>
                            </span>) :
                                  (<></>)
                                }
                                <span style={styles.detail} className="text-muted small">
                              <b>Ingest Type:</b> <i>{trigger && trigger.metadata ? trigger.metadata.ingestType : 'None'}</i>
                            </span>
                              </>
                            ) : (
                              <>
                            <span style={styles.detail} className="text-muted small">
                              <b>Database Type:</b> <i>{trigger && trigger.metadata ? trigger.metadata.sourceDBType : 'None'}</i>
                            </span>
                                <span style={styles.detail} className="text-muted small">
                              <b>Task Name:</b> <i>{trigger && trigger.metadata ? (!!(trigger.metadata.taskName) ? trigger.metadata.taskName : trigger.metadata.onPremTaskName) : 'None'}</i>
                            </span>
                                <span style={styles.detail} className="text-muted small">
                              <b>Table:</b> <i>{trigger && trigger.metadata ? trigger.metadata.sourceTable : 'None'}</i>
                            </span>
                                <span style={styles.detail} className="text-muted small">
                              <b>Ingest Type:</b> <i>{trigger && trigger.metadata ? trigger.metadata.ingestType : 'None'}</i>
                            </span>
                              </>
                            )}
                            {scheduleFrequency &&
                              <span style={styles.detail} className="text-muted small">
                              <b>Schedule Frequency:</b> <i>{trigger.metadata.schedule.frequency}</i>
                            </span>
                            }
                            {scheduleFrequency && scheduleFrequency === 'daily' &&
                              <span style={styles.detail} className="text-muted small">
                              <b>Start Time:</b> <i>{trigger.metadata.schedule.startTime}</i>
                            </span>
                            }
                            {scheduleFrequency && scheduleFrequency === 'daily' && everyNHours !== '0' &&
                              <span style={styles.detail} className="text-muted small">
                              <b>In every:</b> <i>{trigger.metadata.schedule.everyNHours} Hours</i> 
                            </span>
                            }
                            {scheduleFrequency && scheduleFrequency === 'daily' && everyNHours !== '0' && !!endDate &&
                              <span style={styles.detail} className="text-muted small">
                              <b>End Date:</b> <i>{trigger.metadata.schedule.endDate}</i>
                            </span>
                            }
                            {scheduleFrequency && scheduleFrequency === 'monthly' &&
                              <span style={styles.detail} className="text-muted small">
                              <b>Date of Month:</b> <i>{trigger.metadata.schedule.startDate}</i>
                            </span>
                            }
                            {scheduleFrequency && scheduleFrequency === 'monthly' && !!endDate &&
                              <span style={styles.detail} className="text-muted small">
                              <b>End Date:</b> <i>{trigger.metadata.schedule.endDate}</i>
                            </span>
                            }
                            {scheduleFrequency && scheduleFrequency === 'weekly' &&
                              <span style={styles.detail} className="text-muted small">
                              <b>Day of the week:</b> <i>{trigger.metadata.schedule.dayOfWeek}</i>
                            </span>
                            }
                            {scheduleFrequency && scheduleFrequency === 'weekly' && !!endDate &&
                              <span style={styles.detail} className="text-muted small">
                              <b>End Date:</b> <i>{trigger.metadata.schedule.endDate}</i>
                            </span>
                            }
                          </>
                        ) : isManagedEgress ? (
                          <>
                            <span style={styles.detail} className="text-muted small">
                              <b>Database Type:</b> <i>{trigger.dbDetails.dbType}</i>
                            </span>
                            <span style={styles.detail} className="text-muted small">
                              <b>Destination Table:</b> <i>{trigger.metadata.destinationTable}</i>
                            </span>
                                <span style={styles.detail} className="text-muted small">
                              <b>Ingest Type:</b> <i>{trigger.metadata.ingestType}</i>
                            </span>
                          </>
                        ): (
                          <>
                            <span style={styles.detail} className="text-muted small">
                              <b>Trigger:</b> <i>{trigger && trigger.event ? trigger.event : 'None'}</i>
                            </span>
                            <span style={styles.detail} className="text-muted small">
                              <b>Destination Dataset:</b> <i>{destination && destination.dataType ? destination.dataType : 'None'}</i>
                            </span>
                          </>
                        )}

                        {!!fields.length &&
                          <>
                            <span style={styles.detail} className="text-muted small"><b>Fields:</b></span>
                            <Spacer height="10px"/>
                            <div style={{display: 'block', width: '100%'}}>
                              <Table key={`table-${id}`} size='sm' hover striped bordered
                                     style={{position: 'relative', marginLeft: '0px'}}>
                                <thead key={`tableHeader-${id}`}>
                                <tr key={`field-header-row-${id}`}>
                                  {uniqueColumns.map(column => (
                                    <th key={`field-header-col-${column}-${id}`} className="text-muted small">
                                      <b>{column.charAt(0).toUpperCase() + column.slice(1)}</b></th>
                                  ))}
                                </tr>
                                </thead>
                                <tbody key={`tableBody-${id}`}>
                                {rows.map((row, rowNumber) => {
                                  return (
                                    <tr key={`${id}-row-${rowNumber}`} id={`${id}-row-${rowNumber}`}>
                                      {row.map((item, count) => {
                                        const value = typeof item === 'object' ? JSON.stringify(item) : item.toString();
                                        if (count + 1 === row.length && count + 1 < uniqueColumns.length) {
                                          return (
                                            <>
                                              <td key={`cell-${count}-${rowNumber}-${id}`}
                                                  className="text-muted small">{value}</td>
                                              <td key={`cell-empty-${rowNumber}-${id}`}
                                                  className="text-muted small"></td>
                                            </>
                                          );
                                        }
                                        return (
                                          <td key={`cell-${count}-${rowNumber}-${id}`}
                                              className="text-muted small">{value}</td>
                                        );
                                      })}
                                    </tr>
                                  )
                                })}
                                </tbody>
                              </Table>
                            </div>
                          </>
                        }
                      </>
                    )
                  };
                })}
              />
              <div id='emptyResponse' hidden={!!tasks.length}><i>No tasks found for this dataset.</i></div>
            </Card.Body>
          </Card>
        </div>
      }
      {creatingTask &&
        <WorkflowTaskForm
          dataset={dataset}
          setCreatingTask={setCreatingTask}
          setRefreshTasks={setRefreshTasks}
          setModal={setModal}
          tasks={tasks}
          enableManagedIngestRdsTask={enableManagedIngestRdsTask}
          enableDataProfile={enableDataProfile}
        />
      }
      <Toast
        show={showToast}
        onClose={() => setShowToast(false)}
        style={{
          position: "fixed",
          top: 20,
          right: 40,
          zIndex: 9999,
          borderColor: toastInfo.status === 'SUCCESS' ? "#00FF00" : "#c21020"
        }}
        >
        <React.Fragment>
          <Toast.Header>
            <strong className="mr-auto">{toastInfo.header}</strong>
          </Toast.Header>
          <Toast.Body>{toastInfo.message}</Toast.Body>
        </React.Fragment>
      </Toast>
      {
         isLoading && <div className="text-center">
         <Spinner id='loading' className="spinner-border uxf-spinner-border-lg" animation="border" role="status">
           <span className="sr-only">Loading...</span>
         </Spinner>
       </div>
      }
    </>
  )
};

export default WorkflowTasks;