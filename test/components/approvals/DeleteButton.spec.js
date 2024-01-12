// Unpublished Work © 2022 Deere & Company.
import {mount, shallow} from 'enzyme';
import React from 'react';
import DeleteButton from '../../../components/approvals/DeleteButton';
import {Button} from "react-bootstrap";
import ConfirmationModal from "../../../components/ConfirmationModal";

jest.mock('../../../apis/datasets');

describe('DeleteButton tests', () => {

  const createItem = () => ({
    loggedInUserIsPendingApprover: true,
    loggedInInUserIsOwner: false,
    loggedInUserIsCreator: true,
    isPendingDelete: false
  })

  it ('should display delete button', () => {
    const wrapper = mount(<DeleteButton item={createItem()} isUpdating={false} handleDelete={()=>{}} />);
    expect(wrapper.exists(Button)).toEqual(true);
  })

  it ('should display modal when button is pushed', () => {
    const wrapper = mount(<DeleteButton item={createItem()} isUpdating={false} handleDelete={()=>{}} />);
    const button = wrapper.find(Button).at(0);

    button.simulate('click');
    wrapper.update();
    const modal = wrapper.find(ConfirmationModal);
    expect(modal.prop("show")).toEqual(true)
  })

})