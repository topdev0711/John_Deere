import classNames from 'classnames';
import React from 'react';
import Link from "next/link";
import UxfFooter from './UXFrame/Footer/UxfFooter';
import {footerLinks} from "../components/utils/siteLinks";
import styles from "../public/css/components/Footer.module.css";

const ListItem = ({className, variant, children, ...props}) => {
  const classes = classNames(className, variant) || null;
  return (<li{...props} className={classes}>{children}</li>);
}

const List = ({className, children, variant, as: Component, ...props}) => {
  const classes = classNames(className, variant) || null;
  return (<div{...props} className={classes}>{children}</div>);
}

const Footer = () => {
  const FooterLink = ({name, url}) => (<ListItem key={url}><Link href={url}><a className={styles.link}>{name}</a></Link></ListItem>);
  const links = footerLinks.map(({name, url}) => <FooterLink key={url} name={name} url={url}/>);
  return (<UxfFooter><List className="nav">{links}</List></UxfFooter>);
}

/* istanbul ignore next */
export default Footer;
