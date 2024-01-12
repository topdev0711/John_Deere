import {useRouter} from "next/router";
import React from "react";
import {Badge, Dropdown, NavLink, NavItem} from "react-bootstrap";
import {MdKeyboardArrowDown} from "react-icons/md";
import Link from "next/link";
import styles from '../public/css/components/HeaderLink.module.css';

const HeaderLink = ({link, badges}) => {
  const router = useRouter();
  const getActiveStatus = path => router.asPath.startsWith(path) ? 'active' : '';

  const dropdownHeader = ({name, dropdown}) => {
    const active = dropdown.some(link => router.asPath.startsWith(link.url));
    const highlightDropdown = active ? 'active' : '';

    const createItem = ({name, url}) => {
      const active = getActiveStatus(url);
      return <Dropdown.Item key={name} id={`${name}-dropdown-item`} className={active}><Link href={url}>{name}</Link></Dropdown.Item>

    }

    return (
      <Dropdown key={require('uuid').v4()} as={NavItem} className={highlightDropdown}>
        <Dropdown.Toggle style={{paddingRight: '3px'}} as={NavLink} id="navbarDropdown1">
        <span className="uxf-link-text">{name} <MdKeyboardArrowDown/></span>
        </Dropdown.Toggle>
        <Dropdown.Menu>{dropdown.map(createItem)}</Dropdown.Menu>
      </Dropdown>
    )
  }

  const iconHeader = ({icon, url}) => <a className={`${styles.icon} nav-icon`} aria-label="home page" href={url}>{icon}</a>;

  const textHeader = ({name, withBadgeValue, url}) => {
    const hasBadgeValue = badges && Object.keys(badges).length && withBadgeValue;
    const badgeValue = hasBadgeValue ? badges[withBadgeValue] : 0;
    const badgeHeader = () => (<span hidden={badgeValue === 0}>&nbsp;&nbsp;<Badge pill variant="warning">{badgeValue}</Badge></span>)
    return (<NavLink id={`${name}-text`} href={url}>{name}{!!withBadgeValue && badgeHeader()}</NavLink>)

  }

  if (!!link.dropdown) return dropdownHeader(link);
  const header = link.icon ? iconHeader(link) : textHeader(link);
  const highlightUrl = link.name !== 'Home' ? getActiveStatus(link.url) : '';
  return <NavItem key={link.url} className={highlightUrl}>{header}</NavItem>;
}

export default HeaderLink;
