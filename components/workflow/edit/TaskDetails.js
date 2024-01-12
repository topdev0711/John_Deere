import React, {useState, useEffect} from 'react';
import WorkflowTaskForm from '../WorkflowTaskForm';
import utils from '../../utils';
import {getDataset} from '../../../apis/datasets';
import {getTasks, isManagedIngest,getTask} from '../../../apis/workflow';

const TaskDetails = ({datasetId = '', taskId='', groups = [], setModal = () => {}}) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [refreshTasks, setRefreshTasks] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [enableManagedIngestRdsTask, setEnableManagedIngestRdsTask] = useState(false);
  const [enableDataProfile, setEnableDataProfile] = useState(false);
  const [dataset, setDataset] = useState({});
  const [isCustodian, setIsCustodian] = useState(false);
  const [task, setTask] = useState([]);
  const [copyingTask, setCopyingTask] = useState(false);
  const [sourceSchemasList, setSourceSchemasList] = useState([]);

  const errorHandler = (error = {}) => {
    setTasks([]);
    setLoading(false);
    setModal({body: error});
  }

  useEffect(() => {
    const setWorkflowTaskDetails = async () => {
      try {
        if (!isLoading) setLoading(true);
        const dataType = await getDataset(datasetId);
        setIsCustodian(utils.isCustodian(dataType.custodian, groups));
        const isManagedTaskRDS = await isManagedIngest(dataType.custodian);
        setEnableManagedIngestRdsTask(isManagedTaskRDS.isManagedIngest);
        const isShowDataProfile = await isManagedIngest(dataType.custodian);
        setEnableDataProfile(isShowDataProfile.isManagedIngest);
        setDataset(dataType);  
        const response = await getTask(taskId);
        if (response.ok) {
          setLoading(false);
          const task = await response.json();
          setTask(task);
          setCopyingTask(true);
        } else {
          setTask('');
          setLoading(false);
          const err = await response.json();
          errorHandler(err.error);
        }
      } catch (e) {
        setLoading(false);
        errorHandler(e);
      }
    };
    setWorkflowTaskDetails();
  }, []);

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
      {copyingTask && tasks.length>0 && Object.keys(dataset).length !== 0  &&
        <WorkflowTaskForm
          dataset={dataset}
          setModal={setModal}
          task ={task}
          tasks = {tasks}
          datasetId={datasetId}
          copyingTask = {copyingTask}
          sourceSchemasList={sourceSchemasList}
          setCopyingTask={setCopyingTask}
          enableManagedIngestRdsTask={enableManagedIngestRdsTask}
          enableDataProfile={enableDataProfile}
        />
      }
    </>
  )
};

export default TaskDetails;
