/**
 * @jest-environment node
 */

const conf = require('../conf');
const fs = require('fs');
const AWS = require('aws-sdk-mock');
const approvers = require('../system-approvers')
const datasets = require('./confDatasetsDatatabase.json');
const aws = require("aws-sdk");
const secretsManager = new aws.SecretsManager();
const Redis = require('ioredis-mock');
const RedisStore = require('cache-manager-ioredis');
const cacheManager = require('cache-manager');

jest.mock('ioredis', () => {
  return require('ioredis-mock');
});

jest.mock('fs');

describe('Config Test Suite', () => {
  let cache;
  beforeEach(() => {
    const redisInstance = new Redis();
    cache = cacheManager.caching({
      store: RedisStore,
      redisInstance,
    });

    AWS.restore()
  });

  it('has multiple classifications', () => {
    const multipleClassificationDatasets = datasets.filter(dataset => dataset.classifications.length > 1);

    console.info(multipleClassificationDatasets.map(dataset => dataset.id).join('\n'));
  });

  it('should write to cache', async () => {
    await cache.set('key', 'value', { ttl: 60 });
    const value = await cache.get('key');
    expect(value).toBe('value');
  });

  it('should not write local configs to file', () => {
    const envSpy = jest.spyOn(conf, 'getEnv').mockReturnValue('local');

    const expected = {
      region: 'us-east-1',
      amazonES: {},
      snsConfig: {apiVersion: '2010-03-31', endpoint: 'http://localstack:4566'},
      s3Config: { endpoint: 'http://localstack:4566', s3ForcePathStyle: true, },
      schemasBucket: 'jd-data-catalog-schemas-devl',
      attachmentsBucket: 'jd-data-catalog-attachment-devl',
      accountNumber: '541843007032',
      tablesTable: 'table',
      metaDataBucket: "jd-us01-edl-devl-file-upload-metadata-audit-logs",
      metastoreBucket: "jd-data-catalog-static-devl",
      metricsTable: "metric",
      discoveredSchemasTable: 'discovered-schema',
      logLevel: 'info',
      docDbConnection: "mongodb://mongo:27017",
      docDbSecretId: "AE/jdDataCatalogSecret",
      viewsTable: "view",
      remediationsTable: 'remediation',
      applicationsTable: 'applications',
      collibraEndPoint: 'https://deere-test.collibra.com/rest/2.0',
      companyUseAccessFlag: "jdc.company_use_access_flag",
      oktaBaseUrl: 'https://sso-dev.johndeere.com/oauth2/v1',
      oktaApiUrl: 'https://johndeere.oktapreview.com/api/v1',
      baseUrl: 'http://localhost:3000',
      isLocal: true,
      authCallback: 'http://localhost:3000/api/login/callback',
      userName: 'govUI_qual',
      password: process.env.collibraPassword,
      oktaClient: '0oal4x8vrfWNnqRav0h7',
      oktaSecret: process.env.OKTA_SECRET,
      edlOktaClient: '0oab61no9hmKkuuMA0h7',
      edlOktaSecret: process.env.EDL_OKTA_SECRET,
      cookieSalt: process.env.COOKIE_SALT,
      esHost: "localstack:4571",
      apiExternalToken: process.env.API_EXTERNAL_TOKEN,
      internalOktaAdminCredentials: 'AE/EDL/OKTA_ADMIN_CREDENTIALS_DEVL',
      toggleServiceUrl: "https://edl-toggle-service.vpn-prod.us.e03.c01.johndeerecloud.com",
      topicARN: "arn:aws:sns:us-east-1:000000000000:JDDataCatalogNotification",
      redisOptions: {
        host: "redis",
        parser: "javascript",
        port: 6379,
        clusterMode: false
      },
      dqTimelinessUrl: 'https://1g11fd9kid.execute-api.us-east-1.amazonaws.com',
      dynamoConfig: {
        accessKeyId: 'foo',
        endpoint: 'http://localstack:4566',
        region: 'us-east-1',
        secretAccessKey: 'bar',
      },
      dqMetricsUrl: "http://host.docker.internal:8081",
      lineageUrl: 'https://edl-data-lineage.vpn-devl.us.e03.c01.johndeerecloud.com',
      oktaOAuthUrl: 'https://johndeere.oktapreview.com/oauth2/ausazr82rqSWEnxwI0h7',
      approvers: approvers.getLocal(),
      edlCatalog: 'https://edl-catalog-api.vpn-devl.us.e03.c01.johndeerecloud.com',
      edlWorkflow: 'https://edl-workflow-api.vpn-devl.us.e03.c01.johndeerecloud.com/v1',
      dynamoMonitorId: 'com.deere.enterprise.datalake.enhance.core.manufacturing.ProductCatalogData',
      jdCatalogNotificationDlq: 'http://localhost:4566/queue/jd-catalog-notification-dlq',
      announcementsTable: 'announcement',
      edlMetastoreApi: 'http://edl-metastore-api.vpn-devl.us.e03.c01.johndeerecloud.com/',
      dereferencedDatasetsTable: "dereferenced-dataset",
      dereferencedPermissionsTable: "dereferenced-permission",
      oneCloudOktaOAuthUrl: 'https://sso-qual.johndeere.com/oauth2/auslv0qm18eANxDxS0h7',
      oneCloudOktaClient: '0oatqdtb80wj7sWxl0h7',
      oneCloudOktaSecret: process.env.ONECLOUD_OKTA_SECRET,
      oneCloudUrl: 'https://onecloudapis2-devl.deere.com/',
      accounts: [
        { account: '541843007032', name: 'jd-us01-commoninformationservices-devl' }
      ],
      databricksToken: process.env.DATABRICKS_TOKEN,
      databricksEdlToken: process.env.DATABRICKS_TOKEN,
      viewRemediationCommunitiesToggle: ['a521b7d4-642c-4524-9c46-e4fa5e836a17', '4d8d917d-5c87-43b7-a495-38c46b6f4ee1', '75b382e2-46b8-4fe8-9300-4ed096586629', 'a7b76f9e-8ff4-4171-9050-3706f1f12188', '2e546443-92a3-4060-9fe7-22c2ec3d51b4'],
      datasetsCollectionName: 'datasets',
      edlFiles: 'https://edl-files.vpn-devl.us.e03.c01.johndeerecloud.com/v1',
      ldapCreds: { username: process.env.LDAP_USERNAME, password: process.env.LDAP_PASSWORD },
      managedTaskGroups: ['AWS-GIT-DWIS-ADMIN', 'AWS-AE-EDL-INGEST-ADMIN', 'AWS-GIT-DWIS-DEV'],
      metastoreDatabases: ['edl_dev', 'edl_current_dev'],
      mdiBucket: 'edl-mdi-storage',
      serviceAccessRoleArn: `system-roles/edl-cross-replication`,
      replicationInstance: 'edl-mdi-dms',
      indexName: 'dataset_v3',
      permissionsCollectionName: 'permissions',
      pnoOAuthUrl: "https://sso-dev.johndeere.com/oauth2/ausi7ysomtO1OWzVi0h7/v1/token",
      pnoUrl: "https://peopleapi.devl-vpn.us.e18.c01.johndeerecloud.com/v1/people",
      custodianVisibleFlag: "jdc.custodian_visibility_flag",
      permissionIndexName: 'permission_groups',
      opensearchUrl: 'http://opensearch:9200/',
      opensearchpermissionUrl: 'http://opensearch:9200/',
      ftOktaClient: '0oabs575rrRTgPtuE1t7',
      ftOktaSecret: process.env.FT_OKTA_SECRET,
      ftOktaOAuthUrl: 'https://johndeere.okta.com/oauth2/aus61myxiyyIlJ6vm1t7',
      collibraDQConfig: 'datacatalogui.fetch_collibra_dq',
      documentControllerFlag: 'jdc.documents_endpoint',
      paginatePermissionsFlag: "jdc.paginate_permissions",
      oktaApiBaseUrl: "https://johndeere.oktapreview.com",
      oktaApiPrivateKey: undefined,
      oktaDClient: "0oa1bswz69uHWfSuu0h8",
    };

    return conf.initConfig().then(config => {
      const {isAdmin, ...actualConfig} = config;
      expect(actualConfig).toEqual(expected);
      expect(fs.writeFileSync).not.toHaveBeenCalled();
      envSpy.mockRestore();
    })
  });

  it('should decrypt non-local configs and write to file', () => {
    const envSpy = jest.spyOn(conf, 'getEnv').mockReturnValue('devl')
    AWS.mock('KMS', 'decrypt', { Plaintext: 'decrypted' });
    const secret = { SecretString: JSON.stringify({ username: 'user', password: 'pass' }) };
    AWS.mock('SecretsManager', 'getSecretValue', secret);
    process.env.BASE_URL = "https://data-catalog-dev.deere.com";

    const expected = {
      region: 'us-east-1',
      dynamoConfig: {region: 'us-east-1'},
      amazonES: { region: 'us-east-1', getCredentials: true },
      snsConfig: {apiVersion: '2010-03-31'},
      s3Config: {s3ForcePathStyle: true},
      schemasBucket: 'jd-data-catalog-schemas-devl',
      attachmentsBucket: 'jd-data-catalog-attachment-devl',
      accountNumber: '541843007032',
      metaDataBucket: "jd-us01-edl-devl-file-upload-metadata-audit-logs",
      metastoreBucket: "jd-data-catalog-static-devl",
      dereferencedDatasetsTable: "jd-data-catalog-dereferenced-dataset",
      dereferencedPermissionsTable: "jd-data-catalog-dereferenced-permission",
      discoveredSchemasTable: 'jd-data-catalog-discovered-schema',
      logLevel: 'info',
      viewsTable: "jd-data-catalog-view",
      tablesTable: 'jd-data-catalog-table',
      remediationsTable: 'jd-data-catalog-remediation',
      applicationsTable: 'jd-data-catalog-application',
      metricsTable: "jd-data-catalog-metric",
      collibraEndPoint: 'https://deere-test.collibra.com/rest/2.0',
      oktaBaseUrl: 'https://sso-dev.johndeere.com/oauth2/v1',
      baseUrl: "https://data-catalog-dev.deere.com",
      oktaApiUrl: "https://johndeere.oktapreview.com/api/v1",
      authCallback: 'https://data-catalog-dev.deere.com/api/login/callback',
      docDbSecretId: "AE/jdDataCatalogSecret",
      docDbCluster: "jddatacatalogdocdb.cluster-cn2xcmyfqfwi.us-east-1.docdb.amazonaws.com",
      userName: 'govUI_qual',
      password: 'decrypted',
      oktaClient: '0oal4x8vrfWNnqRav0h7',
      oktaSecret: 'decrypted',
      oneCloudOktaOAuthUrl: 'https://sso-qual.johndeere.com/oauth2/auslv0qm18eANxDxS0h7',
      oneCloudOktaClient: '0oatqdtb80wj7sWxl0h7',
      oneCloudOktaSecret: 'decrypted',
      oneCloudUrl: 'https://onecloudapis2-devl.deere.com/',
      accounts: [
        { account: '541843007032', name: 'jd-us01-commoninformationservices-devl' }
      ],
      cookieSalt: 'decrypted',
      esHost: 'https://search-jd-catalog-es-bcwnltq6qbbvfn3sftb32vplue.us-east-1.es.amazonaws.com',
      apiExternalToken: 'decrypted',
      topicARN: 'arn:aws:sns:us-east-1:541843007032:JDDataCatalogNotification',
      oktaOAuthUrl: 'https://johndeere.oktapreview.com/oauth2/ausazr82rqSWEnxwI0h7',
      pnoOAuthUrl: "https://sso-dev.johndeere.com/oauth2/ausi7ysomtO1OWzVi0h7/v1/token",
      approvers: approvers.getDevl(),
      edlCatalog: 'https://edl-catalog-api.vpn-devl.us.e03.c01.johndeerecloud.com',
      edlWorkflow: 'https://edl-workflow-api.vpn-devl.us.e03.c01.johndeerecloud.com/v1',
      dynamoMonitorId: '0106a7c0-c212-3a41-9dbd-0a5a38e77d20',
      jdCatalogNotificationDlq: 'https://sqs.us-east-1.amazonaws.com/541843007032/jd-catalog-notification-dlq',
      announcementsTable: 'jd-data-catalog-announcement',
      edlMetastoreApi: 'http://edl-metastore-api.vpn-devl.us.e03.c01.johndeerecloud.com/',
      databricksToken: 'decrypted',
      databricksEdlToken: 'decrypted',
      viewRemediationCommunitiesToggle: ['a521b7d4-642c-4524-9c46-e4fa5e836a17', '4d8d917d-5c87-43b7-a495-38c46b6f4ee1', '75b382e2-46b8-4fe8-9300-4ed096586629', 'a7b76f9e-8ff4-4171-9050-3706f1f12188'],
      datasetsCollectionName: 'datasets',
      edlFiles: 'https://edl-files.vpn-devl.us.e03.c01.johndeerecloud.com/v1',
      managedTaskGroups: ['AWS-GIT-DWIS-ADMIN','AWS-GIT-DWIS-DEV','AWS-GIT-DIAD-SS-DEV', 'AWS-AE-EDL-INGEST-ADMIN', 'AWS-AE-OPS-SUPPORT','EDG-JDES-DATAMART-DATALOAD','AWS-TRANSMISSIONTEST-EDL-TRIAL','AWS-MFG-WJ-SME-CUST','AWS-EDL-FORESTRY-IT-GLOBAL','AWS-JDWM-LOGISTICS-PLANNING','AWS_LX_IGNITION_DATABASE','AWS_ZX_SCF_ADMIN','AWS_CF_Data_Analytics','AWS-ECDA-ANALYTICS-MLOPS-ENGINEERS', 'AWS-MFG-JX-SCFTEAM'],
      redisOptions: {
        host: 'clustercfg.edl-redis-devl.oovu0e.use1.cache.amazonaws.com',
        port: 6379,
        parser: 'javascript',
        clusterMode: true
      },
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
      internalOktaAdminCredentials: 'AE/EDL/OKTA_ADMIN_CREDENTIALS_DEVL',
      toggleServiceUrl: "https://edl-toggle-service.vpn-prod.us.e03.c01.johndeerecloud.com",
      ftOktaClient: '0oabs575rrRTgPtuE1t7',
      ftOktaSecret: "{\"username\":\"user\",\"password\":\"pass\"}",
      ftOktaOAuthUrl: 'https://johndeere.okta.com/oauth2/aus61myxiyyIlJ6vm1t7',
      collibraDQConfig: 'datacatalogui.fetch_collibra_dq',
      documentControllerFlag: 'jdc.documents_endpoint',
      paginatePermissionsFlag: "jdc.paginate_permissions",
      oktaApiBaseUrl: "https://johndeere.oktapreview.com",
      oktaDClient: "0oa1bswz69uHWfSuu0h8",
      companyUseAccessFlag: "jdc.company_use_access_flag",
      pnoUrl: "https://peopleapi.devl-vpn.us.e18.c01.johndeerecloud.com/v1/people",
      custodianVisibleFlag: "jdc.custodian_visibility_flag",
      docDbConnection: "mongodb://user:pass@jddatacatalogdocdb.cluster-cn2xcmyfqfwi.us-east-1.docdb.amazonaws.com:27017/records?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retrywrites=false",
      ldapCreds: { username: 'user', password: 'pass' },
      oktaApiPrivateKey: JSON.stringify({ username: 'user', password: 'pass' })
    };

    return conf.initConfig().then(config => {
      const {isAdmin, ...actualConfig} = config;
      expect(actualConfig).toEqual(expected);
      expect(fs.writeFileSync).toHaveBeenCalledWith('./env-config.json', JSON.stringify(expected));
      envSpy.mockRestore();
    })
  });

  it('should take the base url given in the environment variable', () => {
    const envSpy = jest.spyOn(conf, 'getEnv').mockReturnValue('devl')
    AWS.mock('KMS', 'decrypt', { Plaintext: 'decrypted' });
    const secret = { SecretString: JSON.stringify({ username: 'user', password: 'pass' }) };
    AWS.mock('SecretsManager', 'getSecretValue', secret);
    process.env.BASE_URL = "https://data-catalog-test.deere.com";

    const expected = {
      region: 'us-east-1',
      dynamoConfig: {region: 'us-east-1'},
      amazonES: { region: 'us-east-1', getCredentials: true },
      snsConfig: {apiVersion: '2010-03-31'},
      s3Config: {s3ForcePathStyle: true},
      schemasBucket: 'jd-data-catalog-schemas-devl',
      attachmentsBucket: 'jd-data-catalog-attachment-devl',
      accountNumber: '541843007032',
      metaDataBucket: "jd-us01-edl-devl-file-upload-metadata-audit-logs",
      metastoreBucket: "jd-data-catalog-static-devl",
      dereferencedDatasetsTable: "jd-data-catalog-dereferenced-dataset",
      dereferencedPermissionsTable: "jd-data-catalog-dereferenced-permission",
      discoveredSchemasTable: 'jd-data-catalog-discovered-schema',
      logLevel: 'info',
      viewsTable: "jd-data-catalog-view",
      tablesTable: 'jd-data-catalog-table',
      remediationsTable: 'jd-data-catalog-remediation',
      applicationsTable: 'jd-data-catalog-application',
      metricsTable: "jd-data-catalog-metric",
      collibraEndPoint: 'https://deere-test.collibra.com/rest/2.0',
      oktaBaseUrl: 'https://sso-dev.johndeere.com/oauth2/v1',
      baseUrl: "https://data-catalog-test.deere.com",
      oktaApiUrl: "https://johndeere.oktapreview.com/api/v1",
      authCallback: 'https://data-catalog-test.deere.com/api/login/callback',
      docDbSecretId: "AE/jdDataCatalogSecret",
      docDbCluster: "jddatacatalogdocdb.cluster-cn2xcmyfqfwi.us-east-1.docdb.amazonaws.com",
      userName: 'govUI_qual',
      password: 'decrypted',
      oktaClient: '0oal4x8vrfWNnqRav0h7',
      oktaSecret: 'decrypted',
      oneCloudOktaOAuthUrl: 'https://sso-qual.johndeere.com/oauth2/auslv0qm18eANxDxS0h7',
      oneCloudOktaClient: '0oatqdtb80wj7sWxl0h7',
      oneCloudOktaSecret: 'decrypted',
      oneCloudUrl: 'https://onecloudapis2-devl.deere.com/',
      accounts: [
        { account: '541843007032', name: 'jd-us01-commoninformationservices-devl' }
      ],
      cookieSalt: 'decrypted',
      esHost: 'https://search-jd-catalog-es-bcwnltq6qbbvfn3sftb32vplue.us-east-1.es.amazonaws.com',
      apiExternalToken: 'decrypted',
      topicARN: 'arn:aws:sns:us-east-1:541843007032:JDDataCatalogNotification',
      oktaOAuthUrl: 'https://johndeere.oktapreview.com/oauth2/ausazr82rqSWEnxwI0h7',
      pnoOAuthUrl: "https://sso-dev.johndeere.com/oauth2/ausi7ysomtO1OWzVi0h7/v1/token",
      approvers: approvers.getDevl(),
      edlCatalog: 'https://edl-catalog-api.vpn-devl.us.e03.c01.johndeerecloud.com',
      edlWorkflow: 'https://edl-workflow-api.vpn-devl.us.e03.c01.johndeerecloud.com/v1',
      dynamoMonitorId: '0106a7c0-c212-3a41-9dbd-0a5a38e77d20',
      jdCatalogNotificationDlq: 'https://sqs.us-east-1.amazonaws.com/541843007032/jd-catalog-notification-dlq',
      announcementsTable: 'jd-data-catalog-announcement',
      edlMetastoreApi: 'http://edl-metastore-api.vpn-devl.us.e03.c01.johndeerecloud.com/',
      databricksToken: 'decrypted',
      databricksEdlToken: 'decrypted',
      viewRemediationCommunitiesToggle: ['a521b7d4-642c-4524-9c46-e4fa5e836a17', '4d8d917d-5c87-43b7-a495-38c46b6f4ee1', '75b382e2-46b8-4fe8-9300-4ed096586629', 'a7b76f9e-8ff4-4171-9050-3706f1f12188'],
      datasetsCollectionName: 'datasets',
      edlFiles: 'https://edl-files.vpn-devl.us.e03.c01.johndeerecloud.com/v1',
      managedTaskGroups: ['AWS-GIT-DWIS-ADMIN','AWS-GIT-DWIS-DEV', 'AWS-GIT-DIAD-SS-DEV', 'AWS-AE-EDL-INGEST-ADMIN', 'AWS-AE-OPS-SUPPORT','EDG-JDES-DATAMART-DATALOAD','AWS-TRANSMISSIONTEST-EDL-TRIAL','AWS-MFG-WJ-SME-CUST','AWS-EDL-FORESTRY-IT-GLOBAL','AWS-JDWM-LOGISTICS-PLANNING','AWS_LX_IGNITION_DATABASE','AWS_ZX_SCF_ADMIN','AWS_CF_Data_Analytics','AWS-ECDA-ANALYTICS-MLOPS-ENGINEERS', 'AWS-MFG-JX-SCFTEAM'],
      redisOptions: {
        host: 'clustercfg.edl-redis-devl.oovu0e.use1.cache.amazonaws.com',
        port: 6379,
        parser: 'javascript',
        clusterMode: true
      },
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
      internalOktaAdminCredentials: 'AE/EDL/OKTA_ADMIN_CREDENTIALS_DEVL',
      toggleServiceUrl: "https://edl-toggle-service.vpn-prod.us.e03.c01.johndeerecloud.com",
      ftOktaClient: '0oabs575rrRTgPtuE1t7',
      ftOktaSecret: "{\"username\":\"user\",\"password\":\"pass\"}",
      ftOktaOAuthUrl: 'https://johndeere.okta.com/oauth2/aus61myxiyyIlJ6vm1t7',
      collibraDQConfig: 'datacatalogui.fetch_collibra_dq',
      documentControllerFlag: 'jdc.documents_endpoint',
      paginatePermissionsFlag: "jdc.paginate_permissions",
      oktaApiBaseUrl: "https://johndeere.oktapreview.com",
      oktaDClient: "0oa1bswz69uHWfSuu0h8",
      companyUseAccessFlag:"jdc.company_use_access_flag",
      pnoUrl: "https://peopleapi.devl-vpn.us.e18.c01.johndeerecloud.com/v1/people",
      custodianVisibleFlag: "jdc.custodian_visibility_flag",
      docDbConnection: "mongodb://user:pass@jddatacatalogdocdb.cluster-cn2xcmyfqfwi.us-east-1.docdb.amazonaws.com:27017/records?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retrywrites=false",
      ldapCreds: { username: 'user', password: 'pass' },
      oktaApiPrivateKey: JSON.stringify({ username: 'user', password: 'pass' }),
    };

    return conf.initConfig().then(config => {
      const {isAdmin, ...actualConfig} = config;
      expect(actualConfig).toEqual(expected);
      expect(fs.writeFileSync).toHaveBeenCalledWith('./env-config.json', JSON.stringify(expected));
      envSpy.mockRestore();
    })
  });

  it('should fail to write configs to file', () => {
    const envSpy = jest.spyOn(conf, 'getEnv').mockReturnValue('devl');
    const decryptSpy = jest.fn().mockRejectedValue('Ahh!');

    AWS.mock('KMS', 'decrypt', decryptSpy);

    return conf.initConfig().catch(err => {
      expect(err).toEqual('Ahh!');
      expect(fs.writeFileSync).toHaveBeenCalledTimes(0);
      envSpy.mockRestore();
      decryptSpy.mockRestore();
    })
  });

  it('should fail to decrypt configs', () => {
    const envSpy = jest.spyOn(conf, 'getEnv').mockReturnValue('devl');
    const fsSpy = fs.writeFileSync.mockImplementation(() => { throw 'Ahh!' });

    AWS.mock('KMS', 'decrypt', { Plaintext: 'decrypted' });
    const secret = { SecretString: JSON.stringify({ username: 'user', password: 'pass' }) };
    AWS.mock('SecretsManager', 'getSecretValue', secret);

    return conf.initConfig().catch(err => {
      expect(err).toEqual('Ahh!');
      envSpy.mockRestore();
      fsSpy.mockRestore();
    })
  })

  it('should get configs from written file', () => {
    expect(conf.getConfig().region).toEqual('us-east-1');
    expect(conf.getConfig().isLocal).toEqual(true);
  });

  it('Should validate devl availability config', async () => {
    //given
    const expectedConfig = {
      buckets: [
        'jd-data-catalog-schemas-devl',
        'jd-data-catalog-attachment-devl',
        'jd-us01-edl-devl-file-upload-metadata-audit-logs',
        'jd-data-catalog-static-devl'],
      tables: [
        'jd-data-catalog-discovered-schemas',
        'jd-data-catalog-views',
        'jd-data-catalog-tables',
        'jd-data-catalog-announcements'
      ],
      topics: [
        'arn:aws:sns:us-east-1:ACCOUNT_NUMBER:JDDataCatalogNotification'
      ],
      datatype: 'com.deere.enterprise.datalake.enhance.demo_marvel_comic_characters_new'
    };
    const envSpy = jest.spyOn(conf, 'getEnv').mockReturnValue('devl');
    //when
    const availabilityConf = await conf.getAvailabilityConf();
    //then
    expect(availabilityConf).toEqual(expectedConfig)
  });

  it('Should validate prod availability config', async () => {
    //given
    process.env.APP_ENV = 'prod';
    const expectedConfig = {
      buckets: [
        'jd-data-catalog-schemas-prod',
        'jd-data-catalog-attachment-prod',
        'jd-us01-edl-prod-file-upload-metadata-audit-logs',
        'jd-data-catalog-static-prod'],
      tables: [
        'jd-data-catalog-discovered-schemas',
        'jd-data-catalog-views',
        'jd-data-catalog-tables',
        'jd-data-catalog-announcements'
      ],
      topics: [
        'arn:aws:sns:us-east-1:ACCOUNT_NUMBER:JDDataCatalogNotification'
      ],
      datatype: 'com.deere.enterprise.datalake.enhance.demo_marvel_comic_characters_new'
    };

    //when
    const availabilityConf = await conf.getAvailabilityConf();
    //then
    expect(availabilityConf).toEqual(expectedConfig);
    process.env.APP_ENV = 'Local';
  });
})
