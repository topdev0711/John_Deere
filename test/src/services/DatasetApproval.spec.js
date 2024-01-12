const logger = require('edl-node-log-wrapper');
const DatasetApproval = require('../../../src/services/DatasetApproval');
const { DELETED, AVAILABLE, PENDING_DELETE } = require('../../../src/services/statusService');

describe('dataset approval tests', () => {
  const anyCustodian = 'anyAdGroup';
  const createProdSchema = () => ({id: 'some-schema--2', fields: [{name: 'foo'}], description: 'anyDescription', testing: false});
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
    status: AVAILABLE,
    name: 'DS',
    attachments: { currentAttachments: [] },
    usability: 5
  });

  const autoApprovedDataset = {
    "schemas": [],
    "linkedSchemas": [],
    "tables": [],
    "classifications": [
      {
        "id": "52adcf1a-1373-4880-956b-b92a01c773d1",
        "community": "a521b7d4-642c-4524-9c46-e4fa5e836a17",
        "subCommunity": "48112e16-9abf-48ed-ae79-ab43844a32ec",
        "gicp": "e43046c8-2472-43c5-9b63-e0b23ec09399",
        "personalInformation": false,
        "countriesRepresented": [],
        "development": false,
        "additionalTags": []
      },
      {
        "id": "4fc35405-1ccc-4a71-8e10-06328d6a0eb0",
        "community": "a521b7d4-642c-4524-9c46-e4fa5e836a17",
        "subCommunity": "53b001e4-b0ac-416d-aebf-a2d91c29ce7d",
        "gicp": "e43046c8-2472-43c5-9b63-e0b23ec09399",
        "personalInformation": false,
        "countriesRepresented": [],
        "development": false,
        "additionalTags": []
      }
    ],
    "sourceDatasets": [],
    "paths": [],
    "views": [],
    "discoveredTables": [],
    "_id": "175d48b3-b9fb-43f8-9f33-ed43fd486fd7-1",
    "name": "EDLTDL-210-CompanyUse",
    "description": "EDLTDL-210-CompanyUse",
    "requestComments": "No comments",
    "documentation": "",
    "custodian": "AWS-GIT-DWIS-DEV",
    "application": "TestTravis1234567",
    "category": {
      "id": "a234164e-e9c7-4d61-8e95-dc62132f6c0f",
      "name": "Transactional"
    },
    "dataRecovery": false,
    "phase": {
      "id": "bcd204b0-b567-4e6b-a5b9-a593943c7330",
      "name": "Enhance"
    },
    "technology": {
      "id": "1f8ee69b-62ad-42a3-9598-02947ea25670",
      "name": "AWS"
    },
    "physicalLocation": {
      "id": "6c2760b1-fabf-45fb-adc6-9d717e38b598",
      "name": "us-east-1"
    },
    "deletedSchemas": [],
    "attachments": {
      "newAttachments": [],
      "deletedAttachments": [],
      "currentAttachments": []
    },
    "sources": [],
    "id": "175d48b3-b9fb-43f8-9f33-ed43fd486fd7",
    "version": 1,
    "createdBy": "ARJ5QKA",
    "updatedBy": "ARJ5QKA",
    "createdAt": "2023-06-27T15:49:59.377Z",
    "updatedAt": "2023-06-27T15:49:59.377Z",
    "status": "AVAILABLE",
    "approvals": [
      {
        "approvedBy": "ARJ5QKA",
        "status": "APPROVED",
        "comment": null,
        "updatedAt": "2023-06-27T15:50:07.412Z",
        "approverEmail": "G90_COLLIBRA_APPROVER_SYSTEMS@JohnDeere.com",
        "subCommunity": {
          "id": "48112e16-9abf-48ed-ae79-ab43844a32ec",
          "name": "Demo",
          "approver": "G90_COLLIBRA_APPROVER_SYSTEMS"
        },
        "commentHistory": [
          {
            "status": "APPROVED",
            "updatedBy": "ARJ5QKA",
            "updatedAt": "2023-06-27T15:50:07.412Z",
            "comment": "user approved"
          }
        ],
        "reason": "user approved"
      },
      {
        "approvedBy": "ARJ5QKA",
        "status": "APPROVED",
        "comment": null,
        "updatedAt": "2023-06-27T15:50:07.412Z",
        "approverEmail": "G90_COLLIBRA_APPROVER_SYSTEMS@JohnDeere.com",
        "subCommunity": {
          "id": "53b001e4-b0ac-416d-aebf-a2d91c29ce7d",
          "name": "Logs",
          "approver": "G90_COLLIBRA_APPROVER_SYSTEMS"
        },
        "commentHistory": [
          {
            "status": "APPROVED",
            "updatedBy": "ARJ5QKA",
            "updatedAt": "2023-06-27T15:50:07.412Z",
            "comment": "user approved"
          }
        ],
        "reason": "user approved"
      },
      {
        "approvedBy": "ARJ5QKA",
        "status": "APPROVED",
        "comment": null,
        "updatedAt": "2023-06-27T15:50:07.412Z",
        "custodian": "AWS-GIT-DWIS-DEV",
        "approverEmail": "AWS-GIT-DWIS-DEV@JohnDeere.com",
        "commentHistory": [
          {
            "status": "APPROVED",
            "updatedBy": "ARJ5QKA",
            "updatedAt": "2023-06-27T15:50:07.412Z",
            "comment": "user approved"
          }
        ],
        "reason": "user approved"
      },
      {
        "system": "EDL",
        "status": "APPROVED",
        "details": {
          "dataset": {
            "name": "com.deere.enterprise.datalake.enhance.edltdl_210_companyuse",
            "values": [
              {
                "name": "Databricks Mount Location",
                "value": "/mnt/edl_dev/enhance/edltdl_210_companyuse"
              },
              {
                "name": "S3 Bucket Name",
                "value": "jd-us01-edl-devl-enhance-c361e24fdf10f24a1214441eae0609e0"
              },
              {
                "name": "Account",
                "value": "167834813982"
              },
              {
                "name": "Resource",
                "value": "Enterprise Data & Analytics Platform",
                "url": "https://confluence.deere.com/pages/viewpage.action?pageId=89358918"
              },
              {
                "name": "Resource",
                "value": "EDL Getting Started",
                "url": "https://confluence.deere.com/display/EDAP/EDL+Getting+Started"
              },
              {
                "name": "Resource",
                "value": "EDL Databricks Tutorials",
                "url": "https://confluence.deere.com/pages/viewpage.action?pageId=117932969"
              },
              {
                "name": "Resource",
                "value": "EDL + Databricks",
                "url": "https://confluence.deere.com/display/EDAP/Databricks"
              },
              {
                "name": "Resource",
                "value": "Ingesting Data",
                "url": "https://confluence.deere.com/display/EDAP/Ingesting+Data"
              }
            ]
          },
          "schemas": []
        },
        "approvedBy": "EDL",
        "updatedAt": "2023-06-27T15:50:21.153Z",
        "commentHistory": [
          {
            "status": "APPROVED",
            "updatedBy": "EDL",
            "updatedAt": "2023-06-27T15:50:21.153Z",
            "comment": "user approved"
          }
        ],
        "reason": "user approved"
      }
    ],
    "commentHistory": [
      {
        "updatedBy": "ARJ5QKA",
        "updatedAt": "2023-06-27T15:49:59.553Z",
        "comment": "No comments"
      }
    ],
    "usability": 0,
    "discoveredSchemas": [],
    "environment": {},
    "environmentName": "com.deere.enterprise.datalake.enhance.edltdl_210_companyuse",
    "storageLocation": "jd-us01-edl-devl-enhance-c361e24fdf10f24a1214441eae0609e0",
    "storageAccount": "167834813982"
  }

  const dataset = createDataset();
  const latestAvailable = createDataset();
  const userGroups = [anyCustodian];

  describe('require approval', () => {
    it('requests delete', async () => {
      const deleteDataset = {...createDataset(), status: PENDING_DELETE};
      const datasetApproval = new DatasetApproval(deleteDataset, latestAvailable, userGroups, logger);
      expect(await datasetApproval.requiresApproval()).toEqual(true);
    });

    it('deletes a dataset', async () => {
      const deleteDataset = {...createDataset(), status: DELETED};
      const datasetApproval = new DatasetApproval(deleteDataset, latestAvailable, userGroups, logger);
      expect(await datasetApproval.requiresApproval()).toEqual(true);
    });

    it('has a change by non-custodian', async () => {
      const nonCustodianUserGroups = ['nonCustodian'];
      const datasetApproval = new DatasetApproval(dataset, latestAvailable, nonCustodianUserGroups, logger);
      expect(await datasetApproval.requiresApproval()).toEqual(true);
    });

    it('has a path added', async () => {
      const addedSchemaDataset = {...createDataset(), paths: ['/', 'another pass']};
      const datasetApproval = new DatasetApproval(addedSchemaDataset, latestAvailable, userGroups, logger);
      expect(await datasetApproval.requiresApproval()).toEqual(true);
    });

    it('adds a schema', async () => {
      const addedSchemaDataset = {...createDataset(), schemas: [createProdSchema()]};
      const datasetApproval = new DatasetApproval(addedSchemaDataset, latestAvailable, userGroups, logger);
      expect(await datasetApproval.requiresApproval()).toEqual(true);
    });

    it('adds a linked schema', async () => {
      const addedSchemaDataset = {...createDataset(), linkedSchemas: [createProdSchema()]};
      const datasetApproval = new DatasetApproval(addedSchemaDataset, latestAvailable, userGroups, logger);
      expect(await datasetApproval.requiresApproval()).toEqual(true);
    });

    it('deletes a linked schema', async () => {
      const addedSchemaDataset = {...createDataset(), linkedSchemas: [createProdSchema()]};
      const datasetApproval = new DatasetApproval(dataset, addedSchemaDataset, userGroups, logger);
      expect(await datasetApproval.requiresApproval()).toEqual(true);
    });

    it('changes an important field', async () => {
      const changedGovernanceFieldDataset = {...createDataset(), name: 'aNewName'};
      const datasetApproval = new DatasetApproval(changedGovernanceFieldDataset, latestAvailable, userGroups, logger);
      expect(await datasetApproval.requiresApproval()).toEqual(true);
    });

    it('adds a table', async () => {
      const datasetWithAddedTable = {...createDataset(), tables: [{schemaId: 'abc--2'}]};
      const datasetApproval = new DatasetApproval(datasetWithAddedTable, latestAvailable, userGroups, logger);
      expect(await datasetApproval.requiresApproval()).toEqual(true);
    });
    it('adds a table and ignores forTesting', async () => {
      const datasetWithAddedTable = {
        ...createDataset(),
        tables: [{schemaId: 'abc--2'}],
        schemas: [{id: 'abc--2', testing: true}]
      };
      const datasetApproval = new DatasetApproval(datasetWithAddedTable, latestAvailable, userGroups, logger);
      expect(await datasetApproval.requiresApproval()).toEqual(false);
    });

    it('deletes a table', async () => {
      const datasetWithRemovedTable = {...createDataset(), tables: [{schemaId: 'abc--2'}]};
      const datasetApproval = new DatasetApproval(dataset, datasetWithRemovedTable, userGroups, logger);
      expect(await datasetApproval.requiresApproval()).toEqual(true);
    });
    it('deletes a table and ignores forTesting', async () => {
      const datasetWithRemovedTable = {
        ...createDataset(),
        tables: [{schemaId: 'abc--2'}],
        schemas: [{id: 'abc--2', testing: true}]
      };
      const datasetApproval = new DatasetApproval(dataset, datasetWithRemovedTable, userGroups, logger);
      expect(await datasetApproval.requiresApproval()).toEqual(false);
    });

    it('updates a table', async () => {
      const datasetWithUpdatedTable = {...createDataset(), tables: [{schemaId: 'abc--2', name: 'abc'}]};
      const datasetWithTable = {...createDataset(), tables: [{schemaId: 'abc--2', name: 'efg'}]};

      const datasetApproval = new DatasetApproval(datasetWithUpdatedTable, datasetWithTable, userGroups, logger);
      expect(await datasetApproval.requiresApproval()).toEqual(true);
    });

    it('updates a table and ignores forTesting', async () => {
      const datasetWithUpdatedTable = {
        ...createDataset(),
        tables: [{schemaId: 'abc--2', name: 'abc'}],
        schemas: [{id: 'abc--2', testing: true}]
      };
      const datasetWithTable = {
        ...createDataset(),
        tables: [{schemaId: 'abc--2', name: 'efg'}],
        schemas: [{id: 'abc--2', testing: true}]
      };

      const datasetApproval = new DatasetApproval(datasetWithUpdatedTable, datasetWithTable, userGroups, logger);
      expect(await datasetApproval.requiresApproval()).toEqual(false);
    });
  });

  describe('automatically approved', () => {
    it('updates a custodian updatable field', async () => {
      const addedSchemaDataset = {...createDataset(), description: 'a new description'};
      const datasetApproval = new DatasetApproval(dataset, addedSchemaDataset, userGroups, logger);
      expect(await datasetApproval.requiresApproval()).toEqual(false);
    });
    it('updates application', async () => {
      const addedSchemaDataset = {...createDataset(), application: 'a new application'};
      const datasetApproval = new DatasetApproval(dataset, addedSchemaDataset, userGroups, logger);
      expect(await datasetApproval.requiresApproval()).toEqual(false);
    });

    it('updates application with all company use classifications', async () => {
      let companyUseToggleValues = {"toggle":true,"communities":["a7b76f9e-8ff4-4171-9050-3706f1f12188","2e546443-92a3-4060-9fe7-22c2ec3d51b4","75b382e2-46b8-4fe8-9300-4ed096586629","a521b7d4-642c-4524-9c46-e4fa5e836a17"]}
      let classifications = [...autoApprovedDataset.classifications,
        {
          "id": "4fc35405-1ccc-4a71-8e10-06328d6a0eb0",
          "community": "a521b7d4-642c-4524-9c46-e4fa5e836a17",
          "subCommunity": "b9677668-3d02-434e-896f-7271b3221cc7",
          "gicp": "e43046c8-2472-43c5-9b63-e0b23ec09399",
          "personalInformation": false,
          "countriesRepresented": [],
          "development": false,
          "additionalTags": []
        }
        ];

      const datasetWithUpdatedClassification = {
        ...autoApprovedDataset,
        classifications: classifications
      };
      const datasetApproval = new DatasetApproval(datasetWithUpdatedClassification, autoApprovedDataset, ['AWS-GIT-DWIS-DEV'], logger);
      expect(await datasetApproval.requiresApproval(companyUseToggleValues)).toEqual(false);
    });

    it('updates dataset version in table schema ID', async () => {
      const datasetWithUpdatedTableVersion = {...createDataset(), tables: [{schemaId: 'abc--2'}]};
      const datasetWithTable = {...createDataset(), tables: [{schemaId: 'abc--1'}]};
      const datasetApproval = new DatasetApproval(datasetWithUpdatedTableVersion, datasetWithTable, userGroups, logger);
      expect(await datasetApproval.requiresApproval()).toEqual(false);
    });

    it('updates dataset with an attachment', async () => {
      const attachment = {
        key: "bcd5ebe1-bca5-4b45-b536-3b41c85bdb78-1/metaData.png",
        fileName: "metaData.png",
        bucketName: "anyBucket",
        account: "anyAccount",
        size: 9583
      }

      const originalAttachments = {newAttachments: [], deletedAttachments: [], currentAttachments: [attachment]};
      const updatedAttachments = {
        newAttachments: [],
        deletedAttachments: [],
        currentAttachments: [{...attachment, key: "bcd5ebe1-bca5-4b45-b536-3b41c85bdb78-2/metaData.png"}]
      };

      const datasetWithUpdatedAttachments = {...createDataset(), attachments: updatedAttachments};
      const datasetWithAttachments = {...createDataset(), attachments: originalAttachments};
      const datasetApproval = new DatasetApproval(datasetWithUpdatedAttachments, datasetWithAttachments, userGroups, logger);
      expect(await datasetApproval.requiresApproval()).toEqual(false);
    });

    it('deletes a path', async () => {
      const deletedPathsDataset = {...createDataset(), paths: ['/', 'anotherPath']};
      const datasetApproval = new DatasetApproval(dataset, deletedPathsDataset, userGroups, logger);
      expect(await datasetApproval.requiresApproval()).toEqual(false);
    });

    it('updates a schema description', async () => {
      const updatedSchemaDataset = {
        ...createDataset(),
        schemas: [{...createProdSchema(), description: 'a new description'}]
      };
      const datasetWithSchema = {...createDataset(), schemas: [createProdSchema()]};
      const datasetApproval = new DatasetApproval(updatedSchemaDataset, datasetWithSchema, userGroups, logger);
      expect(await datasetApproval.requiresApproval()).toEqual(false);
    });
  });
});
