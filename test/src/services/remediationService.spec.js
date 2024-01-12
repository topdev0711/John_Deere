/**
 * @jest-environment node
 */

const approvalService =  require('../../../src/services/approvalService');
const datasetDao = require('../../../src/data/datasetDao');
const datasetService =  require('../../../src/services/datasetService');
const emailService =  require('../../../src/services/emailService');
const metastoreDao = require('../../../src/data/metastoreDao');
const referenceService = require('../../../src/services/referenceService');
const remediationDao = require('../../../src/data/remediationDao');
const remediationService = require('../../../src/services/remediationService');
const viewService =  require('../../../src/services/viewService');
const { when } = require('jest-when');

jest.mock('../../../src/services/approvalService');
jest.mock('../../../src/data/datasetDao');
jest.mock('../../../src/services/datasetService');
jest.mock('../../../src/services/emailService');
jest.mock('../../../src/data/metastoreDao');
jest.mock('../../../src/services/referenceService');
jest.mock('../../../src/data/remediationDao');
jest.mock('../../../src/services/viewService');

describe('remediationService Tests', () => {
 const user = 'Stewie';
 const isoDate = '2018-07-02T07:56:47.007Z';
 const testTime = new Date(isoDate).getTime();
 const approvalsTest = [
  {
    approvedBy: "mm12161",
    approverEmail: "G90_COLLIBRA_APPROVER_SYSTEMS@JohnDeere.com",
    comment: null,
    community: "a521b7d4-642c-4524-9c46-e4fa5e836a17",
    status: "PENDING",
    updatedAt: "2021-05-14T13:54:59.771Z"
  },
  {
    custodian: 'some-custodian',
    approvedBy: 'some-custodian',
    approverEmail: "undefined@JohnDeere.com",
    comment: null,
    status: "PENDING",
    updatedAt: "2021-05-14T13:54:59.771Z"
  }];

  const sampleViews = [
    {
      datasetId: 'datasetId-1',
      name: 'view-name',
      driftDetails: {
        type: 'dataset',
        items: ['drifted-datasetId1']
      },
      updatedAt: isoDate,
      status: 'DRIFTED'
    }
  ]

  const sampleApprovalsForToggles = [
    {
      approvedBy: "mm12161",
      approverEmail: "G90_COLLIBRA_APPROVER_MANUFACTURING@JohnDeere.com",
      comment: null,
      community: "40580770-1a17-4210-950c-0c52e75641a5",
      status: "PENDING",
      updatedAt: "2021-05-14T13:54:59.771Z"
    },
    {
      approvedBy: "mm12161",
      approverEmail: "G90_COLLIBRA_APPROVER_SYSTEMS@JohnDeere.com",
      comment: null,
      community: "a521b7d4-642c-4524-9c46-e4fa5e836a17",
      status: "PENDING",
      updatedAt: "2021-05-14T13:54:59.771Z"
    }
  ];

  const pendingdApprovals = [
    {
      approvedBy: user,
      approverEmail: 'G90_COLLIBRA_APPROVER_SYSTEMS@JohnDeere.com',
      comment: null,
      community: {
        id: 'a521b7d4-642c-4524-9c46-e4fa5e836a17',
        name: 'Systems',
        approver: 'G90_COLLIBRA_APPROVER_SYSTEMS'
      },
      status: 'PENDING',
      updatedAt: '2021-05-14T13:54:59.771Z'
    },
    {
      approvedBy: "mm12161",
      approverEmail: "G90_COLLIBRA_APPROVER_FINANCIAL_SERVICES@JohnDeere.com",
      comment: null,
      community: {
        id: '4d8d917d-5c87-43b7-a495-38c46b6f4ee1',
        name: 'Financial Services',
        approver: 'G90_COLLIBRA_APPROVER_FINANCIAL_SERVICES'
      },
      status: "PENDING",
      updatedAt: "2021-05-14T13:54:59.771Z"
    }
  ];

  const fullyApprovedApprovals = [
    {
      approvedBy: user,
      approverEmail: 'G90_COLLIBRA_APPROVER_SYSTEMS@JohnDeere.com',
      comment: null,
      community: {
        id: 'a521b7d4-642c-4524-9c46-e4fa5e836a17',
        name: 'Systems',
        approver: 'G90_COLLIBRA_APPROVER_SYSTEMS'
      },
      status: 'APPROVED',
      updatedAt: '2021-05-14T13:54:59.771Z'
    },
    {
      approvedBy: "mm12161",
      approverEmail: "G90_COLLIBRA_APPROVER_FINANCIAL_SERVICES@JohnDeere.com",
      comment: null,
      community: {
        id: '4d8d917d-5c87-43b7-a495-38c46b6f4ee1',
        name: 'Financial Services',
        approver: 'G90_COLLIBRA_APPROVER_FINANCIAL_SERVICES'
      },
      status: "APPROVED",
      updatedAt: "2021-05-14T13:54:59.771Z"
    }
  ];

  const partiallyApprovedApprovals = [
    {
      approvedBy: user,
      approverEmail: 'G90_COLLIBRA_APPROVER_SYSTEMS@JohnDeere.com',
      comment: null,
      community: {
        id: 'a521b7d4-642c-4524-9c46-e4fa5e836a17',
        name: 'Systems',
        approver: 'G90_COLLIBRA_APPROVER_SYSTEMS'
      },
      status: 'APPROVED',
      updatedAt: '2021-05-14T13:54:59.771Z'
    },
    {
      approvedBy: "mm12161",
      approverEmail: "G90_COLLIBRA_APPROVER_FINANCIAL_SERVICES@JohnDeere.com",
      comment: null,
      community: {
        id: '4d8d917d-5c87-43b7-a495-38c46b6f4ee1',
        name: 'Financial Services',
        approver: 'G90_COLLIBRA_APPROVER_FINANCIAL_SERVICES'
      },
      status: "PENDING",
      updatedAt: "2021-05-14T13:54:59.771Z"
    }
  ];

  const rejectedApprovals = [
    {
      approvedBy: user,
      approverEmail: 'G90_COLLIBRA_APPROVER_SYSTEMS@JohnDeere.com',
      comment: null,
      community: {
        id: 'a521b7d4-642c-4524-9c46-e4fa5e836a17',
        name: 'Systems',
        approver: 'G90_COLLIBRA_APPROVER_SYSTEMS'
      },
      status: 'REJECTED',
      updatedAt: '2021-05-14T13:54:59.771Z'
    }
  ];

  beforeEach(() => {
    remediationDao.saveRemediation.mockResolvedValue('Success');
    metastoreDao.getView.mockResolvedValue(sampleViews);
    metastoreDao.saveViewMetadatas.mockResolvedValue('Success');
    datasetService.saveDatasets.mockResolvedValue('Success');
    viewService.createUpdatedDatasets.mockResolvedValue([]);
    emailService.sendEmails.mockResolvedValue();
    approvalService.addApprovals.mockResolvedValue({approvals: [
      {
        approvedBy: user,
        approverEmail: "G90_COLLIBRA_APPROVER_SYSTEMS@JohnDeere.com",
        comment: null,
        community: "a521b7d4-642c-4524-9c46-e4fa5e836a17",
        status: "PENDING",
        updatedAt: "2021-05-14T13:54:59.771Z"
      },
      {
        approvedBy: "mm12161",
        approverEmail: "G90_COLLIBRA_APPROVER_FINANCIAL_SERVICES@JohnDeere.com",
        comment: null,
        subCommunity: "2f71b2d2-f3d6-48a1-8bf7-d07ad7bd5f59",
        community: "75b382e2-46b8-4fe8-9300-4ed096586629",
        status: "PENDING",
        updatedAt: "2021-05-14T13:54:59.771Z"
      },
      {
        custodian: 'some-custodian',
        approvedBy: 'some-custodian',
        approverEmail: "undefined@JohnDeere.com",
        comment: null,
        status: "PENDING",
        updatedAt: "2021-05-14T13:54:59.771Z"
      }]
    });
    approvalService.getNonCustodianApprovals.mockReturnValue([
      {
        approvedBy: "mm12161",
        approverEmail: "AWS-GIT-DWIS-DEV@JohnDeere.com",
        comment: null,
        community: "a521b7d4-642c-4524-9c46-e4fa5e836a17",
        status: "PENDING",
        updatedAt: "2021-05-14T13:54:59.771Z"
      },
      {
        approvedBy: "mm12161",
        approverEmail: "G90_COLLIBRA_APPROVER_PARTS_OPERATIONS@JohnDeere.com",
        comment: null,
        subCommunity: "2f71b2d2-f3d6-48a1-8bf7-d07ad7bd5f59",
        community: "75b382e2-46b8-4fe8-9300-4ed096586629",
        status: "PENDING",
        updatedAt: "2021-05-14T13:54:59.771Z"
      }
    ]);
  });

  function createViewRemediation() {
    return {
      id: 'view-name',
      name: 'view-name',
      createdBy: user,
      createdAt: isoDate,
      updatedBy: user,
      updatedAt: isoDate,
      approvals: [
        {
          approvedBy: user,
          approverEmail: 'G90_COLLIBRA_APPROVER_SYSTEMS@JohnDeere.com',
          comment: null,
          community: {
            id: 'a521b7d4-642c-4524-9c46-e4fa5e836a17',
            name: 'Systems',
            approver: 'G90_COLLIBRA_APPROVER_SYSTEMS'
          },
          status: 'PENDING',
          updatedAt: '2021-05-14T13:54:59.771Z'
        }
      ],
      status: 'PENDING',
    }
  }

  it('should save remediations' , async () => {
    referenceService.dereferenceApprovals.mockReturnValue([
      {
        approvedBy: 'mm12161',
        approverEmail: 'AWS-GIT-DWIS-DEV@JohnDeere.com',
        comment: null,
        community: {
          id: 'a521b7d4-642c-4524-9c46-e4fa5e836a17',
          name: 'Systems',
          approver: 'AWS-GIT-DWIS-DEV'
        },
        status: 'PENDING',
        updatedAt: '2021-05-14T13:54:59.771Z'
      },
      {
        approvedBy: 'mm12161',
        approverEmail: 'G90_COLLIBRA_APPROVER_PARTS_OPERATIONS@JohnDeere.com',
        comment: null,
        subCommunity: {
          id: '2f71b2d2-f3d6-48a1-8bf7-d07ad7bd5f59',
          name: 'Operations',
          approver: 'G90_COLLIBRA_APPROVER_PARTS_OPERATIONS'
        },
        status: 'PENDING',
        updatedAt: '2021-05-14T13:54:59.771Z'
      }]);
    const driftedViewNames = ['brian.marvel_raw_cross'];
    await remediationService.saveRemediations(driftedViewNames);
    expect(approvalService.addApprovals).toBeCalled();
    expect(approvalService.getNonCustodianApprovals).toBeCalled();
    expect(remediationDao.saveRemediation).toBeCalled();
    expect(emailService.sendEmails).toBeCalled();
    expect(referenceService.dereferenceApprovals).toBeCalled();
  });

  it('should not save remediations for not toggled communities' , async () => {
    approvalService.addApprovals.mockResolvedValue({approvals: sampleApprovalsForToggles});
    approvalService.getNonCustodianApprovals.mockReturnValue(sampleApprovalsForToggles);

    const driftedViewNames = ['brian.marvel_raw_cross'];

    await remediationService.saveRemediations(driftedViewNames);
    expect(remediationDao.saveRemediation).toBeCalledTimes(0);
    expect(emailService.sendEmails).toBeCalledTimes(0);
  });

  it('should not update remediations if existing pending remediation and new drift with NO new communities' , async () => {
    approvalService.getNonCustodianApprovals.mockReturnValue([
      {
        approvedBy: "mm12161",
        approverEmail: "AWS-GIT-DWIS-DEV@JohnDeere.com",
        comment: null,
        community: "a521b7d4-642c-4524-9c46-e4fa5e836a17",
        status: "PENDING",
        updatedAt: "2021-05-14T13:54:59.771Z"
      },
      {
        approvedBy: "mm12161",
        approverEmail: "G90_COLLIBRA_APPROVER_FINANCIAL_SERVICES@JohnDeere.com",
        comment: null,
        community: "4d8d917d-5c87-43b7-a495-38c46b6f4ee1",
        status: "PENDING",
        updatedAt: "2021-05-14T13:54:59.771Z"
      }
    ]);
    const driftedViewNames = ['view-name'];
    const remediation = {...createViewRemediation(), ...{approvals: pendingdApprovals}, ...{status: 'PENDING'}};
    when(remediationDao.getRemediation).calledWith(remediation.id).mockReturnValue(remediation);

    await remediationService.saveRemediations(driftedViewNames);

    expect(remediationDao.saveRemediation).toBeCalledTimes(0);
    expect(emailService.sendEmails).toBeCalledTimes(0);
  });

  it('should update remediation with PENDING status for new communities, if existing pending remediation and new drift with NEW communities' , async () => {
    approvalService.getNonCustodianApprovals.mockReturnValue([
      {
        approvedBy: "mm12161",
        approverEmail: "AWS-GIT-DWIS-DEV@JohnDeere.com",
        comment: null,
        community: "a521b7d4-642c-4524-9c46-e4fa5e836a17",
        status: "PENDING",
        updatedAt: "2021-05-14T13:54:59.771Z"
      },
      {
        approvedBy: "mm12161",
        approverEmail: "G90_COLLIBRA_APPROVER_FINANCIAL_SERVICES@JohnDeere.com",
        comment: null,
        community: "4d8d917d-5c87-43b7-a495-38c46b6f4ee1",
        status: "PENDING",
        updatedAt: "2021-05-14T13:54:59.771Z"
      },
      {
        approvedBy: "mm12161",
        approverEmail: "G90_COLLIBRA_APPROVER_PARTS@JohnDeere.com",
        comment: null,
        community: "75b382e2-46b8-4fe8-9300-4ed096586629",
        subCommunity: "2f71b2d2-f3d6-48a1-8bf7-d07ad7bd5f59",
        status: "PENDING",
        updatedAt: "2021-05-14T13:54:59.771Z"
      }
    ]);

    referenceService.dereferenceApprovals.mockReturnValue([
      {
        approvedBy: 'mm12161',
        approverEmail: 'G90_COLLIBRA_APPROVER_PARTS@JohnDeere.com',
        comment: null,
        subCommunity: {
          id: '2f71b2d2-f3d6-48a1-8bf7-d07ad7bd5f59',
          name: 'Operations',
          approver: 'G90_COLLIBRA_APPROVER_PARTS_OPERATIONS'
        },
        status: 'PENDING',
        updatedAt: '2021-05-14T13:54:59.771Z'
      }
    ]);

    const driftedViewNames = ['view-name'];
    const remediation = {...createViewRemediation(), ...{approvals: partiallyApprovedApprovals}, ...{status: 'PENDING'}};
    when(remediationDao.getRemediation).calledWith(remediation.id).mockReturnValue(remediation);

    await remediationService.saveRemediations(driftedViewNames);

    expect(remediationDao.saveRemediation).toBeCalledTimes(1);
    expect(emailService.sendEmails).toBeCalledTimes(0);
    expect(referenceService.dereferenceApprovals).toBeCalledTimes(1);
  });

  it('should update existing pending remediation for removed communities by removing communities', async () => {
    approvalService.getNonCustodianApprovals.mockReturnValue([
      {
        approvedBy: "mm12161",
        approverEmail: "AWS-GIT-DWIS-DEV@JohnDeere.com",
        comment: null,
        community: "a521b7d4-642c-4524-9c46-e4fa5e836a17",
        status: "PENDING",
        updatedAt: "2021-05-14T13:54:59.771Z"
      }
    ]);

    const driftedViewNames = ['view-name'];
    const remediation = {...createViewRemediation(), ...{approvals: pendingdApprovals}, ...{status: 'PENDING'}};
    when(remediationDao.getRemediation).calledWith(remediation.id).mockReturnValue(remediation);

    await remediationService.saveRemediations(driftedViewNames);

    expect(remediationDao.saveRemediation).toBeCalledTimes(1);
    expect(emailService.sendEmails).toBeCalledTimes(0);
  });

  it('should update existing pending remediation for removed communities by removing communities and set status as APPROVED when remaining communities are approved', async() => {
    approvalService.getNonCustodianApprovals.mockReturnValue([
      {
        approvedBy: "mm12161",
        approverEmail: "AWS-GIT-DWIS-DEV@JohnDeere.com",
        comment: null,
        community: "a521b7d4-642c-4524-9c46-e4fa5e836a17",
        status: "PENDING",
        updatedAt: "2021-05-14T13:54:59.771Z"
      }
    ]);

    referenceService.dereferenceApprovals.mockReturnValue([]);

    const driftedViewNames = ['view-name'];
    const remediation = {...createViewRemediation(), ...{approvals: partiallyApprovedApprovals}, ...{status: 'PENDING'}};
    when(remediationDao.getRemediation).calledWith(remediation.id).mockReturnValue(remediation);
    when(metastoreDao.getView).calledWith(remediation.name).mockResolvedValue(sampleViews);

    const someDataset = { id: 'some-dataset-id', environmentName: 'some.datatype' };
    const otherDataset = { id: 'other-id', environmentName: 'other.datatype' };
    const unrelatedDataset = { id: 'unrelated-id' };
    const allDatasets = [someDataset, otherDataset, unrelatedDataset];
    datasetDao.getLatestDatasets.mockResolvedValueOnce(allDatasets);

    await remediationService.saveRemediations(driftedViewNames);

    expect(remediationDao.saveRemediation).toBeCalledTimes(1);
    expect(metastoreDao.saveViewMetadatas).toBeCalledTimes(1);
    expect(emailService.sendEmails).toBeCalledTimes(0);
  });

  it('should create new remediation if existing approved remediation', async() => {
    approvalService.getNonCustodianApprovals.mockReturnValue([
      {
        approvedBy: "mm12161",
        approverEmail: "AWS-GIT-DWIS-DEV@JohnDeere.com",
        comment: null,
        community: "a521b7d4-642c-4524-9c46-e4fa5e836a17",
        status: "PENDING",
        updatedAt: "2021-05-14T13:54:59.771Z"
      }
    ]);

    const driftedViewNames = ['view-name'];
    const remediation = {...createViewRemediation(), ...{approvals: fullyApprovedApprovals}, ...{status: 'APPROVED'}};
    when(remediationDao.getRemediation).calledWith(remediation.id).mockReturnValue(remediation);

    await remediationService.saveRemediations(driftedViewNames);

    expect(remediationDao.saveRemediation).toBeCalledTimes(1);
    expect(emailService.sendEmails).toBeCalledTimes(1);
  });

  it('should update remediation if existing rejected remediation and existing drift with changes in communities', async() => {
    approvalService.getNonCustodianApprovals.mockReturnValue([
      {
        approvedBy: "mm12161",
        approverEmail: "AWS-GIT-DWIS-DEV@JohnDeere.com",
        comment: null,
        community: "a521b7d4-642c-4524-9c46-e4fa5e836a17",
        status: "PENDING",
        updatedAt: "2021-05-14T13:54:59.771Z"
      },
      {
        approvedBy: "mm12161",
        approverEmail: "G90_COLLIBRA_APPROVER_FINANCIAL_SERVICES@JohnDeere.com",
        comment: null,
        community: "4d8d917d-5c87-43b7-a495-38c46b6f4ee1",
        status: "PENDING",
        updatedAt: "2021-05-14T13:54:59.771Z"
      },
      {
        approvedBy: "mm12161",
        approverEmail: "G90_COLLIBRA_APPROVER_PARTS@JohnDeere.com",
        comment: null,
        community: "75b382e2-46b8-4fe8-9300-4ed096586629",
        status: "PENDING",
        updatedAt: "2021-05-14T13:54:59.771Z"
      }
    ]);

    referenceService.dereferenceApprovals.mockReturnValue([
      {
        approvedBy: 'mm12161',
        approverEmail: 'G90_COLLIBRA_APPROVER_PARTS@JohnDeere.com',
        comment: null,
        community: {
          id: '75b382e2-46b8-4fe8-9300-4ed096586629',
          name: 'Parts',
          approver: 'G90_COLLIBRA_APPROVER_PARTS'
        },
        status: 'PENDING',
        updatedAt: '2021-05-14T13:54:59.771Z'
      },
      {
        approvedBy: 'mm12161',
        approverEmail: 'G90_COLLIBRA_APPROVER_FINANCIAL_SERVICES@JohnDeere.com',
        comment: null,
        community: {
          id: '4d8d917d-5c87-43b7-a495-38c46b6f4ee1',
          name: 'Financial Services',
          approver: 'G90_COLLIBRA_APPROVER_FINANCIAL_SERVICES'
        },
        status: 'PENDING',
        updatedAt: '2021-05-14T13:54:59.771Z'
      }
    ]);

    const driftedViewNames = ['view-name'];
    const remediation = {...createViewRemediation(), ...{approvals: rejectedApprovals}, ...{status: 'REJECTED'}};
    when(remediationDao.getRemediation).calledWith(remediation.id).mockReturnValue(remediation);

    await remediationService.saveRemediations(driftedViewNames);

    expect(remediationDao.saveRemediation).toBeCalledTimes(1);
    expect(emailService.sendEmails).toBeCalledTimes(0);
  });



  it('should get all pending remediations', async() => {
    remediationDao.getPendingRemediations.mockResolvedValue([{name: 'some-remediation-pending', isViewDrifted: true, status: 'PENDING'}]);
    const results = await remediationService.getPendingRemediations();
    expect(results).toEqual([{id: 'some-remediation-pending', name: 'some-remediation-pending', isViewDrifted: true, status: 'PENDING'}]);
  });

  it('should approve drifted view remediation and update views status in views-table', async () => {
    const status = 'APPROVED';
    const remediation = {...createViewRemediation(), fullyApprovedApprovals, status};
    const updatedViews = [
      { datasetId: 'datasetId-1', name: 'view-name', driftDetails: {}, status: 'AVAILABLE', updatedAt: '2020-09-01T18:26:41.274Z' },
      { datasetId: 'drifted-datasetId1', name: 'view-name', driftDetails: {}, status: 'AVAILABLE', updatedAt: '2020-09-01T18:26:41.274Z' },
    ];

    when(remediationDao.getRemediation).calledWith(remediation.id).mockResolvedValue(remediation);
    when(approvalService.approve).calledWith(remediation, user, testTime).mockResolvedValue(remediation);
    when(metastoreDao.getView).calledWith(remediation.name).mockResolvedValue(sampleViews);
    when(metastoreDao.saveViewMetadatas).calledWith(updatedViews).mockResolvedValue('Success');

    const someDataset = { id: 'datasetId-1', environmentName: 'some.datatype' , views: [ {name: 'existing-view1', status: 'AVAILABLE'}]};
    const otherDataset = { id: 'drifted-datasetId1', environmentName: 'other.datatype', views: [ {name: 'existing-view2', status: 'AVAILABLE'}]};
    const unrelatedDataset = { id: 'unrelated-id' };
    const allDatasets = [someDataset, otherDataset, unrelatedDataset];
    datasetDao.getLatestDatasets.mockResolvedValueOnce(allDatasets);
    const someDatasetUpdated = { id: 'datasetId-1', environmentName: 'some.datatype' , views: [ {name: 'existing-view1', status: 'AVAILABLE'}, {name: 'view-name', status: 'AVAILABLE'}]};
    const otherDatasetUpdated = { id: 'drifted-datasetId1', environmentName: 'other.datatype', views: [ {name: 'existing-view2', status: 'AVAILABLE'}, { name: 'view-name', status: 'AVAILABLE' }]};
    const updatedDatasets = [someDatasetUpdated, otherDatasetUpdated]
    viewService.addViewToExistingDatasets.mockResolvedValueOnce(updatedDatasets);

    await remediationService.approveRemediation(remediation.id, user, testTime);

    expect(metastoreDao.getView).toBeCalledWith(remediation.name);
    expect(metastoreDao.saveViewMetadatas).toBeCalled();
    expect(datasetService.saveDatasets).toBeCalled();
    expect(viewService.addViewToExistingDatasets).toBeCalled();
    expect(remediationDao.saveRemediation).toBeCalledWith(remediation);
    expect(emailService.sendEmails).toBeCalledWith(['G90_COLLIBRA_APPROVER_SYSTEMS@JohnDeere.com'],'Remediation Approved',remediation,'requester','Permission' );
  });

  it('should not save view metadata for partially approved drifted view remediation', async () => {
    const status = 'PENDING';
    const remediation = {...createViewRemediation(), partiallyApprovedApprovals, status};

    when(remediationDao.getRemediation).calledWith(remediation.id).mockResolvedValue(remediation);
    when(approvalService.approve).calledWith(remediation, user, testTime).mockResolvedValue(remediation);

    await remediationService.approveRemediation(remediation.id, user, testTime);

    expect(metastoreDao.getView).toBeCalledTimes(0);
    expect(metastoreDao.saveViewMetadatas).toBeCalledTimes(0);
    expect(datasetService.saveDatasets).toBeCalledTimes(0);
    expect(remediationDao.saveRemediation).toBeCalledWith(remediation);
    expect(emailService.sendEmails).toBeCalledWith(['G90_COLLIBRA_APPROVER_SYSTEMS@JohnDeere.com'],'Remediation Pending',remediation,'requester','Permission' );
  });

  it('should reject drifted view remediation', async () => {
    const status = 'REJECTED';
    const remediation = {...createViewRemediation(), rejectedApprovals, status};
    when(remediationDao.getRemediation).calledWith(remediation.id).mockResolvedValue(remediation);
    when(approvalService.reject).calledWith(remediation, 'testReason', user).mockResolvedValue(remediation);

    await remediationService.rejectRemediation(remediation.id, 'testReason', user, testTime);

    expect(remediationDao.saveRemediation).toBeCalledWith(remediation);
    expect(emailService.sendEmails).toBeCalledWith(['G90_COLLIBRA_APPROVER_SYSTEMS@JohnDeere.com'],'Remediation Rejected',remediation,'requester','Permission' );
  });

  it('should delete pending remediations for undrifted views', async () => {
    const remediation = {...createViewRemediation(), ...{approvals: pendingdApprovals}, ...{status: 'PENDING'}};
    const viewNames = ['view-name'];
    when(remediationDao.getRemediation).calledWith(remediation.id).mockResolvedValue(remediation);
    await remediationService.deleteRemeditaions(viewNames);
    expect(remediationDao.deleteRemediation).toBeCalledWith(remediation.name, remediation.createdAt);
  });

  it('should delete rejected remediations for undrifted views', async () => {
    const remediation = {...createViewRemediation(), ...{approvals: pendingdApprovals}, ...{status: 'REJECTED'}};
    const viewNames = ['view-name'];
    when(remediationDao.getRemediation).calledWith(remediation.id).mockResolvedValue(remediation);
    await remediationService.deleteRemeditaions(viewNames);
    expect(remediationDao.deleteRemediation).toBeCalledWith(remediation.name, remediation.createdAt);
  });

  it('should not delete non-pending remediations', async () => {
    const remediation = {...createViewRemediation(), ...{approvals: pendingdApprovals}, ...{status: 'APPROVED'}};
    const viewNames = ['view-name'];
    when(remediationDao.getRemediation).calledWith(remediation.id).mockResolvedValue(remediation);
    await remediationService.deleteRemeditaions(viewNames);
    expect(remediationDao.deleteRemediation).toBeCalledTimes(0);
  });

  it('should process the remediations', async () => {
    referenceService.dereferenceApprovals.mockReturnValue([
      {
        approvedBy: 'mm12161',
        approverEmail: 'AWS-GIT-DWIS-DEV@JohnDeere.com',
        comment: null,
        community: {
          id: 'a521b7d4-642c-4524-9c46-e4fa5e836a17',
          name: 'Systems',
          approver: 'AWS-GIT-DWIS-DEV'
        },
        status: 'PENDING',
        updatedAt: '2021-05-14T13:54:59.771Z'
      },
      {
        approvedBy: 'mm12161',
        approverEmail: 'G90_COLLIBRA_APPROVER_PARTS_OPERATIONS@JohnDeere.com',
        comment: null,
        subCommunity: {
          id: '2f71b2d2-f3d6-48a1-8bf7-d07ad7bd5f59',
          name: 'Operations',
          approver: 'G90_COLLIBRA_APPROVER_PARTS_OPERATIONS'
        },
        status: 'PENDING',
        updatedAt: '2021-05-14T13:54:59.771Z'
      }]);
    const updatedViews = [
      { name: 'brian.marvel_raw_cross', status: 'DRIFTED' },
      { name: 'view-name', status: 'AVAILABLE' }
    ]
    const deleteRemediation = {...createViewRemediation(), ...{approvals: pendingdApprovals}, ...{status: 'PENDING'}};
    when(remediationDao.getRemediation).calledWith(deleteRemediation.id).mockResolvedValue(deleteRemediation);

    await remediationService.processRemediations(updatedViews);

    expect(approvalService.addApprovals).toBeCalled();
    expect(approvalService.getNonCustodianApprovals).toBeCalled();
    expect(remediationDao.saveRemediation).toBeCalled();
    expect(emailService.sendEmails).toBeCalled();
    expect(referenceService.dereferenceApprovals).toBeCalled();
    expect(remediationDao.deleteRemediation).toBeCalledWith(deleteRemediation.name, deleteRemediation.createdAt);
  });

});
