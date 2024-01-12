const fs = require('fs');
const AWS = require('aws-sdk');
const approvers = require('./system-approvers');
const cacheManager = require("cache-manager");
const Redis = require("ioredis");
const RedisStore = require("cache-manager-ioredis");
let log = require("edl-node-log-wrapper");

const region = 'us-east-1';
const config = {
  lakers: {
    authCallback: getAuthCallBackURL(),
    baseUrl: getBaseURL(),
    isAdmin:user => ['0oab61no9hmKkuuMA0h7'].includes(user.client_id) || ['0oab61no9hmKkuuMA0h7'].includes(user.username)
  },
  local: {
    region: 'us-east-1',
    dynamoConfig: {
      endpoint: 'http://localstack:4566',
      region,
      accessKeyId: 'foo',
      secretAccessKey: 'bar'
    },
    amazonES: {},
    snsConfig: {apiVersion: '2010-03-31', endpoint: 'http://localstack:4566'},
    s3Config: {s3ForcePathStyle: true, endpoint: 'http://localstack:4566'},
    schemasBucket: 'jd-data-catalog-schemas-devl',
    attachmentsBucket: 'jd-data-catalog-attachment-devl',
    accountNumber: "541843007032",
    metaDataBucket: 'jd-us01-edl-devl-file-upload-metadata-audit-logs',
    metastoreBucket: 'jd-data-catalog-static-devl',
    dereferencedDatasetsTable: 'dereferenced-dataset',
    dereferencedPermissionsTable: 'dereferenced-permission',
    discoveredSchemasTable: 'discovered-schema',
    logLevel: process.env.loglevel || 'info',
    viewsTable: 'view',
    tablesTable: 'table',
    remediationsTable: 'remediation',
    applicationsTable: 'applications',
    metricsTable: 'metric',
    collibraEndPoint: 'https://deere-test.collibra.com/rest/2.0',
    oktaBaseUrl: 'https://sso-dev.johndeere.com/oauth2/v1',
    oktaApiUrl: 'https://johndeere.oktapreview.com/api/v1',
    oktaApiBaseUrl: 'https://johndeere.oktapreview.com',
    baseUrl: getBaseURL(),
    authCallback: getAuthCallBackURL(),
    docDbConnection: 'mongodb://mongo:27017',
    userName: 'govUI_qual',
    password: process.env.collibraPassword,
    docDbSecretId: 'AE/jdDataCatalogSecret',
    oktaApiPrivateKey: process.env.OKTA_API_PRIVATE_KEY,
    oktaClient: '0oal4x8vrfWNnqRav0h7',
    oktaDClient: '0oa1bswz69uHWfSuu0h8',
    oktaSecret: process.env.OKTA_SECRET,
    oneCloudOktaOAuthUrl: 'https://sso-qual.johndeere.com/oauth2/auslv0qm18eANxDxS0h7',
    oneCloudOktaClient: '0oatqdtb80wj7sWxl0h7',
    oneCloudOktaSecret: process.env.ONECLOUD_OKTA_SECRET,
    oneCloudUrl: 'https://onecloudapis2-devl.deere.com/',
    accounts: [
      { account: '541843007032', name: 'jd-us01-commoninformationservices-devl' }
    ],
    edlOktaClient: '0oab61no9hmKkuuMA0h7',
    edlOktaSecret: process.env.EDL_OKTA_SECRET,
    cookieSalt: process.env.COOKIE_SALT,
    esHost: 'localstack:4571',
    apiExternalToken: process.env.API_EXTERNAL_TOKEN,
    topicARN: 'arn:aws:sns:us-east-1:000000000000:JDDataCatalogNotification',
    oktaOAuthUrl: 'https://johndeere.oktapreview.com/oauth2/ausazr82rqSWEnxwI0h7',
    pnoOAuthUrl: 'https://sso-dev.johndeere.com/oauth2/ausi7ysomtO1OWzVi0h7/v1/token',
    approvers: approvers.getLocal(),
    edlCatalog: 'https://edl-catalog-api.vpn-devl.us.e03.c01.johndeerecloud.com',
    edlWorkflow: 'https://edl-workflow-api.vpn-devl.us.e03.c01.johndeerecloud.com/v1',
    dynamoMonitorId: 'com.deere.enterprise.datalake.enhance.core.manufacturing.ProductCatalogData',
    jdCatalogNotificationDlq: 'http://localhost:4566/queue/jd-catalog-notification-dlq',
    announcementsTable: 'announcement',
    edlMetastoreApi: 'http://edl-metastore-api.vpn-devl.us.e03.c01.johndeerecloud.com/',
    databricksToken: process.env.DATABRICKS_TOKEN,
    databricksEdlToken: process.env.DATABRICKS_TOKEN,
    viewRemediationCommunitiesToggle: ['a521b7d4-642c-4524-9c46-e4fa5e836a17', '4d8d917d-5c87-43b7-a495-38c46b6f4ee1', '75b382e2-46b8-4fe8-9300-4ed096586629', 'a7b76f9e-8ff4-4171-9050-3706f1f12188', '2e546443-92a3-4060-9fe7-22c2ec3d51b4'],
    datasetsCollectionName: 'datasets',
    edlFiles: 'https://edl-files.vpn-devl.us.e03.c01.johndeerecloud.com/v1',
    ldapCreds: { username: process.env.LDAP_USERNAME, password: process.env.LDAP_PASSWORD },
    managedTaskGroups: ['AWS-GIT-DWIS-ADMIN', 'AWS-AE-EDL-INGEST-ADMIN', 'AWS-GIT-DWIS-DEV'],
    redisOptions: { host: 'redis', port: 6379, parser: 'javascript', clusterMode: false },
    dqTimelinessUrl: 'https://1g11fd9kid.execute-api.us-east-1.amazonaws.com',
    dqMetricsUrl: 'http://host.docker.internal:8081',
    lineageUrl: 'https://edl-data-lineage.vpn-devl.us.e03.c01.johndeerecloud.com',
    metastoreDatabases: ['edl_dev', 'edl_current_dev'],
    mdiBucket: 'edl-mdi-storage',
    serviceAccessRoleArn: `system-roles/edl-cross-replication`,
    replicationInstance: 'edl-mdi-dms',
    indexName: 'dataset_v3',
    permissionsCollectionName: 'permissions',
    permissionIndexName: 'permission_groups',
    opensearchUrl: 'http://opensearch:9200/',
    opensearchpermissionUrl: 'http://opensearch:9200/',
    isAdmin:user => ['0oab61no9hmKkuuMA0h7'].includes(user.client_id) || ['0oab61no9hmKkuuMA0h7'].includes(user.username),
    internalOktaAdminCredentials: 'AE/EDL/OKTA_ADMIN_CREDENTIALS_DEVL',
    toggleServiceUrl: "https://edl-toggle-service.vpn-prod.us.e03.c01.johndeerecloud.com",
    ftOktaClient: '0oabs575rrRTgPtuE1t7',
    ftOktaSecret: process.env.FT_OKTA_SECRET,
    ftOktaOAuthUrl: 'https://johndeere.okta.com/oauth2/aus61myxiyyIlJ6vm1t7',
    collibraDQConfig: 'datacatalogui.fetch_collibra_dq',
    documentControllerFlag: 'jdc.documents_endpoint',
    paginatePermissionsFlag: 'jdc.paginate_permissions',
    companyUseAccessFlag: 'jdc.company_use_access_flag',
    pnoUrl: 'https://peopleapi.devl-vpn.us.e18.c01.johndeerecloud.com/v1/people',
    custodianVisibleFlag: 'jdc.custodian_visibility_flag'
  },
  devl: {
    region: 'us-east-1',
    dynamoConfig: { region },
    amazonES: { region, getCredentials: true },
    snsConfig: {apiVersion: '2010-03-31'},
    s3Config: {s3ForcePathStyle: true},
    schemasBucket: 'jd-data-catalog-schemas-devl',
    attachmentsBucket: 'jd-data-catalog-attachment-devl',
    accountNumber: "541843007032",
    metaDataBucket: 'jd-us01-edl-devl-file-upload-metadata-audit-logs',
    metastoreBucket: 'jd-data-catalog-static-devl',
    dereferencedDatasetsTable: 'jd-data-catalog-dereferenced-dataset',
    dereferencedPermissionsTable: 'jd-data-catalog-dereferenced-permission',
    discoveredSchemasTable: 'jd-data-catalog-discovered-schema',
    logLevel: process.env.loglevel || 'info',
    viewsTable: 'jd-data-catalog-view',
    tablesTable: 'jd-data-catalog-table',
    remediationsTable: 'jd-data-catalog-remediation',
    applicationsTable: 'jd-data-catalog-application',
    metricsTable: 'jd-data-catalog-metric',
    collibraEndPoint: 'https://deere-test.collibra.com/rest/2.0',
    oktaBaseUrl: 'https://sso-dev.johndeere.com/oauth2/v1',
    baseUrl: getBaseURL(),
    oktaApiUrl: 'https://johndeere.oktapreview.com/api/v1',
    authCallback: getAuthCallBackURL(),
    docDbSecretId: 'AE/jdDataCatalogSecret',
    docDbCluster: 'jddatacatalogdocdb.cluster-cn2xcmyfqfwi.us-east-1.docdb.amazonaws.com',
    userName: 'govUI_qual',
    password: 'AQICAHjpl3GB8vdU9F23f8PDVGboSNlg86oRvc/5BiI8OJxvtQFDpbWcKgIpcEOn2HHNKzHZAAAAbjBsBgkqhkiG9w0BBwagXzBdAgEAMFgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMMvEQvDSmC8XCROOuAgEQgCvhuEahVxIli8hLgfcus7WCXYou3GYt/CXFv2IkZ6TOlt2xUXvgLfjK0TEY',
    oktaClient: '0oal4x8vrfWNnqRav0h7',
    oktaSecret: 'AQICAHjpl3GB8vdU9F23f8PDVGboSNlg86oRvc/5BiI8OJxvtQHo9dyW3o0tyjW2H88fUW9xAAAAhzCBhAYJKoZIhvcNAQcGoHcwdQIBADBwBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDKHBGhwUXt4wHVsYvwIBEIBDPFOlf9WbNywr8RZ6ZQcDMQQiP6SHiuoEmp+eTZ6scva/qkSo9dgAka5zA1d6u/LxULJzCEWXqc0zUbScB+jfayjNeQ==',
    oneCloudOktaOAuthUrl: 'https://sso-qual.johndeere.com/oauth2/auslv0qm18eANxDxS0h7',
    oneCloudOktaClient: '0oatqdtb80wj7sWxl0h7',
    oneCloudOktaSecret: 'AQICAHgbVxWbBz0I00blMMGEvPJDKPX7Z0BhY4//PMV/KiOwxwHmeUKig+OZXjv+aSlB5NvlAAAAhzCBhAYJKoZIhvcNAQcGoHcwdQIBADBwBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDGXr/DLVZTCRcG5jmwIBEIBDbF2fPdF7hxmH+xsJh2Xx/CsHgYQOQLE/NzVgLDfZx500wCS+izeoSUe5j0U4RNj1HRYNscVt4u09hdzi7Tq1DCTnOg==',
    oneCloudUrl: 'https://onecloudapis2-devl.deere.com/',
    accounts: [
      { account: '541843007032', name: 'jd-us01-commoninformationservices-devl' }
    ],
    cookieSalt: 'AQICAHjpl3GB8vdU9F23f8PDVGboSNlg86oRvc/5BiI8OJxvtQEATzGlykf8/zrXHa3IHWTdAAAAsjCBrwYJKoZIhvcNAQcGoIGhMIGeAgEAMIGYBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDLFPtRIH8aC7DJo4fAIBEIBrTzNa+VSaB7ycxpMVSBIRXMuj9bMcOc32rmgREzTHxq7HXsFh0bt4qMHuPNVl1LVC+wT8FiGGD9ZB9J4tKhlp7bhykIaVvfecsoU+0Akyn/Y/BCVl06qym3EbhDvEs0fUcNUFdmVleFHAX8M=',
    esHost: 'https://search-jd-catalog-es-bcwnltq6qbbvfn3sftb32vplue.us-east-1.es.amazonaws.com',
    apiExternalToken: 'AQICAHhg/yhPsXEtHLOvgmHjMpcm+mOZ0EPkMvpUABlr3cJkUQHFFUDvyMtEgJVOIsI/tFVWAAAAiTCBhgYJKoZIhvcNAQcGoHkwdwIBADByBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDMudXjDoXxtqdVaQLAIBEIBFc+2pIImPZoum9UYAM8GWUIzSQ4oDpslTFcSUREt1rmD4B8aG78dJbmw2MGg0KYlBbhJGMvNeM6lJzwJ6GrCII2JFxIVR',
    topicARN: 'arn:aws:sns:us-east-1:541843007032:JDDataCatalogNotification',
    oktaOAuthUrl: 'https://johndeere.oktapreview.com/oauth2/ausazr82rqSWEnxwI0h7',
    pnoOAuthUrl: 'https://sso-dev.johndeere.com/oauth2/ausi7ysomtO1OWzVi0h7/v1/token',
    approvers: approvers.getDevl(),
    edlCatalog: 'https://edl-catalog-api.vpn-devl.us.e03.c01.johndeerecloud.com',
    edlWorkflow: 'https://edl-workflow-api.vpn-devl.us.e03.c01.johndeerecloud.com/v1',
    dynamoMonitorId: '0106a7c0-c212-3a41-9dbd-0a5a38e77d20',
    jdCatalogNotificationDlq: 'https://sqs.us-east-1.amazonaws.com/541843007032/jd-catalog-notification-dlq',
    announcementsTable: 'jd-data-catalog-announcement',
    edlMetastoreApi: 'http://edl-metastore-api.vpn-devl.us.e03.c01.johndeerecloud.com/',
    databricksToken: 'AQICAHglOBK79dUej09BOL00CIWrs3u4Eh3N5K8zsORJIx+VHgFV4wKWkGkX7c1nT4WG4cY2AAAAgzCBgAYJKoZIhvcNAQcGoHMwcQIBADBsBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDLAPaDIVPW33LDgF1gIBEIA/7B8VkIZ7FwSkBkFepydq0oO1ix7BO2rPCUYk85jHm5bkiDrApmL/8uhqM+sQwUmvhspqg/pkFC1Ir+sTQ9vY',
    databricksEdlToken: 'AQICAHjRGllPvrRobISwXtjfaHqOBv/gXdbri+yfcFUkVt1VngG7xU/8KwoYAMh4+HpjMEteAAAAgzCBgAYJKoZIhvcNAQcGoHMwcQIBADBsBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDLbHJz0rknTQe2GkDwIBEIA/KdoDteTBwBS66z6qW1LCPAxDroPZOpn4FChyFSsrSn5eKWAZjqVKZJy2HHMxzCgwaoJuFSOHWMeCwwLmduwe',
    viewRemediationCommunitiesToggle: ['a521b7d4-642c-4524-9c46-e4fa5e836a17', '4d8d917d-5c87-43b7-a495-38c46b6f4ee1', '75b382e2-46b8-4fe8-9300-4ed096586629', 'a7b76f9e-8ff4-4171-9050-3706f1f12188'],
    datasetsCollectionName: 'datasets',
    edlFiles: 'https://edl-files.vpn-devl.us.e03.c01.johndeerecloud.com/v1',
    managedTaskGroups: ['AWS-GIT-DWIS-ADMIN','AWS-GIT-DWIS-DEV', 'AWS-GIT-DIAD-SS-DEV', 'AWS-AE-EDL-INGEST-ADMIN', 'AWS-AE-OPS-SUPPORT','EDG-JDES-DATAMART-DATALOAD','AWS-TRANSMISSIONTEST-EDL-TRIAL','AWS-MFG-WJ-SME-CUST','AWS-EDL-FORESTRY-IT-GLOBAL','AWS-JDWM-LOGISTICS-PLANNING','AWS_LX_IGNITION_DATABASE','AWS_ZX_SCF_ADMIN','AWS_CF_Data_Analytics', 'AWS-ECDA-ANALYTICS-MLOPS-ENGINEERS', 'AWS-MFG-JX-SCFTEAM'],
    redisOptions: { host: 'clustercfg.edl-redis-devl.oovu0e.use1.cache.amazonaws.com', port: 6379, parser: 'javascript', clusterMode: true },
    dqTimelinessUrl: 'https://1g11fd9kid.execute-api.us-east-1.amazonaws.com',
    dqMetricsUrl: 'https://edl-data-metrics.vpn-devl.us.e03.c01.johndeerecloud.com',
    lineageUrl: 'https://edl-data-lineage.vpn-devl.us.e03.c01.johndeerecloud.com',
    metastoreDatabases: ['edl_dev', 'edl_current_dev'],
    mdiBucket: 'edl-mdi-storage',
   serviceAccessRoleArn: `system-roles/edl-cross-replication`,
    replicationInstance: 'edl-mdi-dms',
    indexName: 'dataset_v3',
    permissionsCollectionName: 'permissions',
    permissionIndexName: 'permission_groups',
    opensearchUrl: 'https://vpc-edl-catalog-search-ulxc6tzj35rawxaladmr7z6z3u.us-east-1.es.amazonaws.com',
    opensearchpermissionUrl: 'https://edl-permission-search.vpn-devl.us.i03.c01.johndeerecloud.com',
    isAdmin:user => ['0oab61no9hmKkuuMA0h7'].includes(user.client_id) || ['0oab61no9hmKkuuMA0h7'].includes(user.username),
    internalOktaAdminCredentials: 'AE/EDL/OKTA_ADMIN_CREDENTIALS_DEVL',
    toggleServiceUrl: "https://edl-toggle-service.vpn-prod.us.e03.c01.johndeerecloud.com",
    ftOktaClient: '0oabs575rrRTgPtuE1t7',
    ftOktaSecret: 'AQICAHgARQ9CTNXFNY8/vd7RMtcXOLZlCJEc6ipGs4CU9Sn0IQFx0UihCkKXR8j3558ijxXeAAAAhzCBhAYJKoZIhvcNAQcGoHcwdQIBADBwBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDNUBo8q1HZ6yodYVQgIBEIBDWZ0kRisKIU/Q6bepaBIWKKkvQpUQONSUsBJTPp3CnXJVKoHNLe/xibC1BZEmGuM4fIJDBpFhDeTjST1lddjXJChcdw==',
    ftOktaOAuthUrl: 'https://johndeere.okta.com/oauth2/aus61myxiyyIlJ6vm1t7',
    collibraDQConfig: 'datacatalogui.fetch_collibra_dq',
    documentControllerFlag: 'jdc.documents_endpoint',
    paginatePermissionsFlag: 'jdc.paginate_permissions',
    oktaApiBaseUrl: 'https://johndeere.oktapreview.com',
    oktaDClient: '0oa1bswz69uHWfSuu0h8',
    companyUseAccessFlag: 'jdc.company_use_access_flag',
    pnoUrl: 'https://peopleapi.devl-vpn.us.e18.c01.johndeerecloud.com/v1/people',
    custodianVisibleFlag: 'jdc.custodian_visibility_flag'
  },
  prod: {
    region: 'us-east-1',
    dynamoConfig: { region },
    amazonES: { region, getCredentials: true },
    snsConfig: {apiVersion: '2010-03-31'},
    s3Config: {s3ForcePathStyle: true},
    schemasBucket: 'jd-data-catalog-schemas-prod',
    attachmentsBucket: 'jd-data-catalog-attachment-prod',
    accountNumber: "305463345279",
    metaDataBucket: 'jd-us01-edl-prod-file-upload-metadata-audit-logs',
    metastoreBucket: 'jd-data-catalog-static-prod',
    dereferencedDatasetsTable: 'jd-data-catalog-dereferenced-dataset',
    dereferencedPermissionsTable: 'jd-data-catalog-dereferenced-permission',
    discoveredSchemasTable: 'jd-data-catalog-discovered-schema',
    logLevel: process.env.loglevel || 'info',
    viewsTable: 'jd-data-catalog-view',
    tablesTable: 'jd-data-catalog-table',
    remediationsTable: 'jd-data-catalog-remediation',
    applicationsTable: 'jd-data-catalog-application',
    metricsTable: 'jd-data-catalog-metric',
    collibraEndPoint: 'https://deere.collibra.com/rest/2.0',
    oktaBaseUrl: 'https://sso.johndeere.com/oauth2/v1',
    baseUrl: getBaseURL(),
    oktaApiUrl: 'https://johndeere.okta.com/api/v1',
    authCallback: getAuthCallBackURL(),
    docDbSecretId: 'AE/jdDataCatalogSecret',
    docDbCluster: 'jddatacatalogdocdb.cluster-cglvoomb5e2d.us-east-1.docdb.amazonaws.com',
    userName: 'govUI_prod',
    password: 'AQICAHgARQ9CTNXFNY8/vd7RMtcXOLZlCJEc6ipGs4CU9Sn0IQFrQNX8VZ3Ni9yl19vv7EXGAAAAaDBmBgkqhkiG9w0BBwagWTBXAgEAMFIGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMuaFCDJfUDw1AwDnbAgEQgCVOny3z6jCEG6ZSkSN5VkByD8wetplMWyMa9lJuJIK3ehpvPkDF\n',
    oktaClient: '0oabs575rrRTgPtuE1t7',
    oktaSecret: 'AQICAHgARQ9CTNXFNY8/vd7RMtcXOLZlCJEc6ipGs4CU9Sn0IQFx0UihCkKXR8j3558ijxXeAAAAhzCBhAYJKoZIhvcNAQcGoHcwdQIBADBwBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDNUBo8q1HZ6yodYVQgIBEIBDWZ0kRisKIU/Q6bepaBIWKKkvQpUQONSUsBJTPp3CnXJVKoHNLe/xibC1BZEmGuM4fIJDBpFhDeTjST1lddjXJChcdw==',
    oneCloudOktaOAuthUrl: 'https://sso.johndeere.com/oauth2/ausbfbh6o6x6zlgOt1t7',
    oneCloudOktaClient: '0oabs575rrRTgPtuE1t7',
    oneCloudOktaSecret: 'AQICAHgARQ9CTNXFNY8/vd7RMtcXOLZlCJEc6ipGs4CU9Sn0IQFx0UihCkKXR8j3558ijxXeAAAAhzCBhAYJKoZIhvcNAQcGoHcwdQIBADBwBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDNUBo8q1HZ6yodYVQgIBEIBDWZ0kRisKIU/Q6bepaBIWKKkvQpUQONSUsBJTPp3CnXJVKoHNLe/xibC1BZEmGuM4fIJDBpFhDeTjST1lddjXJChcdw==',
    oneCloudUrl: 'https://onecloudapis2.deere.com/',
    accounts: [
      { account: '305463345279', name: 'jd-us01-commoninformationservices-prod' },
      { account: '078228365593', name: 'aws-daa-data-analytics-platforms-prod' },
      { account: '522807992648', name: 'aws-ae-edl-storage1-prod' },
      { account: '167834813982', name: 'aws-ae-edl-storage-2-prod' },
      { account: '844652101329', name: 'aws-ae-databricks-prod' },
      { account: '550639851153', name: 'aws-ae-databricks2-prod' },
      { account: '236633655520', name: 'aws-isg-databricks-prod' }
    ],

    cookieSalt: 'AQICAHgARQ9CTNXFNY8/vd7RMtcXOLZlCJEc6ipGs4CU9Sn0IQFP4ZsU8GYht9cQI76nieMLAAAAcjBwBgkqhkiG9w0BBwagYzBhAgEAMFwGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMkZdUcVVrpCzQBYzJAgEQgC+HTZxfYQdYSQcZ4kkkNdIcAiQ05bgr5iP96GfjB96RulnRvJq3/tiapRbT59Swyw==',
    esHost: 'search-jd-catalog-es2-gpi4grybga6unzbqb2qubz2lnm.us-east-1.es.amazonaws.com',
    apiExternalToken: 'AQICAHgARQ9CTNXFNY8/vd7RMtcXOLZlCJEc6ipGs4CU9Sn0IQE5517LimFEPOf1/+wgzC0NAAAAgTB/BgkqhkiG9w0BBwagcjBwAgEAMGsGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMEz3F1yC+WZ1Gv15RAgEQgD777ra5gGkOCBUcXTMQyKNk19tDr+A9Q7MPEtU57UXfnEacm0d1L3w0SGDZ6gm9GcDmawg64+ZKNpkoFQskKA==',
    topicARN: 'arn:aws:sns:us-east-1:305463345279:JDDataCatalogNotification',
    oktaOAuthUrl: 'https://johndeere.okta.com/oauth2/aus61myxiyyIlJ6vm1t7',
    pnoOAuthUrl: 'https://sso.johndeere.com/oauth2/aus9miqblwANGFNNr1t7/v1/token',
    approvers: approvers.getProd(),
    edlCatalog: 'https://edl-catalog-api.vpn-prod.us.e03.c01.johndeerecloud.com',
    edlWorkflow: 'https://edl-workflow-api.vpn-prod.us.e03.c01.johndeerecloud.com/v1',
    dynamoMonitorId: '0106a7c0-c212-3a41-9dbd-0a5a38e77d20',
    jdCatalogNotificationDlq: 'https://sqs.us-east-1.amazonaws.com/305463345279/jd-catalog-notification-dlq',
    announcementsTable: 'jd-data-catalog-announcement',
    edlMetastoreApi: 'http://edl-metastore-api.vpn-prod.us.e03.c01.johndeerecloud.com/',
    databricksToken: 'AQICAHjCWBuWSikBDyDDf5blbRyRe5orlMdYnQtcfz261YfSMAGqdJgKs44PDq+2eSvalJhvAAAAgzCBgAYJKoZIhvcNAQcGoHMwcQIBADBsBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDN84zp+LH9yj7Ie4WgIBEIA/8KMGQXunfk4waEZ/8eKBSEWbMq0S/XDHrfcpgMl5inQgjSVmlvP8cN4CKz/kr2XXcXLKj+325UHc9tAvysjf',
    databricksEdlToken: 'AQICAHhRak1NWUi0mCkfPy9rATHOdgbkDNzsixrdH6H5DfB1WgEtKILvpPaWNwyxpWsLywGmAAAAgzCBgAYJKoZIhvcNAQcGoHMwcQIBADBsBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDFz3pcnmr8JBIvxtvAIBEIA//ehUmi+qD2X39jC6TPTMIMZnHmUwxotVeYQaI1r5QP0y/vr+pi8CFXC4Hu+iw+ckFsMHNLUQNWfqC5Riu/nC',
    viewRemediationCommunitiesToggle: ['a521b7d4-642c-4524-9c46-e4fa5e836a17', 'fd60bc2c-0cdc-4aae-941e-0245e84a76db'],
    datasetsCollectionName: 'datasets',
    edlFiles: 'https://edl-files.vpn-prod.us.e03.c01.johndeerecloud.com/v1',
    managedTaskGroups: ['AWS-GIT-DWIS-ADMIN', 'AWS-GIT-DWIS-DEV', 'AWS-GIT-DIAD-SS-DEV', 'AWS-AE-EDL-INGEST-ADMIN', 'AWS-AE-OPS-SUPPORT','EDG-JDES-DATAMART-DATALOAD','AWS-TRANSMISSIONTEST-EDL-TRIAL','AWS-MFG-WJ-SME-CUST','AWS-EDL-FORESTRY-IT-GLOBAL','AWS-JDWM-LOGISTICS-PLANNING','AWS_LX_IGNITION_DATABASE','AWS_ZX_SCF_ADMIN','AWS_CF_Data_Analytics', 'AWS-ECDA-ANALYTICS-MLOPS-ENGINEERS', 'AWS-MFG-JX-SCFTEAM'],
    redisOptions: { host: 'clustercfg.edl-redis-prod.jzdzd0.use1.cache.amazonaws.com', port: 6379, parser: 'javascript', clusterMode: true },
    dqTimelinessUrl: 'https://17p3dnx1c5.execute-api.us-east-1.amazonaws.com',
    dqMetricsUrl: 'https://edl-data-metrics.vpn-prod.us.e03.c01.johndeerecloud.com',
    lineageUrl: 'https://edl-data-lineage.vpn-prod.us.e03.c01.johndeerecloud.com',
    metastoreDatabases: ['edl', 'edl_current'],
    mdiBucket: 'edl-mdi-storage',
    serviceAccessRoleArn: `system-roles/edl-cross-replication`,
    replicationInstance: 'edl-mdi-dms',
    indexName: 'dataset_v3',
    permissionsCollectionName: 'permissions',
    permissionIndexName: 'permission_groups',
    opensearchUrl: 'https://edl-catalog-search.vpn-prod.us.i03.c01.johndeerecloud.com',
    opensearchpermissionUrl: 'https://edl-permission-search.vpn-prod.us.i03.c01.johndeerecloud.com',
    isAdmin:user => ['0oa61niur1qpKMeBU1t7'].includes(user.client_id) || ['0oa61niur1qpKMeBU1t7'].includes(user.username),
    internalOktaAdminCredentials: 'AE/EDL/OKTA_ADMIN_CREDENTIALS_PROD',
    toggleServiceUrl: "https://edl-toggle-service.vpn-prod.us.e03.c01.johndeerecloud.com",
    ftOktaClient: '0oabs575rrRTgPtuE1t7',
    ftOktaSecret: 'AQICAHgARQ9CTNXFNY8/vd7RMtcXOLZlCJEc6ipGs4CU9Sn0IQFx0UihCkKXR8j3558ijxXeAAAAhzCBhAYJKoZIhvcNAQcGoHcwdQIBADBwBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDNUBo8q1HZ6yodYVQgIBEIBDWZ0kRisKIU/Q6bepaBIWKKkvQpUQONSUsBJTPp3CnXJVKoHNLe/xibC1BZEmGuM4fIJDBpFhDeTjST1lddjXJChcdw==',
    ftOktaOAuthUrl: 'https://johndeere.okta.com/oauth2/aus61myxiyyIlJ6vm1t7',
    collibraDQConfig: 'datacatalogui.fetch_collibra_dq',
    documentControllerFlag: 'jdc.documents_endpoint',
    paginatePermissionsFlag: 'jdc.paginate_permissions',
    oktaApiBaseUrl: 'https://johndeere.okta.com',
    oktaDClient: '0oap3hoqpeQmGYoUV1t7',
    companyUseAccessFlag: 'jdc.company_use_access_flag',
    pnoUrl: 'https://mdmpeople.prod-vpn.us.e18.c01.johndeerecloud.com/v1/people',
    custodianVisibleFlag: 'jdc.custodian_visibility_flag'
  }
};


