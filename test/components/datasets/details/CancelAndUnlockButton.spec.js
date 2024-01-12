import {getUnlockButton} from '../../../../components/datasets/details/CancelAndUnlockButton';

describe('CancelAndUnlockButton tests', () => {
  const anyUser = 'anyUser';

  it('has button for dataset custodian', () => {
    const adGroup = 'any-ad-group';
    const buttonExists = !!getUnlockButton({custodian: adGroup, lockedBy: anyUser}, {groups: [adGroup]});
    expect(buttonExists).toEqual(true);
  });

  it('has button for user for legacy lock', () => {
    const buttonExists = !!getUnlockButton({ lockedBy: anyUser}, anyUser);
    expect(buttonExists).toEqual(true);
  });

  it('has button for user', () => {
    const buttonExists = !!getUnlockButton({lockedBy:{username: anyUser}}, {username: anyUser});
    expect(buttonExists).toEqual(true);
  });

  it('does not have button when there is no lock', () => {
    const adGroup = 'any-ad-group';
    const buttonExists = !!getUnlockButton({custodian: adGroup}, {groups: [adGroup]});
    expect(buttonExists).toEqual(false);
  });

  it('does not have button for user who is not custodian or created lock', () => {
    const buttonExists = !!getUnlockButton({lockedBy:{username: anyUser}}, {username: 'anotherUser', groups: []});
    expect(buttonExists).toEqual(false);
  });
});
