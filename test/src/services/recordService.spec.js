const recordService = require('../../../src/services/recordService');
const referenceService = require('../../../src/services/referenceService');
const uuid = require('uuid');

jest.mock('uuid');
jest.mock('../../../src/services/referenceService')

describe('record service', () => {
  const mockDate = new Date();
  const isoDate = mockDate.toISOString();

  const user = 'Stewie';
  const recordId = 'uuid value';
  const communityId = '1234';
  const approver = 'Meg';
  let jestDateSpy;

  beforeEach(() => {
    uuid.v4.mockReturnValue(recordId);
    jestDateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    referenceService.getValue.mockResolvedValue({
      id: communityId,
      approver
    });
  });

  afterEach(() => {
    jestDateSpy.mockRestore();
  });

  it('add audit fields', () => {
    const auditableRecord = recordService.addAuditFields({}, user);

    const expectedRecord = {
      id: recordId,
      version: 1,
      createdBy: user,
      updatedBy: user,
      createdAt: isoDate,
      updatedAt: isoDate,
      status: 'PENDING'
    };

    expect(auditableRecord).toEqual(expectedRecord);
  });

  it('add audit fields while maintaining existing values', () => {
    const existingTime = '2017-07-02T07:56:47.007Z';
    const record = {
      id: 'existing id',
      version: 2,
      createdBy: 'Peter',
      updatedBy: 'Peter',
      createdAt: existingTime,
      updatedAt: existingTime,
      status: 'AVAILABLE'
    };

    const auditableRecord = recordService.addAuditFields(record, user);

    const expectedRecord = {
      id: 'existing id',
      version: 2,
      createdBy: 'Peter',
      updatedBy: user,
      createdAt: existingTime,
      updatedAt: isoDate,
      status: 'AVAILABLE'
    };

    expect(auditableRecord).toEqual(expectedRecord);
  });

  it('should overwrite audit fields even if provided', () => {
    const existingRecord = {
      id: recordId,
      version: 1,
      createdBy: user,
      updatedBy: user,
      createdAt: isoDate,
      updatedAt: isoDate,
      status: 'PENDING',
      approvals: ['i approve'],
      myField: 'my custom field'
    };

    const updatedRecord = {
      id: 'new id',
      version: 2,
      createdBy: 'new user',
      updatedBy: 'new user',
      createdAt: 'new time',
      updatedAt: 'new time',
      status: 'new stats',
      approvals: ['new approve'],
      myField: 'my new custom field value'
    };

    const mergedRecord = recordService.mergeAuditFields(existingRecord, updatedRecord);

    expect(mergedRecord).toEqual({
      id: recordId,
      version: 1,
      createdBy: user,
      updatedBy: user,
      createdAt: isoDate,
      updatedAt: isoDate,
      status: 'PENDING',
      approvals: ['i approve'],
      myField: 'my new custom field value'      
    });
  });
});