function getEnv() {
  return process.env.APP_ENV;
}

function getAuthCallBackURL() {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.concat("/api/login/callback");
  } else if (getEnv() === 'prod') {
    return 'https://data-catalog.deere.com/api/login/callback';
  } else if (getEnv() === 'devl') {
    return 'https://data-catalog-dev.deere.com/api/login/callback';
  } else if (getEnv() === 'lakers') {
    return 'https://data-catalog-dev-lakers.vpn-devl.us.e03.c01.johndeerecloud.com/api/login/callback';
  } else {
    return 'http://localhost:3000/api/login/callback';
  }
}

function getBaseURL() {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  } else if (getEnv() === 'prod') {
    return 'https://data-catalog.deere.com';
  } else if (getEnv() === 'devl') {
    return 'https://data-catalog-dev.deere.com';
  } else if (getEnv() === 'lakers') {
    return 'https://data-catalog-dev-lakers.vpn-devl.us.e03.c01.johndeerecloud.com';
  } else {
    return 'http://localhost:3000';
  }
}

function isLakers() {
  console.log('isLakers: ', process.env.LAKERS === 'true' || process.env.LAKERS === true);
  return process.env.LAKERS === 'true' || process.env.LAKERS === true;
}

async function decryptValue(region, value) {
  const kms = new AWS.KMS({ region });
  const decoded = Buffer.from(value, 'base64');
  return kms.decrypt({ CiphertextBlob: decoded }).promise().then(res => res.Plaintext);
}

