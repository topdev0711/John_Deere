import {mount, shallow} from "enzyme";
import Searchbar from "../../../../components/permissions/search/Searchbar";
import {FormControl} from "react-bootstrap";
import {useRouter} from "next/router";
import {useGetPermissionsSwr} from '../../../../apis/permissions';

jest.mock("next/router", () => ({
  useRouter() {
    return {query: ''}
  }
}));

jest.mock('../../../../apis/permissions');

describe('permissions searchbar tests', () => {
  it('should have no permissions count when component starts', () => {
    useGetPermissionsSwr.mockReturnValue({error: undefined, data: undefined});
    const searchbar = mount(<Searchbar />);
    const form = searchbar.find(FormControl);
    expect(form.props().placeholder).toEqual('Search permissions');
  });

  it('should have blank permissions count when it fails to get count', () => {
    useGetPermissionsSwr.mockReturnValue({error: 'someError', data: undefined});
    const searchbar = mount(<Searchbar />);
    const form = searchbar.find(FormControl);
    expect(form.props().placeholder).toEqual('Search permissions');
  });

  it('should show permissions count', () => {
    useGetPermissionsSwr.mockReturnValue({error: undefined, data: {permissions: 125}});
    const searchbar = mount(<Searchbar />);
    const form = searchbar.find(FormControl);
    expect(form.props().placeholder).toEqual('Search 125 permissions');
  });

  it('should show initial search terms', () => {
    useGetPermissionsSwr.mockReturnValue({error: undefined, data: {permissions: 125}});
    const searchbar = mount(<Searchbar />);
    const form = searchbar.find(FormControl);
    expect(form.props().defaultValue).toEqual(undefined);
  });
});
