const applicationService = require('../../../src/services/applicationService');
const conf = require('../../../conf');
const apiHelper = require('../../../src/utilities/edlApiHelper');
const applicationsDao = require('../../../src/data/applicationsDao')
const featureToggleService = require("../../../src/services/featureToggleService");
const Redis = require('ioredis-mock');
const RedisStore = require('cache-manager-ioredis');
const cacheManager = require('cache-manager');

jest.mock('ioredis', () => {
  return require('ioredis-mock');
});
jest.mock('../../../src/utilities/edlApiHelper');
jest.mock('../../../src/data/applicationsDao')
jest.mock('../../../src/services/featureToggleService')
jest.mock('node-fetch', () => require('fetch-mock-jest').sandbox())
const fetch = require('node-fetch')

const mockCache = {
  get: async () => {},
  set: async () => {}
};

describe('application Service', () => {
  beforeEach(() => {
    const redisInstance = new Redis();
    let cache = cacheManager.caching({
      store: RedisStore,
      redisInstance,
    });

    jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue(cache);
  });

  afterEach(() => {
    fetch.mockReset();
  });
  let applications = {
    "data": {
        "q0": [
            {
                "name": "name-test1",
                "authorizations": [
                    {
                        "subject": "AWS-GIT-DWIS-DEV"
                    }
                ],
                "isDeleted": false,
                "applicationEnvironments": [
                  {
                    "location": "305463345279"
                  },
                  {
                    "location": "541843007032"
                  }
                ],
                "buisinessApplicationName": "enterprise_data_lake_edl",
                "configurationItems": [
                  {
                    "assignmentGroup": "AE EDL Support",
                    "supportGroup": "AE EDL Support",
                    "shortDescription": "EDL Component Tag Test1"
                  }
                ],
                "teamPdl": "ENTERPRISEDATALAKECORETEAM@JOHNDEERE.COM"
            },
            {
                "name": "name-test2",
                "authorizations": [
                    {
                        "subject": "AWS-GIT-DWIS-DEV"
                    }
                ],
                "isDeleted": true,
                "applicationEnvironments": [
                  {
                    "location": "305463345279"
                  },
                  {
                    "location": "541843007032"
                  }
                ],
                "buisinessApplicationName": "unknown",
                "configurationItems": [
                  {
                    "assignmentGroup": "AE EDL Support",
                    "supportGroup": "AE EDL Support",
                    "shortDescription": "EDL Component Tag Test"
                  }
                ],
                "teamPdl": "ENTERPRISEDATALAKECORETEAM@JOHNDEERE.COM"
            }
          ],
        "q1": [
          {
              "name": "name-test3",
              "authorizations": [
                  {
                      "subject": "EDG-GIT-DWIS-DEV"
                  }
              ],
              "isDeleted": false,
              "applicationEnvironments": [
                {
                  "location": "305463345279"
                },
                {
                  "location": "813480354605"
                },
                {
                  "location": "078228365593"
                },
                {
                  "location": "813480354605"
                }
              ],
              "buisinessApplicationName": "unknown",
              "configurationItems": [
                {
                  "assignmentGroup": "AE EDL Support",
                  "supportGroup": "AE EDL Support",
                  "shortDescription": "EDL Component Tag Test"
                }
              ],
              "teamPdl": "ENTERPRISEDATALAKECORETEAM@JOHNDEERE.COM"
          },
          {
            "name": "name-test4",
            "authorizations": [
                {
                    "subject": "EDG-GIT-DWIS-DEV"
                }
            ],
            "isDeleted": false,
            "applicationEnvironments": [
              {
                "location": "305463355555"
              },
              {
                "location": "541843007777"
              }
            ],
            "buisinessApplicationName": "unknown",
            "configurationItems": [
              {
                "assignmentGroup": "AE OPS Support",
                "supportGroup": "AE OPS Support",
                "shortDescription": "Component Tag Test"
              }
            ],
            "teamPdl": "test@JOHNDEERE.COM"
          },
          {
            "name": "name-test5",
            "authorizations": [
                {
                    "subject": "EDG-GIT-DWIS-DEV"
                }
            ],
            "isDeleted": false,
            "applicationEnvironments": [
              {
                "location": "541843007032"
              }
            ],
            "buisinessApplicationName": "unknown",
            "configurationItems": [
              {
                "assignmentGroup": "AE OPS Support",
                "supportGroup": "AE OPS Support",
                "shortDescription": "Component Tag Test"
              }
            ],
            "teamPdl": "test@JOHNDEERE.COM"
          }
        ],
        "q2": [],
        "q3": [
          {
              "name": "name-test1",
              "authorizations": [
                  {
                      "subject": "EDL-GIT-DWIS-ADMIN"
                  }
              ],
              "isDeleted": false,
              "applicationEnvironments": [
                {
                  "location": "305463345279"
                },
                {
                  "location": "541843007032"
                }
              ],
              "buisinessApplicationName": "enterprise_data_lake_edl",
              "configurationItems": [
                {
                  "assignmentGroup": "AE EDL Support",
                  "supportGroup": "AE EDL Support",
                  "shortDescription": "EDL Component Tag Test1"
                }
              ],
              "teamPdl": "ENTERPRISEDATALAKECORETEAM@JOHNDEERE.COM"
          }
        ]
    }
  }

  let application = {
    "authorizations": [
        {
          "subject": "AWS-SOME-GROUP"
        }
    ],
    "business_criticality": "medium",
    "assignment_group": "AE EDL Support",
    "install_status": "Installed",
    "support_group": "AE EDL Support",
    "comments": "",
    "short_description": "some short description",
    "name": "edlWorkflow",
    "business_application_name": "unknown",
    "team_notification_pdl": "SOME@JOHNDEERE.COM",
        }

  let applicationEnvironments = [
    {
      "business_criticality": "low",
      "assignment_group": "AE EDL Support",
      "install_status": "Installed",
      "support_group": "AE EDL Support",
      "comments": "",
      "description": null,
      "short_description": "test",
      "parent_name": "edl-test-application",
      "name": "jd-us01-commoninformationservices-devl.edl-test-application",
      "application_name": "edl-test-application",
      "is_deleted": false,
      "provider_type": "aws",
      "location": "541843007032",
      "where_deployed": "jd-us01-commoninformationservices-devl",
      "type": "account",
      "deploy_status": "deployed",
  }
  ]

  let body = {
    "name": "edl-test-application",
    "assignment_group": "AE EDL Support",
    "authorizations": [
      {
        "authorization_type": "api",
        "role": "product_developer",
        "subject": "AWS-GIT-DWIS-DEV"
      }
    ],
    "business_application_name": "enterprise_data_lake_edl",
    "business_criticality": "low",
    "install_status": "Installed",
    "short_description": "EDL Component Tag Test",
    "support_group": "AE EDL Support",
    "team_notification_pdl": "ENTERPRISEDATALAKECORETEAM@JOHNDEERE.COM"
  }

  let createAppResponse = {
    "business_criticality": "low",
    "assignment_group": "AE EDL Support",
    "install_status": "Installed",
    "support_group": "AE EDL Support",
    "comments": null,
    "description": null,
    "short_description": "EDL Component Tag Test",
    "parent_name": "enterprise_data_lake_edl",
    "name": "edl-test-application",
    "business_application_name": "enterprise_data_lake_edl",
    "team_notification_pdl": "ENTERPRISEDATALAKECORETEAM@JOHNDEERE.COM"
}

let businessApplicationResponse = [{
    "name": "accenture_clone_and_test_tool_saas",
    "displayName": "Accenture Clone and Test Tool - SaaS",
    "productName": "global_payroll",
    "apmAppNumber": "APM0020499",
    "installStatus": "In Production"
  }]

  let pnoResponse = [
    {
      "identifier": {
        "userId": "ARJ5QKA",
        "employeeNumber": "13354",
        "sapId": "00010054997"
      },
      "profileInfo": {
        "userTypeCode": 1,
        "userTypeCodeDescription": "SALARIED_EMPLOYEE",
        "userLegacyTypeCode": "U",
        "deleteStatusIndicator": "N",
        "firstName": "Tushar Kanta",
        "lastName": "Panda",
        "firstNameLatin": "TUSHAR KANTA",
        "lastNameLatin": "PANDA",
        "jobTitle": "Senior Software Engineer",
        "userStartDate": "2022-10-12 00:00:00.0",
        "employeeStartDate": "2022-11-09 00:00:00.0",
        "assignedUnit": "90",
        "assignedCountry": "US",
        "communicationInfo": {
          "country": "UNITED STATES",
          "email": "PandaTusharKanta@JohnDeere.com"
        },
        "supervisorInfo": {
          "managerUserID": "DP11317",
          "managerSAPId": "00000878767"
        },
        "placeId": "2000886"
      },
      "organizationInfo": {
        "unitInfo": {
          "unitKeyCode": "9000",
          "unitCode": "90",
          "unitDepartmentCode": "942",
          "chargeUnit": "90",
          "chargeDepartment": "942",
          "personalAreaCode": "9000",
          "costCenter": "9000942000"
        }
      },
      "status": "ACTIVE"
    }
  ]

  it('should get an array of application associated only to given conf aws accounts', async () => {
    conf.islocal = true;
    featureToggleService.getToggle.mockResolvedValue({ enabled: true });
    const expectedResult = [
      {
        "value": "name-test1",
        "label": "name-test1",
        "businessApplication": "enterprise_data_lake_edl",
        "id": "name-test1",
        "teamPdl": "ENTERPRISEDATALAKECORETEAM@JOHNDEERE.COM",
        "assignmentGroup": "AE EDL Support",
        "supportGroup": "AE EDL Support",
        "shortDescription": "EDL Component Tag Test1",
        "subject": "AWS-GIT-DWIS-DEV",
        "unit": "90",
        "department": "980"
      },
      {
        "value": "name-test3",
        "label": "name-test3",
        "businessApplication": "unknown",
        "id": "name-test3",
        "teamPdl": "ENTERPRISEDATALAKECORETEAM@JOHNDEERE.COM",
        "assignmentGroup": "AE EDL Support",
        "supportGroup": "AE EDL Support",
        "shortDescription": "EDL Component Tag Test",
        "subject": "EDG-GIT-DWIS-DEV",
        "unit": "90",
        "department": "980"
      },
      {
        "value": "name-test4",
        "label": "name-test4",
        "businessApplication": "unknown",
        "id": "name-test4",
        "teamPdl": "test@JOHNDEERE.COM",
        "assignmentGroup": "AE OPS Support",
        "supportGroup": "AE OPS Support",
        "shortDescription": "Component Tag Test",
        "subject": "EDG-GIT-DWIS-DEV",
        "unit": "90",
        "department": "980"
      },
      {
        "value": "name-test5",
        "label": "name-test5",
        "businessApplication": "unknown",
        "id": "name-test5",
        "teamPdl": "test@JOHNDEERE.COM",
        "assignmentGroup": "AE OPS Support",
        "supportGroup": "AE OPS Support",
        "shortDescription": "Component Tag Test",
        "subject": "EDG-GIT-DWIS-DEV",
        "unit": "90",
        "department": "980"
      }
    ];
    applicationsDao.getApplication.mockResolvedValue({
      applicationName: 'app-1',
      unit: '90',
      department: '980'
    });
    apiHelper.getApplications.mockResolvedValue(applications);
    let lite = false
    const actualApplications = await applicationService.getApplicationDetails(['AWS-GIT-DWIS-DEV', 'EDG-GIT-DWIS-DEV'], 'arj5qka', lite);
    expect(actualApplications).toEqual(expectedResult);
  });

  it('should get an array of business applications associated only to given conf aws accounts', async () => {
    conf.islocal = true;
    const expectedResult = [{
      "name": "accenture_clone_and_test_tool_saas",
      "displayName": "Accenture Clone and Test Tool - SaaS",
      "productName": "global_payroll",
      "apmAppNumber": "APM0020499",
      "installStatus": "In Production"
    }]
    apiHelper.getBusinessApplications.mockResolvedValue({data : businessApplicationResponse});
    const actualBusinessApplications = await applicationService.getBusinessApplicationsList("some-id");
    expect(actualBusinessApplications).toEqual(expectedResult);
  });

  it('should get an empty array if there are no tags for the given groups returned from one cloud graphql api', async () => {
    conf.islocal = true;
    const expectedResult = [];
    applications = {
      "data": {
          "q0": [],
          "q1": [],
          "q2": []
      }
    }
    apiHelper.getApplications.mockResolvedValue(applications);
    const actualApplications = await applicationService.getApplicationDetails();
    expect(actualApplications).toEqual(expectedResult);
  });

  it('should throw error if one cloud api throws error', () => {
    conf.islocal = true;
    const tagsSpy = apiHelper.getApplications.mockImplementation(() => { throw 'Unauthorized!' });
    return applicationService.getApplicationDetails().catch(err => {
      expect(err).toEqual('Unauthorized!');
      tagsSpy.mockRestore();
    })
  });

  it('should create an application', async () => {
    conf.islocal = true;
    featureToggleService.getToggle.mockResolvedValue({ enabled: true });
    const expectedResult = {
      "business_criticality": "low",
      "assignment_group": "AE EDL Support",
      "install_status": "Installed",
      "support_group": "AE EDL Support",
      "comments": null,
      "description": null,
      "short_description": "EDL Component Tag Test",
      "parent_name": "enterprise_data_lake_edl",
      "name": "edl-test-application",
      "business_application_name": "enterprise_data_lake_edl",
      "team_notification_pdl": "ENTERPRISEDATALAKECORETEAM@JOHNDEERE.COM"
  };
    apiHelper.createApplication.mockResolvedValue(createAppResponse);
    const actualApplication = await applicationService.createApplication(body);
    expect(actualApplication).toEqual(expectedResult);
  });

  it('should edit an application', async () => {
    conf.islocal = true;
    featureToggleService.getToggle.mockResolvedValue({ enabled: false });
    const expectedResult = {
      "business_criticality": "low",
      "assignment_group": "AE EDL Support",
      "install_status": "Installed",
      "support_group": "AE EDL Support",
      "comments": null,
      "description": null,
      "short_description": "EDL Component Tag Test",
      "parent_name": "enterprise_data_lake_edl",
      "name": "edl-test-application",
      "business_application_name": "enterprise_data_lake_edl",
      "team_notification_pdl": "ENTERPRISEDATALAKECORETEAM@JOHNDEERE.COM"
  };
    apiHelper.editApplication.mockResolvedValue(createAppResponse);
    const actualApplication = await applicationService.editApplication('edl-test-application', body);
    expect(actualApplication).toEqual(expectedResult);
  });

  it('should throw an error if createApplication fails', () => {
    conf.islocal = true;
    featureToggleService.getToggle.mockResolvedValue({ enabled: true });
    apiHelper.createApplication.mockImplementation(() => { throw new Error('Some error') });
    return expect(applicationService.createApplication(body)).rejects.toThrowError('Some error');
  });

  it('should get an application response associated with the application name', async () => {
    conf.islocal = true;
    featureToggleService.getToggle.mockResolvedValue({ enabled: true });
    const expectedResult = {
      "assignmentGroup": "AE EDL Support",
      "businessApplication": "unknown",
      "businessCriticality": "medium",
      "comments": "",
      "installStatus": "Installed",
      "name": "edlWorkflow",
      "shortDescription": "some short description",
      "subject": "AWS-SOME-GROUP",
      "supportGroup": "AE EDL Support",
      "teamPdl": "SOME@JOHNDEERE.COM",
      "department": "980",
      "unit": "90",
    };
    apiHelper.getOneCloudApi.mockResolvedValue(application);
    applicationsDao.getApplication.mockResolvedValue({
      applicationName: 'app-1',
      unit: '90',
      department: '980'
    });
    const actualApplication = await applicationService.getApplication('some-myapp');
    expect(actualApplication).toEqual(expectedResult);
  });

  it('should throw an error if there are no application for the given application name', () => {
    conf.islocal = true;
    application = undefined;
    featureToggleService.getToggle.mockResolvedValue({ enabled: false });
    apiHelper.getOneCloudApi.mockResolvedValue(application);
    return expect(applicationService.getApplication('some-myapp')).rejects.toThrowError("Cannot read property 'name' of undefined");
  });

  it('should throw error if one cloud application registry api throws error', () => {
    conf.islocal = true;
    apiHelper.getOneCloudApi.mockImplementation(() => { throw new Error('Unauthorized!') });
    return expect(applicationService.getApplication('some-myapp')).rejects.toThrowError('Unauthorized!');
  });

  it('should throw error if the one cloud getApplicationEnvironment api throws error', () => {
    conf.islocal = true;
    apiHelper.getOneCloudApi.mockImplementation(() => { throw new Error('Unauthorized!') });
    return expect(applicationService.deleteApplication('My-app')).rejects.toThrowError('Unauthorized!')
  });

  it('should return an object with unit and department when pno service is called', async () => {
    const username = 'exampleUser';
    apiHelper.getPnODetailsForUser.mockResolvedValue(pnoResponse);
    const result = await applicationService.getPnOData(username);
    expect(result).toEqual({
      unit: '90',
      department: '942'
    });
  });

  it('should return an object with empty unit or department when response is empty', async () => {
    const username = 'exampleUser';
    const mockResponse = [];
    apiHelper.getPnODetailsForUser.mockResolvedValue(mockResponse);
    const result = await applicationService.getPnOData(username);
    expect(result).toEqual({
      unit: undefined,
      department: undefined
    });
  });

});
