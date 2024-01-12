const nodemailer = require('nodemailer');
const conf = require('../../conf');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');
const moment = require('moment');
const referenceService = require('./referenceService');
const {findUserInfo} = require('../data/ldap/activeDirectoryDao');
const { isRejected } = require('./statusService')
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  referenceService.setLogger(logger);
}

const emailBodyTemplateOptions = {
  viewEngine: {
    defaultLayout: 'layout',
    extname: '.hbs',
    layoutsDir: path.join(__dirname, '..', 'views/layouts'),
    partialsDir: path.join(__dirname, '..', 'views/partials'),
    helpers: {
      ifEven: function (conditional, options) {
        if ((conditional % 2) == 0) {
          return options.fn(this);
        } else {
          return options.inverse(this);
        }
      },
      ifEqual: function (a, b, options) {
        if (a == b) {
          return options.fn(this);
        } else {
          return options.inverse(this);
        }
      }
    },
  },
  viewPath: path.join(__dirname, '..', 'views/partials'),
  extName: '.hbs',
}

function getTransporter() {
  const emailBodyTemplate = hbs(emailBodyTemplateOptions);
  const transporter = nodemailer.createTransport({host: 'mail.dx.deere.com', port: 25, secure: false});
  transporter.use('compile', emailBodyTemplate);
  return transporter;
}

function getApprovalsInfo(approval) {
  const refId = approval.subCommunity ? approval.subCommunity : approval.community;
  const reference = refId.name ? refId : referenceService.getValue(refId);
  return {
    status: approval.status,
    approvedBy: approval.approvedBy,
    reason: approval.reason,
    ...(approval.subCommunity) ? {subCommunity: reference.name} : {community: reference.name}
  };
}

function getOwnerInfo(approval) {
  return {
    status: approval.status,
    approvedBy: approval.approvedBy,
    reason: approval.reason,
    owner: approval.owner
  };
}

function getApprovals(approvals) {
  const ownerApproval = approvals.filter(approval => approval.owner).map(getOwnerInfo);
  const approvalsData = approvals.filter(approval => !approval.system && !approval.custodian && !approval.owner).map(getApprovalsInfo);
  const communityApproval = approvalsData.filter(d => d.community);
  const subCommunityApproval = approvalsData.filter(d => d.subCommunity);
  return {...communityApproval.length && { communityApproval },
    ...subCommunityApproval.length && { subCommunityApproval },
    ...ownerApproval.length && { ownerApproval }
  }
}

async function getUserInfo(updatedBy) {
  try {
    return (await findUserInfo(updatedBy));
  } catch (e) {
    return {name: updatedBy, mail: `${updatedBy}@deere.com`};
  }
}

async function getRejectingApprover({approvals, updatedBy }) {
  const {approvedBy} = approvals.find(isRejected);
  try {
    const {name, mail} = await findUserInfo(approvedBy);
    return {rejectingApproverName: name, rejectingApproverEmail: mail};
  } catch (e) {
    log.error(`Failed to get rejecting approver user info with error: ${e.stack}`);
    return {rejectingApproverName: updatedBy, rejectingApproverEmail: `${updatedBy}@deere.com`};
  }
}

async function emailData(data, address, catalogType) {
  try {
    const {approvals = [], id, name, updatedBy, version} = data;
    const baseUrl = conf.getConfig().baseUrl;
    let dataUrl = `${baseUrl}/catalog/${catalogType.toLowerCase()}s/detail?version=${version}`;
    dataUrl += catalogType.toLowerCase() === 'view' ? `&ref=approvals&id=${name}` : `&id=${id}`;
    const approvalUrl = `${conf.getConfig().baseUrl}/approvals`;
    const {name: userName, mail: userEmail} = await getUserInfo(updatedBy);
    const approvalFields = getApprovals(approvals);
    const submissionDate = moment(data.updatedAt).format('DD MMM YYYY');
    const rejected = isRejected(data);
    const status = data.status.toLowerCase();
    const rejectingApprover = rejected ? (await getRejectingApprover(data)): {};

    return {userName, userEmail, dataUrl, name, submissionDate, approvalUrl, catalogType, status, rejected, ...approvalFields, ...rejectingApprover};
  } catch (error) {
    log.error(error);
  }
}

async function sendEmails(addresses, subject, data, template, catalogType) {
  if (conf.getConfig().isLocal || !addresses) {
    return;
  }
  try {
    let transporter = getTransporter();

    await Promise.all(addresses.map(async address => {
      const mailObject = {
        from: '"Enterprise Data Lake Core Team" <ENTERPRISEDATALAKECORETEAM@JohnDeere.com>',
        to: address,
        subject: subject,
        text: !template ? data : subject,
        template: !template ? 'default' : template,
        context: !template ? { text: data } : await emailData(data, address, catalogType)
      }
      return transporter.sendMail(mailObject);
    }));
  } catch (e) {
    log.error(e);
  }
}

module.exports = { setLogger, sendEmails };
