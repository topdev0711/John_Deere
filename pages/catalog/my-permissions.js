import {withRouter} from "next/router";
import React, { useEffect, useState } from 'react'
import {Card, Nav, Tab} from "react-bootstrap";
import { groupBy, sortBy } from 'lodash/collection';
import { getGroupsPermissions } from '../../apis/permissions';
import PermissionCard from '../../components/PermissionCard';
import Records from '../../components/Records';
import Spacer from "../../components/Spacer";
import SmallSpinner from "../../components/SmallSpinner";
import {AppStateConsumer} from "../../components/AppState";

const createGroupProps = (groupedPermissions, name) => {
  const permissions = groupedPermissions[name];
  const {roleType} = permissions[0];
  return {name, roleType, permissions, isMember: true};
}

const getCardProps = (permissions, role) => {
  const groupKey = role === 'human' ? 'group' : 'clientId';
  const groupedPermissions = groupBy(sortBy(permissions, groupKey), groupKey);
  return Object.keys(groupedPermissions).map(name => createGroupProps(groupedPermissions, name));
}

const TabBody = ({roleType, groups}) => {
  const [groupPermissions, setGroupPermissions] = useState(null);
  const [hasError, setHasError] = useState(false);
  const getPermissions = () => getGroupsPermissions(groups, [roleType]);

  useEffect(() => {
    getPermissions().then(data => setGroupPermissions(data))
      .catch(e => {
        console.error(e.stack);
        setHasError(true);
      })
  }, []);

  if (hasError) return <div>failed to load</div>;
  if(!groupPermissions) return <SmallSpinner />;

  const cardProps = getCardProps(groupPermissions, roleType);
  const permissionCards = cardProps.map(cardProp => <PermissionCard {...cardProp} />);
  return <Records recordType="permission" records={permissionCards} />
}

const RoleTabContent = ({role, groups}) =>
   <Tab.Pane eventKey={role}>
    <Card.Body>
      <Card.Text><TabBody roleType={role.toLowerCase()} groups={groups} /></Card.Text>
    </Card.Body>
  </Tab.Pane>

const MyPermissions = ({ loggedInUser: { groups }}) => {
  return (
    <>
      <h2>My Permissions</h2>
      <Spacer height="20px"/>
      <Tab.Container transition={false} defaultActiveKey="Human">
        <Nav size="sm" variant="tabs" className="uxf-nav-tabs-medium">
          <Nav.Item key="humanItem"><Nav.Link eventKey="Human">Human</Nav.Link></Nav.Item>
          <Nav.Item key="systemItem"><Nav.Link eventKey="System">System</Nav.Link></Nav.Item>
        </Nav>
        <Tab.Content>
          <RoleTabContent role={"Human"} groups={groups} />
          <RoleTabContent role={"System"} groups={groups} />
        </Tab.Content>
      </Tab.Container>
      <br/>
    </>
  )
};

const MyPermissionsPage = withRouter(props => (
  <AppStateConsumer>{({ loggedInUser }) => (<MyPermissions {...props} loggedInUser={loggedInUser}/>)}</AppStateConsumer>
));

export default MyPermissionsPage;