async function getFtClientSecret(region) {
  const secretsManager = new AWS.SecretsManager({ region });
  try {
    const response = await secretsManager.getSecretValue({ SecretId: "AE/EDL/EDL-OKTA-CLIENT-SECRET" }).promise();
    return response.SecretString;
  }
  catch(e){
    log.error("Fetch from secret manager failed with error " + e);
    return '';
  }
}

async function getSecret(region, secretId, raw = false) {
  const secretsManager = new AWS.SecretsManager({ region });
  const response = await secretsManager.getSecretValue({ SecretId: secretId }).promise();
  return raw ? response.SecretString : JSON.parse(response.SecretString);
}

async function createConnectionString(region, secretId, docDbCluster) {
  const { username, password } = await getSecret(region, secretId);
  return `mongodb://${username}:${encodeURIComponent(password)}@${docDbCluster}:27017/records?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retrywrites=false`;
}

const getAdminCredentialsInternal = async () => {
  const initial = config[publicFuncs.getEnv()];
  const secretId = initial?.internalOktaAdminCredentials;
  const { clientId, secret, authUrl } = await getSecret("us-east-1", secretId);
  return [clientId, secret, authUrl];
};

async function getOktaPivateKey() {
    return getSecret('us-east-1', 'AE/EDL/EDL-JWT-PrivateKey-Groups-API', true);
}

