import {Breadcrumb} from "react-bootstrap";
import Link from "next/link";

const styles = {
  breadcrumb: {
    marginLeft: '-17px',
    marginTop: '-17px'
  }
};

const TaskBreadcrumb = ({datasetId}) => {
  const detailPath = `/catalog/datasets/detail?id=${datasetId}&edit=false`;
  return <Breadcrumb style={styles.breadcrumb}>
    <Breadcrumb.Item><Link href="/catalog"><a>Catalog</a></Link></Breadcrumb.Item>
    <Breadcrumb.Item><Link id='task-detail-link' href={detailPath}><a>Dataset Detail</a></Link></Breadcrumb.Item>
    <Breadcrumb.Item active={true}>Tasks</Breadcrumb.Item>
  </Breadcrumb>
}

export default TaskBreadcrumb;
