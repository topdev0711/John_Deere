import PermissionDropdown from './PermissionDropdown';
import { MdCheck, MdLayers, MdLockOutline } from "react-icons/md";
import React, { useState } from "react";
import Router from 'next/router';
import {Button, Card} from "react-bootstrap";
import Spacer from "./Spacer";

const summary = { marginTop: '8px', paddingBottom: '10px' };
const summaryDetail = { color: '#777', paddingRight: '15px', paddingBottom: '5px', display: 'block'};
const leftText = {maxWidth: '90%' };
const descriptionText = { ...leftText, fontSize: '11pt' };
const iconDetails = { color: 'green', float: 'right', right: '5px', position: 'relative', paddingLeft: '15px', paddingBottom: '5px', paddingRight: '10px'};
const unselecteditem = { marginTop: '10px', paddingLeft: '20px', paddingTop: '10px'};
const selectedItem = { ...unselecteditem, backgroundColor: '#f6f6f6'};

const getDescription = permissions => {
  const description = permissions.map(p => p.name).join(', ');
  return description.length > 200 ? description.substring(0, 200) + '...' : description;
}

const getPermissionRoute = (name, roleType) => {
  const detailType = roleType === 'human' ? 'group' : 'clientId';
  return `/catalog/permissions/summary-detail?${detailType}=${name}`
}

const PermissionButton = ({name, roleType}) => {
  const handleClick = e => {
    e.stopPropagation();
    e.preventDefault();
    Router.push(getPermissionRoute(name, roleType));
  };

  return <Button style={{padding: 0, textAlign: 'left'}} size="lg" variant="link" onClick={handleClick}>
           <span>{name}</span>
         </Button>
}

const PermissionCard = ({name, roleType, permissions, isMember}) => {
  const [ selected, setSelected ] = useState(false);
  const cardStyle = () => selected ? selectedItem : unselecteditem;

  return (
    <div key={name} onMouseEnter={() => setSelected(true)} onMouseLeave={() => setSelected(false)}>
      <Card style={cardStyle()}>
        <Card.Title style={leftText}><PermissionButton name={name} roleType={roleType}/></Card.Title>
        <div style={descriptionText} className="text-muted"><i>{getDescription(permissions)}</i></div>
        <Spacer height="20px" />
        <div style={summary} className="text-muted small">
          <span className="d-md-inline" style={summaryDetail}>
            <MdLayers size="18" /><b>User Type: </b><i>{roleType}</i>
          </span>
          <span className="d-md-inline" style={summaryDetail}>
            <MdLockOutline size="18" /> <b>Permissions: </b> <PermissionDropdown permissions={permissions}/>
          </span>
          {isMember && <span id="isMember" style={iconDetails}><MdCheck /> Member</span>}
        </div>
      </Card>
    </div>
  );
 };

export default PermissionCard;
