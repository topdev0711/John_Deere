import {MdHome as HomeIcon} from "react-icons/md";
import React from "react";

const baseLinks = () => [
  { name: 'Home', url: '/datasets', icon: <HomeIcon className="nav-home-icon"/>},
  { name: 'Catalog', url: '/datasets', dropdown: [
      { name: 'Datasets', url: '/datasets' },
      { name: 'Permissions', url: '/permissions' }
    ] },
  { name: 'Approvals', url: '/approvals', withBadgeValue: 'pendingApprovals' },
  { name: 'Help', url: '/docs' },
  { name: 'Contact', url: '/contact' }
]

const externalLinks = [
  {name: 'Privacy & Data', url: 'https://www.deere.com/en/privacy-and-data/'},
  {name: 'Terms of Use', url: 'https://www.deere.com/en/privacy-and-data/terms/'}
];

const headerLinks = baseLinks();
const footerLinks = [...baseLinks(), ...externalLinks];

export { headerLinks, footerLinks };
