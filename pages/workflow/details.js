
import React from "react";
import TaskDetails from '../../components/workflow/edit/TaskDetails';
import TaskDetailsBreadcrumb from "../../components/workflow/edit/TaskDetailsBreadcrumb";

const Details = ({router: {query: {datasetId, taskId}}}) => {
  return (
    <>
      <TaskDetailsBreadcrumb datasetId={datasetId}/>
      <TaskDetails taskId={taskId} datasetId={datasetId}/>
    </>
  )
};

export default Details;