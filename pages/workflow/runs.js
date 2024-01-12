import React from "react";
import WorkflowTaskRuns from '../../components/workflow/WorkflowTaskRuns';
import RunsBreadcrumb from "../../components/workflow/RunsBreadcrumb";

const Runs = ({router: {query: {datasetId, taskId}}}) => {
  return (
    <>
      <RunsBreadcrumb datasetId={datasetId}/>
      <WorkflowTaskRuns taskId={taskId} datasetId={datasetId}/>
    </>
  )
};

export default Runs;
