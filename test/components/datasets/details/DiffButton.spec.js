import {getDiffButton} from '../../../../components/datasets/details/DiffButton';

describe('DiffButton tests', () => {
  it('has button', () => {
    const buttonExists = !!getDiffButton({status: 'PENDING'}, {status: 'Available'});
    expect(buttonExists).toEqual(true);
  });

  it('does not have button when not pending', () => {
    const buttonExists = !!getDiffButton({status: 'PENDING'});
    expect(buttonExists).toEqual(false);
  });

  it('does not have button when not there is no latest available version', () => {
    const buttonExists = !!getDiffButton({status: 'Available'}, {status: 'Available'});
    expect(buttonExists).toEqual(false);
  });
});
