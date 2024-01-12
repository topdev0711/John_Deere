const { addCommentHistories } = require('../../../src/migration/commentHistory');
const { APPROVED, PENDING } = require('../../../src/services/statusService');
describe('commentHistory migration test', () => {
  const anyComment = 'some comment';

  const approval = {
    approvedBy: 'dp11317',
    approverEmail: 'G90_COLLIBRA_APPROVER_SYSTEMS@JohnDeere.com',
    community: { id: 'a521b7d4-642c-4524-9c46-e4fa5e836a17', name: 'Systems', approver: 'G90_COLLIBRA_APPROVER_SYSTEMS' },
    status: 'APPROVED',
    updatedAt: '2020-06-29T15:53:26.342Z'
  };

  const record = {
    _id: '34570500-9427-460d-8ee2-36da9d507faa-3',
    classifications: [
      {
        additionalTags: [],
        development: false,
        personalInformation: false,
        id: 'cad36897-0b6e-4ea4-8d07-c148934c22db',
        community: { id: 'a521b7d4-642c-4524-9c46-e4fa5e836a17', name: 'Systems' },
        subCommunity: { id: '48112e16-9abf-48ed-ae79-ab43844a32ec', name: 'Demo' },
        gicp: { id: '159d753e-c245-43eb-ba2b-7d29cb436c3d', name: 'Unclassified' }
      }
    ],
    requestComments: anyComment,
    sourceDatasets: [],
    technology: { id: '1f8ee69b-62ad-42a3-9598-02947ea25670', name: 'AWS' },
    version: 3,
    status: 'AVAILABLE',
    environmentName: 'com.deere.enterprise.datalake.raw.prashanth_raw_dataset_external',
    createdAt: '2020-06-29T15:49:26.209Z',
    updatedBy: 'EDL',
    createdBy: 'EDL',
    name: 'acl_enhancement_test_external-2',
    phase: { id: 'bef5d851-c91e-4ba1-82b7-62a274ad189b', name: 'Raw' },
    physicalLocation: { id: '6c2760b1-fabf-45fb-adc6-9d717e38b598', name: 'us-east-1' },
    updatedAt: '2020-06-29T15:50:41.192Z',
    category: { id: 'dc2db157-e121-4ac1-8d16-dc38141616b5', name: 'Master'},
    description: 'prashanth_raw_dataset',
    id: '34570500-9427-460d-8ee2-36da9d507faa',
    custodian: 'AWS-GIT-DWIS-ADMIN',
    approvals: [approval],
    documentation: '',
    environment: {},
    dataRecovery: false
  };

  it('should add comment history to record', () => {
    const actualRecord = addCommentHistories([record]);

    const requestComments = [{updatedBy: 'EDL', updatedAt: '2020-06-29T15:50:41.192Z', comment: anyComment}];
    const approvalComments = [{ status: APPROVED, updatedBy: 'dp11317', updatedAt: '2020-06-29T15:53:26.342Z', comment: 'No comment' }];
    const approvals = [{...record.approvals[0], commentHistory: approvalComments}];
    const expectedRecord = [{ ...record, approvals, commentHistory: requestComments }];

    expect(actualRecord).toEqual(expectedRecord);
  });

  it('should add empty comment history to record', () => {
    const incomingApprovals = [{ ...approval, status: PENDING}];
    const actualRecord = addCommentHistories([{ ...record, approvals: incomingApprovals}]);

    const requestComments = [{updatedBy: 'EDL', updatedAt: '2020-06-29T15:50:41.192Z', comment: anyComment}];
    const approvals = [{...record.approvals[0], commentHistory: [], status: PENDING}];
    const expectedRecord = [{ ...record, approvals, commentHistory: requestComments}];

    expect(actualRecord).toEqual(expectedRecord);
  });
});
