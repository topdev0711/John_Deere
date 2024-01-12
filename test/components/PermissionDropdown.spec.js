import Router from 'next/router';
import PermissionDropdown from '../../components/PermissionDropdown';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import {Dropdown} from "react-bootstrap";
import { act } from 'react-dom/test-utils';

configure({ adapter: new Adapter() });

jest.mock('next/router');

const perms = [
  {id: 'foo', name: 'Foo', startDate: '2020-01-27T15:53:10.371Z', endDate: '2025-01-28T15:53:10.371Z'},
  {id: 'bar', name: 'Bar', startDate: '2020-01-21T15:53:10.371Z', endDate: '2020-01-22T15:53:10.371Z'}
];

describe('PermissionDropdown test suite', () => {
  it('should render', () => {
    const wrapper = shallow(<PermissionDropdown permissions={perms} />);
    expect(wrapper).toBeDefined();
  });

  it('should render with perms', () => {
    const wrapper = shallow(
      <PermissionDropdown permissions={perms} />
    );
    const items = wrapper.find(Dropdown.Item);
    expect(items.at(0).text()).toContain('Foo');
    expect(items.at(0).find('span').prop('hidden')).toEqual(true);
    expect(items.at(1).text()).toContain('Bar');
    expect(items.at(1).find('span').prop('hidden')).toEqual(false);
  });

  it('should handle click', () => {
    const wrapper = shallow(
      <PermissionDropdown permissions={[perms[0]]} />
    );
    const items = wrapper.find(Dropdown.Item);
    act(() => {
      items.at(0).prop('onClick')();
    });
    expect(Router.push).toHaveBeenCalledWith('/catalog/permissions/detail?id=foo');
  });
})
