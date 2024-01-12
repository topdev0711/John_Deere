import {getWorkflowButton} from '../../../../components/datasets/details/WorkflowButton';

describe('WorkflowButton tests', () => {
  it('has button for available dataset', () => {
    const buttonExists = !!getWorkflowButton({status: 'AVAILABLE'})
    expect(buttonExists).toEqual(true);
  });

  it('does not have button', () => {
    const buttonExists = !!getWorkflowButton({status: 'PENDING'})
    expect(buttonExists).toEqual(false);
  });
});
