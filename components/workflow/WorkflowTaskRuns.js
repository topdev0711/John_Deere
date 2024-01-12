import React, {useState, useEffect} from 'react';
import Router from 'next/router';
import {Card, Button, Table, Spinner} from 'react-bootstrap';
import {MdHelpOutline} from 'react-icons/md';
import Spacer from '../Spacer';
import moment from 'moment';
import ConfirmationModal from '../ConfirmationModal';
import {getRunHistory, getTask} from '../../apis/workflow';

const styles = {
  header: {display: 'block'},
  detail: {display: 'block', paddingBottom: '5px'}
};

function getDuration(startDate, endDate) {
  if (startDate && endDate) {
    let sDate = moment(startDate, "YYYY-MM-DDTHH:mm:ss.SSSZ");
    let eDate = moment(endDate, "YYYY-MM-DDTHH:mm:ss.SSSZ");
    return moment.utc(eDate.diff(sDate)).format("HH:mm:ss")
  } else {
    return '';
  }
}

function sortItems(runHistory) {
  runHistory.sort((a, b) => new Date(b.created) - new Date(a.created));
  return runHistory;
}

const WorkflowTaskRuns = ({taskId, datasetId}) => {
  const [historyRuns, setHistoryRuns] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [showErrors, setShowErrors] = useState(false);
  const [task, setTask] = useState('');
  const {task_definition: definition = {}, id} = task;
  const {action = {}, source = {}, trigger = {}, destination = {}} = definition;
  const isManagedIngest = trigger.event === 'managed_ingest_request';
  const isManagedEgress = trigger.event === 'managed_egress_request';

  function displayErrorDetails(errors) {
    let errorsToDisplay = [];
    if (typeof errors === 'string') {
      errorsToDisplay.push(errors);
    } else {
      errors.forEach(e => {
        if (typeof e === 'string') {
          errorsToDisplay.push(e);
        } else if (e.error && e.error.message) {
          errorsToDisplay.push(e.error.message);
        } else if (e.message) {
          errorsToDisplay.push(e.message);
        }
      });
    }
    setErrors(errorsToDisplay);
    setShowErrors(true);
  }

  function onCancelErrorModal() {
    setErrors([]);
    setShowErrors(false);
  }

  useEffect(() => {
    async function loadTaskDetail() {
      try {
        const response = await getTask(taskId);
        if (response.ok) {
          const task = await response.json();
          setTask(task);
        } else {
          setTask('');
          const err = await response.json();
          console.error('Error', err);
        }
      } catch (e) {
        setTask('');
        setLoading(false);
        console.error('Error', JSON.stringify(e));
      }
    }

    loadTaskDetail();
  }, [taskId]);

  useEffect(() => {
    async function loadRunHistory() {
      try {
        const response = await getRunHistory(taskId);
        if (response.ok) {
          const historyRuns = await response.json();
          setHistoryRuns(historyRuns);
          setLoading(false);
        } else {
          setHistoryRuns([]);
          setLoading(false);
          const err = await response.json();
          console.error('Error', err);
        }
      } catch (e) {
        setHistoryRuns([]);
        setLoading(false);
        const err = await response.json();
        console.error('Error', err);
      }
    }

    loadRunHistory();
  }, [taskId]);

  return (
    <>
      {!isLoading &&
        <div key={`run-history`}>
          <ConfirmationModal
            id="error_details"
            show={showErrors}
            showAcceptOnly={true}
            acceptButtonText={'OK'}
            body={errors}
            onCancel={() => {
            }}
            onAccept={() => onCancelErrorModal()}
          />
          <div className="float-right" style={{marginTop: '-55px'}}>
            <Button
              size="sm"
              variant="outline-primary"
              href="https://confluence.deere.com/display/EDAP/Datasets"
              target="_blank"
            >
              <MdHelpOutline size="15"/>&nbsp;
              Help
            </Button>
          </div>
          <Spacer height="10px"/>
          <Card>
            <Card.Body>
              <h3>{action && action.operation && action.operation.name ? action.operation.name.toUpperCase() : (isManagedIngest ? 'MANAGED INGEST' : (isManagedEgress? 'MANAGED EGRESS': 'None'))}</h3>

              <hr/>
              <div className="float-right"></div>
              <span style={styles.detail} className="text-muted small">
                  {
                    isManagedIngest ? <><b>Database Source:</b>
                        <i>{trigger && trigger.metadata ? trigger.metadata.sourceDBType : 'None'}</i></>
                      : <><b>Trigger:</b> <i>{trigger && trigger.event ? trigger.event : 'None'}</i></>
                  }
                </span>
              {
                (isManagedIngest && trigger.metadata.sourceDBType.toLowerCase() === 'sharepoint')
                  ? <>
                    <span style={styles.detail}
                          className="text-muted small"><b>Location:</b> <i>{trigger.metadata.sharepoint_details.siteUrl}</i></span>
                    <span style={styles.detail} className="text-muted small">
                  <b>{trigger.metadata.sharepoint_details.displayType === 'list' ? 'Sharepoint Lists: ' : 'Document Library: '}</b> 
                  <i>{trigger.metadata.sharepoint_details.displayType === 'list' ? trigger.metadata.sharepoint_details.sourceFiles : trigger.metadata.sharepoint_details.docFolder}</i>
                </span>
                  </>
                  : <>
                    <span style={styles.detail}
                          className="text-muted small"><b>{isManagedIngest || isManagedEgress ? (trigger && trigger.metadata && trigger.metadata.phase.toLowerCase() === 'enhance' ? 'EDL Schema:' : 'Task Name:') : 'Source Schema:'}</b> <i>{isManagedIngest || isManagedEgress ? (trigger && trigger.metadata && trigger.metadata.phase.toLowerCase() === 'enhance' ? (source && source.representation ? source.representation : 'None') : (!!(trigger.metadata.taskName) ? trigger.metadata.taskName : trigger.metadata.onPremTaskName)) : (source && source.representation ? source.representation : 'None')}</i></span>
                    <span style={styles.detail} className="text-muted small">
                    {
                        isManagedIngest ? <><b>Table:</b><i>{trigger && trigger.metadata ? trigger.metadata.sourceTable : 'None'}</i></>
                          : isManagedEgress ? <><b>Table: </b><i>{trigger?.metadata?.destinationTable}</i></> : <><b>Destination Dataset:</b>
                            <i>{destination && destination.dataType ? destination.dataType : 'None'}</i></>
                    }
                </span>
                  </>
              }
              {historyRuns.length > 0 &&
                <div>
                  <Spacer height="10px"/>
                  <Table size='sm' hover striped bordered style={{position: 'relative', marginLeft: '0px'}}>
                    <thead>
                    <tr>
                      <th className="text-muted small"><b>ID</b></th>
                      <th className="text-muted small"><b>Started</b></th>
                      <th className="text-muted small"><b>Ended</b></th>
                      <th className="text-muted small"><b>Duration</b></th>
                      <th className="text-muted small"><b>Status</b></th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortItems(historyRuns).map((historyRun) => {
                      const {id, created, modified, status, errors = [], task_id, request_id} = historyRun;
                      const final_id = isManagedIngest ? request_id : id
                      return (
                        <tr>
                          <td className="text-muted small">{final_id}</td>
                          <td className="text-muted small">{created}</td>
                          <td className="text-muted small">{modified}</td>
                          <td className="text-muted small">{getDuration(created, modified)}</td>
                          <td className="text-muted small">
                            {(status === 'FAILED' || status === 'COMPLETE_WITH_ERRORS') ?
                              <span className="float-center">
                                                          <Button
                                                            style={{marginTop: '-5px'}}
                                                            size="sm"
                                                            variant="link"
                                                            onClick={() => displayErrorDetails(errors)}>
                                                            {status}
                                                          </Button>
                                                      </span> :
                              <span className="float-center">
                                                          <Button
                                                            style={{marginTop: '-5px'}}
                                                            size="sm"
                                                            variant="tabs">
                                                            {status}
                                                          </Button>
                                                      </span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                    </tbody>
                  </Table>
                </div>
              }
              <Spacer height="10px"/>
              <div id='emptyResponse' hidden={!!historyRuns.length}><i>No run history found for this task.</i></div>
              <span className="float-right">
                  <Button
                    onClick={() => Router.push('/workflow/tasks?datasetId=' + datasetId)}
                    size="sm"
                    variant="primary">
                    OK
                  </Button>
                </span>
            </Card.Body>
          </Card>
        </div>
      }
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

export default WorkflowTaskRuns;