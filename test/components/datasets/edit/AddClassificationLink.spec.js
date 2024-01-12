import AddClassificationLink from "../../../../components/datasets/edit/AddClassificationLink";
import {mount} from "enzyme";
import {Button, OverlayTrigger, Tooltip} from "react-bootstrap";

describe("AddClassificationLink test suite", () => {
  it("should show an inactive link when the dataset is classified as public", () => {
    const wrapper = mount(<AddClassificationLink addGovBlock={() => {}} isPublicDataset={true} />);
    expect (wrapper.exists(Button)).toEqual(true);
    const button = wrapper.find(Button);
    expect(button.prop('disabled')).toEqual(true);
  })

  it("should not create a new classification form when the button is inactive and clicked", () => {
    const mockAddGovBlock = jest.fn();
    const wrapper = mount(<AddClassificationLink onClick={mockAddGovBlock} isPublicDataset={true} />);
    const button = wrapper.find(Button);
    button.simulate('click');
    expect(mockAddGovBlock).not.toHaveBeenCalled();
  })

  it("should show an active link when the dataset is not classified as public", () => {
    const wrapper = mount(<AddClassificationLink addGovBlock={() => {}} isPublicDataset={false} />);
    expect (wrapper.exists(Button)).toEqual(true);
    const button = wrapper.find(Button);
    expect(button.prop('disabled')).toEqual(false);
  })

  it("should create a new classification form when the button is active and clicked", () => {
    const mockAddGovBlock = jest.fn();
    const wrapper = mount(<AddClassificationLink onClick={mockAddGovBlock} isPublicDataset={false} />);
    const button = wrapper.find(Button);
    button.simulate('click');
    expect(mockAddGovBlock).toHaveBeenCalled();
  })

  it("should not show tooltip when the dataset is classified as a public dataset and the mouse is not hovering over the button", () => {
    const wrapper = mount(<AddClassificationLink addGovBlock={()=>{}} isPublicDataset={true} />);
    expect(wrapper.exists(Tooltip)).toEqual(false);
    expect(wrapper.exists(OverlayTrigger)).toEqual(true);
  })

  it("should show tooltip when the dataset is classified as a public dataset and the mouse is hovering over the button", () => {
    const wrapper = mount(<AddClassificationLink addGovBlock={()=>{}} isPublicDataset={true} />);
    expect(wrapper.exists(OverlayTrigger)).toEqual(true);
    wrapper.simulate('mouseover');
    const tooltip = wrapper.find('#tooltip-disabled-add-classification')
    expect(tooltip.at(0).text()).toEqual("Unable to add additional classification, public GICP grants access to all users.")
  })

  it("should not show tooltip when the dataset is not classified as a public dataset and the mouse is not hovering over the button", () => {
    const wrapper = mount(<AddClassificationLink addGovBlock={()=>{}} isPublicDataset={false} />);
    const tooltip = wrapper.find('#tooltip-disabled-add-classification');
    expect(wrapper.exists(OverlayTrigger)).toEqual(false)
    expect(wrapper.exists(Tooltip)).toEqual(false);
  })

  it("should show tooltip when the dataset is not classified as a public dataset and the mouse is hovering over the button", () => {
    const wrapper = mount(<AddClassificationLink addGovBlock={()=>{}} isPublicDataset={false} />);
    wrapper.simulate('mouseover');
    expect(wrapper.exists(OverlayTrigger)).toEqual(false)
    expect(wrapper.exists(Tooltip)).toEqual(false);
  })
})
