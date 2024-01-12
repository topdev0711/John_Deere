import React from "react";
import { Alert, ListGroup, Modal, Button, Spinner } from "react-bootstrap";
import UserModal from '../components/UserModal';
import Accordion from './Accordion'
import AllowedPermissionsToggleGroup from "./AllowedPermissionsToggleGroup";
import utils from './utils';
import DownloadCSV from "./DownloadCSV";
import PermissionModal from "./PermissionModal";
global.fetch = require('node-fetch');

export default class AccessiblePermissions extends React.Component {
  state = {
    showAll: false,
    selectedPermission: null,
    showPreview: false
  }

  render() {
    const { permissions, isLoading, isView, datasetId = '', hasAccess = false } = this.props
    const { showAll, showPreview, selectedPermission, selectedStatus = "active" } = this.state

    permissions?.sort((a, b) => {
      return a.name.localeCompare(b.name)
    })

    const handleStatusSelection = selection => this.setState({selectedStatus: selection});
    const isSelectedStatusActive = selectedStatus === "active";
    const activePermissions = permissions.filter(permission => !utils.isPermExpired(permission));
    const expiredPermissions = permissions.filter(permission => utils.isPermExpired(permission));
    let visiblePermissions = isSelectedStatusActive ? activePermissions : expiredPermissions;
    const permissionsMap = new Map();
    visiblePermissions.forEach(ob => {
      let res = permissionsMap.get(ob.group) || [];
      res.push(ob);
      permissionsMap.set(ob.group , res);
    });
    const elementsFromMap = Array.from(permissionsMap.entries())?.sort();
    const showAllPermissions = elementListFromMap => showAll ? elementListFromMap : elementListFromMap?.slice(0, 10)
    const visibleElements = showAllPermissions(elementsFromMap);
    const numToggledPermissions = isSelectedStatusActive ? activePermissions.length : expiredPermissions.length;
    const isVisibleDownloadButton = hasAccess && !!permissions.length;
    const areRemainingPermissions = elementsFromMap.length > visibleElements.length;
    const numRemainingPermissions = elementsFromMap.length - visibleElements.length;

    const getADGroupVerbiage = num => num > 1 ? "AD Groups" : "AD group";
    const getPermissionsVerbiage = num => num > 1 ? "permissions" : "permission";
    const getVerbVerbiage = num => num > 1 ? "have" : "has";
    const getContainVerbiage = num => num > 1 ? "contain" : "contains";
    const adGroupString = getADGroupVerbiage(numRemainingPermissions);

  
    return (
      <>
        <PermissionModal permission={selectedPermission} show={showPreview} onCancel={() => this.setState({ selectedPermission: null, showPreview: false })} />
        <div hidden={isLoading}>
          <Alert variant="dark">
            <div className="text-muted small mb-0">
              <p hidden={!numToggledPermissions} className="uxf-alert-description">The following <b>{elementsFromMap.length} {getADGroupVerbiage(elementsFromMap.length)}</b> {getContainVerbiage(elementsFromMap.length)} <b>{numToggledPermissions} {isSelectedStatusActive && <span>active</span>}{!isSelectedStatusActive && <span>expired</span>} {getPermissionsVerbiage(numToggledPermissions)}</b> that {getVerbVerbiage(numToggledPermissions)} {!!isView && <span>explicit</span>} access to this {!!isView && <span>view</span>}{!isView && <span>dataset</span>}.
                {isVisibleDownloadButton && <DownloadCSV datasetId={datasetId} />}
              </p>
              <p hidden={!!numToggledPermissions} className="uxf-alert-description">There are <b>no {isSelectedStatusActive && <span>active</span>}{!isSelectedStatusActive && <span>expired</span>} permissions</b> that have access to this {!!isView && <span>view</span>}{!isView && <span>dataset</span>}.
                {isVisibleDownloadButton && <DownloadCSV datasetId={datasetId} />}
              </p>
              {isVisibleDownloadButton && <span style={{position: 'absolute', top: 10, right : 60}}>
                <AllowedPermissionsToggleGroup selectedStatus={selectedStatus} handleStatusSelection={handleStatusSelection} />
              </span>}
              {!isVisibleDownloadButton && <span style={{position: 'absolute', top: 10, right : 20}}>
                <AllowedPermissionsToggleGroup selectedStatus={selectedStatus} handleStatusSelection={handleStatusSelection} />
              </span>}
            </div>
          </Alert>
          {visibleElements.length > 0 &&
          <Accordion id="permissionAccordion" items={visibleElements.map((value) => {
            return {
              id: value[0],
              header : <UserModal linkName={`${value[0]} (${value[1].length})`} groupName={value[0]} isCommunity={true} />,
              body: (
                <ListGroup className="text-muted small">
                  {value[1].map(permission => (
                  <ListGroup.Item key={permission.id} action onClick={() => this.setState({ selectedPermission: permission, showPreview: true })}>
                    {permission.name}
                  </ListGroup.Item>
                  ))}
                </ListGroup>
              ),
            }
           })}/>
          }

          {areRemainingPermissions &&
            <Button onClick={() => this.setState({ showAll: true })} size="sm" variant="outline-primary">
                Show remaining {numRemainingPermissions} {selectedStatus} {adGroupString}
            </Button>
          }
        </div>
        <div className="text-muted small" align="center" hidden={!isLoading}>
          <Spinner className="spinner-border uxf-spinner-border-md" animation="border" role="status">
            <span className="sr-only">Loading...</span>
          </Spinner>
        </div>
      </>
    )
  }
}