function getLdapCredentials() {
  return getSecret('us-east-1', 'AE/JDDataCatalogLDAPSecret');
}

async function getRedisCredentials() {
  const { password } = await getSecret('us-east-1', 'AE/EDL/REDIS_AUTH_TOKEN');
  return password
}

async function initConfig() {
  const isLocal = !['prod', 'devl'].includes(publicFuncs.getEnv());
  if (isLocal) {
    return { isLocal, ...config['local'] };
  }

  const initial = config[publicFuncs.getEnv()];
  const password = await decryptValue(initial.region, initial.password);
  const oktaSecret = await decryptValue(initial.region, initial.oktaSecret);
  const ftOktaSecret = await getFtClientSecret(initial.region);
  const cookieSalt = await decryptValue(initial.region, initial.cookieSalt);
  const apiExternalToken = await decryptValue(initial.region, initial.apiExternalToken);
  const oneCloudOktaSecret = await decryptValue(initial.region, initial.oneCloudOktaSecret);
  const docDbConnection = await createConnectionString(initial.region, initial.docDbSecretId, initial.docDbCluster);
  const databricksToken = await decryptValue(initial.region, initial.databricksToken);
  const databricksEdlToken = await decryptValue(initial.region, initial.databricksEdlToken);
  const ldapCreds = await getLdapCredentials();
  const oktaApiPrivateKey = await getOktaPivateKey();

  const baseURL = getBaseURL();
  const authCallbackURL = getAuthCallBackURL();
  const fullConfig = {
    ...initial,
    password: password.toString('ascii'),
    oktaSecret: oktaSecret.toString('ascii'),
    ftOktaSecret: ftOktaSecret,
    cookieSalt: cookieSalt.toString('ascii'),
    apiExternalToken: apiExternalToken.toString('ascii'),
    oneCloudOktaSecret: oneCloudOktaSecret.toString('ascii'),
    docDbConnection,
    databricksToken: databricksToken.toString('ascii'),
    databricksEdlToken: databricksEdlToken.toString('ascii'),
    viewRemediationCommunitiesToggle: initial.viewRemediationCommunitiesToggle,
    ldapCreds,
    oktaApiPrivateKey,
    baseUrl: baseURL,
    authCallback: authCallbackURL
  };

  fs.writeFileSync('./env-config.json', JSON.stringify(fullConfig));
  return isLakers() && getEnv() === 'devl' ? { ...fullConfig, ...config['lakers'] } : fullConfig;
}

