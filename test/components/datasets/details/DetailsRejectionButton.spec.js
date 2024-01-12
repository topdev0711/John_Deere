import {getRejectionButton} from '../../../../components/datasets/details/DetailsRejectionButton';
import {getLatestPendingUserApprovals} from '../../../../components/utils/ApprovalsUtil';

jest.mock('../../../../components/utils/ApprovalsUtil');

describe('DetailsApprovalButton', () => {
  beforeEach(() => jest.resetAllMocks());

  it('has button when it is a pending approval by user', () => {
    getLatestPendingUserApprovals.mockReturnValue({loggedInUserIsPendingApprover: 'someUser'});
    const buttonExists = !!getRejectionButton();
    expect(buttonExists).toEqual(true);
  });

  it('has button when it is a pending approval by owner', () => {
    getLatestPendingUserApprovals.mockReturnValue({loggedInUserIsOwner: 'someOwner'});
    const buttonExists = !!getRejectionButton();
    expect(buttonExists).toEqual(true);
  });

  it('does not have button', () => {
    getLatestPendingUserApprovals.mockReturnValue({});
    const buttonExists = !!getRejectionButton();
    expect(buttonExists).toEqual(false);
  });
});
