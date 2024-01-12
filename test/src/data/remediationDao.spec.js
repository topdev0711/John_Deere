const remediationDao = require('../../../src/data/remediationDao');
const conf = require('../../../conf');
const dynamo = require('../../../src/data/dynamo');
const dynamoTestUtils = require('./dynamoTestUtils');

const confSpy = jest.spyOn(conf, 'getConfig');

jest.mock('../../../src/data/dynamo');

const sampleRemediation = {
  name: 'view-1',
  createdAt: 'some time',
  approvals: [],
  status: "PENDING"
};

const testConfig = {
  remediationsTable: 'jd-data-catalog-remediation',
  isLocal: false
};

const mockDate = new Date();

describe('remediationDao Tests', () => {
  beforeEach(() => {
    confSpy.mockImplementation(() => testConfig);
  });

  afterEach(() => {
    confSpy.mockReset();
  });
  it('should save view remediation', async () => {
    const create = jest.fn();
    dynamo.define.mockReturnValue({create});
    const result = await remediationDao.saveRemediation(sampleRemediation);
    expect(create).toBeCalledWith(sampleRemediation);
    expect(result).toEqual('Success');
  });

  it('should throw an error when saving fails',  () => {
     const create = jest.fn();
     create.mockRejectedValue('boom');
     dynamo.define.mockReturnValue({create});
      return expect(remediationDao.saveRemediation(sampleRemediation))
      .rejects
      .toThrow(new Error('failed to save remediation'));
  });

  it('should get all remediations', async () => {
    const sampleRemediations = [{name: 'some-remediation-pending', status: 'PENDING'}, {name: 'some-remediation-approved', status: 'APPROVED'}, {name: 'some-remediation-rejected', status: 'REJECTED'}];
    const expectedResult = [{name: 'some-remediation-pending', status: 'PENDING'}]
    const keys = ['loadAll', 'exec', 'promise', 'collectItems'];
    const scan = dynamoTestUtils.createFunction(keys, sampleRemediations);
    dynamo.define.mockReturnValue({scan});

    const result = await remediationDao.getPendingRemediations();
    expect(result).toEqual(expectedResult);
  });
  it('should fail to get all remediations', () => {
    const expectedResult = Promise.reject(new Error('An unexpected error occured when retrieving the view-remediations'));
    const keys = ['loadAll', 'exec', 'promise', 'collectItems'];
    const scan = dynamoTestUtils.createFunction(keys, expectedResult);
    dynamo.define.mockReturnValue({scan});

    const result = remediationDao.getPendingRemediations();
    return expect(result).rejects.toThrow(new Error('An unexpected error occurred when retrieving the view-remediations'));
  });

  it('should get remediation for given view name', async () =>{
    const sampleRemediations = [{ name: 'some-view' }];
    const expectedResult = { name: 'some-view' };
    const keys = ['descending', 'exec', 'promise', 'collectItems'];
    const query = dynamoTestUtils.createFunction(keys, sampleRemediations);
    dynamo.define.mockReturnValue({query});

    const result = await remediationDao.getRemediation('some-view');

    expect(result).toEqual(expectedResult);
  });

  it('should fail to get remediation for given view name',  () => {
    const expectedResult = Promise.reject(new Error('An unexpected error occured when retrieving the view-remediation some-view'));
    const keys = ['descending', 'exec', 'promise', 'collectItems'];
    const query = dynamoTestUtils.createFunction(keys, expectedResult);
    dynamo.define.mockReturnValue({query});

    const result =  remediationDao.getRemediation('some-view');

    return expect(result).rejects.toThrow(new Error('An unexpected error occurred when retrieving the view-remediation'));
  });

  it('should delete remediation', async () => {
    const destroy = jest.fn();
    dynamo.define.mockReturnValue({destroy});
    destroy.mockImplementation((hash, range, cb) => cb());
    const result = await remediationDao.deleteRemediation('name', 'createdAt');
    expect(destroy.mock.calls[0][0]).toEqual('name');
    expect(destroy.mock.calls[0][1]).toEqual('createdAt');
  });

  it('should fail to delete remediation', () => {
    const destroy = jest.fn();
    dynamo.define.mockReturnValue({destroy});
    destroy.mockImplementation((hash, range, cb) => cb('error'));
    const result = remediationDao.deleteRemediation('name', 'createdAt');
    return expect(result).rejects.toEqual(new Error('failed to delete remediation'));
  });

});
