/**
 * @jest-environment node
 */

const uuid = require('uuid');
const accessUtility = require('../../../src/utilities/accessUtility');
const datasetDao = require('../../../src/data/datasetDao');
const activeDirectoryDao = require('../../../src/data/ldap/activeDirectoryDao');
const datasetApprovalService = require('../../../src/services/datasetApprovalService');
const datasetService = require('../../../src/services/datasetService');
const datasetValidator = require('../../../src/services/datasetValidator')
const emailService = require('../../../src/services/emailService');
const fileService = require('../../../src/services/fileService');
const notificationService = require('../../../src/services/notificationService');
const recordService = require('../../../src/services/recordService');
const referenceService = require('../../../src/services/referenceService');
const schemaDao = require('../../../src/data/schemaDao');
const documentDao = require('../../../src/data/documentDao');
const s3 = require('../../../src/data/s3');
const versionService = require('../../../src/services/versionService');
const { when, resetAllWhenMocks } = require('jest-when');
const schemaValidationService = require('../../../src/services/schemaValidationService');
const edlApiHelper = require('../../../src/utilities/edlApiHelper');
const conf = require("../../../conf");
const { APPROVED, AVAILABLE, DELETED, PENDING, PENDING_DELETE, REJECTED, ALL_STATUSES} = require("../../../src/services/statusService");

jest.mock('uuid');
jest.mock('../../../src/utilities/accessUtility');
jest.mock('../../../src/services/datasetApprovalService');
jest.mock('../../../src/data/datasetDao');
jest.mock('../../../src/data/ldap/activeDirectoryDao');
jest.mock('../../../src/services/datasetValidator');
jest.mock('../../../src/services/fileService');
jest.mock('../../../src/services/referenceService');
jest.mock('../../../src/services/versionService');
jest.mock('../../../src/services/emailService');
jest.mock('../../../src/services/recordService');
jest.mock('../../../src/data/schemaDao');
jest.mock('../../../src/services/notificationService');
jest.mock('../../../src/data/s3');
jest.mock('../../../src/data/documentDao');
jest.mock('../../../src/services/schemaValidationService');
jest.mock('../../../src/utilities/edlApiHelper');

function assertValidationError(error, message, name) {
  expect(error.details[0].message).toEqual(message);
  expect(error.details[0].name).toEqual(name);
}

