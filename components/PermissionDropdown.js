import {Dropdown} from "react-bootstrap";
import {MdKeyboardArrowDown} from 'react-icons/md';
import React from "react";
import Router from 'next/router';
import utils from "./utils";

/* istanbul ignore next */
const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
  <a style={{cursor: 'pointer'}} ref={ref} onClick={e => { e.preventDefault(); onClick(e); }}>
    {children}
  </a>
));

const PermissionDropdown = ({permissions}) => <Dropdown as={'span'}>
  <Dropdown.Toggle as={CustomToggle} id="dropdown-custom-components">
    <i>{permissions.length} <MdKeyboardArrowDown/></i>
  </Dropdown.Toggle>
  <Dropdown.Menu>
    <Dropdown.Header>{permissions.length} Permission(s)</Dropdown.Header>
    <Dropdown.Divider/>
    {permissions.map(p => {
      const isEffective = utils.isPermEffective(p);
      return (
        <Dropdown.Item key={p.id} eventKey={p.id} onClick={() => Router.push(`/catalog/permissions/detail?id=${p.id}`)}>
          {p.name}<span hidden={isEffective} style={{color: isEffective ? undefined : '#c21020'}} className="small"> (Expired)</span>
        </Dropdown.Item>
      )
    })}
  </Dropdown.Menu>
</Dropdown>;

export default PermissionDropdown;
