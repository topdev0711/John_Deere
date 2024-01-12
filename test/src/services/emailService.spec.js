const nodemailer = require('nodemailer');
const emailService = require('../../../src/services/emailService');
const conf = require('../../../conf');
const data = require('./emailServiceRequester.json');
const approverData = require('./emailServiceApprover.json');
const referenceService = require('../../../src/services/referenceService');
const {findUserInfo} = require('../../../src/data/ldap/activeDirectoryDao');
const {REJECTED} = require('../../../src/services/statusService');

jest.mock('nodemailer');
jest.mock('../../../src/services/referenceService');
jest.mock('../../../src/data/ldap/activeDirectoryDao');

describe('emailService tests', () => {
  let sendMailer;
  const anyAddress = 'anyAddress';
  const anySubject = 'anySubject';
  const anyBody = 'anyBody';
  const anyTemplate = 'some template';
  const anyCatalogType = 'some type';
  const anyName = 'anyName';
  const anyMail = 'anyUserEmail@JohnDeere.com';
  const approver = 'DooScooby';
  const from = '"Enterprise Data Lake Core Team" <ENTERPRISEDATALAKECORETEAM@JohnDeere.com>';
  const createEmailInfo = context => ({from, to: anyAddress, subject: anySubject, text: anySubject, template: 'requester', context});

  const createDatasetContext = () => {
    return {
      userName: 'anyName',
      userEmail: 'anyUserEmail@JohnDeere.com',
      dataUrl: 'https://test-data-catalog.com/catalog/datasets/detail?version=1&id=56debf7d-7643-4159-bde2-4aa61890cf3a',
      name: 'Some Name',
      submissionDate: '21 May 2020',
      approvalUrl: 'https://test-data-catalog.com/approvals',
      catalogType: 'dataset',
      status: 'pending',
      rejected: false,
      communityApproval: [{community: 'Customer', status: 'PENDING', approvedBy: null, reason: undefined}]
    }
  }

  const createPermissionContext = () => {
    return {
      userName: 'anyName',
      userEmail: 'anyUserEmail@JohnDeere.com',
      dataUrl: `https://test-data-catalog.com/catalog/permissions/detail?version=28&id=123456840503dnflng`,
      name: 'CPS Automation',
      submissionDate: '22 May 2020',
      approvalUrl: 'https://test-data-catalog.com/approvals',
      catalogType: 'Permission',
      status: 'available',
      rejected: false,
      communityApproval: [
        {community: 'Channel', status: 'APPROVED', approvedBy: 'testracfId', reason: undefined},
        {community: 'Channel', status: 'APPROVED', approvedBy: 'testracfId', reason: undefined}
      ]
    }
  }

  beforeEach(() => {
    jest.spyOn(conf, 'getConfig').mockReturnValue({isLocal: false});
    findUserInfo.mockResolvedValue({name: anyName, mail: anyMail});
    sendMailer = jest.fn().mockResolvedValue({});
    nodemailer.createTransport.mockReturnValue({sendMail: sendMailer, use: jest.fn().mockImplementation(() => '')});
  });

  it('should send emails', async () => {
    await emailService.sendEmails([anyAddress], anySubject, anyBody);
    const expectedEmailInfo = {...createEmailInfo({text: anyBody}), template: 'default', text: anyBody};
    expect(sendMailer).toBeCalledWith(expectedEmailInfo);
  });

  it('should not send email(s) when local', async () => {
    jest.spyOn(conf, 'getConfig').mockReturnValue({isLocal: true});
    await emailService.sendEmails([anyAddress], anySubject, anyBody, anyTemplate, anyCatalogType);
    expect(sendMailer).not.toBeCalled();
  });

  it('should not throw error when error occurs while sending any email', () => {
    const sendMailer = jest.fn().mockRejectedValue(new Error('boom'));
    nodemailer.createTransport.mockReturnValue({sendMail: sendMailer});
    return emailService.sendEmails([anyAddress], anySubject, anyBody, anyTemplate, anyCatalogType);
  });

  it('should not throw error when no addresses', () => {
    return emailService.sendEmails(null, anySubject, anyBody, anyTemplate, anyCatalogType);
  });

  it('should send emails to community requester', async () => {
    referenceService.getValue.mockReturnValue({id: '10', name: 'Channel', approver});
    jest.spyOn(conf, 'getConfig').mockReturnValue({isLocal: false, baseUrl: 'https://test-data-catalog.com'});

    await emailService.sendEmails([anyAddress], anySubject, data, 'requester', 'Permission');

    const context = createPermissionContext();
    const expectedEmailInfo = createEmailInfo(context);
    expect(sendMailer).toBeCalledWith(expectedEmailInfo);
  });

  it('should send emails to deref community requester', async () => {
    jest.spyOn(conf, 'getConfig').mockReturnValue({isLocal: false, baseUrl: 'https://test-data-catalog.com'});
    const approvals = data.approvals.map(approval => ({...approval, community: {id: '10', name: 'Channel', approver}}));
    const updatedData = {...data, approvals};

    await emailService.sendEmails([anyAddress], anySubject, updatedData, 'requester', 'Permission');

    const context = createPermissionContext();
    const expectedEmailInfo = createEmailInfo(context);
    expect(sendMailer).toBeCalledWith(expectedEmailInfo);
  });

  it('should send emails to community & subCommunity requester', async () => {
    referenceService.getValue.mockReturnValue({id: '10', name: 'Channel', approver});
    jest.spyOn(conf, 'getConfig').mockReturnValue({isLocal: false, baseUrl: 'https://test-data-catalog.com'});

    const subCommunityApproval = {subCommunity: 'Warranty', status: 'APPROVED', approvedBy: 'testracfId', approverEmail: 'anyAddress', comment: null, updatedAt: null}
    const updatedData = {...data, approvals: [...data.approvals, subCommunityApproval]};
    await emailService.sendEmails([anyAddress], anySubject, updatedData, 'requester', 'Permission');

    const expectedSubCommunityApproval = [{subCommunity: 'Channel', status: 'APPROVED', approvedBy: 'testracfId', reason: undefined}]
    const context = { ...createPermissionContext(), subCommunityApproval: expectedSubCommunityApproval};
    const expectedEmailInfo = createEmailInfo(context);
    expect(sendMailer).toBeCalledWith(expectedEmailInfo);
  });

  it('should send emails to deref community & subCommunity requester', async () => {
    const updatedData = {
      ...data,
      approvals: [
        ...data.approvals.map(approval => {
          return {
            ...approval,
            ...approval.community && {community: {id: '10', name: 'Channel', approver}},
          }
        }),
        {
          subCommunity: {id: '11', name: 'Warranty', approver},
          status: 'APPROVED',
          approvedBy: 'testracfId',
          approverEmail: 'anyAddress',
          comment: null,
          updatedAt: null
        }
      ]
    }
    jest.spyOn(conf, 'getConfig').mockReturnValue({isLocal: false, baseUrl: 'https://test-data-catalog.com'});

    await emailService.sendEmails([anyAddress], anySubject, updatedData, 'requester', 'Permission');

    const expectedSubCommunityApproval = [{subCommunity: 'Warranty', status: 'APPROVED', approvedBy: 'testracfId', reason: undefined}];
    const context = { ...createPermissionContext(), subCommunityApproval: expectedSubCommunityApproval};
    const expectedEmailInfo = createEmailInfo(context);
    expect(sendMailer).toBeCalledWith(expectedEmailInfo);
  });

  it('should send emails to community approver', async () => {
    referenceService.getValue.mockReturnValue({id: '11', name: 'Customer', approver});
    jest.spyOn(conf, 'getConfig').mockReturnValue({isLocal: false, baseUrl: 'https://test-data-catalog.com'});

    await emailService.sendEmails([anyAddress], anySubject, approverData, 'approver', 'dataset');

    const context = createDatasetContext();
    const expectedEmailInfo = {...createEmailInfo(context), template: 'approver'};
    expect(sendMailer).toBeCalledWith(expectedEmailInfo);
  });

  it('should send emails to community & SubCommunity approver', async () => {
    referenceService.getValue.mockReturnValue({id: '11', name: 'Customer', approver});
    jest.spyOn(conf, 'getConfig').mockReturnValue({isLocal: false, baseUrl: 'https://test-data-catalog.com'});
    const subCommunityApproval = {
      'subCommunity': 'Warranty',
      'status': 'PENDING',
      'approvedBy': null,
      'approverEmail': 'anyAddress',
      'comment': null,
      'updatedAt': null
    }
    approverData.approvals.push(subCommunityApproval)
    await emailService.sendEmails([anyAddress], anySubject, approverData, 'approver', 'dataset');

    const expectedSubCommunityApproval = [{subCommunity: 'Customer', status: 'PENDING', approvedBy: null, reason: undefined}];
    const context = { ...createDatasetContext(), subCommunityApproval: expectedSubCommunityApproval};
    const expectedEmailInfo = {...createEmailInfo(context), template: 'approver'};
    expect(sendMailer).toBeCalledWith(expectedEmailInfo);
  });

  it('should reject dataset', async () => {
    referenceService.getValue.mockReturnValue({id: '11', name: 'Customer', approver});
    jest.spyOn(conf, 'getConfig').mockReturnValue({isLocal: false, baseUrl: 'https://test-data-catalog.com'});
    const rejectedApproval = { approvedBy: anyName, status: REJECTED, subCommunity: 'Customer', reason: undefined };
    const approvals = [rejectedApproval];
    const data = {...approverData, status: REJECTED, approvals };

    await emailService.sendEmails([anyAddress], anySubject, data, 'approver', 'dataset');

    const subCommunityApproval = [rejectedApproval];
    const {communityApproval, ...initialContext} = createDatasetContext();
    const context = {...initialContext, status: REJECTED.toLowerCase(), rejected: true, rejectingApproverEmail: 'anyUserEmail@JohnDeere.com', rejectingApproverName: 'anyName', subCommunityApproval};
    const expectedEmailInfo = {...createEmailInfo(context), template: 'approver'};
    expect(sendMailer).toBeCalledWith(expectedEmailInfo);
  });

  it('should use racf email as fallback', async () => {
    findUserInfo.mockRejectedValue(new Error('anyError'));

    referenceService.getValue.mockReturnValue({id: '11', name: 'Customer', approver});
    jest.spyOn(conf, 'getConfig').mockReturnValue({isLocal: false, baseUrl: 'https://test-data-catalog.com'});
    const rejectedApproval = { approvedBy: anyName, status: REJECTED, subCommunity: 'Customer', reason: undefined };
    const approvals = [rejectedApproval];
    const data = {...approverData, status: REJECTED, approvals };

    await emailService.sendEmails([anyAddress], anySubject, data, 'approver', 'dataset');

    const subCommunityApproval = [rejectedApproval];
    const {communityApproval, ...initialContext} = createDatasetContext();
    const context = {...initialContext, status: REJECTED.toLowerCase(), rejected: true, userName: 'testracfId', userEmail:'testracfId@deere.com', rejectingApproverEmail: 'testracfId@deere.com', rejectingApproverName: 'testracfId', subCommunityApproval};
    const expectedEmailInfo = {...createEmailInfo(context), template: 'approver'};
    expect(sendMailer).toBeCalledWith(expectedEmailInfo);
  });
});