describe('datasetService tests', () => {
  const attachmentsContent = { Contents: [], Name: 'jd-data-catalog-attachment-devl', CommonPrefixes: [] };
  const datasetId = '1234';
  const schemaBaseId = 'a108b4a3-d00b-4e33-a143-a73932b7ff77';
  const schemaId = 'a108b4a3-d00b-4e33-a143-a73932b7ff77--1';
  const schemaVersion = '1.0.0';
  const mockDate = new Date();
  const isoDate = mockDate.toISOString();
  const user = 'Fred';
  const schemaName = 'base schema';
  const approver = 'DooScooby';
  const approverEmail = `${approver}@JohnDeere.com`;

  const fullUser = {
    username: user,
    groups: [approver]
  };
  const edlUser = {
    username: user,
    isAdmin: true
  };

  const nonEdlUser = {
    username: user,
    isAdmin: false
  };

  const userInfo = {
    username: 'user123',
    email: 'user123@JohnDeere.com',
    lockedBy: '2021-05-31'
  };

  let jestDateSpy;
  let jestConsoleInfo;

  function createApproval(communityId = '10', status = PENDING) {
    return {
      community: communityId,
      status,
      approvedBy: null,
      approverEmail,
      comment: null,
      updatedAt: null
    };
  }

  function createSimpleDataset(id = datasetId, name = 'Netflix', sourceDatasets = [], status = PENDING) {
    return {
      id,
      version: 1,
      status,
      createdBy: user,
      updatedBy: user,
      createdAt: isoDate,
      updatedAt: isoDate,
      name,
      description: 'Streaming service for TV shows and movies',
      documentation: '##### Support Resources',
      custodian: 'EDG-NETFLIX-MANAGERS',
      sourceDatasets,
      category: '4',
      phase: '6',
      technology: '7',
      physicalLocation: '8',
      schemas: [createSchema()],
      linkedSchemas: [],
      tables: [],
      paths: [],
      classifications: [
        {
          community: '10',
          subCommunity: '11',
          countriesRepresented: ['12', '13'],
          gicp: '14',
          id: "2345",
          personalInformation: false,
          development: false,
          additionalTags: ['tag']
        }
      ],
      attachments: {
        deletedAttachments: [],
        newAttachments: [],
        currentAttachments: []
      },
      approvals: [createApproval()],
      views: [],
      discoveredTables: [],
      usability: expect.anything(),
      storageAccount: "12345",
      storageLocation: "jd-us01-edl-devl-raw-someEncodedId"
    };
  }

  function createDatasetForCatalog(id = datasetId, name = 'Netflix', sourceDatasets = [], status = PENDING, version = 1) {
    return {
      id,
      version,
      status,
      createdBy: user,
      updatedBy: user,
      createdAt: isoDate,
      updatedAt: isoDate,
      name,
      description: 'Streaming service for TV shows and movies',
      documentation: '##### Support Resources',
      custodian: 'EDG-NETFLIX-MANAGERS',
      sourceDatasets,
      category: '4',
      phase: '6',
      technology: '7',
      physicalLocation: '8',
      schemas: [createSchema()],
      linkedSchemas: [],
      tables: [],
      paths: [],
      discoveredSchemas: [],
      views: [],
      discoveredTables: [],
      classifications: [
        {
          community: '10',
          subCommunity: '11',
          countriesRepresented: ['12', '13'],
          gicp: '14',
          id: '2345',
          personalInformation: false,
          development: false,
          additionalTags: ['tag']
        }
      ],
      attachments: {
        deletedAttachments: [],
        newAttachments: [],
        currentAttachments: []
      },
      approvals: [
        {
          community: { id: '10', name: 'Name', approver },
          status: PENDING,
          approvedBy: null,
          approverEmail,
          comment: null,
          updatedAt: null
        }
      ]
    };
  }

  function createNewDatasetToSave() {
    return {
      id: datasetId,
      name: 'Netflix',
      requestComments: 'some test comments',
      version: 1,
      createdBy: user,
      createdAt: isoDate,
      description: 'Streaming service for TV shows and movies',
      documentation: '##### Support Resources',
      custodian: 'EDG-NETFLIX-MANAGERS',
      deletedSchemas: [],
      sourceDatasets: [],
      category: '4',
      phase: '6',
      technology: '7',
      physicalLocation: '8',
      schemas: [createSchema()],
      linkedSchemas: [],
      tables: [],
      paths: [],
      status: PENDING,
      classifications: [
        {
          community: '10',
          subCommunity: '11',
          countriesRepresented: ['12', '13'],
          gicp: '14',
          id: '2345',
          personalInformation: false,
          development: false,
          additionalTags: ['tag']
        }
      ],
      attachments: {
        deletedAttachments: [],
        newAttachments: [],
        currentAttachments: []
      },
      approvals: [createApproval()],
      views: [],
      discoveredTables: [],
      usability: expect.anything(),
      storageAccount: "12345",
      storageLocation: "jd-us01-edl-devl-raw-someEncodedId"
    };
  }

  function createDatasetInDocDb(status = AVAILABLE, id = datasetId, name = 'Netflix', sourceDatasets = []) {
    return {
      id,
      version: 1,
      status,
      createdBy: user,
      updatedBy: user,
      createdAt: isoDate,
      updatedAt: isoDate,
      name,
      description: 'Streaming service for TV shows and movies',
      documentation: '##### Support Resources',
      custodian: 'EDG-NETFLIX-MANAGERS',
      sourceDatasets,
      category: { name: 'Master', id: '4' },
      phase: { name: 'Raw', id: '6' },
      technology: { name: 'AWS', id: '7' },
      physicalLocation: { name: 'US East', id: '8' },
      schemas: [createSchema()],
      linkedSchemas: [],
      tables: [],
      paths: [],
      classifications: [
        {
          community: { name: 'system', id: '10' },
          subCommunity: { name: 'demo', id: '11' },
          countriesRepresented: [{ id: '12', name: 'US' }, { id: '13', name: 'CA' }],
          gicp: { id: '14', name: 'classified' },
          id: "2345",
          personalInformation: false,
          development: false,
          additionalTags: ['tag']
        }
      ],
      attachments: {
        deletedAttachments: [],
        newAttachments: [],
        currentAttachments: []
      },
      approvals: [
        {
          community: { id: "10" },
          status: PENDING,
          approvedBy: null,
          approverEmail,
          comment: null,
          updatedAt: null
        }
      ],
      views: [],
      discoveredTables: [],
      usability: expect.anything(),
      storageAccount: "12345",
      storageLocation: "jd-us01-edl-devl-raw-someEncodedId"
    };
  }

  function createExpectedDatasetForRead(status = AVAILABLE, id = datasetId, name = 'Netflix', sourceDatasets = []) {
    return {
      id,
      version: 1,
      status,
      createdBy: user,
      updatedBy: user,
      createdAt: isoDate,
      updatedAt: isoDate,
      name,
      description: 'Streaming service for TV shows and movies',
      documentation: '##### Support Resources',
      custodian: 'EDG-NETFLIX-MANAGERS',
      sourceDatasets,
      category: { name: 'Master', id: '4' },
      phase: { name: 'Raw', id: '6' },
      technology: { name: 'AWS', id: '7' },
      physicalLocation: { name: 'US East', id: '8' },
      schemas: [createSchema()],
      linkedSchemas: [],
      tables: [],
      paths: [],
      discoveredSchemas: [],
      discoveredTables: [],
      views: [],
      classifications: [
        {
          community: { name: 'system', id: '10' },
          subCommunity: { name: 'demo', id: '11' },
          countriesRepresented: [{ id: '12', name: 'US' }, { id: '13', name: 'CA' }],
          gicp: { id: '14', name: 'classified' },
          id: "2345",
          personalInformation: false,
          development: false,
          additionalTags: ['tag']
        }
      ],
      attachments: {
        deletedAttachments: [],
        newAttachments: [],
        currentAttachments: []
      },
      approvals: [
        {
          community: { id: "10" },
          status: PENDING,
          approvedBy: null,
          approverEmail,
          comment: null,
          updatedAt: null
        }
      ],
      usability: expect.anything(),
      storageAccount: "12345",
      storageLocation: "jd-us01-edl-devl-raw-someEncodedId"
    };
  }

  function createSchema() {
    return {
      id: schemaId,
      name: schemaName,
      version: '1.0.0',
      testing: true
    };
  }

  function createDetailedSchemas() {
    return {
      id: schemaId,
      name: schemaName,
      version: '1.0.0',
      description: "description",
      fields: [
        {
          name: "Name",
          attribute: "id",
          datatype: "string",
          description: "some description",
          nullable: false
        }
      ],
      environmentName: "com.deere.enterprise.datalake.enhance.someName"
    };
  }

  const communityApproval = {
    approvedBy: null,
    approverEmail: "DooScooby@JohnDeere.com",
    comment: null,
    community: {
      approver: "DooScooby",
      id: "10",
      name: "Name",
    },
    status: PENDING,
    updatedAt: null,
  };

  function createDefaultFullFields() {
    return {
      attachments: expect.anything(),
      approvals: [communityApproval],
      classifications: [],
      discoveredSchemas: [],
      discoveredTables: [],
      environment: {},
      linkedSchemas: [],
      paths: [],
      sourceDatasets: [],
      tables: [],
      views: [],
      usability: expect.anything(),
    };
  }

  function mockDatasetDao(dataset) {
    datasetDao.getDataset.mockResolvedValue(dataset);
    datasetDao.getDatasets.mockResolvedValue([dataset]);
    datasetDao.getDatasetVersions.mockResolvedValue([dataset]);
  }

  function mockReferenceService() {
    referenceService.getName.mockImplementation((val) => val);
    versionService.getLatestVersions.mockResolvedValue(val => val);
    uuid.v4.mockReturnValue(schemaBaseId);
    referenceService.getValue.mockReturnValue({ id: '10', name: 'Name', approver });
    referenceService.dereferenceIds.mockImplementation(record => record);
  }

  function mockRecordService() {
    recordService.addAuditFields.mockImplementation(record => ({ id: datasetId, ...record }));
    recordService.mergeAuditFields.mockImplementation((_, updatedRecord) => ({ ...updatedRecord, views: [], discoveredTables: [] }));
  }

  function mockVersionService() {
    versionService.allowedToUpdate.mockReturnValue(true);
    versionService.calculateVersion.mockReturnValue(2);
    versionService.getLatestAvailableVersion.mockReturnValue(createDatasetInDocDb());
    versionService.getLatestVersions.mockResolvedValue(val => val);
  }

  function setupExistingDatasetsInES(daoDatasets = [{ ...createDatasetInDocDb(), status: AVAILABLE }], esDatasets = [createDatasetInDocDb()]) {
    datasetDao.getDatasetVersions.mockReset();
    datasetDao.getLatestDatasets.mockReset();
    datasetDao.getDatasetVersions.mockResolvedValueOnce(daoDatasets);
    datasetDao.getLatestDatasets.mockResolvedValue(esDatasets);
  }

  const mockUuid = () => uuid.v4.mockReturnValue(schemaBaseId);
  const mockSchemaDao = schema => schemaDao.getSchema.mockResolvedValue(schema);
  const mockEmailService = () => emailService.sendEmails.mockResolvedValue();
  const mockNotification = () => notificationService.sendNotification.mockResolvedValue('Just a value');

  function mockApprovalService() {
    datasetApprovalService.addApprovals.mockImplementation(record => {
      if (record.approvals) return record;
      return { ...record, ...{ approvals: [] } };
    });
  }



  beforeEach(() => {
    resetAllWhenMocks();
    jest.resetAllMocks();
    jestDateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    jestConsoleInfo = jest.spyOn(console, 'info').mockImplementation();
    mockDatasetDao(createDatasetInDocDb());
    mockReferenceService();
    mockRecordService();
    mockVersionService();
    mockUuid();
    mockSchemaDao(createSchema());
    mockEmailService();
    mockApprovalService();
    mockNotification();
    schemaDao.getDiscoveredSchemasForDataset.mockResolvedValue([]);
    accessUtility.getUniqueGovernance.mockImplementation(val => val);
    versionService.getLatestVersions.mockImplementation(val => val);
    datasetDao.getLatestDatasets.mockResolvedValue([createDatasetInDocDb()]);
    s3.getContents.mockResolvedValue({ Contents: [] });
    datasetDao.getDatasetVersions.mockResolvedValue([]);
  });

  afterEach(() => {
    jestDateSpy.mockRestore();
    jestConsoleInfo.mockRestore();
    jest.resetAllMocks();
  });

  describe('should get dataset', () => {
    it('should get raw datasets', async () => {
      datasetDao.getDatasets.mockResolvedValueOnce(createDatasetInDocDb());
      const expectedStatus = ['some-status'];
      const response = await datasetService.getRawDatasets(expectedStatus);
      expect(response).toEqual(createDatasetInDocDb());
      expect(datasetDao.getDatasets).toHaveBeenCalledWith(expectedStatus);
    });



    it('should throw an error when "start" is not provide along with "dateFilter"', () => {
      const searchResults = [
        { id: 1, status: AVAILABLE, name: 'hello', version: 1, classifications: [] },
        { id: 1, status: AVAILABLE, name: 'world', version: 2, classifications: [] },
        { id: 1, status: DELETED, name: 'helloWorld', version: 3, classifications: [] }
      ];
      const queryParams = {
        status: [AVAILABLE, DELETED],
        name: 'hello',
        dateFilter: 'updatedAt'
      };
      datasetDao.getLatestDatasets.mockResolvedValue(searchResults);

      const expectedError = new Error('Must include a "start" in query parameters along with "dateFilter".');
      const results = datasetService.searchForDataset(queryParams);
      return expect(results).rejects.toThrow(expectedError);
    });

    it('should filter on name and return latest Available datasets', async () => {
      const searchResults = [
        { id: 1, status: AVAILABLE, name: 'hello', version: 1, classifications: [] },
        { id: 1, status: AVAILABLE, name: 'world', version: 2, classifications: [] },
        { id: 1, status: DELETED, name: 'helloWorld', version: 3, classifications: [] }
      ];
      const queryParams = {
        status: [AVAILABLE, DELETED],
        name: 'hello'
      };
      const expectedParams = {
        statuses: [AVAILABLE, DELETED],
        name: 'hello'
      }
      const expected = [searchResults[2]];
      datasetDao.getLatestDatasets.mockResolvedValueOnce([searchResults[2]]);
      const results = await datasetService.searchForDataset(queryParams);
      expect(datasetDao.getLatestDatasets).toHaveBeenCalledWith(expectedParams)
      expect(results).toEqual(expected);
    });

    it('should filter on community when searching for datasets', async () => {
      const searchResults = [
        {
          id: 1, status: AVAILABLE, name: 'Stan', version: 1, classifications: [{
            community: { name: 'CIA-agent' }
          }]
        },
        {
          id: 2, status: AVAILABLE, name: 'Francine', version: 1, classifications: [{
            community: { name: 'homemaker' }
          }]
        },
      ];
      const queryParams = {
        status: undefined,
        name: undefined,
        community: 'cia-agent'
      };
      const expectedResult = [searchResults[0]];
      datasetDao.getLatestDatasets.mockResolvedValueOnce(expectedResult);
      const actualResult = await datasetService.searchForDataset(queryParams);
      expect(datasetDao.getLatestDatasets).toHaveBeenCalledWith({
        statuses: [AVAILABLE],
        communities: ['cia-agent']
      });
      expect(actualResult).toEqual(expectedResult);
    });

    it('should get latest datasets', async () => {
      const expected = [{ id: 'some ds' }];
      datasetDao.getLatestDatasets.mockResolvedValueOnce(expected);
      const results = await datasetService.getLatestDatasets();
      expect(results).toEqual(expected);
    });

    it('should get latest datasets for all statuses', async () => {
      const expected = [{ id: 'some ds' }];
      datasetDao.getLatestDatasets.mockResolvedValueOnce(expected);
      const results = await datasetService.getLatestDatasets({ statuses: [DELETED] });
      expect(results).toEqual(expected);
      expect(datasetDao.getLatestDatasets).toHaveBeenCalledWith({ statuses: [DELETED] });
    });

    it('should get datasets with reference values including discovered schemas', async () => {
      const ds1 = createDatasetInDocDb();
      const ds2 = createDatasetInDocDb(PENDING, 'test', 'test');
      datasetDao.getLatestDatasets.mockResolvedValueOnce([ds1, ds2])

      const actualDatasets = await datasetService.getDatasets();

      expect(actualDatasets).toContainEqual(ds1);
      expect(actualDatasets).toContainEqual(ds2);
    });

    it('should populate with default values', async () => {
      const sourceDataset = createDatasetInDocDb();
      delete sourceDataset.documentation;
      delete sourceDataset.schemas;
      delete sourceDataset.linkedSchemas;
      delete sourceDataset.classifications;
      delete sourceDataset.sourceDatasets;
      delete sourceDataset.paths;
      delete sourceDataset.tables;
      const fullDataset = {
        ...createDatasetInDocDb(),
        discoveredSchemas: [],
        discoveredTables: [],
        views: []
      };
      fullDataset.documentation = "";
      fullDataset.schemas = [];
      fullDataset.linkedSchemas = [];
      fullDataset.classifications = [];
      fullDataset.sourceDatasets = [];
      fullDataset.paths = [];
      fullDataset.tables = [];
      const expectedDatasets = {...fullDataset,views: [
        {
          "id": "a108b4a3-d00b-4e33-a143-a73932b7ff77--1",
          "name": "edl_views.views_remediation_drift_test_diana_copy",
          "status": "AVAILABLE",
          "createdAt": "2023-05-08T21:58:35.533Z",
          "testing": true,
          "version": "1.0.0"
        },
        {
          "id": "a108b4a3-d00b-4e33-a143-a73932b7ff77--1",
          "name": "edl_views.views_remediation_drift_test_diana",
          "status": "AVAILABLE",
          "createdAt": "2023-05-19T20:28:22.854Z",
          "testing": true,
          "version": "1.0.0"
        }
      ]};
      s3.getContents.mockResolvedValue({ Contents: [] });
      let mockedDataset = {...sourceDataset, views: [
          {
            "name": "edl_views.views_remediation_drift_test_diana_copy",
            "status": "AVAILABLE",
            "createdAt": "2023-05-08T21:58:35.533Z"
          },
          {
            "name": "edl_views.views_remediation_drift_test_diana",
            "status": "DRIFTED",
            "createdAt": "2023-05-19T20:28:22.854Z"
          },
          {
            "name": "edl_views.views_remediation_drift_test_diana",
            "status": "AVAILABLE",
            "createdAt": "2023-05-19T20:28:22.854Z"
          }
        ]}
      datasetDao.getLatestDataset.mockResolvedValue(mockedDataset);
      const actualDatasets = await datasetService.getDataset(true, datasetId);
      expect(actualDatasets).toEqual(expectedDatasets);
    });

    it('should populate with views', async () => {
      const sourceDataset = createDatasetInDocDb();
      delete sourceDataset.documentation;
      delete sourceDataset.schemas;
      delete sourceDataset.linkedSchemas;
      delete sourceDataset.classifications;
      delete sourceDataset.sourceDatasets;
      delete sourceDataset.paths;
      delete sourceDataset.tables;
      const fullDataset = {
        ...createDatasetInDocDb(),
        discoveredSchemas: [],
        discoveredTables: [],
        views: []
      };
      fullDataset.documentation = "";
      fullDataset.schemas = [];
      fullDataset.linkedSchemas = [];
      fullDataset.classifications = [];
      fullDataset.sourceDatasets = [];
      fullDataset.paths = [];
      fullDataset.tables = [];
      const expectedDatasets = {...fullDataset,views: [
          {
            "id": "a108b4a3-d00b-4e33-a143-a73932b7ff77--1",
            "name": "edl_views.views_remediation_drift_test_diana_copy",
            "status": "AVAILABLE",
            "createdAt": "2023-05-08T21:58:35.533Z",
            "testing": true,
            "version": "1.0.0"
          },
          {
            "id": "a108b4a3-d00b-4e33-a143-a73932b7ff77--1",
            "name": "edl_views.views_remediation_drift_test_diana",
            "status": "AVAILABLE",
            "createdAt": "2023-05-19T20:28:22.854Z",
            "testing": true,
            "version": "1.0.0"
          }
        ]};
      s3.getContents.mockResolvedValue({ Contents: [] });
      let mockedDataset = {...sourceDataset, views: [
          {
            "name": "edl_views.views_remediation_drift_test_diana_copy",
            "status": "AVAILABLE",
            "createdAt": "2023-05-08T21:58:35.533Z"
          },
          {
            "name": "edl_views.views_remediation_drift_test_diana",
            "status": "AVAILABLE",
            "createdAt": "2023-05-19T20:28:22.854Z"
          }
        ]}
      datasetDao.getLatestDataset.mockResolvedValue(mockedDataset);
      const actualDatasets = await datasetService.getDataset(true, datasetId);
      expect(actualDatasets).toEqual(expectedDatasets);
    });

    it('should get a version of a dataset', async () => {
      const expectedDataset = {
        ...createDatasetInDocDb(),
        discoveredSchemas: [],
        discoveredTables: [],
        views: [],
        schemas: [createDetailedSchemas()]
      };
      schemaDao.getSchema.mockResolvedValue(createDetailedSchemas());

      s3.getContents.mockResolvedValue({ Contents: [] });

      const actualDataset = await datasetService.getDataset(true, datasetId, 1);

      expect(actualDataset).toEqual(expectedDataset);
    });


    it('should get the latest version of a dataset', async () => {
      datasetDao.getLatestDataset.mockResolvedValue(createSimpleDataset());
      await datasetService.getDataset(true, datasetId, 'latest');
      expect(datasetDao.getLatestDataset).toHaveBeenCalledWith(datasetId, ALL_STATUSES);
    });

    it('should get the latest available version of a dataset', async () => {
      datasetDao.getLatestDataset.mockResolvedValue(createSimpleDataset());
      await datasetService.getDataset(true, datasetId, 'latest', [AVAILABLE]);
      expect(datasetDao.getLatestDataset).toHaveBeenCalledWith(datasetId, [AVAILABLE]);
    });

    it('should get a dataset with lazy loading on schemas', async () => {
      const schema = createSchema();
      const expectedDataset = {
        ...createDatasetInDocDb(),
        discoveredSchemas: [],
        discoveredTables: [],
        views: [],
        schemas: [schema]
      };

      s3.getContents.mockResolvedValue({ Contents: [] });

      const actualDataset = await datasetService.getDataset(false, datasetId, 1);

      expect(actualDataset).toEqual(expectedDataset);
    });

    it('should get a dataset with a discovered schema', async () => {
      const expectedFullDiscoveredSchema = { ...createDetailedSchemas(), id: 'some-discovered', discovered: 'some-time' };
      const expectedDataset = {
        ...createDatasetInDocDb(),
        discoveredSchemas: [expectedFullDiscoveredSchema],
        schemas: [createDetailedSchemas()],
        views: [],
        discoveredTables: [],
      };
      schemaDao.getSchema
        .mockResolvedValueOnce(createDetailedSchemas())
        .mockResolvedValueOnce({ ...createDetailedSchemas(), id: 'some-discovered' });
      schemaDao.getDiscoveredSchemasForDataset.mockResolvedValue([{ id: 'some-discovered', discovered: 'some-time' }]);
      s3.getContents.mockResolvedValue({ Contents: [] });

      datasetDao.getDataset.mockResolvedValueOnce({ ...createDatasetInDocDb(), discoveredSchemas: ['some-id'] })

      const actualDataset = await datasetService.getDataset(true, datasetId, 1);

      expect(actualDataset).toEqual(expectedDataset);
    });

    it('should get a dataset with a view', async () => {
      const expectedFullView = { ...createDetailedSchemas(), id: 'some-view', name: 'some-view', status: AVAILABLE };
      const expectedDataset = {
        ...createDatasetInDocDb(),
        views: [expectedFullView],
        schemas: [createDetailedSchemas()],
        discoveredSchemas: [],
        discoveredTables: []
      };
      mockDatasetDao({
        ...createDatasetInDocDb(),
        views: [{ name: 'some-view', status: 'AVAILABLE' }]
      });
      schemaDao.getSchema
        .mockResolvedValueOnce(createDetailedSchemas())
        .mockResolvedValueOnce(expectedFullView);
      s3.getContents.mockResolvedValue({ Contents: [] });

      const actualDataset = await datasetService.getDataset(true, datasetId, 1);

      expect(schemaDao.getSchema).toHaveBeenCalledWith('some-view');
      expect(actualDataset).toEqual(expectedDataset);
    });

    it('should get a dataset with table linked schema ID updated to latest version', async () => {
      const existingDataset = createDatasetInDocDb();
      existingDataset.status = AVAILABLE;
      existingDataset.schemas = [];
      existingDataset.linkedSchemas = [{ ...createDetailedSchemas(), id: 'linked-schema--1', name: "linked-schema" }];
      existingDataset.tables = [{ schemaId: 'linked-schema--1', tableName: 'scooby' }];
      datasetDao.getDataset.mockResolvedValueOnce(existingDataset);

      const otherDataset = createDatasetInDocDb();
      otherDataset.version = 2;
      otherDataset.schemas = [{ ...createDetailedSchemas(), id: 'linked-schema--2', name: "linked-schema" }];
      datasetDao.getLatestDatasets.mockResolvedValueOnce([otherDataset]);

      const updatedSchema = { id: 'linked-schema--2', name: 'linked-schema', version: '1.0.0' };
      schemaDao.getSchema.mockResolvedValue(updatedSchema)
      s3.getContents.mockResolvedValue({ Contents: [] });

      const actualDataset = await datasetService.getDataset(true, datasetId, 1);

      const expectedDataset = {
        ...createDatasetInDocDb(),
        status: AVAILABLE,
        schemas: [],
        linkedSchemas: [updatedSchema],
        tables: [{ schemaId: 'linked-schema--2', tableName: 'scooby' }],
        views: [],
        discoveredSchemas: [],
        discoveredTables: []
      };
      expect(actualDataset).toEqual(expectedDataset);
    });

    it('should get latest available dataset when no version provided', async () => {
      const latestDataset = createDatasetInDocDb();
      latestDataset.version = 2;
      latestDataset.status = AVAILABLE;

      datasetDao.getLatestDataset.mockResolvedValue(latestDataset);
      schemaDao.getSchema.mockResolvedValue(createDetailedSchemas());
      s3.getContents.mockResolvedValue({ Contents: [] });

      const actualDataset = await datasetService.getDataset(true, datasetId);

      const expectedDataset = {
        ...createDatasetInDocDb(),
        version: 2,
        status: AVAILABLE,
        views: [],
        schemas: [createDetailedSchemas()],
        discoveredSchemas: [],
        discoveredTables: []
      };
      expect(actualDataset).toEqual(expectedDataset);
    });

    it('should get a pending dataset with previous dataset version', async () => {
      const previousDataset = createDatasetInDocDb();
      previousDataset.version = 1;
      previousDataset.status = AVAILABLE;
      const pendingDataset = createDatasetInDocDb();
      pendingDataset.version = 2;
      pendingDataset.status = PENDING;
      datasetDao.getLatestDataset.mockResolvedValue(previousDataset);
      datasetDao.getDataset.mockResolvedValueOnce(pendingDataset);
      schemaDao.getSchema.mockResolvedValueOnce(createDetailedSchemas())
        .mockResolvedValueOnce(createDetailedSchemas());
      s3.getContents.mockResolvedValue({ Contents: [] });

      const actualDataset = await datasetService.getDataset(true, datasetId, 2);

      const pendingDatasetDetail = createExpectedDatasetForRead();
      pendingDatasetDetail.version = 2;
      pendingDatasetDetail.status = PENDING;
      pendingDatasetDetail.schemas = [createDetailedSchemas()];

      const previousDatasetDetail = createExpectedDatasetForRead();
      previousDatasetDetail.version = 1;
      previousDatasetDetail.status = AVAILABLE;
      previousDatasetDetail.schemas = [createDetailedSchemas()];

      const expectedDataset = {
        ...pendingDatasetDetail,
        previousVersion: previousDatasetDetail
      };
      expect(actualDataset).toEqual(expectedDataset);
    });

    it('should get a rejected dataset with previous dataset version', async () => {
      const previousDataset = createDatasetInDocDb();
      previousDataset.version = 1;
      previousDataset.status = AVAILABLE;
      const rejectedDataset = createDatasetInDocDb();
      rejectedDataset.version = 2;
      rejectedDataset.status = REJECTED;
      datasetDao.getLatestDataset.mockResolvedValue(previousDataset);
      datasetDao.getDataset.mockResolvedValueOnce(rejectedDataset);
      schemaDao.getSchema.mockResolvedValueOnce(createDetailedSchemas())
        .mockResolvedValueOnce(createDetailedSchemas());
      s3.getContents.mockResolvedValue({ Contents: [] });

      const actualDataset = await datasetService.getDataset(true, datasetId, 2);

      const rejectedDatasetDetail = createExpectedDatasetForRead();
      rejectedDatasetDetail.version = 2;
      rejectedDatasetDetail.status = REJECTED;
      rejectedDatasetDetail.schemas = [createDetailedSchemas()];

      const previousDatasetDetail = createExpectedDatasetForRead();
      previousDatasetDetail.version = 1;
      previousDatasetDetail.status = AVAILABLE;
      previousDatasetDetail.schemas = [createDetailedSchemas()];

      const expectedDataset = {
        ...rejectedDatasetDetail,
        previousVersion: previousDatasetDetail
      };
      expect(actualDataset).toEqual(expectedDataset);
    });

    it('should fail to get dataset', () => {
      const expectedError = new Error('foo');
      datasetDao.getDataset.mockRejectedValueOnce(expectedError);

      const result = datasetService.getDataset(true, datasetId, 1);

      return expect(result).rejects
        .toThrow(expectedError.message);
    });

    it('should not fail when schema fails to load', async () => {
      schemaDao.getSchema.mockRejectedValue(new Error('boom'));
      s3.getContents.mockResolvedValue({ Contents: [] });

      const actualDataset = await datasetService.getDataset(true, datasetId, 1);

      const expectedDataset = {
        ...createDatasetInDocDb(),
        discoveredSchemas: [],
        discoveredTables: [],
        views: []
      };
      expectedDataset.schemas = [];
      expect(actualDataset).toEqual(expectedDataset);
    });

    it('should return datasets with statuses that can be approved', async () => {
      const expectedApprovals = [PENDING, REJECTED, APPROVED].map(status => {
        return {
          ...createDatasetInDocDb(datasetId, 'Netflix', [], status),
          approvals: [createApproval({ approver, id: '10', name: 'Name' })]
        }
      });
      datasetDao.getLatestDatasets.mockResolvedValueOnce(expectedApprovals);
      datasetApprovalService.getUserApprovals.mockImplementation(item => item);

      const actualApprovals = await datasetService.findAllForApproval(fullUser);
      expect(actualApprovals).toEqual(expectedApprovals);
      expect(datasetApprovalService.getUserApprovals).toHaveBeenCalledWith(expectedApprovals, fullUser);
    });

    it('should get all versions of a dataset', async () => {
      const version1 = createDatasetInDocDb();
      const version2 = { ...createDatasetInDocDb(), version: 2 };
      const version3 = { ...createDatasetInDocDb(), version: 3 };
      const expectedVersions = [version1, version2, version3];
      datasetDao.getDatasetVersions.mockResolvedValueOnce(expectedVersions);

      const actualVersions = await datasetService.getAllDatasetVersions("anyId");
      expect(actualVersions).toEqual(expectedVersions);
    });
  });

  describe('should save dataset', () => {
    let savedDataset;
    let custodian = {
      custodian: 'TEST-GRP',
      status: PENDING,
      approvedBy: null,
      approverEmail: 'TEST-GRP@JohnDeere.com',
      comment: null,
      updatedAt: null
    }

    beforeEach(() => {
      savedDataset = {
        approvals: [
          {
            ...createApproval(),
            community: {
              approver: "DooScooby",
              id: "10",
              name: "Name"
            }
          },
          custodian
        ],
        schemas: [createSchema()]
      };
      datasetApprovalService.addApprovals.mockResolvedValue({ approvals: [createApproval(), custodian], schemas: [createSchema()] });
      setupExistingDatasetsInES();
    });

    it('should save datasets', async () => {
      const datasetToSave = createNewDatasetToSave();
      await datasetService.saveDatasets([datasetToSave]);
      expect(datasetDao.saveDatasets).toBeCalledWith([datasetToSave]);
    });

    it('when valid dataset with all possible fields', async () => {
      const datasetToSave = { ...createNewDatasetToSave(), name: 'someName' };
      const commentHistory = [{ comment: "No comments", updatedAt: isoDate, updatedBy: "Fred" }];
      const expectedForIndex = {
        ...createDefaultFullFields(),
        commentHistory,
        "approvals": [{
          "approvedBy": null,
          "approverEmail": "DooScooby@JohnDeere.com",
          "comment": null,
          "community": { "approver": "DooScooby", "id": "10", "name": "Name" },
          "status": PENDING,
          "updatedAt": null
        },
        {
          "custodian": "TEST-GRP",
          "approverEmail": "TEST-GRP@JohnDeere.com",
          "approvedBy": null,
          "comment": null,
          "status": PENDING,
          "updatedAt": null
        }],
        "documentation": "",
        "schemas": [{ ...createSchema(), id: "a108b4a3-d00b-4e33-a143-a73932b7ff77--1"}],
        "attachments": {
          "currentAttachments": []
        }
      };
      const expectedDataset = { ...savedDataset, classifications: [], commentHistory, views: [] };
      s3.getContents.mockResolvedValue({ Contents: [] });
      await datasetService.saveDataset(datasetToSave, fullUser);

      expect(schemaDao.saveSchema).toBeCalledWith(datasetToSave.schemas[0]);
      expect(recordService.addAuditFields).toBeCalled();
      expect(datasetDao.saveDataset).toBeCalledWith(expectedForIndex);
      expect(emailService.sendEmails).toBeCalledWith(['DooScooby@JohnDeere.com', 'TEST-GRP@JohnDeere.com'], 'Dataset Pending', expectedDataset, 'approver', 'dataset');
    });

    it('should have no whitespace in posted dataset', async () => {
      const classifications = [
        {
          community: '10',
          subCommunity: '11',
          countriesRepresented: ['12', '13'],
          gicp: '14',
          id: '2345',
          personalInformation: false,
          development: false,
          additionalTags: ['tag ']
        }
      ];

      const expectedClassifications = [{
        community: '10',
        subCommunity: '11',
        countriesRepresented: ['12', '13'],
        gicp: '14',
        id: '2345',
        personalInformation: false,
        development: false,
        additionalTags: ['tag']
      }];
      const datasetToSave = { ...createNewDatasetToSave(), classifications };

      s3.getContents.mockResolvedValue({ Contents: [] });
      await datasetService.saveDataset(datasetToSave, fullUser);

      const expectedDataset = { ...createNewDatasetToSave(), classifications: expectedClassifications };
      expect(datasetApprovalService.addApprovals).toBeCalledWith(expectedDataset, expect.anything(), expect.anything(), expect.anything(), expect.anything());
    });

    it('should remove surrounding whitespace from name when saving', async () => {
      const datasetToSave = {
        ...createNewDatasetToSave(),
        name: '        someName           ',
        schemas: []
      };
      const expectedDataset = {
        name: 'someName'
      }

      await datasetService.saveDataset(datasetToSave, fullUser);

      expect(recordService.addAuditFields).toHaveBeenCalledWith(expect.objectContaining(expectedDataset), expect.anything());
    });

    it('when valid new dataset should validate using generated schema ids', async () => {
      const datasetToSave = {
        ...createNewDatasetToSave(),
        name: 'someName',
        schemas: [
          {
            name: 'base schema',
            version: '1.0.0'
          }
        ]
      };
      const schemaID = '2345'
      uuid.v4.mockReturnValue(schemaID);
      const expectedDataset = {
        ...datasetToSave,
        schemas: [
          {
            id: schemaID + '--1',
            name: 'base schema',
            version: '1.0.0'
          }
        ]
      }

      await datasetService.saveDataset(datasetToSave, fullUser);

      expect(datasetValidator.validateNew).toHaveBeenCalledWith(expectedDataset, expect.anything(), expect.anything())
    });

    it('when valid dataset with all possible fields along with subcommunity approval', async () => {
      const commentHistory = [{ comment: "No comments", updatedAt: isoDate, updatedBy: "Fred" }];

      const datasetToSave = { ...createNewDatasetToSave(), name: 'someName', commentHistory };
      let subCommunityApproval = {
        subCommunity: {
          approver: "DooScooby",
          id: "10",
          name: "Name"
        },
        status: PENDING,
        approvedBy: null,
        approverEmail,
        comment: null,
        updatedAt: null
      };
      const savedDatasetSubComm = {
        ...savedDataset,
        commentHistory,
        classifications: [],
        views: []
      }
      savedDatasetSubComm.approvals = [
        {
          ...createApproval(),
          community: {
            approver: "DooScooby",
            id: "10",
            name: "Name"
          }
        },
        subCommunityApproval,
        custodian
      ];
      const approvals = [createApproval(), subCommunityApproval, custodian]
      datasetApprovalService.addApprovals.mockResolvedValue({ approvals: approvals, schemas: [createSchema()] });
      const expectedForIndex = {
        commentHistory,
        "approvals": [{
          "approvedBy": null,
          "approverEmail": "DooScooby@JohnDeere.com",
          "comment": null,
          "community": { "approver": "DooScooby", "id": "10", "name": "Name" },
          "status": PENDING,
          "updatedAt": null
        },
        {
          "approvedBy": null,
          "approverEmail": "DooScooby@JohnDeere.com",
          "comment": null,
          "subCommunity": { "approver": "DooScooby", "id": "10", "name": "Name" },
          "status": PENDING,
          "updatedAt": null
        },
        {
          "custodian": "TEST-GRP",
          "approverEmail": "TEST-GRP@JohnDeere.com",
          "approvedBy": null,
          "comment": null,
          "status": PENDING,
          "updatedAt": null
        }],
        "classifications": [],
        "documentation": "",
        "environment": {},
        "linkedSchemas": [],
        "tables": [],
        "paths": [],
        "schemas": [{ ...createSchema(), id: "a108b4a3-d00b-4e33-a143-a73932b7ff77--1" }],
        "sourceDatasets": [],
        "discoveredSchemas": [],
        "discoveredTables": [],
        "views": [],
        "attachments": {
          "currentAttachments": []
        },
        "usability": expect.anything()
      };
      s3.getContents.mockResolvedValue({ Contents: [] });
      await datasetService.saveDataset(datasetToSave, fullUser);

      expect(schemaDao.saveSchema).toBeCalledWith(datasetToSave.schemas[0]);
      expect(recordService.addAuditFields).toBeCalled();
      expect(datasetDao.saveDataset).toBeCalledWith(expectedForIndex);
      expect(emailService.sendEmails).toBeCalled();
      expect(emailService.sendEmails).toBeCalledWith(['DooScooby@JohnDeere.com', 'TEST-GRP@JohnDeere.com'], 'Dataset Pending', savedDatasetSubComm, 'approver', 'dataset');
    });

    it('when valid dataset with application field passed to register a dataset', async () => {
      versionService.getLatestVersions.mockClear();
      versionService.getLatestVersions.mockReturnValue([]);
      s3.getContents.mockResolvedValue({ Contents: [] });
      const datasetToSave = {
        ...createNewDatasetToSave(),
        attachments: {
          deletedAttachments: [],
          newAttachments: [],
          currentAttachments: []
        }
      }
      datasetApprovalService.addApprovals.mockResolvedValue(datasetToSave);

      const commentHistory = [{ comment: "some test comments", updatedAt: isoDate, updatedBy: "Fred" }];

      const expectedES = {
        ...datasetToSave,
        commentHistory,
        environment: {},
        views: [],
        discoveredSchemas: [],
        discoveredTables: [],
        approvals: [
          {
            community: {
              approver: "DooScooby",
              id: "10",
              name: "Name"
            },
            status: PENDING,
            approvedBy: null,
            approverEmail,
            comment: null,
            updatedAt: null
          }
        ]
      };

      await datasetService.saveDataset(datasetToSave, fullUser);

      expect(schemaDao.saveSchema).toBeCalledWith(datasetToSave.schemas[0]);
      expect(recordService.addAuditFields).toBeCalled();
      expect(datasetDao.saveDataset).toBeCalledWith(expectedES);
    });

    it('when valid dataset with all possible fields and allowed to skip approvals', async () => {
      const commentHistory = [{ comment: "No comments", updatedAt: isoDate, updatedBy: "Fred" }];

      const expected = {
        ...savedDataset,
        commentHistory,
        ...createDefaultFullFields(),
        documentation: "",
        status: APPROVED,
        approvals: [],
      };
      const datasetToSave = createNewDatasetToSave();
      datasetApprovalService.addApprovals.mockReturnValue(expected)
      await datasetService.saveDataset(datasetToSave, fullUser);

      expect(schemaDao.saveSchema).toBeCalledWith(datasetToSave.schemas[0]);
      expect(recordService.addAuditFields).toBeCalled();
      expect(datasetDao.saveDataset).toHaveBeenCalledWith(expected);
      expect(notificationService.sendDatasetNotification).toBeCalled();
      expect(emailService.sendEmails).not.toBeCalled();
      expect(datasetValidator.validateNew).toBeCalledWith(datasetToSave, [createDatasetInDocDb()], [createDatasetInDocDb()]);
    });

    it('when valid dataset with all possible fields and no classification ids', async () => {
      const datasetToSave = { ...createNewDatasetToSave(), name: 'someName' };
      datasetToSave.classifications = datasetToSave.classifications.map(c => ({ ...c, id: undefined }));
      uuid.v4.mockReturnValue('2345');
      const commentHistory = [{ comment: "some test comments", updatedAt: isoDate, updatedBy: undefined }];

      const expected = {
        ...datasetToSave,
        commentHistory,
        ...createDefaultFullFields(),
        approvals: expect.anything(),
        classifications: datasetToSave.classifications.map(c => ({ ...c, id: '2345' }))
      }
      datasetApprovalService.addApprovals.mockImplementation(v => v);
      await datasetService.saveDataset(datasetToSave, user);

      expect(datasetDao.saveDataset).toHaveBeenCalledWith(expected);
    });

    it('fail with duplicate classification ids', () => {
      const datasetToSave = createNewDatasetToSave();
      datasetToSave.classifications = [
        datasetToSave.classifications[0],
        datasetToSave.classifications[0]
      ];
      datasetApprovalService.addApprovals.mockImplementation(v => v);
      expect(datasetService.saveDataset(datasetToSave, user)).rejects.toThrow(new Error('Each classification must have a unique ID'));
    });

    it('when valid dataset with only required fields', async () => {
      const sourceDataset = createNewDatasetToSave();
      delete sourceDataset.id;
      delete sourceDataset.schemas[0].id;
      delete sourceDataset.documentation;
      setupExistingDatasetsInES([{ ...createDatasetInDocDb(), phase: 5 }], [{ ...createDatasetInDocDb(), phase: 5 }])
      await datasetService.saveDataset(sourceDataset, fullUser);

      expect(schemaDao.saveSchema).toBeCalledWith({ ...sourceDataset.schemas[0], ...{ id: schemaId } });
      expect(datasetDao.saveDataset).toBeCalled();
    });

    it('when valid dataset with empty optional fields', async () => {
      referenceService.dereferenceIds.mockImplementation(val => val);
      const expected = {
        ...savedDataset,
        commentHistory: [{ comment: "No comments", updatedAt: isoDate, updatedBy: "Fred" }],
        ...createDefaultFullFields(),
        documentation: "",
        approvals: expect.anything()
      };
      const datasetToSave = { ...createNewDatasetToSave(), name: 'someName', documentation: '' };
      await datasetService.saveDataset(datasetToSave, fullUser);
      expect(datasetDao.saveDataset).toBeCalledWith(expected);
    });

    it('should fail when validation fails', () => {
      const invalidDataset = createNewDatasetToSave();
      const expectedError = new Error(invalidDataset.name);
      expectedError.details = [{ name: invalidDataset.name, message: 'bad stuff' }];
      datasetValidator.validateNew.mockRejectedValue(expectedError);
      return datasetService.saveDataset(invalidDataset, fullUser).then(() => fail('it should not reach here'))
        .catch(error => assertValidationError(error, 'bad stuff', invalidDataset.name));
    });

    describe('verify deleted schemas test', () => {
      it('should only allow deleted schemas that are not present in the schemas array', async () => {
        const datasetToSave = { ...createNewDatasetToSave(), name: 'someName', version: 2, deletedSchemas: [schemaId] };
        const latest = { ...datasetToSave, version: 1 };
        let simpleDataset = createSimpleDataset();
        delete simpleDataset.status;
        delete simpleDataset.updatedAt;
        delete simpleDataset.updatedBy;

        const expectedDataset = {
          ...createDefaultFullFields(),
          ...simpleDataset,
          commentHistory: [{ comment: "some test comments", updatedAt: isoDate, updatedBy: undefined }],
          approvals: [communityApproval],
          name: 'someName',
          requestComments: "some test comments",
          deletedSchemas: [],
          version: 2,
          status: PENDING,
          schemas: [
            {
              ...createSchema(),
              id: `${schemaBaseId}--2`
            }
          ]
        };
        datasetApprovalService.addApprovals.mockImplementation(a => a);
        versionService.getLatestAvailableVersion.mockReturnValue(latest);

        await datasetService.saveDataset(datasetToSave, user);

        expect(datasetDao.saveDataset).toHaveBeenCalledWith(expectedDataset);
      });

      it('should only allow deleted schemas that are present in the latest schemas array or linked schemas', async () => {
        const datasetToSave = { ...createNewDatasetToSave(), name: 'someName', schemas: [], deletedSchemas: [schemaId] };
        const latest = { ...datasetToSave, schemas: [] };
        const simpleDataset = createSimpleDataset();
        delete simpleDataset.status;
        delete simpleDataset.updatedAt;
        delete simpleDataset.updatedBy;

        const expectedDataset = {
          ...createDefaultFullFields(),
          ...simpleDataset,
          commentHistory: [{ comment: "some test comments", updatedAt: isoDate, updatedBy: undefined }],
          approvals: [communityApproval],
          name: 'someName',
          requestComments: "some test comments",
          deletedSchemas: [],
          status: PENDING,
          schemas: []
        };
        datasetApprovalService.addApprovals.mockImplementation(a => a);
        versionService.getLatestAvailableVersion.mockReturnValue(latest);

        await datasetService.saveDataset(datasetToSave, user);

        expect(datasetDao.saveDataset).toHaveBeenCalledWith(expectedDataset);
      });

      it('should handle latest without schemas array or linked schemas', async () => {
        const datasetToSave = { ...createNewDatasetToSave(), name: 'someName', schemas: [], deletedSchemas: [schemaId] };
        const latest = { ...datasetToSave, schemas: [] };
        delete latest.schemas;
        delete latest.linkedSchemas;

        let simpleDataset = createSimpleDataset();
        delete simpleDataset.status;
        delete simpleDataset.updatedAt;
        delete simpleDataset.updatedBy;

        const expectedDataset = {
          ...createDefaultFullFields(),
          ...simpleDataset,
          commentHistory: [{ comment: "some test comments", updatedAt: isoDate, updatedBy: undefined }],
          approvals: [communityApproval],
          name: 'someName',
          requestComments: "some test comments",
          deletedSchemas: [],
          status: PENDING,
          schemas: []
        };
        datasetApprovalService.addApprovals.mockImplementation(a => a);
        versionService.getLatestAvailableVersion.mockReturnValue(latest);

        await datasetService.saveDataset(datasetToSave, user);

        expect(datasetDao.saveDataset).toHaveBeenCalledWith(expectedDataset);
      });

      it('should not allow deleted schemas with no latest', async () => {
        const datasetToSave = { ...createNewDatasetToSave(), schemas: [], deletedSchemas: [schemaId] };
        delete datasetToSave.id;

        const simpleDataset = createSimpleDataset();
        delete simpleDataset.status;
        delete simpleDataset.updatedAt;
        delete simpleDataset.updatedBy;
        const expectedDataset = {
          ...createDefaultFullFields(),
          ...simpleDataset,
          commentHistory: [{ comment: "some test comments", updatedAt: isoDate, updatedBy: undefined }],
          approvals: [communityApproval],
          requestComments: "some test comments",
          deletedSchemas: [],
          status: PENDING,
          schemas: []
        };
        datasetApprovalService.addApprovals.mockImplementation(a => a);

        versionService.getLatestAvailableVersion.mockReturnValueOnce(undefined);
        await datasetService.saveDataset(datasetToSave, user);

        expect(datasetDao.saveDataset).toHaveBeenCalledWith(expectedDataset);
      });

      it('should allow deleted schemas that are not present in the schemas array when in latest', async () => {
        const datasetToSave = { ...createNewDatasetToSave(), name: 'someName', schemas: [], deletedSchemas: [schemaId] };
        const latest = { ...datasetToSave, schemas: [createSchema()], deletedSchemas: [] };

        let simpleDataset = createSimpleDataset();
        delete simpleDataset.status;
        delete simpleDataset.updatedAt;
        delete simpleDataset.updatedBy;

        const expectedDataset = {
          ...createDefaultFullFields(),
          ...simpleDataset,
          commentHistory: [{ comment: "some test comments", updatedAt: isoDate, updatedBy: undefined }],
          approvals: [communityApproval],
          name: 'someName',
          requestComments: "some test comments",
          deletedSchemas: [schemaId],
          status: PENDING,
          schemas: []
        };
        datasetApprovalService.addApprovals.mockImplementation(a => a);
        versionService.getLatestAvailableVersion.mockReturnValue(latest);

        await datasetService.saveDataset(datasetToSave, user);

        expect(datasetDao.saveDataset).toHaveBeenCalledWith(expectedDataset);
      });

      it('should allow deleted schemas that are not present in the schemas array when in latest linked', async () => {
        const datasetToSave = { ...createNewDatasetToSave(), name: 'someName', schemas: [], deletedSchemas: [schemaId] };

        const simpleDataset = createSimpleDataset();
        delete simpleDataset.status;
        delete simpleDataset.updatedAt;
        delete simpleDataset.updatedBy;

        const expectedDataset = {
          ...createDefaultFullFields(),
          ...simpleDataset,
          commentHistory: [{ comment: "some test comments", updatedAt: isoDate, updatedBy: undefined }],
          approvals: [communityApproval],
          name: 'someName',
          requestComments: "some test comments",
          deletedSchemas: [schemaId],
          status: PENDING,
          schemas: []
        };
        datasetApprovalService.addApprovals.mockImplementation(a => a);
        datasetDao.getLatestDatasets.mockResolvedValueOnce([datasetToSave]);

        await datasetService.saveDataset(datasetToSave, user);

        expect(datasetDao.saveDataset).toHaveBeenCalledWith(expectedDataset);
      });

      it('should not allow deleted schemas that are in linked schemas', async () => {
        const datasetToSave = { ...createNewDatasetToSave(), name: 'someName', schemas: [], linkedSchemas: [createSchema()], deletedSchemas: [schemaId] };
        const latest = { ...datasetToSave, linkedSchemas: [createSchema()], deletedSchemas: [] };

        let simpleDataset = createSimpleDataset();
        delete simpleDataset.status;
        delete simpleDataset.updatedAt;
        delete simpleDataset.updatedBy;

        const expectedDataset = {
          ...createDefaultFullFields(),
          ...simpleDataset,
          commentHistory: [{ comment: "some test comments", updatedAt: isoDate, updatedBy: undefined }],
          approvals: [communityApproval],
          name: 'someName',
          requestComments: "some test comments",
          linkedSchemas: [createSchema()],
          deletedSchemas: [],
          status: PENDING,
          schemas: []
        };
        datasetApprovalService.addApprovals.mockImplementation(a => a);
        versionService.getLatestAvailableVersion.mockReturnValue(latest);
        datasetDao.getLatestDatasets.mockResolvedValueOnce([datasetToSave]);

        await datasetService.saveDataset(datasetToSave, user);

        expect(datasetDao.saveDataset).toHaveBeenCalledWith(expectedDataset);
      });

      it('should remove multiple deleted schemas and duplicates that are present in the schemas array', async () => {
        const schemas = [
          createSchema(),
          {
            ...createSchema(),
            id: '1--2'
          },
          {
            ...createSchema(),
            id: '2--1'
          }
        ];
        const datasetToSave = {
          ...createNewDatasetToSave(),
          name: 'someName',
          schemas,
          deletedSchemas: [schemaId, '1--2', '2--1', '3--2', '3--2']
        };
        const latest = {
          ...datasetToSave,
          schemas: [],
          linkedSchemas: [createSchema(), { ...createSchema(), id: '3--1' }],
          deletedSchemas: []
        };

        let ds = createSimpleDataset();
        delete ds.status;
        delete ds.updatedAt;
        delete ds.updatedBy;

        const expectedDataset = {
          ...createDefaultFullFields(),
          ...ds,
          commentHistory: [{ comment: "some test comments", updatedAt: isoDate, updatedBy: undefined }],
          approvals: [communityApproval],
          name: 'someName',
          requestComments: "some test comments",
          deletedSchemas: ['3--2'],
          status: PENDING,
          schemas: [
            createSchema(),
            {
              ...createSchema(),
              id: '1--1'
            },
            {
              ...createSchema(),
              id: '2--1'
            }
          ]
        };
        datasetApprovalService.addApprovals.mockImplementation(a => a);
        versionService.getLatestAvailableVersion.mockReturnValue(latest);

        await datasetService.saveDataset(datasetToSave, user);

        expect(datasetDao.saveDataset).toHaveBeenCalledWith(expectedDataset);
      });
    });
  });
  describe('updating dataset tests', () => {

    it('should update reference data', async () => {
      const updateRequest = {id:'anyData',name:'anyReference',updateType:'subCommunity'}
      await datasetService.updateReferenceData(updateRequest);
     expect(datasetDao.updateReferenceData).toHaveBeenCalledWith(updateRequest);
    })

    it('should use dereferenced existing datasets when updating a dataset', async () => {
      const existing = createDatasetInDocDb(AVAILABLE);
      const derefExisting = { ...createSimpleDataset(), status: AVAILABLE };
      datasetDao.getDatasetVersions.mockResolvedValueOnce([existing]);

      const dataset = createNewDatasetToSave();

      await datasetService.updateDataset(datasetId, 1, dataset, user);
      expect(recordService.mergeAuditFields).toHaveBeenCalledWith(derefExisting, dataset);
    });

    it('should remove surrounding whitespace from name when updating', async () => {
      const existing = createDatasetInDocDb(AVAILABLE);
      datasetDao.getDatasetVersions.mockResolvedValueOnce([existing]);
      const datasetToSave = {
        ...createNewDatasetToSave(),
        name: '        someName           ',
        schemas: []
      };
      delete datasetToSave.attachments;
      const expectedDataset = { name: 'someName' };

      await datasetService.updateDataset(datasetToSave.id, 1, datasetToSave, fullUser);

      expect(recordService.addAuditFields).toHaveBeenCalledWith(expect.objectContaining(expectedDataset), expect.anything());
    });

    it('should update an existing dataset and create a new one', async () => {
      const existingDataset = { ...createDatasetInDocDb(), status: AVAILABLE };
      setupExistingDatasetsInES([existingDataset], [createDatasetInDocDb()]);

      const updatedDataset = { ...createNewDatasetToSave() };
      updatedDataset.classifications[0].gicp = 'updatedGicp';

      const newSchemaId = `${schemaBaseId}--2`;
      versionService.getLatestAvailableVersion.mockReturnValue(existingDataset);
      datasetDao.getLatestDatasets.mockResolvedValueOnce([existingDataset]);
      s3.getContents.mockResolvedValue({ Contents: [] });

      await datasetService.updateDataset(datasetId, 1, updatedDataset, fullUser);

      const expectedDataset = {
        ...createDefaultFullFields(),
        ...createNewDatasetToSave(),
        commentHistory: [{ comment: "some test comments", updatedAt: isoDate, updatedBy: "Fred" }],
        approvals: [{ ...communityApproval, commentHistory: [] }],
        version: 2,
        schemas: [{ ...createSchema(), id: newSchemaId }],
        status: PENDING,
        deletedSchemas: []
      };
      expectedDataset.classifications[0].gicp = 'updatedGicp';

      expect(schemaDao.saveSchema).toBeCalledWith({ ...updatedDataset.schemas[0], ...{ id: newSchemaId } });
      expect(datasetDao.saveDataset).toBeCalledWith(expectedDataset);
    });

    it('should update an existing dataset with legacy schema and create a new one', async () => {
      const existingDataset = { ...createDatasetInDocDb(), status: AVAILABLE, schemas: [{ ...createSchema(), id: schemaBaseId }] };
      setupExistingDatasetsInES([existingDataset], [{ ...createDatasetInDocDb(), status: AVAILABLE, schemas: [{ ...createSchema(), id: schemaBaseId }] }]);

      const updatedDataset = createNewDatasetToSave();
      updatedDataset.classifications[0].gicp = 'updatedGicp';

      const newSchemaId = `${schemaBaseId}--2`;
      versionService.getLatestAvailableVersion.mockReturnValue(existingDataset);

      s3.getContents.mockResolvedValue(attachmentsContent);

      await datasetService.updateDataset(datasetId, 1, updatedDataset, fullUser);

      const expectedDataset = {
        ...createDefaultFullFields(),
        ...createNewDatasetToSave(),
        commentHistory: [{ comment: "some test comments", updatedAt: isoDate, updatedBy: "Fred" }],
        approvals: [{ ...communityApproval, commentHistory: [] }],
        version: 2,
        schemas: [{ ...createSchema(), id: newSchemaId }],
        status: PENDING,
        deletedSchemas: []
      };
      expectedDataset.classifications[0].gicp = 'updatedGicp';

      expect(schemaDao.saveSchema).toBeCalledWith({ ...updatedDataset.schemas[0], ...{ id: newSchemaId } });
      expect(datasetDao.saveDataset).toBeCalledWith(expectedDataset);
    });

    it('should update table schema IDs for new dataset version', async () => {
      const dynamoDataset1 = { ...createDatasetInDocDb(), schemas: [{ ...createSchema(), id: 'linked-schema-not-changed--3' }] };
      const esDataset1 = { ...createDatasetInDocDb(), status: AVAILABLE, schemas: [{ ...createSchema(), id: 'linked-schema-not-changed--3' }] };
      setupExistingDatasetsInES([createDatasetInDocDb(), dynamoDataset1], [createDatasetInDocDb(), esDataset1]);

      const existingDataset = createDatasetInDocDb();

      const existingTable = { schemaId, schemaName, schemaVersion, tableName: 'stewie' };
      const existingLinkedTable = { schemaId: `linked-schema-not-changed--3`, schemaName, schemaVersion, tableName: 'boogie' };
      existingDataset.tables = [existingTable, existingLinkedTable];

      existingDataset.schemas = [createSchema()];
      existingDataset.linkedSchemas = [{ id: existingLinkedTable.schemaId }];
      setupExistingDatasetVersions([existingDataset]);

      const updatedDataset = createNewDatasetToSave();
      const newTable = {
        schemaId: null,
        schemaName: 'new-schema',
        schemaVersion,
        tableName: 'new-table'
      };
      updatedDataset.schemas = [createSchema(), { name: newTable.schemaName, version: schemaVersion, testing: true }];
      updatedDataset.linkedSchemas = [{ id: existingLinkedTable.schemaId }];
      updatedDataset.tables = [existingTable, existingLinkedTable, newTable];
      uuid.v4.mockReturnValue(newTable.schemaName);
      s3.getContents.mockResolvedValue(attachmentsContent);

      await datasetService.updateDataset(existingDataset.id, 1, updatedDataset, fullUser);

      const expectedDataset = {
        ...createDefaultFullFields(),
        ...createNewDatasetToSave(),
        commentHistory: [{ comment: "some test comments", updatedAt: isoDate, updatedBy: "Fred" }],
        approvals: [{ ...communityApproval, commentHistory: [] }],
      };
      expectedDataset.schemas = [{ ...createSchema(), id: `${schemaBaseId}--2` }, { ...createSchema(), id: 'new-schema--2', name: 'new-schema' }];
      expectedDataset.linkedSchemas = [{ ...createSchema(), id: 'linked-schema-not-changed--3' }];
      expectedDataset.tables = [{
        ...existingTable,
        schemaId: `${schemaBaseId}--2`
      }, existingLinkedTable, {
        ...newTable,
        schemaId: 'new-schema--2'
      }];
      expectedDataset.version = 2;
      expectedDataset.status = PENDING;
      expectedDataset.deletedSchemas = [];

      expect(datasetDao.saveDataset).toBeCalledWith(expectedDataset);
    });

    it('should update table schema IDs for new dataset version when no schemaId is provided', async () => {
      const dynamoDataset1 = { ...createDatasetInDocDb(), schemas: [{ ...createSchema(), id: 'linked-schema-not-changed--3' }] };
      const esDataset1 = { ...createDatasetInDocDb(), schemas: [{ ...createSchema(), id: 'linked-schema-not-changed--3' }] };
      setupExistingDatasetsInES([createDatasetInDocDb(), dynamoDataset1], [createDatasetInDocDb(), esDataset1]);

      const existingDataset = createDatasetInDocDb();

      const existingTable = { schemaId, schemaName, schemaVersion, tableName: 'stewie' };
      const existingLinkedTable = { schemaId: `linked-schema-not-changed--3`, schemaName, schemaVersion, tableName: 'boogie' };
      existingDataset.tables = [existingTable, existingLinkedTable];

      existingDataset.schemas = [createSchema()];
      existingDataset.linkedSchemas = [{ id: existingLinkedTable.schemaId }];

      const updatedDataset = createNewDatasetToSave();
      const newTable = {
        schemaName: 'new-schema',
        schemaVersion,
        tableName: 'new-table'
      };
      updatedDataset.schemas = [createSchema(), { name: newTable.schemaName, version: schemaVersion, testing: true }];
      updatedDataset.linkedSchemas = [{ id: existingLinkedTable.schemaId }];
      updatedDataset.tables = [existingTable, existingLinkedTable, newTable];
      uuid.v4.mockReturnValue(newTable.schemaName);

      s3.getContents.mockResolvedValue(attachmentsContent);

      await datasetService.updateDataset(existingDataset.id, 1, updatedDataset, fullUser);

      const expectedDataset = {
        ...createDefaultFullFields(),
        ...createNewDatasetToSave(),
        commentHistory: [{ comment: "some test comments", updatedAt: isoDate, updatedBy: "Fred" }],
        approvals: [{ ...communityApproval, commentHistory: [] }]
      };
      expectedDataset.schemas = [{ ...createSchema(), id: `${schemaBaseId}--2` }, { ...createSchema(), id: 'new-schema--2', name: 'new-schema' }];
      expectedDataset.linkedSchemas = [{ ...createSchema(), id: 'linked-schema-not-changed--3' }];
      expectedDataset.tables = [{
        ...existingTable,
        schemaId: `${schemaBaseId}--2`
      }, existingLinkedTable, {
        ...newTable,
        schemaId: 'new-schema--2'
      }];
      expectedDataset.version = 2;
      expectedDataset.status = PENDING;
      expectedDataset.deletedSchemas = [];

      expect(datasetDao.saveDataset).toBeCalledWith(expectedDataset);
    });

    it('should remove table when schema is removed', async () => {
      const existingTable = { schemaId, tableName: 'scooby' };
      const existingDataset = createDatasetInDocDb();
      existingDataset.tables = [existingTable];
      setupExistingDatasetsInES([existingDataset], [{ ...createDatasetInDocDb(), tables: [existingTable] }]);


      const updatedDataset = createNewDatasetToSave();
      updatedDataset.schemas = [];
      updatedDataset.tables = [existingTable];
      s3.getContents.mockResolvedValue(attachmentsContent);

      await datasetService.updateDataset(datasetId, 1, updatedDataset, fullUser);

      const expectedDataset = {
        ...createDefaultFullFields(),
        ...createNewDatasetToSave(),
        commentHistory: [{ comment: "some test comments", updatedAt: isoDate, updatedBy: "Fred" }],
        approvals: [{ ...communityApproval, commentHistory: [] }],
        version: 2,
        schemas: [],
        tables: [],
        status: PENDING,
        deletedSchemas: []
      };
      expect(datasetDao.saveDataset).toBeCalledWith(expectedDataset);
    });

    it('should update existing dataset version', async () => {
      setupExistingDatasetsInES([{ ...createDatasetInDocDb(), status: AVAILABLE }], [createDatasetInDocDb()]);

      const updatedDataset = { ...createNewDatasetToSave(), description: 'Updated description' };
      updatedDataset.description = 'Updated description';
      versionService.calculateVersion.mockReturnValue(1);
      s3.getContents.mockResolvedValue(attachmentsContent);

      await datasetService.updateDataset(datasetId, 1, updatedDataset, fullUser);

      const expectedDataset = {
        ...createDefaultFullFields(),
        ...createNewDatasetToSave(),
        commentHistory: [{ comment: "some test comments", updatedAt: isoDate, updatedBy: "Fred" }],
        approvals: [communityApproval],
        description: 'Updated description',
        schemas: [createSchema()],
        status: PENDING,
        deletedSchemas: []
      };

      expect(schemaDao.saveSchema).toBeCalledWith({ ...updatedDataset.schemas[0] });
      return expect(datasetDao.saveDataset).toBeCalledWith(expectedDataset);
    });

    it('allow update without approval when no schemas', () => {
      const existingDataset = { ...createDatasetInDocDb(), status: AVAILABLE, schemas: undefined };
      setupExistingDatasetsInES([existingDataset], [{ ...createDatasetInDocDb(), status: AVAILABLE, schemas: undefined }]);
      const updatedDataset = { ...createNewDatasetToSave(), schemas: [], documentation: 'Updated documentation' };
      schemaDao.getSchemas.mockResolvedValue([]);
      s3.getContents.mockResolvedValue(attachmentsContent);
      return datasetService.updateDataset(datasetId, 1, updatedDataset, fullUser);
    });

    it('should approve dataset', async () => {
      const dataset = createDatasetInDocDb();
      const expectedForIndex = {
        ...createDatasetInDocDb(),
        discoveredSchemas: [],
        discoveredTables: [],
        environment: {},
        views: [],
        status: APPROVED,
      };
      datasetDao.getDataset.mockResolvedValueOnce(dataset);
      referenceService.dereferenceId.mockReturnValueOnce({ approver: "DooScooby", id: "10", name: "Name" });
      dataset.status = APPROVED;
      when(datasetApprovalService.approve).calledWith(dataset, fullUser).mockResolvedValue(dataset);
      s3.getContents.mockResolvedValue({ Contents: [] });

      await datasetService.approveDataset(datasetId, 1, fullUser);
      expect(datasetDao.saveDataset).toBeCalledWith(expectedForIndex);
      expect(notificationService.sendDatasetNotification).toBeCalledWith(dataset.id, dataset.name, dataset.version, dataset.updatedAt, true);
      expect(emailService.sendEmails).toBeCalledWith(['Fred@deere.com'], 'Dataset Approved', dataset, 'requester', 'dataset');
    });

    it('should send a mail with subject dataset deleted', async () => {
      const dataset = createDatasetInDocDb();
      datasetDao.getDataset.mockResolvedValueOnce(dataset);
      dataset.status = DELETED;
      when(datasetApprovalService.approve).calledWith(dataset, fullUser).mockResolvedValue(dataset);

      await datasetService.approveDataset(datasetId, 1, fullUser);
      expect(emailService.sendEmails).toBeCalledWith(['Fred@deere.com'], 'Dataset Deleted', dataset, 'requester', 'dataset');
    });

    it('should lock dataset', async () => {
      datasetDao.getDataset.mockResolvedValueOnce({ status: AVAILABLE, lockedBy: null, version: 1 });
      datasetDao.getLatestDataset.mockResolvedValueOnce({ status: AVAILABLE, lockedBy: null, version: 1 });

      await datasetService.lockDataset('Foo', 1, userInfo);
      expect(datasetDao.lockDataset).toBeCalledWith('Foo', 1, userInfo);
    });

    it('should allow user who locked ds to continue editing', () => {
      datasetDao.getDataset.mockResolvedValueOnce({ status: AVAILABLE, lockedBy: 'user', version: 1 });
      datasetDao.getLatestDataset.mockResolvedValueOnce({ status: AVAILABLE, lockedBy: null, version: 1 });

      expect(datasetService.lockDataset('Foo', 1, { username: 'user', email: 'user@jd.com', lockDate: '2021-05-31' })).resolves.toEqual();
      expect(datasetValidator.validateLockDataset).toHaveBeenCalledTimes(0);
    });

    it('should respond successfully for a dataset that is locked by same user', () => {
      const lockedBy = { lockedBy: 'user123', version: 1, status: AVAILABLE }
      datasetDao.getDataset.mockResolvedValueOnce({ lockedBy, version: 1 });
      datasetDao.getLatestDataset.mockResolvedValueOnce({ lockedBy, version: 1, status: AVAILABLE });
      const result = datasetService.lockDataset('Foo', 1, userInfo);
      expect(result).resolves.toEqual();
    });

    it('should not lock dataset that is already locked', () => {
      const error = new Error('Cannot lock a dataset that is already locked. Locked by some user')
      datasetValidator.validateLockDataset.mockImplementation(() => { throw error });

      datasetDao.getLatestDataset.mockResolvedValueOnce({
        lockedBy: 'some user',
        status: AVAILABLE,
        version: 1
      });

      const result = datasetService.lockDataset('Foo', 1, userInfo);
      return expect(result).rejects.toThrow(new Error('Cannot lock a dataset that is already locked. Locked by some user'));
    });

    it('should throw an error when locking a non-available dataset', () => {
      const error = new Error('Only available datasets are lockable.')
      datasetValidator.validateLockDataset.mockImplementation(() => { throw error });

      datasetDao.getDataset.mockResolvedValueOnce({ status: PENDING, lockedBy: null, version: 1 });
      datasetDao.getLatestDataset.mockResolvedValueOnce({ status: PENDING, lockedBy: null, version: 1 });

      const result = datasetService.lockDataset('Foo', 1, userInfo);
      return expect(result).rejects.toThrow(new Error('Only available datasets are lockable.'));
    });

    it('should throw an error when locking a non-latest version of dataset', () => {
      const error = new Error('You can only lock the most recent non-deleted dataset version. The latest version is 2')
      datasetValidator.validateLockDataset.mockImplementation(() => { throw error });

      datasetDao.getDataset.mockResolvedValueOnce({ status: AVAILABLE, lockedBy: null });
      datasetDao.getLatestDataset.mockResolvedValueOnce({ status: AVAILABLE, lockedBy: null, version: 2 });

      const result = datasetService.lockDataset('Foo', 1, userInfo);
      return expect(result).rejects.toThrow(new Error('You can only lock the most recent non-deleted dataset version. The latest version is 2'));
    });

    it('should throw error when unlocking dataset locked by other user and not a dataset custodian', () => {
      datasetDao.getDataset.mockResolvedValueOnce({ lockedBy: 'different user', custodian: 'custodian-A' });
      const result = datasetService.unlockDataset('Foo', 1, 'user123', []);
      return expect(result).rejects.toThrow(new Error('Cannot unlock another user\'s locked dataset. Locked by different user.'));
    });

    it('should unlock dataset locked by same user', async () => {
      datasetDao.getDataset.mockResolvedValueOnce({ lockedBy: 'user1234' });

      await datasetService.unlockDataset('Foo', 1, 'user1234', ['custodian-B']);
      expect(datasetDao.unlockDataset).toBeCalledWith('Foo', 1);
    });

    it('should unlock dataset locked by dataset custodian', async () => {
      datasetDao.getDataset.mockResolvedValueOnce({ lockedBy: 'user1234', custodian: 'custodian-A' });

      await datasetService.unlockDataset('Foo', 1, 'user1234', ['custodian-A', 'custodian-B']);
      expect(datasetDao.unlockDataset).toBeCalledWith('Foo', 1);
    });

    it('should reject dataset', async () => {
      const reason = 'no way';
      const dataset = createDatasetInDocDb();
      const expectedForIndex = createExpectedDatasetForSave(REJECTED);
      datasetDao.getDataset.mockResolvedValueOnce(dataset);
      when(datasetApprovalService.reject).calledWith(dataset, reason, fullUser).mockResolvedValue({ ...dataset, status: REJECTED });
      s3.getContents.mockResolvedValue(attachmentsContent);

      await datasetService.rejectDataset(datasetId, 1, reason, fullUser);

      expect(datasetDao.saveDataset).toBeCalledWith(expectedForIndex);
      dataset.status = REJECTED;
      expect(emailService.sendEmails).toBeCalledWith(['Fred@deere.com'], 'Dataset Rejected', dataset, 'requester', 'dataset');
    });

    it('should delete a pending dataset', async () => {
      s3.getContents.mockResolvedValue({ Contents: [] });
      datasetDao.getDataset.mockResolvedValueOnce(createDatasetInDocDb(PENDING));
      await datasetService.deletePendingDataset(datasetId, 1, {username: user, groups: ['group1']});
      const expectedForIndex = {
        ...createDatasetInDocDb(DELETED),
        views: [],
        discoveredSchemas: [],
        discoveredTables: [],
        environment: {}
      };
      expectedForIndex.schemas = createDatasetInDocDb().schemas;

      expect(datasetDao.saveDataset).toBeCalledWith(expectedForIndex);
    });

    it('should delete a pending rejected dataset as custodian', async () => {
      s3.getContents.mockResolvedValue({ Contents: [] });
      datasetDao.getDataset.mockResolvedValueOnce(createDatasetInDocDb(REJECTED));
      await datasetService.deletePendingDataset(datasetId, 1, {username: 'Shaggy', groups: ['EDG-NETFLIX-MANAGERS']});
      const expectedForIndex = {
        ...createDatasetInDocDb(DELETED),
        updatedBy: "Shaggy",
        usability: 5,
        views: [],
        discoveredSchemas: [],
        discoveredTables: [],
        environment: {}
      };
      expectedForIndex.schemas = createDatasetInDocDb().schemas;

      expect(datasetDao.saveDataset).toBeCalledWith(expectedForIndex);
    });

    it('should not be allowed to delete an available dataset', () => {
      const existingDataset = { ...createDatasetInDocDb(), status: AVAILABLE };
      datasetDao.getDataset.mockResolvedValue(existingDataset);

      const deleteResult = datasetService.deletePendingDataset(datasetId, 1, {username: user, groups:[]});

      return expect(deleteResult).rejects.toThrow(new Error('Cannot delete a dataset with a status of AVAILABLE'));
    });

    it('should not be allowed to delete an approved dataset', () => {
      const existingDataset = createDatasetInDocDb();
      existingDataset.status = APPROVED;
      datasetDao.getDataset.mockResolvedValue(existingDataset);

      const deleteResult = datasetService.deletePendingDataset(datasetId, 1, {username: user, groups:['group1']});

      return expect(deleteResult).rejects.toThrow(new Error('Cannot delete a dataset with a status of APPROVED'));
    });

    it('should not be able to delete dataset if not creator', () => {
      const deleteResult = datasetService.deletePendingDataset(datasetId, 1, {username: 'Shaggy', groups:[]});

      return expect(deleteResult).rejects.toThrow(new Error('Shaggy is not authorized to delete dataset'));
    });
  });

  describe('managing publishing paths', () => {
    const sampleContents = { Contents: [] };

    beforeEach(() => {
      s3.getContents.mockResolvedValue(sampleContents);
      referenceService.dereferenceIds.mockImplementation(val => val);
    });

    it('should create dataset version for a new published path', async () => {
      const pathRequest = { path: '/', comments: 'new path' };
      const paths = ['/'];
      const comments = 'new path'
      const existingDataset = { ...createDatasetInDocDb(), status: AVAILABLE, paths: [] };
      const pendingDataset = { ...existingDataset, version: 2, status: PENDING, requestComments: comments };
      versionService.calculateVersion.mockReturnValueOnce(2);
      datasetApprovalService.addApprovals.mockImplementationOnce((ds) => ({ ...ds, requestComments: comments, status: PENDING }));
      referenceService.dereferenceId.mockReturnValueOnce({ name: 'raw' });

      const actualResponse = await datasetService.updatePublishedPaths(datasetId, 1, pathRequest, fullUser);
      const expectedDataset = {
        ...createDefaultFullFields(),
        ...pendingDataset,
        approvals: [communityApproval],
        commentHistory: [{ comment: 'new path', updatedAt: isoDate, updatedBy: 'Fred' }],
        paths,
        usability: 5
      };
      expectedDataset.approvals.forEach(approval => approval.publishedPath = '/');
      expect(datasetDao.saveDataset).toBeCalledWith(expectedDataset);
      expect(actualResponse).toEqual({ id: existingDataset.id, version: 2 });
    });

    it('should not blow up for model dataset version for a new published path', async () => {
      const pathRequest = { path: '/', comments: 'new path' };
      const comments = 'new path'
      const existingDataset = { ...createDatasetInDocDb(), phase: { name: 'Model', id: '7' }, status: AVAILABLE, paths: [] };
      versionService.calculateVersion.mockReturnValueOnce(2);
      datasetApprovalService.addApprovals.mockImplementationOnce((ds) => ({ ...ds, requestComments: comments }));
      referenceService.dereferenceId.mockReturnValueOnce({ name: 'enhance' });

      mockDatasetDao(existingDataset);

      const actualResponse = await datasetService.updatePublishedPaths(datasetId, 1, pathRequest, fullUser);

      expect(actualResponse).toBeDefined();
    });

    it('should create dataset version for a new unpublished path', async () => {
      const pathRequest = { path: '/', comments: 'remove path' };
      const existingDataset = { ...createDatasetInDocDb(), status: AVAILABLE, phase: { name: 'raw' }, paths: ['/'] };
      datasetDao.getDataset.mockResolvedValueOnce(existingDataset);
      datasetApprovalService.addApprovals.mockImplementationOnce((ds) => ({ ...ds, requestComments: pathRequest.comments, status: PENDING }));
      referenceService.dereferenceId.mockReturnValueOnce({ name: 'raw' });

      await datasetService.updatePublishedPaths(datasetId, 1, pathRequest, fullUser);

      const expectedDataset = {
        ...createDefaultFullFields(),
        ...existingDataset,
        approvals: [communityApproval],
        version: 2,
        status: PENDING,
        requestComments: pathRequest.comments,
        commentHistory: [{ comment: 'remove path', updatedAt: isoDate, updatedBy: 'Fred' }],
        paths: []
      };
      expectedDataset.approvals.forEach(approval => {
        approval.unpublishedPath = '/'
        delete approval.publishedPath;
      });
      expect(datasetDao.saveDataset).toBeCalledWith(expectedDataset);
    });

    it('should throw error when trying to publish path for enhance type', () => {
      const pathRequest = { path: '/', comments: 'add path' };
      datasetDao.getDataset.mockResolvedValueOnce({ phase: { name: 'enhance' }, approvals: [] });
      const publishResponse = datasetService.updatePublishedPaths(datasetId, 1, pathRequest, fullUser);
      return expect(publishResponse).rejects.toThrow(new Error('Cannot publish paths for an enhance dataset.'));
    });
  });

  describe('delete dataset tests', () => {
    it('should save a pending deleted dataset with pending status and audit keys', async () => {
      datasetDao.getDatasetVersions.mockResolvedValueOnce({ id: datasetId });
      versionService.getLatestNonDeletedVersion.mockImplementation(_val => createDatasetInDocDb());
      datasetApprovalService.addApprovalsForDelete.mockResolvedValue({ ...createDatasetInDocDb(), status: PENDING });
      s3.getContents.mockResolvedValue({ Contents: [] });

      await datasetService.deleteDataset(datasetId, 'test', nonEdlUser);

      const expectedDataset = { ...createDatasetInDocDb(), status: PENDING, discoveredSchemas: [], environment: {}, usability: 5 };
      expectedDataset.approvals[0].community = { approver: 'DooScooby', id: '10', 'name': 'Name' };

      expect(datasetDao.saveDataset).toBeCalledWith(expectedDataset);
    });

    it('should remove lock on a pending deleted dataset if lockedby same user', async () => {
      datasetDao.getDatasetVersions.mockResolvedValueOnce({ id: datasetId })
      versionService.getLatestNonDeletedVersion.mockImplementation(_val => createDatasetInDocDb());
      datasetApprovalService.addApprovalsForDelete.mockResolvedValue({ ...createDatasetInDocDb(), status: PENDING });
      s3.getContents.mockResolvedValue({ Contents: [] });
      await datasetService.deleteDataset(datasetId, 'test', nonEdlUser);

      const expectedDataset = { ...createDatasetInDocDb(), status: PENDING, discoveredSchemas: [], environment: {}, usability: 5 };
      expectedDataset.approvals[0].community = { approver: 'DooScooby', id: '10', 'name': 'Name' };

      expect(datasetDao.saveDataset).toBeCalledWith(expectedDataset);
    });

    it('should find all non-deleted dataset versions and update status to delete in ES and Dynamo when pending delete is approved by edl', async () => {
      const simpleDatasets = [
        createDatasetForCatalog(datasetId, 'Netflix', [], AVAILABLE, 1),
        createDatasetForCatalog(datasetId, 'Netflix', [], AVAILABLE, 2),
        createDatasetForCatalog(datasetId, 'Netflix', [], DELETED, 3),
        createDatasetForCatalog(datasetId, 'Netflix', [], DELETED, 4),
      ];

      datasetDao.getDatasetVersions.mockReturnValueOnce(simpleDatasets);
      datasetDao.getDataset.mockReturnValueOnce(createDatasetForCatalog(datasetId, 'Netflix', [], AVAILABLE, 4));
      datasetApprovalService.approve.mockReturnValueOnce(createDatasetForCatalog(datasetId, 'Netflix', [], DELETED, 4));
      s3.getContents.mockResolvedValueOnce({ Contents: [] });
      await datasetService.approveDataset(datasetId, 3, user, 'some details');

      expect(datasetDao.saveDataset).toBeCalledWith(createDatasetForIndexing(DELETED, 4));
      expect(datasetDao.saveDataset).toBeCalledWith(createDatasetForIndexing(DELETED, 2));
      expect(datasetDao.saveDataset).toBeCalledWith(createDatasetForIndexing(DELETED, 1));
      expect(datasetDao.saveDataset).toHaveBeenCalledTimes(3);
    });

    it('should send delete dataset notification when pending delete record is approved by communities', async () => {
      const dataset = {
        ...createDatasetInDocDb(APPROVED),
        approvals: [
          { system: 'Catalog', status: PENDING_DELETE },
        ]
      };

      const expectedESDataset = {
        ...createExpectedDatasetForRead(APPROVED),
        schemas: [createSchema()],
        approvals: [
          { system: 'Catalog', status: PENDING_DELETE }
        ],
        environment: {}
      };
      notificationService.sendDatasetNotification.mockResolvedValue('success');
      datasetDao.getDataset.mockResolvedValue(dataset);
      datasetApprovalService.approve.mockResolvedValue(dataset);
      s3.getContents.mockResolvedValue({ Contents: [] });

      await datasetService.approveDataset(datasetId, 1, user, 'some details');

      expect(datasetDao.saveDataset).toBeCalledWith(expectedESDataset);
      expect(notificationService.sendDatasetNotification)
        .toHaveBeenCalledWith(dataset.id, dataset.name, dataset.version, dataset.updatedAt, true, 'delete dataset');
    });

    it('should send delete dataset notification when user admin/EDL', async () => {
      const dataset = { ...createDatasetInDocDb(), approvals: [] };
      const commentHistory = [{ comment: 'test', updatedAt: isoDate, updatedBy: 'Fred' }];
      const expectedESDataset = {
        ...createExpectedDatasetForRead(APPROVED),
        commentHistory,
        requestComments: 'test',
        schemas: [createSchema()],
        approvals: [{ system: 'Catalog', status: PENDING_DELETE, updatedAt: isoDate }],
        environment: {}
      };

      datasetDao.getDatasetVersions.mockResolvedValueOnce({ id: datasetId })
      notificationService.sendDatasetNotification.mockResolvedValue('success');
      datasetDao.getDataset.mockResolvedValue(dataset);
      versionService.getLatestNonDeletedVersion.mockImplementation(_val => createDatasetInDocDb());
      versionService.calculateVersion.mockReturnValue(1);
      s3.getContents.mockResolvedValue({ Contents: [] });

      const result = await datasetService.deleteDataset(datasetId, 'test', edlUser);
      expect(datasetDao.saveDataset).toBeCalledWith(expectedESDataset);
      expect(notificationService.sendDatasetNotification)
        .toHaveBeenCalledWith(dataset.id, dataset.name, dataset.version, dataset.updatedAt, 'delete dataset');
      expect(result).toEqual({ id: '1234', version: 1 });
    });

    it('should delete dataset when user is admin/EDL', async () => {
      const dataset = {
        ...createDatasetInDocDb(),
        discoveredSchemas: []
      };
      const expectedDocDbDataset = {
        ...createDatasetInDocDb(DELETED),
        approvals: [
          { system: 'Catalog', status: APPROVED }
        ]
      };
      const expectedESDataset = {
        ...createExpectedDatasetForRead(DELETED),
        schemas: [createSchema()],
        approvals: [
          { system: 'Catalog', status: APPROVED }
        ],
        environment: {}
      };
      notificationService.sendDatasetNotification.mockResolvedValue('success');
      datasetDao.getDataset.mockResolvedValue(dataset);
      datasetApprovalService.approve.mockResolvedValue(expectedDocDbDataset);
      s3.getContents.mockResolvedValue({ Contents: [] });

      await datasetService.approveDataset(datasetId, 1, edlUser, 'some details');

      expect(datasetDao.saveDataset).toBeCalledWith(expectedESDataset);
    });

    it('should throw an error message when dataset is in not available status and user is admin/EDL', () => {
      const previousDataset = createDatasetInDocDb();
      const latestDataset = createDatasetInDocDb();
      latestDataset.version = 2;
      latestDataset.status = DELETED;
      previousDataset.status = DELETED;
      const allVersions = [previousDataset, latestDataset];
      datasetDao.getDatasetVersions.mockReturnValueOnce(allVersions);
      versionService.getLatestNonDeletedVersion.mockReturnValueOnce(undefined);
      const result = datasetService.deleteDataset(datasetId, 'test', edlUser);
      return expect(result).rejects.toThrow(new Error('Cannot find available dataset with id = 1234'));
    });

    it('should throw an error message when dataset is not found and user is admin/EDL', () => {
      const nonExistingDatasetId = '4567';
      datasetDao.getDatasetVersions.mockRejectedValueOnce(new Error('Cannot find dataset with id = 4567'));
      const result = datasetService.deleteDataset(nonExistingDatasetId, 'test', edlUser);
      return expect(result).rejects.toThrow(new Error('Cannot find dataset with id = 4567'));
    });

    it('Should update dataset updated by and updated at while deleting dataset', async () => {
      //given
      const dataset = { ...createDatasetInDocDb(), approvals: [] };
      datasetApprovalService.addApprovalsForDelete.mockResolvedValue(createSimpleDataset());
      datasetDao.getDatasetVersions.mockResolvedValueOnce({ id: datasetId })
      versionService.getLatestNonDeletedVersion.mockImplementation(_val => dataset);
      versionService.calculateVersion.mockReturnValue(1);
      versionService.allowedToUpdate.mockReturnValue(true);

      //when
      const actualDataset = await datasetService.deleteDataset(datasetId, 'test', {});
      //test
      const expectedDataset = createSimpleDataset();
      expectedDataset.approvals[0].community = { approver: 'DooScooby', id: '10', name: 'Name' };
      expect(actualDataset).toEqual(expectedDataset);
    });
  });

  describe('Linked schemas tests', () => {
    function linkedFromDataset(version) {
      return {
        ...createLinkedToDataset(version),
        linkedSchemas: [],
        tables: [],
        paths: [],
        schemas: [{ ...createSchema(), id: `linkedSchema--${version}` }],
        classifications: [],
        id: 'linkedFromDataset',
        documentation: '',
        attachments: { currentAttachments: [] }
      }
    }

    function createLinkedToDataset(version) {
      return {
        id: 'linkedToDataset',
        approvals: [],
        linkedSchemas: [{ ...createSchema(), id: 'linkedSchema--1' }],
        tables: [],
        paths: [],
        schemas: [{ ...createSchema(), id: 'someOtherSchema' }],
        sourceDataset: [],
        status: AVAILABLE,
        sourceDatasets: [],
        version,
        discoveredSchemas: [],
        views: [],
        discoveredTables: [],
        attachments: { currentAttachments: [] }
      };
    }

    function createProcessedLinkedToDataset(version) {
      return {
        ...createLinkedToDataset(version),
        discoveredSchemas: [],
        discoveredTables: [],
        views: [],
        linkedSchemas: [{ ...createSchema(), id: 'linkedSchema--2' }],
        documentation: '',
        classifications: [],
        version,
        attachments: { currentAttachments: [] },
        usability: expect.anything()
      }
    }

    it('should return the most recent available linked schema version when getting a single dataset with id', async () => {
      const input = [createLinkedToDataset(1), linkedFromDataset(2)];
      datasetDao.getLatestDatasets.mockResolvedValueOnce(input);
      datasetDao.getDataset.mockResolvedValue(input[0]);
      referenceService.dereferenceIds.mockImplementation(val => val);
      schemaDao.getSchema.mockResolvedValueOnce({ ...createDetailedSchemas(), id: 'linkedSchema--2' })
        .mockResolvedValueOnce({ ...createSchema(), id: 'linkedSchema--2' });
      s3.getContents.mockResolvedValue({ Contents: [] });
      const createdDataset = createProcessedLinkedToDataset(1);
      createdDataset.schemas = [{ ...createDetailedSchemas(), id: 'linkedSchema--2' }];
      const expectedDataset = { ...createdDataset, discoveredSchemas: [] };
      const result = await datasetService.getDataset(true, input[0].id, 1);

      expect(result).toEqual(expectedDataset);
    });

    it('should return the most recent available linked schema version when working with old versionless schema IDs', async () => {
      const datasetWithLinkedSchema = createLinkedToDataset(0);
      datasetWithLinkedSchema.linkedSchemas = [{ ...createSchema(), id: 'linkedSchema' }];
      datasetWithLinkedSchema.schemas = [];
      const datasetWithSchema = linkedFromDataset(1);
      datasetWithSchema.schemas = [{ ...createDetailedSchemas(), id: 'linkedSchema' }];
      datasetWithSchema.linkedSchemas = [];
      const input = [datasetWithLinkedSchema, datasetWithSchema];
      datasetDao.getLatestDatasets.mockResolvedValueOnce(input);
      datasetDao.getDataset.mockResolvedValue(input[0]);
      referenceService.dereferenceIds.mockImplementation(val => val);
      schemaDao.getSchema.mockResolvedValueOnce({ ...createSchema(), id: 'linkedSchema' })
      s3.getContents.mockResolvedValue({ Contents: [] });

      const expectedDataset = createProcessedLinkedToDataset(0);
      expectedDataset.schemas = [];
      expectedDataset.linkedSchemas = [{ ...createSchema(), id: 'linkedSchema' }];
      expectedDataset.discoveredSchemas = [];
      const result = await datasetService.getDataset(true, input[0].id, 1);

      expect(result).toEqual(expectedDataset);
    });

    it('should return nothing if a dataset cannot be found for a linkedSchema', async () => {
      const input = createLinkedToDataset(1);
      datasetDao.getLatestDataset.mockResolvedValueOnce(input);

      referenceService.dereferenceIds.mockImplementation(val => val);
      schemaDao.getSchema.mockImplementation(val => ({ ...createDetailedSchemas(), id: val }));
      s3.getContents.mockResolvedValue({ Contents: [] });

      const createdDataset = createProcessedLinkedToDataset(1);
      createdDataset.schemas = [{ ...createDetailedSchemas(), id: 'someOtherSchema' }];
      const expectedDataset = { ...createdDataset, linkedSchemas: [] };
      const result = await datasetService.getDataset(true, 'id')

      expect(result).toEqual(expectedDataset);
    });

    it('should return only datasets that contain hello in the dataset name', async () => {
      const expectedHello = { ...createProcessedLinkedToDataset(1), name: 'hello', id: 'hello', linkedSchemas: [] };
      const expectedHelloWorld = { ...createProcessedLinkedToDataset(1), name: 'hello world', id: 'hello-world', linkedSchemas: [] };
      const expectedParams = { statuses: [AVAILABLE], name: 'hello' };
      datasetDao.getLatestDatasets.mockResolvedValue([expectedHello, expectedHelloWorld]);

      const result = await datasetService.getDatasets([AVAILABLE], 'hello');

      expect(result).toEqual([expectedHello, expectedHelloWorld]);
      expect(datasetDao.getLatestDatasets).toHaveBeenCalledWith(expectedParams)
    });
  });

  describe('add schema to dataset', () => {
    const successfulResponse = { id: 'schema', status: 'Successful' };
    beforeEach(() => {
      datasetDao.getDatasets.mockResolvedValue([]);
      schemaDao.getDiscoveredSchemas.mockResolvedValue([]);
      versionService.getLatestVersions.mockImplementation(val => val);
      schemaValidationService.validateDiscoveredSchemas.mockReturnValue([]);
    });

    it('should add schema to ES dataset if not present and add record to dynamo if discovered is included', async () => {
      const storedDataset = { id: 'dataset', schemas: [], discoveredSchemas: [] };
      const schema = { id: 'schema', discovered: 'some-time' };
      const expectedMetadata = {
        ...schema,
        testing: true,
        datasetId: storedDataset.id,
        discovered: 'some-time'
      };

      datasetDao.getLatestDatasets.mockResolvedValueOnce([storedDataset]);

      const result = await datasetService.addSchemasToDataset(storedDataset.id, [schema]);

      expect(result).toEqual([successfulResponse]);
      expect(documentDao.updatePropertyForId).toBeCalledWith('datasets', storedDataset.id, 'discoveredSchemas', ['schema']);
      expect(schemaDao.saveDiscoveredSchemas).toBeCalledWith([expectedMetadata], [schema]);
    });

    it('should add multiple schemas to ES dataset if not present and add record to dynamo if discovered is included', async () => {
      const storedDataset = { id: 'dataset', schemas: [], discoveredSchemas: [] };
      const schema = { id: 'schema', discovered: 'some-time' };
      const otherSchema = { id: 'other-schema', discovered: 'some-time' };
      const expectedMetadata = {
        ...schema,
        testing: true,
        datasetId: storedDataset.id
      };
      const otherMetadata = {
        ...otherSchema,
        testing: true,
        datasetId: storedDataset.id
      }
      const expectedMetadatas = [expectedMetadata, otherMetadata];
      const otherSuccess = { ...successfulResponse, id: otherSchema.id };

      datasetDao.getLatestDatasets.mockResolvedValue([storedDataset]);

      const result = await datasetService.addSchemasToDataset(storedDataset.id, [schema, otherSchema]);

      expect(result).toEqual([successfulResponse, otherSuccess]);
      expect(documentDao.updatePropertyForId).toBeCalledWith('datasets', storedDataset.id, 'discoveredSchemas', ['schema', 'other-schema']);
      expect(schemaDao.saveDiscoveredSchemas).toBeCalledWith(expectedMetadatas, [schema, otherSchema]);
    });

    it('should reject schema if discovered is not included', async () => {
      const storedDataset = { id: 'dataset', schemas: [], discoveredSchemas: [] };
      const schema = { id: 'schema' };

      datasetDao.getLatestDatasets.mockResolvedValue([storedDataset]);

      const results = datasetService.addSchemasToDataset(storedDataset.id, [schema])
      await expect(results).rejects.toThrow('Only discovered schemas are allowed to be added at this time.');
    });

    it('should update schema in ES dataset if present and update dynamo record', async () => {
      const storedDataset = { id: 'dataset', schemas: [], discoveredSchemas: ['schema'] };
      const schema = { id: 'schema', discovered: 'some-time', documentation: 'some new change' };
      const expectedMetaData = {
        id: schema.id,
        testing: true,
        datasetId: storedDataset.id,
        discovered: 'some-time'
      };

      schemaDao.getDiscoveredSchemas.mockResolvedValue([{ id: 'schema', datasetId: 'dataset' }]);
      datasetDao.getLatestDatasets.mockResolvedValueOnce([storedDataset]);

      const result = await datasetService.addSchemasToDataset(storedDataset.id, [schema]);

      expect(result).toEqual([successfulResponse]);
      expect(documentDao.updatePropertyForId).toBeCalledWith('datasets', storedDataset.id, 'discoveredSchemas', ['schema']);
      expect(schemaDao.saveDiscoveredSchemas).toBeCalledWith([expectedMetaData], [schema]);
    });

    it('should update previous ES dataset versions with new discovered array', async () => {
      const storedDataset = { id: 'dataset', schemas: [], discoveredSchemas: ['schema'], version: 1 };
      const schema = { id: 'some-new-id', discovered: 'some-time', documentation: 'some new change' };
      const expectedMetaData = {
        id: schema.id,
        testing: true,
        datasetId: storedDataset.id,
        discovered: 'some-time'
      };

      schemaDao.getDiscoveredSchemas.mockResolvedValue([{ id: 'schema', datasetId: 'dataset' }]);
      datasetDao.getLatestDatasets.mockResolvedValueOnce([storedDataset, { ...storedDataset, version: 2, discoveredSchemas: [] }]);

      const result = await datasetService.addSchemasToDataset(storedDataset.id, [schema]);

      expect(result).toEqual([{ id: schema.id, status: "Successful" }]);
      expect(documentDao.updatePropertyForId).toBeCalledWith('datasets', storedDataset.id, 'discoveredSchemas', ['schema', 'some-new-id']);
      expect(schemaDao.saveDiscoveredSchemas).toBeCalledWith([expectedMetaData], [schema]);
    });

    it('should fail to add schema when dataset not exists', () => {
      datasetDao.getLatestDatasets.mockResolvedValue([{ id: 'bar' }]);
      const result = datasetService.addSchemasToDataset('foo', [{ id: 'foo', discovered: 'some-time' }]);
      return expect(result).rejects.toThrow(new Error('Dataset does not exist'));
    });

    it('should fail to add schema when datastore blows up', () => {
      datasetDao.getLatestDatasets.mockImplementation(() => {
        throw Error('error');
      });
      const result = datasetService.addSchemasToDataset('foo', [{ id: 'foo', discovered: 'some-time' }]);

      return expect(result).rejects.toThrow('error');
    });

    it('should fail to add schema when cannot store schema', () => {
      datasetDao.getLatestDatasets.mockResolvedValue([{ id: 'foo' }]);
      schemaDao.saveDiscoveredSchemas.mockImplementation(() => {
        throw Error('error');
      });
      const result = datasetService.addSchemasToDataset('foo', [{ id: 'foo', discovered: 'some-time' }]);
      return expect(result).rejects.toThrow('error');
    });

    it('should fail if passing in a discovered schema without an ID', async () => {
      const storedDataset = { id: 'dataset', schemas: [], discoveredSchemas: ['schema'] };
      const schema = { id: undefined, discovered: 'some-time' };
      const error = { id: schema.id, status: 'Must include a schema id and discovered timestamp' };

      datasetDao.getLatestDatasets.mockResolvedValue([storedDataset]);
      const result = await datasetService.addSchemasToDataset(storedDataset.id, [schema]);
      expect(result).toEqual([error]);
    });

    it('should handle failure and still process valid schemas', async () => {
      const storedDataset = { id: 'dataset', schemas: [], discoveredSchemas: ['schema'] };
      const schema = { id: 'schema', discovered: 'some-time' };
      const otherSchema = { id: 'other', discovered: undefined };
      const error = { id: otherSchema.id, status: 'Must include a schema id and discovered timestamp' };

      datasetDao.getLatestDatasets.mockResolvedValue([storedDataset]);

      const result = await datasetService.addSchemasToDataset(storedDataset.id, [schema, otherSchema]);
      expect(result).toEqual([error, successfulResponse]);
    });

    it('should fail to add schema if ID is not globally unique within discovered schemas outside of updated dataset', async () => {
      const otherDataset = { id: 'foo', schemas: [{ ...createSchema(), id: 'schema' }] };
      const dataset = { id: 'bar', discoveredSchemas: [] };
      const schema = { id: 'schema', discovered: 'some-time' };
      const error = { id: schema.id, status: `Schema ID ${schema.id} is not unique to this dataset` };

      datasetDao.getLatestDatasets.mockResolvedValue([dataset, otherDataset]);

      const result = await datasetService.addSchemasToDataset(dataset.id, [schema]);
      expect(result).toEqual([error]);
    });

    it('should fail to add schema if ID is not globally unique across regular schemas outside of updated dataset', async () => {
      const otherDataset = { id: 'foo', schemas: [{ ...createSchema(), id: 'schema' }] };
      const dataset = { id: 'bar', discoveredSchemas: [] };
      const schema = { id: 'schema', discovered: 'some-time' };
      const error = { id: schema.id, status: `Schema ID ${schema.id} is not unique to this dataset` };

      datasetDao.getLatestDatasets.mockResolvedValue([dataset, otherDataset]);

      const result = await datasetService.addSchemasToDataset(dataset.id, [schema]);

      expect(result).toEqual([error]);
    });

    it('should fail to add schema if ID is not unique across schemas submitted', async () => {
      const otherDataset = { id: 'foo', schemas: [] };
      const dataset = { id: 'bar', discoveredSchemas: [] };
      const schema = { id: 'schema', discovered: 'some-time' };
      const otherSchema = { id: 'schema', discovered: 'some-other-time' };
      const error = { id: schema.id, status: `Schema ID ${schema.id} is used more than once in this submission` };
      const otherError = { id: otherSchema.id, status: `Schema ID ${otherSchema.id} is used more than once in this submission` };

      datasetDao.getLatestDatasets.mockResolvedValue([dataset, otherDataset]);

      const result = await datasetService.addSchemasToDataset(dataset.id, [schema, otherSchema]);
      expect(result).toEqual([error, otherError]);
    });

    it('should remove discovered schema from dataset', async () => {
      const schema = { id: 'schema1', datasetId: 'dataset1' };
      const storedMeta = [
        schema,
        { ...schema, id: 'schema2' }
      ];

      schemaDao.getDiscoveredSchemasForDataset.mockResolvedValue(storedMeta);

      await datasetService.removeSchemaFromDataset('dataset1', 'schema1');

      expect(documentDao.updatePropertyForId).toBeCalledWith('datasets', 'dataset1', 'discoveredSchemas', ['schema2']);
      expect(schemaDao.deleteDiscoveredSchema).toBeCalledWith('dataset1', 'schema1');
    });

    it('should fail to remove discovered schema from dataset when indexing fails', () => {
      schemaDao.getDiscoveredSchemasForDataset.mockResolvedValue([]);
      documentDao.updatePropertyForId.mockRejectedValue('error');

      const result = datasetService.removeSchemaFromDataset('dataset1', 'schema1');
      return expect(result).rejects.toEqual('error');
    });

    it('should fail to remove discovered schema from dataset when schema dao fails', () => {
      schemaDao.getDiscoveredSchemasForDataset.mockRejectedValue('error');

      const result = datasetService.removeSchemaFromDataset('dataset1', 'schema1');
      return expect(result).rejects.toEqual('error');
    });
  });

  describe('get s3 contents for a dataset', () => {
    const s3Bucket = "jd-us01-edl-devl-raw-someEncodedId";
    const account = "12345";
    function createEdlApproval() {
      return {
        system: "EDL",
        approvedBy: "EDL",
        details: {
          schemas: [],
          dataset: {
            values: [
              {
                name: "Databricks Mount Location",
                value: "/mnt/edl/raw/dataset"
              },
              {
                name: "S3 Bucket Name",
                value: s3Bucket
              },
              {
                name: "Account",
                value: account
              }
            ],
            name: "com.deere.edl.raw.dataset"
          }
        }
      }
    }

    function createDatasetWithStorageLocation(phaseName = 'Raw') {
      return {
        ...createDatasetInDocDb(),
        approvals: [createEdlApproval()],
        phase: { id: 'something', name: phaseName },
        id: 'id'
      }
    }

    const exampleFileMap = {
      'Root': {
        name: 'Root'
      }
    }

    const sampleContents = { Contents: [] };

    beforeEach(() => {
      s3.getContents.mockResolvedValue(sampleContents);
      datasetDao.getDataset.mockResolvedValue(createDatasetWithStorageLocation());
      fileService.createFileMap.mockReturnValue(exampleFileMap);
    })

    it('should return s3 response with fileMap for root if s3 call is successfull', async () => {
      const expectedReturnObject = { ...sampleContents, fileMap: exampleFileMap };
      const result = await datasetService.getDatasetContents('id', 'version');

      expect(datasetDao.getDataset).toHaveBeenCalledWith('id', 'version');
      expect(s3.getContents).toHaveBeenCalledWith(s3Bucket, account, '', '', '/');
      expect(result).toEqual(expectedReturnObject);
    });

    it('should be able to pass a prefix for a type and build files in map for each returned prefix', async () => {
      const expectedReturnObject = {
        ...sampleContents,
        fileMap: exampleFileMap
      };
      const result = await datasetService.getDatasetContents('id', 'version', '', 'path/');

      expect(s3.getContents).toHaveBeenCalledWith(s3Bucket, account, '', 'path/', '/');
      expect(result).toEqual(expectedReturnObject);
    });

    it('should be able to call getAttachments if there exist an attachment with dataset id and version', async () => {
      datasetDao.getDataset.mockResolvedValue({ custodian: 'testgroup1' });
      const attachmentsContent = {
        Contents: [{ Key: 'test/abc.txt' }],
        Name: 'jd-data-catalog-attachment-devl',
        CommonPrefixes: []
      };
      s3.getContents.mockResolvedValue(attachmentsContent);
      const attachmentBucket = 'jd-data-catalog-attachment-devl';
      const accountNumber = conf.getConfig().accountNumber
      const expected = [
        {
          account: accountNumber,
          bucketName: "jd-data-catalog-attachment-devl",
          fileName: "abc.txt",
          key: "id-version/abc.txt"
        }
      ];
      const result = await datasetService.getAttachments('id-version/');

      expect(s3.getContents).toHaveBeenNthCalledWith(1, attachmentBucket, accountNumber, '', 'id-version/', '/');
      expect(result).toEqual(expected);
    });

    it('should be able to call getAttachments if there are no attachments with dataset id and version', async () => {
      datasetDao.getDataset.mockResolvedValue({ custodian: 'testgroup1' });
      s3.getContents.mockResolvedValue(attachmentsContent);
      const attachmentBucket = 'jd-data-catalog-attachment-devl';
      const expected = [];
      const result = await datasetService.getAttachments('id-version/');
      const accountNumber = conf.getConfig().accountNumber

      expect(s3.getContents).toHaveBeenNthCalledWith(1, attachmentBucket, accountNumber, '', 'id-version/', '/');
      expect(result).toEqual(expected);
    });

    it('should be able to call getStagedAttachments if there exist an attachment with dataset id and version', async () => {
      const attachmentsContent = {
        Contents: [{ Key: 'test/abc.txt' }],
        Name: 'jd-data-catalog-attachment-devl',
        CommonPrefixes: []
      };
      s3.getContents.mockResolvedValue(attachmentsContent);
      const attachmentBucket = 'jd-data-catalog-attachment-devl';
      const accountNumber = conf.getConfig().accountNumber
      const expected = [
        {
          account: accountNumber,
          bucketName: "jd-data-catalog-attachment-devl",
          fileName: "abc.txt",
          key: "staged/uuid/abc.txt"
        }
      ];
      const result = await datasetService.getAttachments('staged/uuid/');

      expect(s3.getContents).toHaveBeenNthCalledWith(1, attachmentBucket, accountNumber, '', 'staged/uuid/', '/');
      expect(result).toEqual(expected);
    });

    it('should be able to call getStagedAttachments if there are no attachments with dataset id and version', async () => {
      s3.getContents.mockResolvedValue(attachmentsContent);
      const attachmentBucket = 'jd-data-catalog-attachment-devl';
      const expected = [];
      const result = await datasetService.getAttachments('staged/uuid/');
      const accountNumber = conf.getConfig().accountNumber

      expect(s3.getContents).toHaveBeenNthCalledWith(1, attachmentBucket, accountNumber, '', 'staged/uuid/', '/');
      expect(result).toEqual(expected);
    });

    it('should be able to call s3 deleteAttachment when there exist deleted attachments', async () => {
      setupExistingDatasetsInES();

      const updatedDataset = { ...createNewDatasetToSave(), attachments: { newAttachments: [], deletedAttachments: ['file1.txt'] } };
      updatedDataset.attachments = { newAttachments: [], deletedAttachments: ['file1.txt'] };
      versionService.calculateVersion.mockReturnValue(1);
      s3.getContents.mockResolvedValue(attachmentsContent);

      await datasetService.updateDataset(datasetId, 1, updatedDataset, fullUser);

      const expectedDataset = {
        ...createDefaultFullFields(),
        ...createNewDatasetToSave(),
        commentHistory: [{ comment: "some test comments", updatedAt: isoDate, updatedBy: "Fred" }],
        approvals: [communityApproval],
        attachments: {
          currentAttachments: [],
          newAttachments: [],
          deletedAttachments: ['file1.txt']
        },
        schemas: [createSchema()],
        status: PENDING,
        deletedSchemas: []
      };
      expectedDataset.approvals.forEach(approval => {
        delete approval.unpublishedPath;
      });
      expect(schemaDao.saveSchema).toBeCalledWith({ ...updatedDataset.schemas[0] });
      expect(s3.deleteAttachment).toHaveBeenCalledTimes(1);
      return expect(datasetDao.saveDataset).toBeCalledWith(expectedDataset);
    });

    it('should throw error if s3 call fails for getDatasetAttachments', () => {
      datasetDao.getDataset.mockResolvedValue({ custodian: 'testgroup1' });
      s3.getContents.mockRejectedValueOnce(new Error('Failed'));
      const errMessage = 'An unexpected error occurred when getting attachments.'
      return expect(datasetService.getAttachments('id-version/')).resolves.toThrow(new Error(errMessage));
    });

    it('should throw error if s3 call fails for getStagedAttachments', () => {
      s3.getContents.mockRejectedValueOnce(new Error('Failed'));
      const errMessage = 'An unexpected error occurred when getting attachments.'
      return expect(datasetService.getAttachments('staged/uuid/')).resolves.toThrow(new Error(errMessage));
    });

    it('should only call s3 if dataset is raw', () => {
      datasetDao.getDataset.mockResolvedValueOnce(createDatasetWithStorageLocation('Enhance'));

      return expect(datasetService.getDatasetContents('id')).rejects.toThrow(new Error('Only raw and model datasets support this feature currently.'));
    });

    it('should throw error if s3 call fails', () => {
      s3.getContents.mockRejectedValueOnce(new Error('Failed'));

      return expect(datasetService.getDatasetContents('id')).resolves.toThrow(new Error('An unexpected error occurred when getting dataset contents.'));
    });
  });

  function setupExistingDatasetVersions(datasets) {
    datasetDao.getDataset.mockResolvedValueOnce(datasets[0]);
    datasetDao.getDatasetVersions.mockResolvedValueOnce(datasets);
  }

  function createExpectedDatasetForSave(status, version = 1) {
    return {
      ...createDatasetInDocDb(),
      status,
      version,
      discoveredSchemas: [],
      discoveredTables: [],
      environment: {},
      views: []
    }
  }
  function createDatasetForIndexing(status, version = 1) {
    return {
      "approvals": [{
        "approvedBy": null,
        "approverEmail": "DooScooby@JohnDeere.com",
        "comment": null,
        "community": { "approver": "DooScooby", "id": "10", "name": "Name" },
        "status": PENDING,
        "updatedAt": null
      }],
      "category": "4",
      "classifications": [{
        "additionalTags": ["tag"],
        "community": "10",
        "countriesRepresented": ["12", "13"],
        "development": false,
        "gicp": "14",
        "id": "2345",
        "personalInformation": false,
        "subCommunity": "11"
      }],
      "createdAt": isoDate,
      "createdBy": "Fred",
      "custodian": "EDG-NETFLIX-MANAGERS",
      "description": "Streaming service for TV shows and movies",
      "documentation": "##### Support Resources",
      "environment": {},
      "id": "1234",
      "linkedSchemas": [],
      "tables": [],
      "paths": [],
      "name": "Netflix",
      "phase": "6",
      "physicalLocation": "8",
      "schemas": [{ ...createSchema(), id: "a108b4a3-d00b-4e33-a143-a73932b7ff77--1" }],
      "sourceDatasets": [],
      "status": status,
      "technology": "7",
      "updatedAt": isoDate,
      "updatedBy": "Fred",
      "version": version,
      "discoveredSchemas": [],
      "views": [],
      "discoveredTables": [],
      "attachments": { "deletedAttachments": [], "newAttachments": [], "currentAttachments": [] },
      "usability": expect.anything()
    };
  }

  describe('Build Table ', () => {
    it('Should throw error if database name is edl sources', async () => {
      //given
      const tableInfo = {
        databaseName: 'edl',
        tableName: 'FakeTableName',
        fileType: 'CSV',
        pathInfo: 's3a://bucket/path',
        environmentName: 'dataset.env.name',
        delimiter: ','
      };

      try {
        //when
        await datasetService.createTable(tableInfo);
      } catch (e) {
        //then
        expect('Not allowed to create table in edl database').toEqual(e.message);
      }
    });

    it('Should throw error if table name is empty', async () => {
      //given
      const tableInfo = {
        databaseName: 'isg',
        tableName: '',
        fileType: 'CSV',
        pathInfo: 's3a://bucket/path',
        environmentName: 'dataset.env.name',
        delimiter: ','
      };

      try {
        //when
        await datasetService.createTable(tableInfo);
      } catch (e) {
        //then
        expect('Must be a valid table name. Table name can not be empty and can not contain spaces/special characters').toEqual(e.message);
      }
    });

    it('Should throw error if table name is undefined', async () => {
      //given
      const tableInfo = {
        databaseName: 'isg',
        tableName: undefined,
        fileType: 'CSV',
        pathInfo: 's3a://bucket/path',
        environmentName: 'dataset.env.name',
        delimiter: ','
      };

      try {
        //when
        await datasetService.createTable(tableInfo);
      } catch (e) {
        //then
        expect('Must be a valid table name. Table name can not be empty and can not contain spaces/special characters').toEqual(e.message);
      }
    });

    it('Should throw error if table name more than 100 characters', async () => {
      //given
      const tableInfo = {
        databaseName: 'isg',
        tableName: 'hsjadfakfadfksakfsakfasfsaasdfaskflsdkfaksfsfkafakakfakdfkkfaskfosdfksaofasfkakfsdopfksaopkfasodhfaksfhdadhlakfhafafaf',
        fileType: 'CSV',
        pathInfo: 's3a://bucket/path',
        environmentName: 'dataset.env.name',
        delimiter: ','
      };

      try {
        //when
        await datasetService.createTable(tableInfo);
      } catch (e) {
        //then
        expect('Must be a valid table name. Table name can not be empty and can not contain spaces/special characters').toEqual(e.message);
      }
    });

    it('Should throw error if table name contains any special characters', async () => {
      //given
      const tableInfo = {
        databaseName: 'isg',
        tableName: 'sdfadfla;&%^*&*(*########@!7&*()&;;;a;;dfsadfafs;;a!sdjfaj*',
        fileType: 'CSV',
        pathInfo: 's3a://bucket/path',
        environmentName: 'dataset.env.name',
        delimiter: ','
      };

      try {
        //when
        await datasetService.createTable(tableInfo);
      } catch (e) {
        //then
        expect('Must be a valid table name. Table name can not be empty and can not contain spaces/special characters').toEqual(e.message);
      }
    });

    it('Should create table definition based on table name, database name and using', async () => {
      //given
      const tableInfo = {
        databaseName: 'jdf',
        tableName: 'fake_table_name',
        fileType: 'CSV',
        pathInfo: 's3a://bucket/path',
        environmentName: 'dataset.env.name',
        delimiter: ','
      }
      edlApiHelper.post.mockResolvedValue('Created Table Successfully');
      //when
      await datasetService.createTable(tableInfo);
      //then
      expect(edlApiHelper.postWithContentType).toBeCalledWith(conf.getConfig().edlMetastoreApi + 'v1/metastore/tables', tableInfo);
    });
  });

  describe('availableDatasetIds', () => {
    it('should return AVAILABLE dataset ids only', async () => {
      const dataset1Id = 'dataset1-id';
      const dataset2Id = 'dataset2-id';
      const datasetIds = [dataset1Id, dataset2Id];
      const expected = [dataset1Id];
      datasetDao.getLatestDataset.mockResolvedValueOnce({ status: 'AVAILABLE' });
      datasetDao.getLatestDataset.mockResolvedValueOnce(undefined);

      const actual = await datasetService.availableDatasetIds(datasetIds);

      expect(datasetDao.getLatestDataset).toHaveBeenCalledTimes(2);
      expect(datasetDao.getLatestDataset).toHaveBeenNthCalledWith(1, dataset1Id, ['AVAILABLE']);
      expect(datasetDao.getLatestDataset).toHaveBeenNthCalledWith(2, dataset2Id, ['AVAILABLE']);
      expect(actual).toEqual(expected);
    });
  });

  describe('Search for Datasets - Recently modified datasets Order by and Limit', () => {

    const queryParams = {
      status: undefined,
      name: undefined,
      community: undefined,
      orderBy: 'EDL',
      limit: 5
    };

    it('Should return recently modified datasets', async () => {
      //given
      const recentlyModifiedDatasets = [
        { id: 'fake id 1', name: 'fake name 1', phase: 'Raw', community: 'Systems', modifiedBy: 'fakeRacfId1' },
        { id: 'fake id 2', name: 'fake name 2', phase: 'Raw', community: 'Systems', modifiedBy: 'fakeRacfId2' },
        { id: 'fake id 3', name: 'fake name 3', phase: 'Raw', community: 'Systems', modifiedBy: 'fakeRacfId3' },
        { id: 'fake id 4', name: 'fake name 4', phase: 'Raw', community: 'Systems', modifiedBy: 'fakeRacfId4' },
        { id: 'fake id 5', name: 'fake name 5', phase: 'Raw', community: 'Systems', modifiedBy: 'fakeRacfId5' },
      ];

      const racfIdsNames = [
        { racfId: 'fakeRacfId1', name: 'Fake LDAP Name 1' },
        { racfId: 'fakeRacfId2', name: 'Fake LDAP Name 2' },
        { racfId: 'fakeRacfId3', name: 'Fake LDAP Name 3' },
        { racfId: 'fakeRacfId4', name: 'Fake LDAP Name 4' },
        { racfId: 'fakeRacfId5', name: 'Fake LDAP Name 5' },
      ];

      const expectedResults = [
        { id: 'fake id 1', name: 'fake name 1', phase: 'Raw', community: 'Systems', modifiedBy: 'Fake LDAP Name 1' },
        { id: 'fake id 2', name: 'fake name 2', phase: 'Raw', community: 'Systems', modifiedBy: 'Fake LDAP Name 2' },
        { id: 'fake id 3', name: 'fake name 3', phase: 'Raw', community: 'Systems', modifiedBy: 'Fake LDAP Name 3' },
        { id: 'fake id 4', name: 'fake name 4', phase: 'Raw', community: 'Systems', modifiedBy: 'Fake LDAP Name 4' },
        { id: 'fake id 5', name: 'fake name 5', phase: 'Raw', community: 'Systems', modifiedBy: 'Fake LDAP Name 5' }
      ];

      jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue({
        get: jest.fn().mockImplementation(() => Promise.resolve({})),
        set: jest.fn().mockImplementation(() => Promise.resolve('OK'))
      });

      datasetDao.getRecentlyModifiedRecords.mockResolvedValue(recentlyModifiedDatasets);
      activeDirectoryDao.findNamesByRacfIds.mockResolvedValue(racfIdsNames);
      //when
      const results = await datasetService.searchForDataset(queryParams);
      //then
      expect(results).toEqual(expectedResults);
    });

    it('Should return cached racfIds', async () => {
      //given
      const recentlyModifiedDatasets = [
        { id: 'fake id 1', name: 'fake name 1', phase: 'Raw', community: 'Systems', modifiedBy: 'fakeRacfId1' },
        { id: 'fake id 2', name: 'fake name 2', phase: 'Raw', community: 'Systems', modifiedBy: 'fakeRacfId2' },
        { id: 'fake id 3', name: 'fake name 3', phase: 'Raw', community: 'Systems', modifiedBy: 'fakeRacfId3' },
        { id: 'fake id 4', name: 'fake name 4', phase: 'Raw', community: 'Systems', modifiedBy: 'fakeRacfId4' },
        { id: 'fake id 5', name: 'fake name 5', phase: 'Raw', community: 'Systems', modifiedBy: 'fakeRacfId5' },
      ];

      const cachedRacfIdsNamesMap = [
        { racfId: 'fakeRacfId1', name: 'Fake LDAP Name 1' },
        { racfId: 'fakeRacfId2', name: 'Fake LDAP Name 2' },
        { racfId: 'fakeRacfId3', name: 'Fake LDAP Name 3' },
        { racfId: 'fakeRacfId4', name: 'Fake LDAP Name 4' }
      ];

      const racfIdsNames = [
        { racfId: 'fakeRacfId5', name: 'Fake LDAP Name 5' }
      ];

      const expectedResults = [
        { id: 'fake id 1', name: 'fake name 1', phase: 'Raw', community: 'Systems', modifiedBy: 'Fake LDAP Name 1' },
        { id: 'fake id 2', name: 'fake name 2', phase: 'Raw', community: 'Systems', modifiedBy: 'Fake LDAP Name 2' },
        { id: 'fake id 3', name: 'fake name 3', phase: 'Raw', community: 'Systems', modifiedBy: 'Fake LDAP Name 3' },
        { id: 'fake id 4', name: 'fake name 4', phase: 'Raw', community: 'Systems', modifiedBy: 'Fake LDAP Name 4' },
        { id: 'fake id 5', name: 'fake name 5', phase: 'Raw', community: 'Systems', modifiedBy: 'Fake LDAP Name 5' }
      ];

      datasetDao.getRecentlyModifiedRecords.mockResolvedValue(recentlyModifiedDatasets);
      activeDirectoryDao.findNamesByRacfIds.mockResolvedValue(racfIdsNames);

      jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue({
        get: jest.fn().mockImplementation(() => Promise.resolve(new Map(cachedRacfIdsNamesMap.map(key => [key.racfId, key.name])))),
        set: jest.fn().mockImplementation(() => Promise.resolve('OK'))
      });

      //when
      const results = await datasetService.searchForDataset(queryParams);
      //then
      expect(results).toEqual(expectedResults);
    });

    it('Should not call ldap if all the racfids are in cache', async () => {
      //given
      const recentlyModifiedDatasets = [
        { id: 'fake id 1', name: 'fake name 1', phase: 'Raw', community: 'Systems', modifiedBy: 'fakeRacfId1' },
        { id: 'fake id 2', name: 'fake name 2', phase: 'Raw', community: 'Systems', modifiedBy: 'fakeRacfId2' },
        { id: 'fake id 3', name: 'fake name 3', phase: 'Raw', community: 'Systems', modifiedBy: 'fakeRacfId3' },
        { id: 'fake id 4', name: 'fake name 4', phase: 'Raw', community: 'Systems', modifiedBy: 'fakeRacfId4' },
        { id: 'fake id 5', name: 'fake name 5', phase: 'Raw', community: 'Systems', modifiedBy: 'fakeRacfId5' },
      ];

      const cachedRacfIdsNamesMap = [
        { racfId: 'fakeRacfId1', name: 'Fake LDAP Name 1' },
        { racfId: 'fakeRacfId2', name: 'Fake LDAP Name 2' },
        { racfId: 'fakeRacfId3', name: 'Fake LDAP Name 3' },
        { racfId: 'fakeRacfId4', name: 'Fake LDAP Name 4' },
        { racfId: 'fakeRacfId5', name: 'Fake LDAP Name 5' }
      ];

      const expectedResults = [
        { id: 'fake id 1', name: 'fake name 1', phase: 'Raw', community: 'Systems', modifiedBy: 'Fake LDAP Name 1' },
        { id: 'fake id 2', name: 'fake name 2', phase: 'Raw', community: 'Systems', modifiedBy: 'Fake LDAP Name 2' },
        { id: 'fake id 3', name: 'fake name 3', phase: 'Raw', community: 'Systems', modifiedBy: 'Fake LDAP Name 3' },
        { id: 'fake id 4', name: 'fake name 4', phase: 'Raw', community: 'Systems', modifiedBy: 'Fake LDAP Name 4' },
        { id: 'fake id 5', name: 'fake name 5', phase: 'Raw', community: 'Systems', modifiedBy: 'Fake LDAP Name 5' }
      ];

      datasetDao.getRecentlyModifiedRecords.mockResolvedValue(recentlyModifiedDatasets);

      jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue({
        get: jest.fn().mockImplementation(() => Promise.resolve(new Map(cachedRacfIdsNamesMap.map(key => [key.racfId, key.name])))),
        set: jest.fn().mockImplementation(() => Promise.resolve())
      });

      //when
      const results = await datasetService.searchForDataset(queryParams);
      //then
      expect(results).toEqual(expectedResults);
      expect(activeDirectoryDao.findNamesByRacfIds).toBeCalledTimes(0);
    });
  });
});
