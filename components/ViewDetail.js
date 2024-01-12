import React , { useState, useEffect } from 'react';
import {Nav,  Tab} from "react-bootstrap";
import Spacer from './Spacer';
import { Card } from "react-bootstrap";
import Fields from './Fields';
import ListedDatasets from './ListedDatasets';
import AllowedPermissions from './AllowedPermissions';
import utils from "./utils";
import { MdSelectAll } from "react-icons/md";
import {FaAsterisk} from 'react-icons/fa';
import {getGroupsPermissions} from "../apis/permissions";

const styles = {
  meta: {
    paddingRight: '15px',
    paddingBottom: '5px',
    display: 'block',
    color: '#777'
  },
  viewNotices: {
    color: 'green',
    marginBottom: '15px',
    fontSize: '10pt'
  },
  tabChanges: {
    fontSize: '10px',
    marginTop:'-4px',
    color: '#e69d00'
  },
  magrinZero: {
    margin: 0
  }
};

async function getViewDetails(name) {
  return fetch(`/api/views/${name}`, {
    credentials: 'same-origin',
    method: 'GET',
    headers: {'Content-Type': 'application/json'}
  });
}

const ViewDetail = (props) => {
  const viewName = props.router.query.id;
  const groups = props.appProps?.loggedInUser?.groups;
  const id = viewName;
  const [permissions, setPermissions] = useState([]);
  const [viewDetails, setViewDetails] = useState({});
  const [ error, setError ] = useState('');

  const {isDynamic = false, description = '', fields = [], datasets = [] } = viewDetails;

  useEffect(() => {
    async function loadViewDetails() {
      if(viewName && !viewDetails[viewName]){
        try {
          const res = await getViewDetails(viewName);
          if(res.ok) {
            const fullResponse = await res.json();
            setViewDetails(fullResponse);
          } else {
            const error = await res.json();
            console.error(error)
            setError(error.error);
          }
        } catch (error) {
          console.error(error);
          setError('An unexpected error occurred when getting view details.');
        }
      }
    }

    async function loadPermissions() {
      if(!!groups){
        try {
          const userPermissions = await getGroupsPermissions(groups, ['human', 'system']);
          setPermissions(userPermissions)
        } catch (error) {
          console.error(error);
          setError('An unexpected error occurred when getting permissions.');
        }
      }

    }
    loadViewDetails();
    loadPermissions();
  }, [viewName, groups]);

return (
    <>
      <h2>View Details</h2>
      <Spacer height="20px" />
      { error &&
        <div id='error-div'> {error} </div>
      }
      { !error &&
       <div>
          <Card>
              <Card.Body className='detail-summary'>
                <div id='view-name'>
                  <h3>
                    {viewName}
                  </h3>
                </div>
                <div id="dynamic-fields-overlay" style={styles.viewNotices}>
                  {isDynamic &&
                      <div id="dynamic-fields">  <span id="dynamic-fields-span" ><MdSelectAll /> Dynamic Fields</span> </div>
                  }
                </div>
                <div id="view-description" className="text-muted">
                  <i>{description}</i>
                </div>
                <Spacer height="14px" />
              </Card.Body>
          </Card>
          <Spacer />
              <Tab.Container mountOnEnter={true} unmountOnExit={true} transition={false} id="left-tabs-example" defaultActiveKey={`structure-${id}`}>
                <Nav id={id + "tabs"} size="sm" variant="tabs" className="uxf-nav-tabs-medium" style={styles.magrinZero}>
                  <Nav.Item>
                    <Nav.Link eventKey={`structure-${id}`}>Structure</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey={`datasets-${id}`}>
                      Related Datasets
                      <>&nbsp;<FaAsterisk style={styles.tabChanges}/> </>
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey={`view-permissions-${id}`}>View Permissions</Nav.Link>
                  </Nav.Item>
                </Nav>
                <Tab.Content>
                  <Tab.Pane eventKey={`structure-${id}`}>
                    <Spacer height="20px" />
                    <Fields
                      id={id}
                      fields={fields}
                      added=''
                      removed=''
                      previous=''
                      diffFormatter=''
                    />
                  </Tab.Pane>
                  <Tab.Pane eventKey={`datasets-${id}`}>
                    <Spacer height="20px" />
                    <ListedDatasets displayedDatasets={datasets} type='views' isLoading={false}/>
                  </Tab.Pane>
                  <Tab.Pane eventKey={`view-permissions-${id}`}>
                    <Spacer height="20px" />
                    <AllowedPermissions permissions={utils.findPermissionsWithAccessToView(viewName, permissions)} isLoading={false} isView={true} />
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
        </div>
      }
      </>
  )
}

export default ViewDetail;
