import React from 'react';
import {shallow} from 'enzyme';
import {Button} from 'react-bootstrap';
import {DatasetDetailButtons} from '../../../../components/datasets/details/DetailActionButtons';
import {getUnlockButton} from '../../../../components/datasets/details/CancelAndUnlockButton';
import {getApprovalButton} from '../../../../components/datasets/details/DetailsApprovalButton';
import {getRejectionButton} from '../../../../components/datasets/details/DetailsRejectionButton';
import {getEditButton} from '../../../../components/datasets/details/EditDatasetButton';
import {getRequestAccessButton} from '../../../../components/datasets/details/RequestAccessButton';
import {getWorkflowButton} from '../../../../components/datasets/details/WorkflowButton';

jest.mock('../../../../components/datasets/details/CancelAndUnlockButton');
jest.mock('../../../../components/datasets/details/DetailsApprovalButton');
jest.mock('../../../../components/datasets/details/DetailsRejectionButton');
jest.mock('../../../../components/datasets/details/EditDatasetButton');
jest.mock('../../../../components/datasets/details/RequestAccessButton');
jest.mock('../../../../components/datasets/details/WorkflowButton');

describe('DetailActionButtons tests', () => {
  beforeEach(() => jest.resetAllMocks());
  const mockAllButtons = () => {
    getUnlockButton.mockReturnValue(<Button id='unlock-button' />);
    getApprovalButton.mockReturnValue(<Button id='approval-button' />);
    getRejectionButton.mockReturnValue(<Button id='reject-button' />);
    getEditButton.mockReturnValue(<Button id='edit-button' />);
    getRequestAccessButton.mockReturnValue(<Button id='request-access-button' />);
    getWorkflowButton.mockReturnValue(<Button id='workflow-button' />);
  };

  it('has no buttons', () => {
    const detailActions = shallow(<DatasetDetailButtons />);
    const buttonCount = detailActions.find(Button).length;
    expect(buttonCount).toEqual(0);
  });

  it('has all buttons', () => {
    mockAllButtons();
    const detailActions = shallow(<DatasetDetailButtons />);
    console.info(detailActions.debug())
    const buttonCount = detailActions.find(Button).length;
    expect(buttonCount).toEqual(6);
  });

  it('has some buttons', () => {
    getWorkflowButton.mockReturnValue(<Button id='workflow-button' />);
    const detailActions = shallow(<DatasetDetailButtons />);
    const buttonCount = detailActions.find(Button).length;
    expect(buttonCount).toEqual(1);
  });
});
