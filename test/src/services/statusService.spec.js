const statusService = require('../../../src/services/statusService');

describe('statusService spec', () => {
  it('should be approved', () => {
    const actualResponse = statusService.isApproved('APPROVED');
    expect(actualResponse).toEqual(true);
  });

  it('should be approved record', () => {
    const actualResponse = statusService.isApproved({ status: 'APPROVED' });
    expect(actualResponse).toEqual(true);
  });

  it('should be available', () => {
    const actualResponse = statusService.isAvailable('AVAILABLE');
    expect(actualResponse).toEqual(true);
  });

  it('should be available record', () => {
    const actualResponse = statusService.isAvailable({ status: 'AVAILABLE' });
    expect(actualResponse).toEqual(true);
  });

  it('should be deleted', () => {
    const actualResponse = statusService.isDeleted('DELETED');
    expect(actualResponse).toEqual(true);
  });

  it('should be deleted record', () => {
    const actualResponse = statusService.isDeleted({ status: 'DELETED' });
    expect(actualResponse).toEqual(true);
  });

  it('should be pending', () => {
    const actualResponse = statusService.isPending('PENDING');
    expect(actualResponse).toEqual(true);
  });

  it('should be pending record', () => {
    const actualResponse = statusService.isPending({ status: 'PENDING' });
    expect(actualResponse).toEqual(true);
  });

  it('should be pending delete', () => {
    const actualResponse = statusService.isPendingDelete('PENDING DELETE');
    expect(actualResponse).toEqual(true);
  });

  it('should be pending delete record', () => {
    const actualResponse = statusService.isPendingDelete({ status: 'PENDING DELETE' });
    expect(actualResponse).toEqual(true);
  });

  it('should be rejected', () => {
    const actualResponse = statusService.isRejected('REJECTED');
    expect(actualResponse).toEqual(true);
  });

  it('should be rejected record', () => {
    const actualResponse = statusService.isRejected({ status: 'REJECTED' });
    expect(actualResponse).toEqual(true);
  });

  it('should be NonDeleteStatus', () => {
    const actualResponse = statusService.isNonDeleteStatus('APPROVED');
    expect(actualResponse).toEqual(true);
  });

  it('should be nonDeleteStatus record', () => {
    const actualResponse = statusService.isNonDeleteStatus({ status: 'APPROVED' });
    expect(actualResponse).toEqual(true);
  });

  it('should be latestNonAvailableStatus', () => {
    const actualResponse = statusService.isLatestNonAvailableStatus('APPROVED');
    expect(actualResponse).toEqual(true);
  });

  it('should be latestNonAvailableStatus record', () => {
    const actualResponse = statusService.isLatestNonAvailableStatus({ status: 'APPROVED' });
    expect(actualResponse).toEqual(true);
  });
});
