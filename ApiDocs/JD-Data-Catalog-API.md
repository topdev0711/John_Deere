This service allows you to approve, reject, and view approvals from EDL Data Catalog as well as view permissions and datasets in the app.

**Authorization:**

In order to work with these endpoints, the consumer must provide a valid Okta OAuth bearer token. If you do not have a valid client ID setup to work with EDL refer to the [client credentials guide](https://confluence.deere.com/display/gsec/EDL+Client+Credentials+Applications). Community approvers must reach out the [Enterprise Data Lake Core Team](ENTERPRISEDATALAKECORETEAM@JohnDeere.com) in order to have their client associated with the correct community for approvals.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Dataset](#dataset)
  - [GET Datasets](#get-datasets)
  - [GET Dataset](#get-dataset)
  - [GET Dataset Versions](#get-dataset-versions)
  - [POST](#post)
  - [DELETE](#delete)
- [Permission](#permission)
  - [GET Permissions](#get-permissions)
  - [GET Permission](#get-permission)
  - [GET Permission Versions](#get-permission-versions)
  - [POST Permission](#get-permission-versions)
  - [POST Update Permission](#get-permission-versions)
- [References](#references)
  - [GET References](#get-references)- [Dataset](#dataset)
  - [GET Datasets](#get-datasets)
  - [GET Dataset](#get-dataset)
  - [GET Dataset Versions](#get-dataset-versions)
  - [POST](#post)
  - [DELETE](#delete)
- [Permission](#permission)
  - [GET Permissions](#get-permissions)
  - [GET Permission](#get-permission)
  - [GET Permission Versions](#get-permission-versions)
  - [POST Permission](#post-permission)
  - [POST Update Permission](#post-update-permission)
- [References](#references)
  - [GET References](#get-references)
- [Dataset Approvals](#dataset-approvals)
  - [GET](#get)
- [Permission Approvals](#permission-approvals)
  - [GET](#get-1)
- [Approve Dataset](#approve-dataset)
  - [POST](#post-1)
- [Reject Dataset](#reject-dataset)
  - [POST](#post-2)
- [Approve Permission](#approve-permission)
  - [POST](#post-3)
- [Reject Permission](#reject-permission)
  - [POST](#post-4)
- [Dataset Approvals](#dataset-approvals)
  - [GET](#get-2)
- [Permission Approvals](#permission-approvals)
  - [GET](#get-3)
- [Approve Dataset](#approve-dataset)
  - [POST](#post-2)
- [Reject Dataset](#reject-dataset)
  - [POST](#post-3)
- [Approve Permission](#approve-permission)
  - [POST](#post-4)
- [Reject Permission](#reject-permission)
  - [POST](#post-5)
<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Dataset
The `dataset` service returns information on a specific dataset version from the catalog.

### GET Datasets
Returns all datasets and is filtered by query parameter if provided
<br>
`/api-external/datasets?name=:name&status=:status&community=:community`

*Query Parameters:*
- `name`: filter any datasets that include this value in the name field of the dataset, will return all datasets if no name value provided
- `status`: filter by status of the dataset, by default only AVAILABLE datasets will be shown
- `community`: filter datasets such that the dataset must include at least one classification with the community specified
- `dateFilter`: filter datasets based on the parameter value provided in this parameter. Valid values are `createdAt and `updatedAt`. This is an optional parameter.
- `start`: provide start date in ISO format (YYYY-MM-DD / YYYY-MM-DD HH:MM:SS / YYYY-MM-DDTHH:MM:SS.000Z). This parameter is required when `dateFilter` is provided
- `end`: provide end date in ISO format (YYYY-MM-DD / YYYY-MM-DD HH:MM:SS / YYYY-MM-DDTHH:MM:SS.000Z). This parameter is optional when `dateFilter` is provided. In absence of `end` datasets will get filtered greater than or equal `start` date.
- `text`: keywords that will be searched for in dataset attributes NOTE: + should be used to separate each keyword
- `category`: filter on the category of data, i.e. Master, Reference, or Transactional
- `custodian`: filter on AD group that is responsible for the dataset, group name must start with AWS, EDG, or G90_COLLIBRA
- `gicp`: filter on gicp classification e.g. Unclassified
- `phase`: filter on the phase
- `country`: filter on the country
- `subCommunity`: filter on subCommunity
- `limit`: restrict how many datasets returned
- `personalInformation`: is true or false value as to whether dataset contains personal information

*Security:*
- `Authorization required`: Yes
- `OAuth Scope`: read:jdcatalog
- `Data`: None

<br>

**Basic Request:**
```
https://data-catalog.deere.com/api-external/datasets?name=Marvel&status=AVAILABLE&status=DELETED&community=systems&dateFilter=updatedAt&start=2020-06-02T00:00:00.000Z&end=2020-06-04T00:00:00.000Z
```

**Basic Response:**
```json
[
    {
        "documentation": "",
        "schemas": [],
        "linkedSchemas": [],
        "environment": {
            "id": "d963c1b0-c81b-404e-8c55-b88d7f48c4f8",
            "name": "EDL"
        },
        "technology": {
            "id": "1f8ee69b-62ad-42a3-9598-02947ea25670",
            "name": "AWS"
        },
        "version": 1,
        "classifications": [
            {
                "development": false,
                "additionalTags": [],
                "personalInformation": false,
                "countriesRepresented": [
                    {
                        "id": "c29bf721-aeb7-4ac9-ab79-110fb9beb8cb",
                        "name": "ALL"
                    }
                ],
                "community": {
                    "id": "a521b7d4-642c-4524-9c46-e4fa5e836a17",
                    "name": "Systems"
                },
                "subCommunity": {
                    "id": "48112e16-9abf-48ed-ae79-ab43844a32ec",
                    "name": "Demo"
                },
                "gicp": {
                    "id": "159d753e-c245-43eb-ba2b-7d29cb436c3d",
                    "name": "Unclassified"
                }
            }
        ],
        "environmentName": "com.deere.enterprise.datalake.raw.demo.marvel",
        "status": "AVAILABLE",
        "createdAt": "2019-11-12T02:55:52.888Z",
        "updatedBy": "tv82936",
        "createdBy": "tv82936",
        "name": "Demo Marvel",
        "phase": {
            "id": "bef5d851-c91e-4ba1-82b7-62a274ad189b",
            "name": "Raw"
        },
        "physicalLocation": {
            "id": "6c2760b1-fabf-45fb-adc6-9d717e38b598",
            "name": "us-east-1"
        },
        "updatedAt": "2019-11-12T02:55:52.888Z",
        "category": {
            "id": "dc2db157-e121-4ac1-8d16-dc38141616b5",
            "name": "Master"
        },
        "description": "Marvel Data",
        "id": "4024a647-1767-321f-9456-26b6fef2399f",
        "custodian": "AWS-GIT-DWIS-DEV",
        "approvals": [
            {
                "approvedBy": "EDL",
                "details": {
                    "dataset": {
                        "name": "com.deere.enterprise.datalake.raw.demo.marvel",
                        "values": [
                            {
                                "name": "Databricks Mount Location",
                                "value": "/mnt/edl/raw/demo_marvel"
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
                    }
                },
                "system": "EDL",
                "status": "APPROVED",
                "updatedAt": "2019-11-12T02:56:10.710Z",
                "community": {
                    "name": "Not Found",
                    "approver": null
                }
            }
        ],
        "storageLocation": "jd-us01-edl-prod-raw-856f096f056b7071c8c8930757e451e4",
        "storageAccount": "305463345279",
        "sourceDatasets": []
    }
]
```

### GET Dataset
Returns a single dataset.
<br><br>
`/api-external/datasets/:id`
<br>
returns the latest available dataset

`/api-external/datasets/:id/versions/:version`
<br>
returns the specific version of the dataset

*Query Parameters:* <br>
`isDetailed`: boolean value (true or false) that will provide detailed information about schemas and views such as all of the fields with their type and attributes, the default value is true, when false it will only provide id, name, and version for schemas and views. <br>
*Security:*
- `Authorization required`: Yes
- `OAuth Scope`: read:jdcatalog
- `Data`: None

<br>

**Basic Request:**
For a specific version
```
https://data-catalog.deere.com/api-external/datasets/4024a647-1767-321f-9456-26b6fef2399f/versions/1
```

For the latest available version
```
https://data-catalog.deere.com/api-external/datasets/0106a7c0-c212-3a41-9dbd-0a5a38e77d20
```

**Basic Response:**
```json
{
    "schemas": [
        {
            "id": "85a59eda-6ef0-4737-a92f-9a6bd03c0ea4--65",
            "name": "Demo Marvel Comic Characters",
            "version": "0.0.8",
            "description": "Comic Character Stats test",
            "documentation": "Coming Soon! test",
            "partitionedBy": [
                "ExtractTime",
                "Alignment"
            ],
            "testing": false,
            "fields": [
                {
                    "name": "Name",
                    "attribute": "id",
                    "datatype": "string",
                    "description": "The character name",
                    "nullable": false
                },
                {
                    "name": "Alignment",
                    "attribute": "None",
                    "datatype": "string",
                    "description": "Good, bad or something else...",
                    "nullable": false
                }
            ],
            "environmentName": "com.deere.enterprise.datalake.enhance.demo_marvel_comic_characters"
        }
    ],
    "linkedSchemas": [],
    "tables": [
        {
            "schemaVersion": "0.0.8",
            "schemaName": "Demo Marvel Comic Characters",
            "schemaId": "85a59eda-6ef0-4737-a92f-9a6bd03c0ea4--65",
            "tableName": "demo_marvel_comiccharacters_old"
        }
    ],
    "classifications": [
        {
            "development": true,
            "additionalTags": [],
            "personalInformation": false,
            "countriesRepresented": [
                {
                    "id": "c29bf721-aeb7-4ac9-ab79-110fb9beb8cb",
                    "name": "ALL"
                }
            ],
            "id": "f4ef7035-5738-4185-bb69-c0e355ed54de",
            "community": {
                "id": "a521b7d4-642c-4524-9c46-e4fa5e836a17",
                "name": "Systems"
            },
            "subCommunity": {
                "id": "48112e16-9abf-48ed-ae79-ab43844a32ec",
                "name": "Demo"
            },
            "gicp": {
                "id": "159d753e-c245-43eb-ba2b-7d29cb436c3d",
                "name": "Unclassified"
            }
        }
    ],
    "sourceDatasets": [],
    "paths": [
        "/"
    ],
    "_id": "0106a7c0-c212-3a41-9dbd-0a5a38e77d20-65",
    "technology": {
        "id": "1f8ee69b-62ad-42a3-9598-02947ea25670",
        "name": "AWS"
    },
    "version": 65,
    "documentation": "New documentation By Pass",
    "status": "AVAILABLE",
    "createdAt": "2020-10-06T09:02:11.953Z",
    "updatedBy": "uzimya0",
    "createdBy": "uzimya0",
    "name": "Demo Marvel Comic Characters",
    "phase": {
        "id": "bcd204b0-b567-4e6b-a5b9-a593943c7330",
        "name": "Enhance"
    },
    "physicalLocation": {
        "id": "6c2760b1-fabf-45fb-adc6-9d717e38b598",
        "name": "us-east-1"
    },
    "updatedAt": "2020-10-06T09:02:12.109Z",
    "category": {
        "id": "dc2db157-e121-4ac1-8d16-dc38141616b5",
        "name": "Master"
    },
    "requestComments": "No comments",
    "description": "Marvel Comic Book  Characters",
    "id": "0106a7c0-c212-3a41-9dbd-0a5a38e77d20",
    "custodian": "AWS-GIT-DWIS-ADMIN",
    "approvals": [
        {
            "approvedBy": "uzimya0",
            "comment": null,
            "approverEmail": "AWS-GIT-DWIS-ADMIN@JohnDeere.com",
            "custodian": "AWS-GIT-DWIS-ADMIN",
            "status": "APPROVED",
            "updatedAt": "2020-10-06T09:02:32.734Z"
        },
        {
            "approvedBy": "EDL",
            "details": {
                "dataset": {
                    "name": "com.deere.enterprise.datalake.enhance.demo_marvel_comic_characters_new",
                    "values": [
                        {
                            "name": "Databricks Mount Location",
                            "value": "/mnt/edl_dev/enhance/demo_marvel_comic_characters_new"
                        },
                        {
                            "name": "S3 Bucket Name",
                            "value": "jd-us01-edl-devl-enhance-661b71118597dab5a14a1c2c42d57276"
                        },
                        {
                            "name": "Account",
                            "value": "078228365593"
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
                "schemas": [
                    {
                        "id": "85a59eda-6ef0-4737-a92f-9a6bd03c0ea4--65",
                        "name": "com.deere.enterprise.datalake.enhance.demo_marvel_comic_characters@0.0.8",
                        "values": [
                            {
                                "name": "Databricks Table",
                                "value": "demo_marvel_comiccharacters_old_0_0_8"
                            },
                            {
                                "name": "Databricks Table",
                                "value": "demo_marvel_comiccharacters_old"
                            },
                            {
                                "name": "Resource",
                                "value": "EDL Warehouse",
                                "url": "https://confluence.deere.com/display/EDAP/EDL+Warehouse"
                            },
                            {
                                "name": "Resource",
                                "value": "BI Tools or SQL Clients",
                                "url": "https://confluence.deere.com/display/EDAP/Using+BI+Tools+or+SQL+Clients"
                            }
                        ]
                    }
                ]
            },
            "system": "EDL",
            "status": "APPROVED",
            "updatedAt": "2020-10-06T09:02:38.570Z",
            "community": {
                "name": "Not Found",
                "approver": null
            }
        }
    ],
    "environmentName": "com.deere.enterprise.datalake.enhance.demo_marvel_comic_characters_new",
    "discoveredSchemas": [],
    "views": [
        {
            "id": "edl_views_devl.test_view",
            "name": "edl_views_devl.test_view",
            "version": "1.0.0",
            "description": "this is test type for event testing",
            "documentation": "",
            "partitionedBy": [],
            "testing": false,
            "fields": [
                {
                    "name": "id",
                    "attribute": "id",
                    "datatype": "int",
                    "description": "this is id filed",
                    "nullable": false
                },
                {
                    "name": "updated_ts",
                    "attribute": "extract time",
                    "datatype": "timestamp",
                    "description": "this is last updated timestamp",
                    "nullable": false
                },
                {
                    "name": "del_ind",
                    "attribute": "delete indicator",
                    "datatype": "int",
                    "description": "delete indicator",
                    "nullable": false
                },
                {
                    "name": "name",
                    "attribute": "None",
                    "datatype": "string",
                    "description": "contains name",
                    "nullable": false
                },
                {
                    "name": "address",
                    "attribute": "None",
                    "datatype": "string",
                    "description": "address field",
                    "nullable": false
                }
            ],
            "status": "AVAILABLE"
        }
    ],
    "environment": {},
    "dataRecovery": false,
    "discoveredTables": [],
    "attachments": {
        "currentAttachments": []
    }
}
```
<br><br>

**Basic Request with query parameter:**
```
https://data-catalog.deere.com/api-external/datasets/0106a7c0-c212-3a41-9dbd-0a5a38e77d20?isDetailed=false
```

**Basic Response with query parameter:**

```json
{
    "schemas": [
        {
            "id": "85a59eda-6ef0-4737-a92f-9a6bd03c0ea4--65",
            "name": "Demo Marvel Comic Characters",
            "version": "0.0.8"
        }
    ],
    "linkedSchemas": [],
    "tables": [
        {
            "schemaVersion": "0.0.8",
            "schemaName": "Demo Marvel Comic Characters",
            "schemaId": "85a59eda-6ef0-4737-a92f-9a6bd03c0ea4--65",
            "tableName": "demo_marvel_comiccharacters_old"
        }
    ],
    "classifications": [
        {
            "development": true,
            "additionalTags": [],
            "personalInformation": false,
            "countriesRepresented": [
                {
                    "id": "c29bf721-aeb7-4ac9-ab79-110fb9beb8cb",
                    "name": "ALL"
                }
            ],
            "id": "f4ef7035-5738-4185-bb69-c0e355ed54de",
            "community": {
                "id": "a521b7d4-642c-4524-9c46-e4fa5e836a17",
                "name": "Systems"
            },
            "subCommunity": {
                "id": "48112e16-9abf-48ed-ae79-ab43844a32ec",
                "name": "Demo"
            },
            "gicp": {
                "id": "159d753e-c245-43eb-ba2b-7d29cb436c3d",
                "name": "Unclassified"
            }
        }
    ],
    "sourceDatasets": [],
    "paths": [
        "/"
    ],
    "_id": "0106a7c0-c212-3a41-9dbd-0a5a38e77d20-65",
    "technology": {
        "id": "1f8ee69b-62ad-42a3-9598-02947ea25670",
        "name": "AWS"
    },
    "version": 65,
    "documentation": "New documentation By Pass",
    "status": "AVAILABLE",
    "createdAt": "2020-10-06T09:02:11.953Z",
    "updatedBy": "uzimya0",
    "createdBy": "uzimya0",
    "name": "Demo Marvel Comic Characters",
    "phase": {
        "id": "bcd204b0-b567-4e6b-a5b9-a593943c7330",
        "name": "Enhance"
    },
    "physicalLocation": {
        "id": "6c2760b1-fabf-45fb-adc6-9d717e38b598",
        "name": "us-east-1"
    },
    "updatedAt": "2020-10-06T09:02:12.109Z",
    "category": {
        "id": "dc2db157-e121-4ac1-8d16-dc38141616b5",
        "name": "Master"
    },
    "requestComments": "No comments",
    "description": "Marvel Comic Book  Characters",
    "id": "0106a7c0-c212-3a41-9dbd-0a5a38e77d20",
    "custodian": "AWS-GIT-DWIS-ADMIN",
    "approvals": [
        {
            "approvedBy": "uzimya0",
            "comment": null,
            "approverEmail": "AWS-GIT-DWIS-ADMIN@JohnDeere.com",
            "custodian": "AWS-GIT-DWIS-ADMIN",
            "status": "APPROVED",
            "updatedAt": "2020-10-06T09:02:32.734Z"
        },
        {
            "approvedBy": "EDL",
            "details": {
                "dataset": {
                    "name": "com.deere.enterprise.datalake.enhance.demo_marvel_comic_characters_new",
                    "values": [
                        {
                            "name": "Databricks Mount Location",
                            "value": "/mnt/edl_dev/enhance/demo_marvel_comic_characters_new"
                        },
                        {
                            "name": "S3 Bucket Name",
                            "value": "jd-us01-edl-devl-enhance-661b71118597dab5a14a1c2c42d57276"
                        },
                        {
                            "name": "Account",
                            "value": "078228365593"
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
                "schemas": [
                    {
                        "id": "85a59eda-6ef0-4737-a92f-9a6bd03c0ea4--65",
                        "name": "com.deere.enterprise.datalake.enhance.demo_marvel_comic_characters@0.0.8",
                        "values": [
                            {
                                "name": "Databricks Table",
                                "value": "demo_marvel_comiccharacters_old_0_0_8"
                            },
                            {
                                "name": "Databricks Table",
                                "value": "demo_marvel_comiccharacters_old"
                            },
                            {
                                "name": "Resource",
                                "value": "EDL Warehouse",
                                "url": "https://confluence.deere.com/display/EDAP/EDL+Warehouse"
                            },
                            {
                                "name": "Resource",
                                "value": "BI Tools or SQL Clients",
                                "url": "https://confluence.deere.com/display/EDAP/Using+BI+Tools+or+SQL+Clients"
                            }
                        ]
                    }
                ]
            },
            "system": "EDL",
            "status": "APPROVED",
            "updatedAt": "2020-10-06T09:02:38.570Z",
            "community": {
                "name": "Systems",
                "approver": "EDL"
            }
        }
    ],
    "environmentName": "com.deere.enterprise.datalake.enhance.demo_marvel_comic_characters_new",
    "discoveredSchemas": [],
    "views": [
        {
            "name": "edl_views_devl.test_view",
            "status": "AVAILABLE"
        }
    ],
    "environment": {},
    "dataRecovery": false,
    "discoveredTables": [
        "edl_testTable",
        "edl_testTable1"
    ],
    "attachments": {
        "currentAttachments": []
    }
}
```
### GET Dataset Versions
Returns all versions of a dataset
returns the specific version of the dataset

`/api-external/datasets/:id/versions`

*Security:*
- `Authorization required`: Yes
- `OAuth Scope`: read:jdcatalog
- `Data`: None

<br>

**Basic Request:**
```
https://data-catalog.deere.com/api-external/datasets/4024a647-1767-321f-9456-26b6fef2399f/versions
```

**Basic Response:**
```json
[
    {
        "documentation": "",
        "schemas": [],
        "linkedSchemas": [],
        "environment": {
            "id": "d963c1b0-c81b-404e-8c55-b88d7f48c4f8",
            "name": "EDL"
        },
        "technology": {
            "id": "1f8ee69b-62ad-42a3-9598-02947ea25670",
            "name": "AWS"
        },
        "version": 1,
        "classifications": [
            {
                "development": false,
                "additionalTags": [],
                "personalInformation": false,
                "countriesRepresented": [
                    {
                        "id": "c29bf721-aeb7-4ac9-ab79-110fb9beb8cb",
                        "name": "ALL"
                    }
                ],
                "community": {
                    "id": "a521b7d4-642c-4524-9c46-e4fa5e836a17",
                    "name": "Systems"
                },
                "subCommunity": {
                    "id": "48112e16-9abf-48ed-ae79-ab43844a32ec",
                    "name": "Demo"
                },
                "gicp": {
                    "id": "159d753e-c245-43eb-ba2b-7d29cb436c3d",
                    "name": "Unclassified"
                }
            }
        ],
        "environmentName": "com.deere.enterprise.datalake.raw.demo.marvel",
        "status": "AVAILABLE",
        "createdAt": "2019-11-12T02:55:52.888Z",
        "updatedBy": "tv82936",
        "createdBy": "tv82936",
        "name": "Demo Marvel",
        "phase": {
            "id": "bef5d851-c91e-4ba1-82b7-62a274ad189b",
            "name": "Raw"
        },
        "physicalLocation": {
            "id": "6c2760b1-fabf-45fb-adc6-9d717e38b598",
            "name": "us-east-1"
        },
        "updatedAt": "2019-11-12T02:55:52.888Z",
        "category": {
            "id": "dc2db157-e121-4ac1-8d16-dc38141616b5",
            "name": "Master"
        },
        "description": "Marvel Data",
        "id": "4024a647-1767-321f-9456-26b6fef2399f",
        "custodian": "AWS-GIT-DWIS-DEV",
        "approvals": [
            {
                "approvedBy": "EDL",
                "details": {
                    "dataset": {
                        "name": "com.deere.enterprise.datalake.raw.demo.marvel",
                        "values": [
                            {
                                "name": "Databricks Mount Location",
                                "value": "/mnt/edl/raw/demo_marvel"
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
                    }
                },
                "system": "EDL",
                "status": "APPROVED",
                "updatedAt": "2019-11-12T02:56:10.710Z",
                "community": {
                    "name": "Not Found",
                    "approver": null
                }
            }
        ],
        "sourceDatasets": []
    },
    {
        "documentation": "added a new schema",
        "schemas": ["d1234567-c81b-404e-8c55-b88d7f48c4123"],
        "linkedSchemas": [],
        "environment": {
            "id": "d963c1b0-c81b-404e-8c55-b88d7f48c4f8",
            "name": "EDL"
        },
        "technology": {
            "id": "1f8ee69b-62ad-42a3-9598-02947ea25670",
            "name": "AWS"
        },
        "version": 2,
        "classifications": [
            {
                "development": false,
                "additionalTags": [],
                "personalInformation": false,
                "countriesRepresented": [
                    {
                        "id": "c29bf721-aeb7-4ac9-ab79-110fb9beb8cb",
                        "name": "ALL"
                    }
                ],
                "community": {
                    "id": "a521b7d4-642c-4524-9c46-e4fa5e836a17",
                    "name": "Systems"
                },
                "subCommunity": {
                    "id": "48112e16-9abf-48ed-ae79-ab43844a32ec",
                    "name": "Demo"
                },
                "gicp": {
                    "id": "159d753e-c245-43eb-ba2b-7d29cb436c3d",
                    "name": "Unclassified"
                }
            }
        ],
        "environmentName": "com.deere.enterprise.datalake.raw.demo.marvel",
        "status": "AVAILABLE",
        "createdAt": "2019-11-12T02:55:52.888Z",
        "updatedBy": "tv82936",
        "createdBy": "tv82936",
        "name": "Demo Marvel",
        "phase": {
            "id": "bef5d851-c91e-4ba1-82b7-62a274ad189b",
            "name": "Raw"
        },
        "physicalLocation": {
            "id": "6c2760b1-fabf-45fb-adc6-9d717e38b598",
            "name": "us-east-1"
        },
        "updatedAt": "2019-11-12T02:55:52.888Z",
        "category": {
            "id": "dc2db157-e121-4ac1-8d16-dc38141616b5",
            "name": "Master"
        },
        "description": "Marvel Data",
        "id": "4024a647-1767-321f-9456-26b6fef2399f",
        "custodian": "AWS-GIT-DWIS-DEV",
        "approvals": [
            {
                "approvedBy": "EDL",
                "details": {
                    "dataset": {
                        "name": "com.deere.enterprise.datalake.raw.demo.marvel",
                        "values": [
                            {
                                "name": "Databricks Mount Location",
                                "value": "/mnt/edl/raw/demo_marvel"
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
                    }
                },
                "system": "EDL",
                "status": "APPROVED",
                "updatedAt": "2019-11-12T02:56:10.710Z",
                "community": {
                    "name": "Not Found",
                    "approver": null
                }
            }
        ],
        "sourceDatasets": []
    }
]
```

### POST
`/api-external/datasets/`

*Security:*
- `Authorization required`: Yes
- `OAuth Scope`: write:jdcatalog
- `Data`: None

<br>

**Basic Request:**
<br>
Create a new dataset
```
https://data-catalog.deere.com/api-external/datasets
```

Update an existing dataset
```
https://data-catalog.deere.com/api-external/datasets/:id
```

*Path Parameters:*
- **id:** This is the edl data catalog id, note this is returned when creating or updating a dataset and is also contained in the url if you select it in the web app.

**Basic Body:**
```json
{
  "name": "A Sample dataset",
  "description": "an updated description of the dataset",
  "documentation": "updated information, including markdown about the dataset",
  "custodian": "AWS-My-AD-Goup",
  "sourceDatasets": [
    "some-id-45678"
  ],
  "category": "Transactional",
  "environment": "EDL",
  "phase": "Raw",
  "technology": "AWS",
  "physicalLocation": "us-east-1",
  "tables": [
    {
      "schemaName": "My Schema",
      "schemaVersion": "1.0.0",
      "tableName": "my_schema"
    },
    {
      "schemaId": "123-456-789--1",
      "schemaName": "some one else's schema",
      "schemaVersion": "1.0.0",
      "tableName": "my_linked_schema"
    }
  ],
  "deletedSchemas": ["987-654-321--1"],
  "linkedSchemas": ["123-456-789--1"],
  "schemas": [
    {
      "name": "My Schema",
      "version": "1.0.0",
      "description": "A description of the dataset",
      "documentation": "some more specific markdown schema documentation ",
      "partitionedBy": [
        "Alignment"
      ],
      "testing": false,
      "fields": [
        {
          "name": "Name",
          "attribute": "id",
          "datatype": "string",
          "description": "The name of the character",
          "nullable": false
        },
        {
          "name": "Intelligence",
          "attribute": "None",
          "datatype": "int",
          "description": "The level of intelligence",
          "nullable": false
        }
      ]
    }
  ],
  "classifications": [
    {
      "community": "Channel",
      "subCommunity": "Dealer",
      "countriesRepresented": [
        "ALL"
      ],
      "gicp": "Confidential",
      "personalInformation": false,
      "development": false,
      "additionalTags": []
    }
  ]
}
```

**Basic Response:**
```
Status: 200 OK
```
```json
{
  "id": "1234-5678-4321-9876",
  "version": 1
}
```

Note: linkedSchemas are stored in the form "{schema id}--{dataset version}"
<br><br>
**Difference between GET and POST JSON**
<br>
If you use the GET call to get a dataset you want to update in addition to the changes you want to make you must modify the structure.  Most attributes are in the format attribute:{ id, name }
e.g.
```
"phase": {
  "id": "bef5d851-c91e-4ba1-82b7-62a274ad189b",
  "name": "Raw"
}
```

as shown above the format on the post will be
```
"phase":"Raw"
```

**Validation notes**
- All of the fields in the example above are required with the exception of dataset documentation, deletedSchemas, schema description, schema field descriptions, table schemaIds
  - a table schema id is optional because a schema name and version are unique within a dataset and can be inferred; however, a linked schema is from a different dataset and is only uniquely identifiable by its id.
- A dataset cannot be created or updated if the dataset is being updated and has at least one Approver has approved
- A dataset cannot be created with the same name and phase of an existing dataset
- The name and phase of a dataset of an existing dataset cannot be changed
- A schema cannot be removed if another dataset has it in its list of linkedSchemas
- On an existing schema
  - the name cannot be changed
  - the version cannot be changed
  - partitionBy cannot be changed
  - fields cannot be added or removed
  - a field cannot be modified except for the description

### DELETE
`/api-external/datasets/`

*Security:*
- `Authorization required`: Yes
- `OAuth Scope`: delete:jdcatalog, or admin:jdcatalog
- `Data`: None

<br>

**Basic Request:**
Delete a dataset
<br>
```
https://data-catalog.deere.com/api-external/datasets/:id
```

*Path Parameters:*
- **id:** This is the EDL Data Catalog dataset id, note this is returned when creating or updating a dataset and is also contained in the url if you select it in the web app.

**Basic Body:** This is optional in case user wants to provide comments
```json
{
    "requestComments": "A sample comment"
}
```
**Basic Response:**
```
Status: 200 OK
```
```json
{
  "id": "1234-5678-4321-9876",
  "version": 2
}
```
**Notes
- The returned id and version refer to the newly created pending dataset that approvers must approve in order for the dataset to be deleted. This dataset can be reviewed to check the status of the request.
- This is non-recoverable delete, please be sure before using delete api.

**Validation notes**
- `id` provided in request parameter should be valid id and must exist as dataset
- `id` of the latest dataset should be in 'AVAILABLE' status.

## Permission
The `permission` service returns information on a specific permission version from the catalog.

<br>

### GET Permissions
Returns all permissions and is filtered by the query parameters
<br>
`/api-external/permissions?name=:name&status=:status`
<br>
returns the specific version of the dataset
<br>
*Query Parameters:*
- `name`: filter any permissions that include this value in the name field of the permissions, will return all permissions if no name value provided
- `status`: filter by status of the permission, by default only AVAILABLE permissions will be shown
- `dateFilter`: filter permissions based on the parameter value provided in this parameter. Valid values are `createdAt and `updatedAt`. This is an optional parameter.
- `start`: provide start date in ISO format (YYYY-MM-DD / YYYY-MM-DD HH:MM:SS / YYYY-MM-DDTHH:MM:SS.000Z). This parameter is required when `dateFilter` is provided
- `end`: provide end date in ISO format (YYYY-MM-DD / YYYY-MM-DD HH:MM:SS / YYYY-MM-DDTHH:MM:SS.000Z). This parameter is optional when `dateFilter` is provided. In absence of `end` permissions will get filtered greater than or equal `start` date.

*Security:*
- `Authorization required`: Yes
- `OAuth Scope`: read:jdcatalog
- `Data`: None

<br>

**Basic Request:**
```
https://data-catalog.deere.com/api-external/permissions?name=DWIS&status=AVAILABLE&status=DELETED&dateFilter=updatedAt&start=2020-06-02T00:00:00.000Z&end=2020-06-04T00:00:00.000Z
```

**Basic Response:**
```json
[
    {
        "version": 5,
        "status": "AVAILABLE",
        "createdAt": "2019-12-13T20:26:13.861Z",
        "updatedBy": "rr56156",
        "group": "AWS-GIT-DWIS-DEV",
        "createdBy": "rr56156",
        "entitlements": [
            {
                "additionalTags": [],
                "development": false,
                "personalInformation": false,
                "countriesRepresented": [
                    {
                        "id": "01047975-5348-4d4e-a0f9-2dd8f8e934b3",
                        "name": "US"
                    }
                ],
                "community": {
                    "id": "a521b7d4-642c-4524-9c46-e4fa5e836a17",
                    "name": "Systems"
                },
                "actions": [
                    {
                        "id": "a9c184db-7d2e-4481-8ff3-906cfdaa231d",
                        "name": "Read"
                    }
                ],
                "subCommunity": {
                    "id": "b9677668-3d02-434e-896f-7271b3221cc7",
                    "name": "Metrics"
                },
                "gicp": {
                    "id": "159d753e-c245-43eb-ba2b-7d29cb436c3d",
                    "name": "Unclassified"
                }
            }
        ],
        "businessCase": "EDL needs access",
        "roleType": "human",
        "updatedAt": "2019-12-13T20:26:13.861Z",
        "startDate": "2019-12-13T06:00:00.000Z",
        "requestComments": "No comments",
        "description": "Access to EDL role",
        "id": "22edf647-c441-4cab-87a1-ce977352eab4",
        "approvals": [
            {
                "approvedBy": "rr56156",
                "comment": null,
                "approverEmail": "G90_COLLIBRA_APPROVER_SYSTEMS@JohnDeere.com",
                "community": {
                    "id": "a521b7d4-642c-4524-9c46-e4fa5e836a17",
                    "name": "Systems",
                    "approver": "G90_COLLIBRA_APPROVER_SYSTEMS"
                },
                "status": "APPROVED",
                "updatedAt": "2019-12-13T20:26:32.764Z"
            },
            {
                "approvedBy": "EDL",
                "system": "EDL",
                "status": "APPROVED",
                "updatedAt": "2019-12-13T20:26:38.085Z",
                "community": {
                    "name": "Not Found",
                    "approver": null
                }
            }
        ]
    }
]
```

### GET Permission
Returns a single permission.
<br>
`/api-external/permission/:id`
<br>
returns the latest available permission
<br><br>
`/api-external/permission/:id/versions/:version`
<br>
returns the specific version of the permission

*Security:*
- `Authorization required`: Yes
- `OAuth Scope`: read:jdcatalog
- `Data`: None

<br>

**Basic Request:**
```
https://data-catalog.deere.com/api-external/permissions/22edf647-c441-4cab-87a1-ce977352eab4/versions/1
```

**Basic Response:**
```json
{
    "version": 1,
    "status": "AVAILABLE",
    "createdAt": "2019-12-13T20:26:13.861Z",
    "updatedBy": "rr56156",
    "group": "AWS-GIT-DWIS-DEV",
    "createdBy": "rr56156",
    "entitlements": [
        {
            "additionalTags": [],
            "development": false,
            "personalInformation": false,
            "countriesRepresented": [
                {
                    "id": "01047975-5348-4d4e-a0f9-2dd8f8e934b3",
                    "name": "US"
                }
            ],
            "community": {
                "id": "a521b7d4-642c-4524-9c46-e4fa5e836a17",
                "name": "Systems"
            },
            "actions": [
                {
                    "id": "a9c184db-7d2e-4481-8ff3-906cfdaa231d",
                    "name": "Read"
                }
            ],
            "subCommunity": {
                "id": "b9677668-3d02-434e-896f-7271b3221cc7",
                "name": "Metrics"
            },
            "gicp": {
                "id": "159d753e-c245-43eb-ba2b-7d29cb436c3d",
                "name": "Unclassified"
            }
        }
    ],
    "businessCase": "EDL needs access",
    "roleType": "human",
    "updatedAt": "2019-12-13T20:26:13.861Z",
    "startDate": "2019-12-13T06:00:00.000Z",
    "requestComments": "No comments",
    "description": "Access to EDL role",
    "id": "22edf647-c441-4cab-87a1-ce977352eab4",
    "approvals": [
        {
            "approvedBy": "rr56156",
            "comment": null,
            "approverEmail": "G90_COLLIBRA_APPROVER_SYSTEMS@JohnDeere.com",
            "community": {
                "id": "a521b7d4-642c-4524-9c46-e4fa5e836a17",
                "name": "Systems",
                "approver": "G90_COLLIBRA_APPROVER_SYSTEMS"
            },
            "status": "APPROVED",
            "updatedAt": "2019-12-13T20:26:32.764Z"
        },
        {
            "approvedBy": "EDL",
            "system": "EDL",
            "status": "APPROVED",
            "updatedAt": "2019-12-13T20:26:38.085Z",
            "community": {
                "name": "Not Found",
                "approver": null
            }
        }
    ]
}
```

### GET Permission Versions
Returns all versions of a permission

`/api-external/permissions/:id/versions`

*Security:*
- `Authorization required`: Yes
- `OAuth Scope`: read:jdcatalog
- `Data`: None

<br>

**Basic Request:**
```
https://data-catalog.deere.com/api-external/permissions/22edf647-c441-4cab-87a1-ce977352eab4/versions
```

**Basic Response:**
```json
[
    {
        "version": 1,
        "status": "AVAILABLE",
        "createdAt": "2019-12-13T20:26:13.861Z",
        "updatedBy": "rr56156",
        "group": "AWS-GIT-DWIS-DEV",
        "createdBy": "rr56156",
        "entitlements": [
            {
                "additionalTags": [],
                "development": false,
                "personalInformation": false,
                "countriesRepresented": [
                    {
                        "id": "01047975-5348-4d4e-a0f9-2dd8f8e934b3",
                        "name": "US"
                    }
                ],
                "community": {
                    "id": "a521b7d4-642c-4524-9c46-e4fa5e836a17",
                    "name": "Systems"
                },
                "actions": [
                    {
                        "id": "a9c184db-7d2e-4481-8ff3-906cfdaa231d",
                        "name": "Read"
                    }
                ],
                "subCommunity": {
                    "id": "b9677668-3d02-434e-896f-7271b3221cc7",
                    "name": "Metrics"
                },
                "gicp": {
                    "id": "159d753e-c245-43eb-ba2b-7d29cb436c3d",
                    "name": "Unclassified"
                }
            }
        ],
        "businessCase": "EDL needs access",
        "roleType": "human",
        "updatedAt": "2019-12-13T20:26:13.861Z",
        "startDate": "2019-12-13T06:00:00.000Z",
        "requestComments": "No comments",
        "description": "Access to EDL role",
        "id": "22edf647-c441-4cab-87a1-ce977352eab4",
        "approvals": [
            {
                "approvedBy": "rr56156",
                "comment": null,
                "approverEmail": "G90_COLLIBRA_APPROVER_SYSTEMS@JohnDeere.com",
                "community": {
                    "id": "a521b7d4-642c-4524-9c46-e4fa5e836a17",
                    "name": "Systems",
                    "approver": "G90_COLLIBRA_APPROVER_SYSTEMS"
                },
                "status": "APPROVED",
                "updatedAt": "2019-12-13T20:26:32.764Z"
            },
            {
                "approvedBy": "EDL",
                "system": "EDL",
                "status": "APPROVED",
                "updatedAt": "2019-12-13T20:26:38.085Z",
                "community": {
                    "name": "Not Found",
                    "approver": null
                }
            }
        ]
    }
]
```

### POST Permission
Submits a new permission for approval.

`/api-external/permissions`

*Security:*
- `Authorization required`: Yes
- `OAuth Scope`: read:jdcatalog
- `Data`: None

<br>

**Basic Request:**
```
https://data-catalog.deere.com/api-external/permissions
```

**Basic Body**
```json
{
    "group": "AWS-GIT-DWIS-ADMIN",            // AD Group for human permission. (Optional)
    "clientId": "some-client-id",             // Client ID for system permission. (Optional)
    "name": "AWS-GIT-DWIS-ADMIN Permission",  // Name of the permission.
    "entitlements": [                         // Entitlements used to determine access.
        {
            "additionalTags": [],
            "development": false,
            "personalInformation": false,
            "countriesRepresented": ["ALL"],
            "community": "Systems",
            "subCommunity": "Demo",
            "gicp": "Personal & Confidential"
        }
    ],
    "businessCase": "Some case.",             // Business case for a permission.
    "roleType": "human",                      // Roletype, either human or system. 
    "startDate": "2019-11-25T06:00:00.000Z",  // Start date of permission. Based on day.
    "endDate": "2019-11-26T06:00:00.000Z",    // End date of permission. Based on day. (Optional)
    "requestComments": "No comments"          // Comments for approvers.
}
```

**Basic Response:**
```json
{
  "id": "52a22e63-bebc-43b1-8d18-7b9bf3d09cac",
  "version": 1
}
```

### POST Update Permission
Submits an updated permission for approval.

`/api-external/permissions/:id`

*Security:*
- `Authorization required`: Yes
- `OAuth Scope`: read:jdcatalog
- `Data`: None

<br>

**Basic Request:**
```
https://data-catalog.deere.com/api-external/permissions/some-id
```

**Basic Body**
```json
{
    "group": "AWS-GIT-DWIS-ADMIN",            // AD Group for human permission. (Optional)
    "clientId": "some-client-id",             // Client ID for system permission. (Optional)
    "name": "AWS-GIT-DWIS-ADMIN Permission",  // Name of the permission.
    "entitlements": [                         // Entitlements used to determine access.
        {
            "additionalTags": [],
            "development": false,
            "personalInformation": false,
            "countriesRepresented": ["ALL"],
            "community": "Systems",
            "subCommunity": "Demo",
            "gicp": "Personal & Confidential"
        }
    ],
    "businessCase": "Some case.",             // Business case for a permission.
    "roleType": "human",                      // Roletype, either human or system. 
    "startDate": "2019-11-25T06:00:00.000Z",  // Start date of permission. Based on day.
    "endDate": "2019-11-26T06:00:00.000Z",    // End date of permission. Based on day. (Optional)
    "requestComments": "No comments"          // Comments for approvers.
}
```

**Basic Response:**
```json
{
  "id": "52a22e63-bebc-43b1-8d18-7b9bf3d09cac",
  "version": 2
}
```

## References
The `references` service returns the reference information we use within the EDL Data Catalog.

<br>

### GET References
Returns the reference data
<br>
`/api-external/references`
<br>

*Query Parameters:*
None

*Security:*
- `Authorization required`: Yes
- `OAuth Scope`: read:jdcatalog
- `Data`: None

<br>

**Basic Request:**
```
https://data-catalog.deere.com/api-external/references
```

**Basic Response:**
```json
{
  "communities": [
    {
        "name": "Channel",
        "id": "a7b76f9e-8ff4-4171-9050-3706f1f12188",
        "subCommunities": [
          {
              "id": "a3e8b7cc-d34b-4023-84cc-78944c18e444",
              "name": "Dealer AOR",
              "communityId": "a7b76f9e-8ff4-4171-9050-3706f1f12188"
          }
        ],
        "approver": "AWS-GIT-DWIS-DEV"
    }],
    "countries": [
      {
          "name": "AD",
          "id": "b0c4dc3d-96c2-47cd-925b-3605ee9f397b"
      }
    ],
    "businessValues": [
        {
            "name": "Critical",
            "id": "b509a059-5890-45fe-890c-f3b3d56db9d4"
        }
    ],
    "environments": [
        {
            "name": "EDL",
            "id": "d963c1b0-c81b-404e-8c55-b88d7f48c4f8"
        }
    ],
    "categories": [
        {
            "name": "Master",
            "id": "dc2db157-e121-4ac1-8d16-dc38141616b5"
        }
    ],
    "phases": [
        {
            "name": "Enhance",
            "id": "bcd204b0-b567-4e6b-a5b9-a593943c7330"
        }
    ],
    "technologies": [
        {
            "name": "AWS",
            "id": "1f8ee69b-62ad-42a3-9598-02947ea25670"
        }
    ],
    "physicalLocations": [
        {
            "name": "us-east-1",
            "id": "6c2760b1-fabf-45fb-adc6-9d717e38b598"
        }
    ],
    "gicp": [
        {
            "name": "Confidential",
            "id": "5f48ffda-9c01-4416-89e9-326d0a7bcd3c"
        }
    ]
}
```

## Dataset Approvals
The `approvals` service returns information on the records for a given community awaiting approval in the catalog. In addition, the approvals service also returns the records created by the user. In order for a client ID to retrieve the approvals for a specific community the ID must be associated with the approval group. To make this association please send an email to [Enterprise Data Lake Core Team](ENTERPRISEDATALAKECORETEAM@JohnDeere.com).

### GET
Returns a list of pending, rejected, or approved datasets.

`/api-external/datasets/approvals/`

*Security:*
- `Authorization required`: Yes
- `OAuth Scope`: read:jdcatalog
- `Data`: None

<br>

**Basic Request:**
```
https://data-catalog.deere.com/api-external/datasets/approvals
```

**Basic Response:**
```json
[
    {
        "documentation": "![img](//www.firstcomicsnews.com/wp-content/uploads/2016/09/Marvel-Logo-600x257.png)\n\n---\n## Information\nThis dataset contains stats related to hundreds of different comic characters.\n\n**Note:** *This data includes DC characters in addition to Marvel.*\n\n---\n## Additional Information\n- [Marvel Comics](https://www.marvel.com)\n- [DC Comics](https://www.dcuniverse.com)",
        "schemas": [
            "a108b4a3-d00b-4e33-a143-a73932b7ff77",
            "454e2a64-abc3-4894-9bcc-33849ab17823"
        ],
        "linkedSchemas": [],
        "phase": {
            "id": "Enhance",
            "name": "Enhance"
        },
        "updatedBy": "js91162",
        "physicalLocation": {
            "id": "us-east-1",
            "name": "us-east-1"
        },
        "custodian": "AWS-GIT-DWIS-DEV",
        "description": "Marvel Comic Book Characters",
        "technology": {
            "id": "AWS",
            "name": "AWS"
        },
        "version": 1,
        "createdAt": "2019-06-10T16:45:31.446Z",
        "classifications": [
            {
                "development": false,
                "additionalTags": [],
                "personalInformation": false,
                "countriesRepresented": [
                    {
                        "id": "ALL",
                        "name": "ALL"
                    }
                ],
                "community": {
                    "id": "Channel",
                    "name": "Channel"
                },
                "subCommunity": {
                    "id": "Dealer",
                    "name": "Dealer"
                },
                "gicp": {
                    "id": "Confidential",
                    "name": "Confidential"
                }
            }
        ],
        "environment": {
            "id": "EDL",
            "name": "EDL"
        },
        "createdBy": "js91162",
        "environmentName": "com.deere.enterprise.datalake.enhance.demo.marvel.ComicCharacters",
        "approvals": [
            {
                "approvedBy": null,
                "comment": null,
                "community": {
                    "id": "Channel",
                    "name": "Channel",
                    "approver": "AWS-GIT-DWIS-DEV"
                },
                "status": "PENDING",
                "updatedAt": null
            }
        ],
        "businessValue": "Medium",
        "name": "Demo Marvel Comic Characters",
        "id": "com.deere.enterprise.datalake.enhance.demo.marvel.ComicCharacters",
        "category": {
            "id": "Transactional",
            "name": "Transactional"
        },
        "sourceDatasets": [],
        "updatedAt": "2019-06-10T16:45:31.446Z",
        "status": "PENDING",
        "type": "Dataset",
        "loggedInUserIsCreator": false,
        "loggedInUserIsPendingApprover": true
    }
]
```

## Permission Approvals
The `approvals` service returns information on the records for a given community awaiting approval in the catalog. In addition, the approvals service also returns the records created by the user. In order for a client ID to retrieve the approvals for a specific community the ID must be associated with the approval group. To make this association please send an email to [Enterprise Data Lake Core Team](ENTERPRISEDATALAKECORETEAM@JohnDeere.com).

### GET
Returns a list of pending, rejected, or approved permissions.

`/api-external/permissions/approvals/`

*Security:*
- `Authorization required`: Yes
- `OAuth Scope`: r write:jdcatalog
- `Data`: None

<br>

**Basic Request:**
```
https://data-catalog.deere.com/api-external/permissions/approvals
```

**Basic Response:**
```json
[
    {
        "entitlements": [
            {
                "additionalTags": [],
                "countriesRepresented": [
                    {
                        "id": "ALL",
                        "name": "ALL"
                    }
                ],
                "community": {
                    "id": "Channel",
                    "name": "Channel"
                },
                "actions": [
                    {
                        "id": "Read",
                        "name": "Read"
                    },
                    {
                        "id": "Write",
                        "name": "Write"
                    }
                ],
                "subCommunity": {
                    "id": "Service Delivery",
                    "name": "Service Delivery"
                },
                "gicp": {
                    "id": "Confidential",
                    "name": "Confidential"
                }
            }
        ],
        "updatedBy": "cl98561",
        "endDate": "2020-06-24T20:53:15.948Z",
        "description": "Some great description",
        "roleType": "human",
        "version": 1,
        "businessCase": "I really wanna access this data!",
        "createdAt": "2019-06-22T20:53:15.948Z",
        "createdBy": "js12345",
        "approvals": [
            {
                "approvedBy": null,
                "comment": null,
                "community": {
                    "id": "Channel",
                    "name": "Channel",
                    "approver": "AWS-GIT-DWIS-DEV"
                },
                "status": "PENDING",
                "updatedAt": null
            },
            {
                "approvedBy": "cl98561",
                "comment": "Done",
                "community": {
                    "id": "Customer",
                    "name": "Customer"
                },
                "status": "APPROVED",
                "updatedAt": "2019-06-10T16:45:31.446Z"
            },
            {
                "approvedBy": null,
                "comment": null,
                "community": {
                    "id": "Product",
                    "name": "Product",
                    "approver": "AWS-GIT-DWIS-DEV"
                },
                "status": "PENDING",
                "updatedAt": null
            }
        ],
        "id": "CPS Data Scientists",
        "startDate": "2019-06-24T20:53:15.948Z",
        "updatedAt": "2019-06-23T20:53:15.948Z",
        "group": "AWS-GIT-DWIS-ADMIN",
        "status": "PENDING",
        "type": "Permission",
        "loggedInUserIsCreator": false,
        "loggedInUserIsPendingApprover": true
    }
]
```

## Approve Dataset
The `approve dataset` service approves specific records that are pending for a specific community. This service will only approve records if the client ID is associated with an approver group. To make this association please send an email to [Enterprise Data Lake Core Team](ENTERPRISEDATALAKECORETEAM@JohnDeere.com).

### POST
Returns success or failure response.

`/api-external/datasets/:id/versions/:id/approve`

*Security:*
- `Authorization required`: Yes
- `OAuth Scope`: write:jdcatalog
- `Data`: _Optional_, approval details

<br>

**Basic Request:**
```
http://data-catalog.deere.com/api-external/datasets/6263e882-6fb1-4c0b-9c3e-a710f915d940/versions/1/approve
```

**Basic Body:**
```json
{
  "body": {
    "details": "some details"
  }
}
```

**Basic Response:**
```
Status: 200 OK
```

## Reject Dataset
The `reject dataset` service rejects specific records that are pending for a specific community. This service will only reject records if the client ID is associated with an approver group. To make this association please send an email to [Enterprise Data Lake Core Team](ENTERPRISEDATALAKECORETEAM@JohnDeere.com).

### POST
Returns success or failure response.

`/api-external/datasets/:id/versions/:id/reject`

*Security:*
- `Authorization required`: Yes
- `OAuth Scope`: write:jdcatalog
- `Data`: _Optional_, approval details

<br>

**Basic Request:**
```
http://data-catalog.deere.com/api-external/datasets/6263e882-6fb1-4c0b-9c3e-a710f915d940/versions/1/reject
```

**Basic Body:**
```json
{
  "body": {
    "reason": "some reason"
  }
}
```

**Basic Response:**
```
Status: 200 OK
```

## Approve Permission
The `approve permission` service approves specific records that are pending for a specific community. This service will only approve records if the client ID is associated with an approver group. To make this association please send an email to [Enterprise Data Lake Core Team](ENTERPRISEDATALAKECORETEAM@JohnDeere.com).

### POST
Returns success or failure response.

`/api-external/permissions/:id/versions/:id/approve`

*Security:*
- `Authorization required`: Yes
- `OAuth Scope`: write:jdcatalog
- `Data`: _Optional_, approval details

<br>

**Basic Request:**
```
http://data-catalog.deere.com/api-external/permissions/6263e882-6fb1-4c0b-9c3e-a710f915d940/versions/1/approve
```

**Basic Body:**
```json
{
  "body": {
    "details": "some details"
  }
}
```

**Basic Response:**
```
Status: 200 OK
```

## Reject Permission
The `reject permission` service rejects specific records that are pending for a specific community. This service will only reject records if the client ID is associated with an approver group. To make this association please send an email to [Enterprise Data Lake Core Team](ENTERPRISEDATALAKECORETEAM@JohnDeere.com).

### POST
Returns success or failure response.

`/api-external/permissions/:id/versions/:id/reject`

*Security:*
- `Authorization required`: Yes
- `OAuth Scope`: write:jdcatalog
- `Data`: _Optional_, approval details

<br>

**Basic Request:**
```
http://data-catalog.deere.com/api-external/permissions/6263e882-6fb1-4c0b-9c3e-a710f915d940/versions/1/reject
```

**Basic Body:**
```json
{
  "body": {
    "reason": "some reason"
  }
}
```

**Basic Response:**
```
Status: 200 OK
```
