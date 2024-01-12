import React, { Component } from 'react'
import { withRouter } from 'next/router';
import { AppStateConsumer } from '../components/AppState'
import ApprovalsPage from '../components/approvals/ApprovalsPage';

class ApprovalPage extends Component {

  render() {
    const { loggedInUser, isReloadDatasets, setReloadDatasets } = this.props;
    // todo is fragment needed?
    return (<ApprovalsPage loggedInUser ={loggedInUser} isReloadDatasets = {isReloadDatasets} setReloadDatasets = {setReloadDatasets}/>)
  }
}

const Approvals = withRouter(props => (
    <AppStateConsumer>
      {({ loggedInUser, isReloadDatasets, setReloadDatasets }) => (
          <ApprovalPage {...props} loggedInUser={loggedInUser} isReloadDatasets={isReloadDatasets} setReloadDatasets = {setReloadDatasets}/>
          )
      }
    </AppStateConsumer>

));

export default Approvals;
