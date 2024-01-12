import { shallow } from 'enzyme';
import ClassificationSelectionModal from '../../../../components/datasets/edit/ClassificationSelectionModal';
import { Modal, Button } from 'react-bootstrap';
import { act } from 'react-dom/test-utils';

describe('ClassificationSelectionModal test suite', () => {
  it('should render modal shown with detail', () => {
    const wrapper = shallow(
      <ClassificationSelectionModal
        show={true}
        dataset={{ name: 'foo', classifications: [{name: 'bar'}] }}
        onAccept={() => {}}
        onCancel={() => {}}
      />
    )

    const modal = wrapper.find(Modal)
    const detail = modal.find('ClassificationDetail')
    expect(modal.at(0).props().show).toEqual(true)
    expect(detail.at(0).props().selectable).toEqual(true)
    expect(detail.at(0).props().items).toEqual([{ name: 'bar' }])
  })

  it('should handle cancel', () => {
    const callback = jest.fn()
    const wrapper = shallow(
      <ClassificationSelectionModal
        show={true}
        dataset={{ name: 'foo', classifications: [{name: 'bar'}] }}
        onAccept={() => {}}
        onCancel={callback}
      />
    )

    const buttons = wrapper.find(Button)
    buttons.at(0).simulate('click')
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should handle accept', () => {
    const callback = jest.fn()
    const wrapper = shallow(
      <ClassificationSelectionModal
        show={true}
        dataset={{ name: 'foo', classifications: [{name: 'bar'}] }}
        onAccept={callback}
        onCancel={() => {}}
      />
    )

    wrapper.setState({ selections: [{ name: 'bar' }] })
    const buttons = wrapper.find(Button)
    expect(buttons.at(1).props().disabled).toEqual(false)
    buttons.at(1).simulate('click')
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should handle selection changes', () => {
    const wrapper = shallow(
      <ClassificationSelectionModal
        show={true}
        dataset={{ name: 'foo', classifications: [{name: 'bar'}] }}
        onAccept={() => {}}
        onCancel={() => {}}
      />
    )

    const modal = wrapper.find(Modal)
    const detail = modal.find('ClassificationDetail')

    act(() => {
      detail.at(0).props().onSelect([{ name: 'bar' }])
    })

    expect(wrapper.state().selections).toEqual([{ name: 'bar' }])
  })
})
