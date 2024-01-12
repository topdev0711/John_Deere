import React, {useState} from 'react';
import UxfHeader from './UXFrame/Header/UxfHeader';
import {MdNotifications} from 'react-icons/md';
import {Button, Nav} from 'react-bootstrap';
import {headerLinks} from "./utils/siteLinks";
import AnnouncementsModal from "./AnnouncementsModal";
import UserProfileDropDown from "./UserProfileDropdown";
import HeaderLink from "./HeaderLink";
import styles from "../public/css/components/Header.module.css";

const HeaderLinks = ({badges}) => <Nav>{headerLinks.map(link => <HeaderLink link={link} badges={badges}/>)}</Nav>

const AnnouncementButton = ({setShowAnnouncements}) => {
  const handleClick = () => setShowAnnouncements(true);
  return <Button className={styles['announce-btn']} size="sm" variant="warning" id={'announcements'} onClick={handleClick}>
    <MdNotifications size="20"/>&nbsp; Announcements
  </Button>
};

const Header = ({badges, user, announcements, title, inputProps, formProps}) => {
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  return (
    <>
      <UxfHeader
          submitBtnProps={{ariaLabel: 'Search'}}
          clearBtnProps={{ariaLabel: 'Clear search'}}
          headerTitleComponent={<UserProfileDropDown user={user}/>}
          pageHeading={title}
          inputProps= {inputProps}
          formProps={formProps}>
        <HeaderLinks badges={badges} />
        {!!announcements?.length && <AnnouncementButton setShowAnnouncements={setShowAnnouncements} />}
      </UxfHeader>
      <AnnouncementsModal announcements={announcements} showAnnouncements={showAnnouncements} setShowAnnouncements={setShowAnnouncements} />
      <div id="content"/>
    </>
  );
}

export default Header;
