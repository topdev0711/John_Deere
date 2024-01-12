import AllowedPermissions from '../../components/AllowedPermissions'
import Adapter from 'enzyme-adapter-react-16';
import { configure, shallow, mount } from 'enzyme';
import {Alert, ListGroup, Button, ToggleButtonGroup, Accordion as ReactAccordion} from 'react-bootstrap';
import { act } from 'react-dom/test-utils'

configure({ adapter: new Adapter() });

jest.mock('next/router')
describe('AllowedPermissions test suite', () => {


  const createPermissionsForToggle = () => {
    return(
      [
        {id: 0, name: 'P1', roleType: 'human', group: 'group', version: 1},
        {id: 1, name: 'P2', roleType: 'human', group: 'group', version: 1, endDate: '2020-10-05T05:00:00.000Z'}
      ]
    )
  }

  it('should render correctly with zero permissions', () => {
    const wrapper = shallow(<AllowedPermissions permissions={[]} />)
    const paragraphs = wrapper.find(Alert).find('p')
    expect(paragraphs).toHaveLength(2)
    expect(paragraphs.at(0).prop('hidden')).toEqual(true)
    expect(paragraphs.at(1).prop('hidden')).toEqual(false)
  })

  it('should render correctly with less than 10 permissions', () => {
    const permissions = [{ id: 0, name: 'Subha', roleType: 'human', group: 'group', version: 1 }, { id: 1, name: 'Prada', group: 'group', roleType: 'system', clientId: 'client', version: 2 }]
    const wrapper = mount(<AllowedPermissions permissions={permissions} />)
    const toggle = wrapper.find(ReactAccordion.Toggle)
    toggle.at(0).simulate("click")
    const items = wrapper.find(ListGroup).find(ListGroup.Item)
    expect(items).toHaveLength(2)
  })

  it('should render correctly with all permissions', () => {
    const permissions = (new Array(15)).fill({ id: 0, name: 'Subha', roleType: 'human', group: 'group', version: 1 })
    const wrapper = mount(<AllowedPermissions permissions={permissions} />)
    const toggle = wrapper.find(ReactAccordion.Toggle)
    toggle.at(0).simulate("click")
    const items = wrapper.find(ListGroup).find(ListGroup.Item)
    expect(items).toHaveLength(15)
  })

  it('should render correctly display permissions alphabetically', () => {
    const permissions = [{ id: 0, name: 'Subha', roleType: 'human', group: 'group', version: 1 }, { id: 1, name: 'Prada', group: 'group', roleType: 'system', clientId: 'client', version: 2 }]
    const wrapper = mount(<AllowedPermissions permissions={permissions} />)
    const toggle = wrapper.find(ReactAccordion.Toggle)
    toggle.at(0).simulate("click")
    const items = wrapper.find(ListGroup).find(ListGroup.Item)
    expect(items).toHaveLength(2);
    expect(items.at(0).text()).toEqual("Prada")
    expect(items.at(1).text()).toEqual('Subha')
  })

  it('should display modal', async () => {
    const permissions = [{ id: 0, name : 'blah', roleType: 'human', group: 'group', version: 1 }]
    const wrapper = mount(<AllowedPermissions permissions={permissions} />)
    wrapper.setState({
      selectedPermission: null,
      showPreview: true
    })
    
    const toggle = wrapper.find(ReactAccordion.Toggle)
    toggle.at(0).simulate("click")

    const items = wrapper.find(ListGroup).find(ListGroup.Item)
    expect(items).toHaveLength(1)
    expect(items.at(0).text()).toEqual("blah")
  })

  it('should handle click in modal', async () => {
    const permissions = [{ id: '1', roleType: 'human', group: 'group', version: 1 }]
    const wrapper = mount(<AllowedPermissions permissions={permissions} />)

    wrapper.setState({
      selectedPermission: null,
      showPreview: true
    })

    const button = wrapper.find('PermissionModal').at(0).find(Button).at(1)
    expect(wrapper.find('PermissionModal').at(0).find(Button)).toHaveLength(2)

    act(() => {
      button.props().onClick()
    })

    expect(wrapper.state().selectedPermission).toEqual(null)
  })

  it('should cancel modal', () => {
    const permissions = [{ id: 0, roleType: 'human', group: 'group', version: 1 }]
    const wrapper = shallow(<AllowedPermissions permissions={permissions} />)
    wrapper.setState({
      showPreview: true,
      selectedPermission: permissions[0]
    })

    act(() => {
      wrapper.find('PermissionModal').at(0).props().onCancel()
    })

    expect(wrapper.state().selectedPermission).toEqual(null)
    expect(wrapper.state().showPreview).toEqual(false)
  })

  it('should default to showing active permissions', async () => {
    const wrapper = mount(<AllowedPermissions permissions={createPermissionsForToggle()}/>);
    const toggle = wrapper.find(ToggleButtonGroup);
    expect(toggle.prop('value')).toEqual('active');
  })

  it('should show only active permissions when the active toggle is selected', () => {
    const wrapper = mount(<AllowedPermissions permissions={createPermissionsForToggle()} />)
    const items = wrapper.find(ListGroup).find(ListGroup.Item);
    expect(items.length).toEqual(1);
    expect(items.at(0).text()).toEqual('P1');
  })

  it('should show only expired permissions when the expired toggle is selected', () => {
    const wrapper = mount(<AllowedPermissions permissions={createPermissionsForToggle()}/>)
    wrapper.setState({selectedStatus: 'expired'});
    wrapper.update();

    const toggle = wrapper.find(ReactAccordion.Toggle)
    toggle.at(0).simulate("click")

    const items = wrapper.find(ListGroup).find(ListGroup.Item);
    expect(items.length).toEqual(1);
    expect(items.at(0).text()).toEqual('P2');
  })
})
