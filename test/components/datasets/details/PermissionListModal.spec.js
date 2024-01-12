import PermissionListModal from '../../../../components/datasets/details/PermissionListModal';
import { Modal, Button } from "react-bootstrap"; 
import { shallow } from "enzyme";
import { getRequestAccessButton } from '../../../../components/datasets/details/RequestAccessButton';

jest.mock('next/router')

describe('PermissionListModal tests', () => {
  it("verify component renders correctly", () => {
    const wrapper = shallow(<PermissionListModal show={true} permissions = {[]} />);
    const modal = wrapper.find(Modal);
    const modalBody = modal.find(Modal.Body);
    const modalFooter = modal.find(Modal.Footer);
    const buttons = modalFooter.find(Button);
    expect(modal).toHaveLength(1);
    expect(modal.props().show).toEqual(true);
    expect(modalBody).toHaveLength(1);
    expect(modalFooter).toHaveLength(1);
    expect(buttons).toHaveLength(2);
    expect(modalFooter.childAt(0).text()).toEqual('Are you sure you want to add a new permission?');
    expect(buttons.at(0).text()).toEqual("No");
    expect(buttons.at(1).text()).toEqual("Yes");
  });

  it('should render the list of permissions passed as props', () => {
    const permissions = [
      {name: 'foo'},
      {name: 'bar'},
      {name: 'foo bar'}
    ];
    const wrapper = shallow(<PermissionListModal show={true} permissions={permissions} />);
    expect(wrapper.find('ul').children()).toHaveLength(permissions.length);
  });

  it('should render the correct title', () => {
    const wrapper = shallow(<PermissionListModal show={true} permissions={[]} isViewRequest/>);
    expect(wrapper.find(Modal.Title).text()).toEqual('You already have access to this view provided by the following permissions');
  });
});
