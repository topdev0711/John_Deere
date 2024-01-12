import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import PermissionFormWizard from "../../components/PermissionFormWizard";
import Select from "../../components/Select";

configure({ adapter: new Adapter() });

describe('PermissionFormWizard Test Suite', () => {
  it('should render', () => {
    const wrapper = shallow(<PermissionFormWizard />);
    expect(wrapper).toBeDefined();
  });

  it('should render with options', () => {
    const opts = [{id: 'id1', name: 'Foo', isDisabled: false}, {id: 'id2', name: 'Bar', isDisabled: true}];
    const callback = jest.fn();
    const wrapper = shallow(
      <PermissionFormWizard
        options={opts}
        buttonSelected={callback}
      />
    );
    wrapper.find('#radio2').simulate('click');
    const select = wrapper.find(Select).at(0);
    const optionNameFn = select.prop('getOptionLabel');
    const noOptsMessage = select.prop('noOptionsMessage');
    expect(wrapper.state().updateExisting).toEqual(true);
    expect(noOptsMessage()).toEqual("You don't have access to any permissions");
    expect(optionNameFn(opts[0])).toEqual('Foo');
    expect(optionNameFn(opts[1])).toEqual('Bar (pending changes)');
  });

  it('should pass selection to parent', () => {
    const opts = [{id: 'id1', name: 'Foo'}];
    const callback = jest.fn();
    const wrapper = shallow(
      <PermissionFormWizard
        onPermissionSelected={callback}
        options={opts}
      />
    );
    wrapper.setState({updateExisting: true});
    wrapper.find(Select).simulate('change', opts[0]);

    expect(callback.mock.calls[0][0]).toEqual(opts[0]);
  });

  it('should pass null selection to parent', () => {
    const callback = jest.fn();
    const ButtonCallback = jest.fn();
    const wrapper = shallow(
      <PermissionFormWizard
        onPermissionSelected={callback}
        buttonSelected={ButtonCallback}
      />
    );

    wrapper.find('#radio2').simulate('click');
    wrapper.find('#radio1').simulate('click');
    expect(callback.mock.calls[0][0]).toEqual(null);
  });
});
