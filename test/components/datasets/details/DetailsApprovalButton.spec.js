import {getApprovalButton} from '../../../../components/datasets/details/DetailsApprovalButton';
import {getLatestPendingUserApprovals} from '../../../../components/utils/ApprovalsUtil';

jest.mock('../../../../components/utils/ApprovalsUtil');

describe('DetailsApprovalButton', () => {
  beforeEach(() => jest.resetAllMocks());

  it('has button when it is a pending approval by user', () => {
    getLatestPendingUserApprovals.mockReturnValue({loggedInUserIsPendingApprover: 'someUser'});
    const buttonExists = !!getApprovalButton();
    expect(buttonExists).toEqual(true);
  });

  it('has button when it is a pending approval by owner', () => {
    getLatestPendingUserApprovals.mockReturnValue({loggedInUserIsOwner: 'someOwner'});
    const buttonExists = !!getApprovalButton();
    expect(buttonExists).toEqual(true);
  });

  it('does not have button', () => {
    getLatestPendingUserApprovals.mockReturnValue({});
    const buttonExists = !!getApprovalButton();
    expect(buttonExists).toEqual(false);
  });
});
