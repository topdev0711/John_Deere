const getConfig = method => ({credentials: 'same-origin', method, headers: {'Content-Type': 'application/json'}});
const getTasks = (datasetEnvName,isManagedTask) => fetch(`/api/tasks/${datasetEnvName}/managedTask/${isManagedTask}`, getConfig('GET'));
const deleteTask = taskId => fetch(`/api/tasks/${taskId}`, getConfig('DELETE'));
const deleteManagedIngestTask = (taskId, sourceType) => fetch(`/api/managedtasks/${sourceType}/${taskId}`, getConfig('DELETE'));

const isManagedIngest = async (custodian) => {
  const response = await fetch(`/api/managedtasks/${custodian}`, getConfig('GET'));
  return response.json();
};


const runTaskAdhoc = async(taskId) => {

  let body = {};
  body["taskId"] = taskId;
  const response = await fetch("/api/v1/adhocRun", {
    credentials: "same-origin",
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
    
  return response;
};

const getRunHistory = async (taskId)  => {
  return fetch(`/api/tasks/${taskId}/runs`,  {
    credentials: 'same-origin',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

const getTask = async (taskId) => {
  return fetch(`/api/task/${taskId}`,  {
    credentials: 'same-origin',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

module.exports = { getTasks, deleteTask, deleteManagedIngestTask, isManagedIngest, getRunHistory, getTask ,runTaskAdhoc};
