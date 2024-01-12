const apiHelper = require('../utilities/edlApiHelper');
const conf = require('../../conf')
const runtimeConfig = conf.getConfig();
const {_} = require('lodash');
let log = require('edl-node-log-wrapper');
const applicationsDao = require('../data/applicationsDao')
const featureToggleService = require("./featureToggleService");

const setLogger = logger => {
  log = logger;
  apiHelper.setLogger(logger);
};
let oneMinute = 60
const expirationTime = 2 * 60 * oneMinute
async function isBusinessAppDisabled() {
  try{
    let businessAppToggle = !!(await featureToggleService.getToggle("jdc.business_application_enabled"))?.enabled
    return (businessAppToggle) ? businessAppToggle : false;
  } catch (e) {
    log.error(e.stack)
    return false
  }
}

async function getAllApplications(userId, lite, groups) {
  const response = await apiHelper.getApplications('graphql/', (lite ? [] : groups), userId);
  return [].concat(...Object.values(response.data))
}

async function getApplicationDetails(groups, userId, lite = false) {
  let allApplications = await getAllApplications(userId, lite, groups)
  const applications = allApplications.filter(({ isDeleted }) => {
    return !isDeleted;
  })
      .map(async application => {
        let assignmentGroup
        let supportGroup
        let shortDescription
        let comments
        let subject
        let dbAppData
        if (!lite) {
          if (application.configurationItems && application.configurationItems.length > 0) {
            assignmentGroup = application.configurationItems[0].assignmentGroup;
            supportGroup = application.configurationItems[0].supportGroup;
            shortDescription = application.configurationItems[0].shortDescription;
            comments = application.configurationItems[0].comments;
          }
          if (application.authorizations && application.authorizations.length > 0) {
            subject = application.authorizations[0].subject;
          }
          const [isAppDisabled, dbApp] = await Promise.all([
            isBusinessAppDisabled(),
            applicationsDao.getApplication(application.name)
          ]);
          dbAppData = isAppDisabled ? dbApp : {};
        }

        return {
          value: application.name,
          label: application.name,
          businessApplication: application.buisinessApplicationName,
          comments: comments,
          id: application.name,
          teamPdl: application.teamPdl,
          assignmentGroup: assignmentGroup,
          supportGroup: supportGroup,
          shortDescription: shortDescription,
          subject: subject,
          unit: dbAppData?.unit || '',
          department: dbAppData?.department || ''
        };
      });
  const results = await Promise.all(applications);
  return _.uniqBy(results, 'id');
}

async function getBusinessApplicationsList(userId) {
  const response = await apiHelper.getBusinessApplications('graphql/', userId);
  return [].concat(...Object.values(response.data));
}

async function createOneCloudApplication(body) {
  try {
    log.info('Creating application');
    const response = await apiHelper.createApplication('application-registry/applications/', body);
    log.info('Successfully created application');
    return response;
  } catch(error) {
    log.error(error);
    throw error;
  }
}

async function createApplication(body) {
  if (await isBusinessAppDisabled()) {
    await saveApplicationInDynamo(body, body?.name)
  }
  return await createOneCloudApplication(body);
}

async function saveApplicationInDynamo(body, applicationName) {
  if (body?.unit) {
    let dbApplication = {
      applicationName: applicationName,
      unit: body.unit,
      department: body.department
    }
    await applicationsDao.saveApplication(dbApplication)
  }
}

async function editApplication(applicationName,body) {
  try {
    if (await isBusinessAppDisabled()) {
      await saveApplicationInDynamo(body, applicationName);
    }
    return await apiHelper.editApplication(applicationName, body);
  }catch(error) {
    throw new Error("Editing the application failed");
  }
}

async function deleteApplication(appName) {
  try {
    const response = await apiHelper.getOneCloudApi(`application-registry/applications/${appName}/environments`);
    if (await isBusinessAppDisabled()) {
      await applicationsDao.deleteApplication(appName)
    }
    await Promise.all(response.map(async application => {
      return apiHelper.deleteOneCloudApi(`application-registry/application-environment/${application.name}`)
    }))
    return apiHelper.deleteOneCloudApi(`application-registry/applications/${appName}`)
  } catch (e) {
    log.error(e);
    throw e;
  }
}

async function getApplication(applicationName) {
  const response = await apiHelper.getOneCloudApi(`application-registry/applications/${applicationName}`);
  const [isAppDisabled, dbApp] = await Promise.all([
    isBusinessAppDisabled(),
    await applicationsDao.getApplication(response.name)
  ]);

  const dbAppData = isAppDisabled ? dbApp : {};
  return {
    name: response.name,
    businessApplication: response.business_application_name,
    businessCriticality: response.business_criticality,
    installStatus: response.install_status,
    shortDescription: response.short_description,
    teamPdl: response.team_notification_pdl,
    comments: response.comments || '',
    subject: response.authorizations[0].subject,
    assignmentGroup: response.assignment_group,
    supportGroup: response.support_group,
    unit: dbAppData?.unit,
    department: dbAppData?.department
  }
}

async function getPnOData(username) {
  const response = await apiHelper.getPnODetailsForUser(username)
  let pnoResponse = response?.length > 0 ? response[0] : {}
  return {unit : pnoResponse?.organizationInfo?.unitInfo?.chargeUnit, department: pnoResponse?.organizationInfo?.unitInfo?.chargeDepartment}
}

module.exports = {
  setLogger,
  getApplicationDetails,
  getApplication,
  deleteApplication,
  createApplication,
  editApplication,
  getBusinessApplicationsList,
  getPnOData
};
