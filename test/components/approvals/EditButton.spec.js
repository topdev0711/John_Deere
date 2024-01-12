import {mount} from "enzyme";
import EditApprovalButton from "../../../components/approvals/EditApprovalButton";
import {Button} from "react-bootstrap";
import React from "react";
import Router from 'next/router';

jest.mock('next/router');
jest.mock('../../../components/utils');

describe('EditButton tests', () => {
  const createItem = () => ({
    loggedInUserIsPendingApprover: true,
    loggedInInUserIsOwner: false,
    isPendingDelete: false,
    type: "dataset",
    id: 12345,
    version: 4
  })

  it ('should display edit button', () => {
    const wrapper = mount(<EditApprovalButton item={createItem()} isUpdating={false}  />);
    expect(wrapper.exists(Button)).toEqual(true);
    const button = wrapper.find(Button).at(0);
    expect(button.prop('disabled')).toEqual(false);
  })

  it('should take us to the edit page when we click the button', () => {
    const wrapper = mount(<EditApprovalButton item={createItem()} isUpdating={false}  />);
    const button = wrapper.find(Button).at(0);
    button.simulate('click');
    wrapper.update();
    expect(Router.push).toHaveBeenCalledWith('/datasets/12345/edit');
  })
});