function getConfig() {
  const isLocal = !['prod', 'devl'].includes(publicFuncs.getEnv());
  const configJson = isLocal ? config['local'] : require('./env-config.json');
  const { isAdmin } = config[publicFuncs.getEnv() || 'local'];
  return { isLocal, ...configJson, isAdmin };
}

function getAvailabilityConf() {
  const environment = (['prod', 'devl'].includes(getEnv())) ? getEnv() : 'devl';
  return {
    tables: [
      'jd-data-catalog-discovered-schemas',
      'jd-data-catalog-views',
      'jd-data-catalog-tables',
      'jd-data-catalog-announcements'
    ],
    topics: [
      'arn:aws:sns:us-east-1:ACCOUNT_NUMBER:JDDataCatalogNotification'
    ],
    buckets: [
      `jd-data-catalog-schemas-${environment}`,
      `jd-data-catalog-attachment-${environment}`,
      `jd-us01-edl-${environment}-file-upload-metadata-audit-logs`,
      `jd-data-catalog-static-${environment}`
    ],
    datatype: 'com.deere.enterprise.datalake.enhance.demo_marvel_comic_characters_new'
  }
}

async function getRedisCacheManager(ttl) {
  try {
    if (!getConfig().redisOptions.clusterMode) {
      return cacheManager.caching({
        store: RedisStore,
        host: getConfig().redisOptions.host,
        port: getConfig().redisOptions.port,
        ttl
      });
    }
    const password = await getRedisCredentials();
    return cacheManager.caching({
      clusterConfig: {
        nodes: [
          {
            port: getConfig().redisOptions.port,
            host: getConfig().redisOptions.host
          }
        ],
        options: {
          maxRedirections: 16,
          redisOptions: {
            password,
            tls: true
          },
          dnsLookup: (address, callback) => callback(null, address),
          ttl: ttl
        }
      }
    });
  } catch (error) {
    log.error('unable to create redis cache manager with error: ', error);
  }
}

async function connectRedis() {
  const host = getConfig().redisOptions.host;
  const port = getConfig().redisOptions.port;
  if (!getConfig().redisOptions.clusterMode) {
    log.info('Connecting to single mode redis');
    return new Redis({ host, port });
  }
  log.info('Connecting to cluster mode redis');
  const password = await getRedisCredentials();
  return new Redis.Cluster([{
    host,
    port
  }], {
    dnsLookup: (address, callback) => callback(null, address),
    redisOptions: {
      password,
      tls: true
    }
  });
}

const publicFuncs = { getConfig, initConfig, getAvailabilityConf, getEnv, getRedisCacheManager, connectRedis, getAdminCredentialsInternal };

module.exports = publicFuncs;
