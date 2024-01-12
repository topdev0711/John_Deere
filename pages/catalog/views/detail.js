import {withRouter} from 'next/router';
import { AppStateConsumer } from '../../../components/AppState';
import ViewDetail from "../../../components/ViewDetail";

function ViewDetails(props) {
  return (
    <>
     <ViewDetail {...props} />
    </>
  )
}

const Views = withRouter(props => (
  <AppStateConsumer>
    {(appProps) => <ViewDetails {...props} appProps={appProps} />}
  </AppStateConsumer>
));

export default Views;
