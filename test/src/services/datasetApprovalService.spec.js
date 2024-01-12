const approvalService = require('../../../src/services/approvalService');
const { PENDING } = require('../../../src/services/statusService');
const featureToggleService = require("../../../src/services/featureToggleService");
const datasetApprovalService = require('../../../src/services/datasetApprovalService');
const { resetAllWhenMocks } = require('jest-when');

jest.mock('../../../src/services/approvalService');
jest.mock('../../../src/services/featureToggleService')

const anyCustodian = 'anyAdGroup';
const anyDetails = 'anyDetails';
const anyReason = 'anyReason';
const createDataset = () => ({
  id: 'id',
  version: 2,
  custodian: anyCustodian,
  application: '',
  createdBy: 'joe',
  createdAt: 'date',
  environmentName: 'envname',
  documentation: 'none',
  businessValue: 'biz',
  updatedBy: 'joe',
  updatedAt: 'date',
  requestComments: 'foo',
  lockedBy: 'joe',
  approvals: ['linked-schema'],
  schemas: [],
  tables: [],
  paths: [],
  linkedSchemas: [],
  status: 'AVAILABLE',
  name: 'DS',
  attachments: { currentAttachments: [] },
  usability: 5
});


describe('datasetApprovalService test suite', () => {
  afterEach(() => {
    featureToggleService.getToggle.mockResolvedValue({ enabled: false });
    resetAllWhenMocks()
  });

  it('is a delegated approval', () => {
    datasetApprovalService.approve(createDataset(), anyCustodian, anyDetails);
    expect(approvalService.approve).toBeCalledWith(createDataset(), anyCustodian, anyDetails);
  });

  it('is a delegated rejection', () => {
    datasetApprovalService.reject(createDataset(), anyReason, anyCustodian);
    expect(approvalService.reject).toBeCalledWith(createDataset(), anyReason, anyCustodian);
  });

  it('is a delegated getUserApprovals', () => {
    datasetApprovalService.getUserApprovals(createDataset(), createDataset());
    expect(approvalService.getUserApprovals).toBeCalledWith(createDataset(), createDataset(), "Dataset");
  });

  it('is a delegated addApprovalsForDelete', () => {
    datasetApprovalService.addApprovalsForDelete(createDataset());
    expect(approvalService.addApprovalsForDelete).toBeCalledWith(createDataset());
  });

  it('should not have views in its approval request', async () => {
    const dataset = { ...createDataset(), views: ['view1', 'view2']};
    const viewDataset = createDataset();
    const { views, ...noViewsDataset } = createDataset();
    approvalService.addApprovals.mockReturnValue({...noViewsDataset, status: PENDING});

    const actualDataset = await datasetApprovalService.addApprovals(dataset, viewDataset, dataset, viewDataset, [anyCustodian]);

    expect(approvalService.addApprovals).toBeCalledWith(noViewsDataset, noViewsDataset, expect.anything());
    expect(actualDataset).toEqual({...dataset, status: PENDING });
  });

  it('is a dataset that requires approval', async () => {
    const newCustodianDataset = { ...createDataset(), custodian: 'newCustodian'};
    const latestAvailable = createDataset();
    approvalService.addApprovals.mockReturnValue(newCustodianDataset);

    const actualDataset = await datasetApprovalService.addApprovals(newCustodianDataset, latestAvailable, newCustodianDataset, latestAvailable, [anyCustodian]);

    expect(approvalService.addApprovals).toBeCalledWith(newCustodianDataset, latestAvailable, expect.anything());
    expect(actualDataset).toEqual({...newCustodianDataset, status: PENDING });
  });

  it('is a dataset that is automatically approved', async () => {
    const dataset = createDataset();
    approvalService.addApprovals.mockReturnValue(dataset);

    await datasetApprovalService.addApprovals(dataset, dataset, dataset, dataset, [anyCustodian]);

    expect(approvalService.createAutoApproval).toBeCalled();
  });
});
