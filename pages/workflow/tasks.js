import {withRouter} from 'next/router';
import WorkflowTasks from '../../components/workflow/WorkflowTasks';
import {AppStateConsumer} from '../../components/AppState';
import TaskBreadcrumb from "../../components/workflow/TaskBreadcrumb";

const TasksPage = ({router: {query: {datasetId}}, loggedInUser: { groups }}) => {
  return (
    <>
      <TaskBreadcrumb datasetId={datasetId}/>
      <WorkflowTasks datasetId={datasetId} groups={groups}/>
    </>
  );
}

const Tasks = withRouter(props => (
  <AppStateConsumer>
    {({loggedInUser}) => <TasksPage {...props} loggedInUser={loggedInUser}/>}
  </AppStateConsumer>
));

export default Tasks;
