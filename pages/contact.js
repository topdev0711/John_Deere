import React from "react";
import { AppStateConsumer } from "../components/AppState";
import { Table, Collapse, Button } from "react-bootstrap";
import UserModal from "../components/UserModal";
import { MdExpandMore, MdExpandLess } from "react-icons/md";

const initialOpenState = {
  id: "no-id",
  open: false,
};

export default class ContactPage extends React.Component {
  state = {
    openOne: false,
    communityOpen: initialOpenState
   };

  subCommunityEligibleApprover = (community, subCommunity) => {
    return subCommunity.approver ? subCommunity.approver : community.approver;
  }

  toggleOneCommunity(id) {
    this.setState({openOne: !this.state.openOne, communityOpen: {
      id,
      open: !this.state.communityOpen.open,
    }, });
  }

  customStyle(index) {
    if (index % 2 === 0) {
      return {
        backgroundColor: "#f7f7f7",
      };
    }
    return {};
  }

  render() {
    const sorter = (a,b) => a.name.localeCompare(b.name);
    return (
      <>
        <div>
          <h4>Enterprise Data Lake</h4>
          <ul className="uxf-ul">
            <li>
              Join the EDL community on Yammer <a href="https://web.yammer.com/main/groups/eyJfdHlwZSI6Ikdyb3VwIiwiaWQiOiIxMjI5MjY5NDAxNiJ9/all">Enterprise Data Lake Community</a>
            </li>
            <li>
              Join us in Microsoft Teams <a href="https://teams.microsoft.com/l/channel/19%3a961c46cc7153453fbd278045e8c6ec9f%40thread.tacv2/General?groupId=243916a5-0550-4693-bef0-69e020030e91&tenantId=39b03722-b836-496a-85ec-850f0957ca6b">Enterprise Data Lake Team</a>
            </li>
          </ul>
          <br />
          <h4>Community Details</h4>
          <p>Sub-Communities are managed by the community Data Steward and Custodian. Please see the <a href="https://deere.sharepoint.com/sites/DataGov/SitePages/SubCommunity.aspx">Request Process</a> for steps to follow if you would like to have a new sub-community created.</p>
          <Table hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Approver</th>
              </tr>
            </thead>
            <tbody>
              <AppStateConsumer>
                {(ctx) =>
                  ctx.referenceData.communities.sort(sorter).map((community, index) => (
                    <React.Fragment key={community.id}>
                      <tr style={this.customStyle(index)}>
                        <td>{community.name}</td>
                        <td>
                          <UserModal linkName={community.approver} groupName={community.approver} isCommunity={true} />
                          {!!community.subCommunities.length && (
                            <Button size="sm" border="none" variant="none" onClick={() => this.toggleOneCommunity(community.id)}>
                              {this.state.openOne && this.state.communityOpen.id === community.id ? <MdExpandLess /> : <MdExpandMore />}
                            </Button>
                          )}
                        </td>
                      </tr>
                      {!!community.subCommunities.length && (
                        <tr>
                          <Collapse in={this.state.communityOpen.id === community.id ? this.state.communityOpen.open : false}>
                            <td colSpan="2">
                              <Table hover variant="light" striped>
                                <thead>
                                  <tr>
                                    <th>Sub-Community</th>
                                    <th>Approver</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {community.subCommunities.sort(sorter).filter(subCommunity => subCommunity.enabled).map((subComm) => (
                                    <tr key={subComm.id}>
                                      <td style={{ width: "43%" }}>{subComm.name}</td>
                                      <td>
                                        <UserModal linkName={this.subCommunityEligibleApprover(community, subComm)} groupName={this.subCommunityEligibleApprover(community, subComm)} isCommunity={true} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </td>
                          </Collapse>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                }
              </AppStateConsumer>
            </tbody>
          </Table>
        </div>
      </>
    );
  }
}
// Look into hiding the status bubble when isLoading
