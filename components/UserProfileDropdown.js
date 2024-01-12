import Dropdown from "react-bootstrap/Dropdown";
import Link from "next/link";
import React from "react";

const UserProfileDropDown = ({ user }) => {
  if (!user) return <></>;

  return (
  <Dropdown alignRight>
    <Dropdown.Toggle variant="link" size="sm">
      Hey, <span className="uxf-header-title-username">{user.firstName}</span>{' '}
    </Dropdown.Toggle>
    <Dropdown.Menu>
      <Dropdown.Item href={user.url} target="_blank">My Profile</Dropdown.Item>
      <Dropdown.Item><span><Link href={"/catalog/my-permissions"}>My Permissions</Link></span></Dropdown.Item>
      <Dropdown.Item><span><Link href={"/catalog/my-applications"}>My Applications</Link></span></Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>
  )
};

export default UserProfileDropDown;
