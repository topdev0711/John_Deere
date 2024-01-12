import React from 'react';
import {Button} from 'react-bootstrap';
import {MdFormatListBulleted} from 'react-icons/md';
import { useRouter } from 'next/router';

const hasWorkflowButton = ({status}) => status === 'AVAILABLE';

const WorkflowButton = ({dataset}) => {
  const router = useRouter();
  const handleWorkflowClick = () => router.push(`/workflow/tasks?datasetId=${dataset.id}`);
  return <Button id='workflow-button' onClick={handleWorkflowClick} size="sm" variant="outline-primary"><MdFormatListBulleted/> Workflow Tasks</Button>;
}

export const getWorkflowButton = dataset => hasWorkflowButton(dataset) ? <WorkflowButton dataset={dataset} /> : undefined;
