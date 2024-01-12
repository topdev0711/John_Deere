import {mount, shallow} from "enzyme";
import {MdHome as HomeIcon} from "react-icons/md";
import React from "react";
import {useRouter} from "next/router";
import HeaderLink from "../../components/HeaderLink";
import {Dropdown, NavItem} from "react-bootstrap";

const anyPath = '/anyPath';

jest.mock("next/router", () => ({
  useRouter() {return {asPath: anyPath, push: jest.fn()}}
}));

const dropdown = ({name: 'Catalog', url: '/datasets', dropdown: [{name: 'Datasets', url: anyPath}]});
const icon = ({name: 'Home', url: anyPath, icon: <HomeIcon className="nav-home-icon"/>});
const text = ({name: 'Help', url: anyPath, withBadgeValue: 'pendingApprovals'});

describe('HeaderLink tests', () => {
  it('should be an dropdown header', () => {
    const headerLink = shallow(<HeaderLink link={dropdown}/>);
    expect(headerLink.exists(Dropdown)).toEqual(true);
  });

  it('should highlight a dropdown header', () => {
    const headerLink = shallow(<HeaderLink link={dropdown}/>);
    const className = headerLink.find(Dropdown).prop('className');
    expect(className).toEqual('active');
  });

  it('should not highlight a dropdown header', () => {
    const dropdown = ({name: 'Catalog', url: '/datasets', dropdown: [{name: 'Datasets', url: 'differentPath'}]});
    const headerLink = shallow(<HeaderLink link={dropdown}/>);
    const className = headerLink.find(Dropdown).prop('className');
    expect(className).toEqual('');
  });

  it('should highlight a dropdown item', () => {
    const headerLink = mount(<HeaderLink link={dropdown}/>);
    const itemClassName = headerLink.find('NavItem').prop('className');
    expect(itemClassName.includes('active')).toEqual(true)
  });

  it('should not highlight a dropdown item', () => {
    const dropdown = ({name: 'Catalog', url: '/datasets', dropdown: [{name: 'Datasets', url: 'differentPath'}]});
    const headerLink = mount(<HeaderLink link={dropdown}/>);
    const itemClassName = headerLink.find('NavItem').prop('className');
    expect(itemClassName.includes('active')).toEqual(false)
  });

  it('should be an icon header', () => {
    const headerLink = shallow(<HeaderLink link={icon}/>);
    expect(headerLink.exists('a')).toEqual(true);
  });

  it('should be an text header', () => {
    const headerLink = shallow(<HeaderLink link={text}/>);
    expect(headerLink.exists('#Help-text')).toEqual(true);
  });

  it('should be text with badge header', () => {
    const headerLink = shallow(<HeaderLink link={text} badges={{pendingApprovals: 1}}/>);
    const badgeHidden = headerLink.find('span').prop('hidden');
    expect(badgeHidden).toEqual(false);
  });

  it('should not display text badge when zero', () => {
    const headerLink = shallow(<HeaderLink link={text} badges={{pendingApprovals: 0}}/>);
    const badgeHidden = headerLink.find('span').prop('hidden');
    expect(badgeHidden).toEqual(true);
  });

  it('should be text with missing badges', () => {
    const headerLink = shallow(<HeaderLink link={text} />);
    const badgeHidden = headerLink.find('span').prop('hidden');
    expect(badgeHidden).toEqual(true);
  });

  it('should be text with missing badge', () => {
    const headerLink = shallow(<HeaderLink link={text} badges={{}}/>);
    const badgeHidden = headerLink.find('span').prop('hidden');
    expect(badgeHidden).toEqual(true);
  });

  it('should highlight text header', () => {
    const headerLink = shallow(<HeaderLink link={text} badges={{pendingApprovals: 1}}/>);
    const textClass = headerLink.find(NavItem).prop('className');
    expect(textClass).toEqual('active');
  });

  it('should not highlight text header', () => {
    const text = ({name: 'Help', url: 'differentPath', withBadgeValue: 'pendingApprovals'});
    const headerLink = shallow(<HeaderLink link={text} badges={{pendingApprovals: 1}}/>);
    const textClass = headerLink.find(NavItem).prop('className');
    expect(textClass).toEqual('');
  });

  it('should not highlight home', () => {
    const headerLink = shallow(<HeaderLink link={icon}/>);
    const homeClass = headerLink.find(NavItem).prop('className');
    expect(homeClass).toEqual('');
  });
});
