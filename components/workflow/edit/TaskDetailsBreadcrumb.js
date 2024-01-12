import {Breadcrumb} from "react-bootstrap";
import React from "react";
import Link from "next/link";

const styles = {
  breadcrumb: {
    marginLeft: '-17px',
    marginTop: '-17px'
  }
}

const TaskDetailsBreadcrumb = ({datasetId}) => {
  const detailPath = `/catalog/datasets/detail?id=${datasetId}&edit=false`;
  const tasksPath = `/workflow/tasks?datasetId=${datasetId}`;

  return (
      <Breadcrumb style={styles.breadcrumb}>
        <Breadcrumb.Item><Link href={"/catalog"}><a>Catalog</a></Link></Breadcrumb.Item>
        <Breadcrumb.Item><Link id='runs-detail-link' href={detailPath}><a>Dataset Detail</a></Link></Breadcrumb.Item>
        <Breadcrumb.Item><Link id='runs-tasks-link' href={tasksPath}><a>Tasks</a></Link></Breadcrumb.Item>
        <Breadcrumb.Item active={true}>Details</Breadcrumb.Item>
      </Breadcrumb>
  )
};

export default TaskDetailsBreadcrumb;
