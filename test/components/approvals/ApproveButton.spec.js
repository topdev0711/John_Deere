// Unpublished Work © 2022 Deere & Company.
import {mount, shallow} from 'enzyme';
import React from 'react';
import ApproveButton from "../../../components/approvals/ApproveButton";
import {Button} from "react-bootstrap";
import ConfirmationModal from "../../../components/ConfirmationModal";

jest.mock('../../../apis/datasets');

describe('ApproveButton tests', () => {

  const createItem = () => ({
    loggedInUserIsPendingApprover: true,
    loggedInInUserIsOwner: false,
    isPendingDelete: false
  })

  it('should display approval button', () => {
    const wrapper = mount(<ApproveButton item={createItem()} isUpdating={false} handleApproval={() => {
    }}/>);
    expect(wrapper.exists(Button)).toEqual(true);
  })

  it('should display modal when button is pushed', () => {
    const wrapper = mount(<ApproveButton item={createItem()} isUpdating={false} handleApproval={() => {
    }}/>);
    const button = wrapper.find(Button).at(0);

    button.simulate('click');
    wrapper.update();
    const modal = wrapper.find(ConfirmationModal);
    console.log(modal.prop("show"));
    expect(modal.prop("show")).toEqual(true)
  })

  it('should display modal for approval to delete dataset when button is pushed', () => {
    const pendingDeleteItem = {...createItem(), isPendingDelete: true};
    const wrapper = mount(<ApproveButton item={pendingDeleteItem} isUpdating={false} handleApproval={() => {
    }}/>);
    const button = wrapper.find(Button).at(0);

    button.simulate('click');
    wrapper.update();
    const modal = wrapper.find(ConfirmationModal);
    console.log(modal.prop("show"));
    expect(modal.prop("show")).toEqual(true)
  })

})