import { Card, Container, ListItem, SideNav, Table } from "@deere/ux.uxframe-react";
import RecentlyModifiedDetails from '../components/RecentlyModifiedDetails';

const LandingPage = ({ }) => {

    return (
        <div align="left" style={{ marginLeft: 0, paddingLeft: 0, Width: '200%' }}>
            <Container style={{ paddingLeft: 0 }}>
                <div className="float-left" style={{ paddingLeft: 0, paddingRight: '10px' }}>
                    <SideNav style={{ paddingLeft: 0, width: '200%', textAlign: 'left' }}>
                        <div style={{ paddingBottom: '5%', paddingTop: '5%', textIndent: '15px', textAlign: 'left', backgroundColor: "#ccc" }}> EDL Data Catalog</div>
                        <ListItem className="nav-item">
                            <a className="nav-link" href="/catalog" target="_blank">
                                Browse Catalog
                            </a>
                        </ListItem>
                        <ListItem className="nav-item ">
                            <a className="nav-link " href="/catalog/permissions/request" target="_blank">
                                Request Access
                            </a>
                        </ListItem>
                        <ListItem className="nav-item">
                            <a className="nav-link " href="/datasets/register" target="_blank">
                                Register Dataset
                            </a>
                        </ListItem>
                        <ListItem className="nav-item ">
                            <a className="nav-link " href="/approvals" target="_blank">
                                Approvals
                            </a>
                        </ListItem>
                        <div style={{ paddingBottom: '10px', paddingTop: '10px', textAlign: 'left', textIndent: '15px', backgroundColor: '#ccc' }}>Databricks</div>

                        <ListItem className="nav-item ">
                            <a className="nav-link " href="https://deere-edl.cloud.databricks.com/" target="_blank">
                                EDL
                            </a>
                        </ListItem>
                        <ListItem className="nav-item " >
                            <a className="nav-link " href="https://deere-edl-isg.cloud.databricks.com/" target="_blank">
                                ISG
                            </a>
                        </ListItem>
                        <ListItem className="nav-item ">
                            <a className="nav-link " href="https://deere-internal.cloud.databricks.com/" target="_blank">
                                Internal
                            </a>
                        </ListItem>
                        <ListItem className="nav-item ">
                            <a className="nav-link " href="https://deere-edl-expertalerts.cloud.databricks.com/" target="_blank">
                                Expert Alerts
                            </a>
                        </ListItem>
                    </SideNav>
                </div>
                <div style={{ paddingLeft: 230 }}>
                    <Card>
                        <Card.Body >
                            <Card.Text style={{ display: 'block', fontSize: 20 }}><b>John Deere Data Lake</b></Card.Text>
                            <Card.Text style={{ display: 'block' }}>You can use the data lake to store and share data so that anyone with analytical needs has all the data in one place.</Card.Text>
                            <Card.Text style={{ display: 'block', fontSize: 20 }}><b>Latest Updates</b></Card.Text> <br></br>
                            <RecentlyModifiedDetails />
                        </Card.Body>
                    </Card>
                    <br></br>
                    <Card>
                        <Card.Body >
                            <Card.Text style={{ display: 'block', fontSize: 20 }}><b>Data Engineering and Collaborative Data Science</b></Card.Text>
                            <Card.Text style={{ display: 'block' }}>Databricks serves as the Data Lake's compute layer. It is powered by an optimized version of Apacha Spark and facilitates many of the advanced capabilities of the platform.
                                More information about Databricks can be found in our <a href="https://confluence.deere.com/pages/viewpage.action?spaceKey=EDAP&title=Databricks" target="_blank">Documentation</a>
                            </Card.Text>
                            <Card.Text style={{ display: 'block', fontSize: 20 }}><b>Databricks Environments</b></Card.Text>

                            <Table borderless striped style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: "13%", fontSize: 17 }} scope="row">Link</th>
                                        <th style={{ width: "50%", fontSize: 17 }} scope="row">Description</th>
                                    </tr>
                                    <td colSpan="1">
                                        <a class="external-link" href="https://deere-edl.cloud.databricks.com/" target="_blank">deere-edl</a>
                                    </td>
                                    <td>
                                        <div>Used for Most scenarios, General Purpose, supports very large workloads.</div>
                                    </td>
                                </thead>

                                <thead>
                                    <td>
                                        <a class="external-link" href="https://deere-edl-isg.cloud.databricks.com/" target="_blank">deere-edl-isg</a>
                                    </td>
                                    <td>
                                        <div>If you work for ISG this is the workspace dedicated to you and your organization.</div>
                                    </td>
                                </thead>

                                <thead>
                                    <td>
                                        <a class="external-link" href="https://deere-internal.cloud.databricks.com/" target="_blank">deere-internal</a>
                                    </td>
                                    <td>
                                        <div>Less common use cases. Use this environment if you need to move data from a John deere data center to the data lake.</div>
                                    </td>
                                </thead>

                                <thead>
                                    <td>
                                        <a class="external-link" href="https://deere-edl-expertalerts.cloud.databricks.com/" target="_blank">deere-edl-expertalerts</a>
                                    </td>
                                    <td>
                                        <div>This workspace is dedicated for use for Expert Alerts. If you create rules for Expert Alerts, you are welcome to use this workspace.</div>
                                    </td>
                                </thead>
                            </Table>

                        </Card.Body>
                    </Card>
                </div>
            </Container>
        </div>
    )
}

export default LandingPage;
