// Unpublished Work © 2022 Deere & Company.
import { mount } from 'enzyme';
import React from 'react';
import { render, waitFor, screen, cleanup, act , fireEvent} from '@testing-library/react';
import RejectButton from '../../../components/approvals/RejectButton';
import { Button } from "react-bootstrap";
import ConfirmationModal from "../../../components/ConfirmationModal";
import { changeInputByTestId, clickButton, clickByTestId } from "../../helpers/TestHelper";

jest.mock('../../../apis/datasets');

describe('ApproveButton tests', () => {

  beforeEach(() => {
    jest.clearAllMocks()
  })
  afterEach(() => {
    cleanup();
  });

  const createItem = () => ({
    loggedInUserIsPendingApprover: true,
    loggedInInUserIsOwner: false,
    isPendingDelete: false
  })

  it('should display reject button', () => {
    const wrapper = mount(<RejectButton item={createItem()} isUpdating={false} handleRejection={() => {
    }} comments={''} />);
    expect(wrapper.exists(Button)).toEqual(true);
  })

  it('should display modal when button is pushed', async () => {
    let wrapper;
    await act(async () => {
      wrapper = render(<RejectButton item={createItem()} isUpdating={false} handleRejection={() => {
      }} comments={''} />)
    });
    await waitFor(async () => {
      await clickByTestId('rejectButton');
    })
    await waitFor( () => {
      const modal = wrapper.getByRole('dialog');
      console.log('modal', modal.prop)
      expect(modal.textContent).toContain('Are you sure you want to reject this request?')
    })
  })

  it('should not display the modal if something other then empty string was provided', async () => {
    let wrapper;
    await act(async () => {
      wrapper = render(<RejectButton item={createItem()} isUpdating={false} handleRejection={() => {
      }} comments={''} />)
    });

    await waitFor(async () => {
      await clickByTestId('rejectButton');
      expect((wrapper.queryAllByTestId('validatedInput'))[0]).toBeTruthy();
      await changeInputByTestId('validatedInput', '23');
      await clickButton('Yes');
      expect((wrapper.queryAllByTestId('validatedInput'))[0]).toBeFalsy();
    });
  })

  it('should continue displaying the modal if value was just space', async () => {
    let wrapper;
    await act(async () => {
      wrapper = render(<RejectButton item={createItem()} isUpdating={false} handleRejection={() => {
      }} comments={''} />)
    });

    await waitFor(async () => {
      await clickByTestId('rejectButton');
      expect((wrapper.queryAllByTestId('validatedInput'))[0]).toBeTruthy();
      await changeInputByTestId('validatedInput', '    ');
      await clickButton('Yes');
      expect((wrapper.queryAllByTestId('validatedInput'))[0]).toBeTruthy();
    });
  })
  
  it('should display reject button', () => {
    const wrapper = mount(<RejectButton item={createItem()} isUpdating={false} handleRejection={() => {
    }} comments={''}/>);
    expect(wrapper.exists(Button)).toEqual(true);
  })
})
