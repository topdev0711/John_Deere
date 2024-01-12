import ConfirmationModal from '../../components/ConfirmationModal';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

describe('ConfirmationModal component test suite', () => {
  it('verify component renders correctly', () => {
    const wrapper = shallow(<ConfirmationModal show={true} body="body" onCancel="cancel" onAccept="accept" />)
    const modal = wrapper.find(Modal)
    const modalBody = modal.find(Modal.Body)
    const modalFooter = modal.find(Modal.Footer)
    const buttons = modalFooter.find(Button)
    expect(modal).toHaveLength(1)
    expect(modal.props().show).toEqual(true)
    expect(modalBody).toHaveLength(1)
    expect(modalFooter).toHaveLength(1)
    expect(buttons).toHaveLength(2)
    expect(modalBody.text()).toEqual('body')
    expect(buttons.get(0).props.onClick).toEqual('cancel')
    expect(buttons.get(1).props.onClick).toEqual('accept')
  })

  it('verify component renders correctly without cancel button', () => {
    const wrapper = shallow(<ConfirmationModal show={true} body="body" onCancel="cancel" onAccept="accept" showAcceptOnly={true} />)
    const modal = wrapper.find(Modal)
    const modalBody = modal.find(Modal.Body)
    const modalFooter = modal.find(Modal.Footer)
    const buttons = modalFooter.find(Button)
    expect(modal).toHaveLength(1)
    expect(modal.props().show).toEqual(true)
    expect(modalBody).toHaveLength(1)
    expect(modalFooter).toHaveLength(1)
    expect(buttons).toHaveLength(2)
    expect(modalBody.text()).toEqual('body')
    expect(buttons.get(0).props.onClick).toEqual('cancel')
    expect(buttons.get(0).props.hidden).toEqual(true)
    expect(buttons.get(1).props.onClick).toEqual('accept')
  })
})
