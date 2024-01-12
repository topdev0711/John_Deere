const conf = require('../../../conf');
const userService = require('../../../src/services/userService')
const accessService = require('../../../src/services/accessService');
const datasetService = require('../../../src/services/datasetService');
const permissionService = require('../../../src/services/permissionService');
const accessUtility = require('../../../src/utilities/accessUtility');
const edlApiHelper = require('../../../src/utilities/edlApiHelper');
const listAllTestData = require('../../AccessServiceMockedList.json');
const { edlCatalog } = require('../../../conf').getConfig();


jest.mock('../../../src/utilities/edlApiHelper');
jest.mock('../../../src/services/datasetService');
jest.mock('../../../src/services/userService')
jest.mock('cache-manager');

const sourceDatasets =
{
  id: "com.deere.enterprise.datalake.enhance.core.manufacturing.ProductCatalogData",
  createdBy: "js91162",
  updatedBy: "js91162",
  createdAt: "2019-06-10T16:45:31.446Z",
  updatedAt: "2019-06-10T16:45:31.446Z",
  name: "Core Manufacturing Product Catalog Data",
  custodian: "G90_C3_INV_SYS_ADMIN",
  sourceDatasets: [],
  businessValue: "Medium",
  category: "Transactional",
  environmentName: "com.deere.enterprise.datalake.enhance.core.manufacturing.ProductCatalogData",
  phase: "Enhance Domain",
  technology: "AWS",
  physicalLocation: "us-east-1",
  schemas: [],
  classifications: [
    {
      community: { id: 'a521b7d4-642c-4524-9c46-e4fa5e836a17', name: 'Systems' },
      subCommunity: { id: '48112e16-9abf-48ed-ae79-ab43844a32ec', name: 'Demo' },
      countriesRepresented: [
        "ALL"
      ],
      gicp: "Unclassified",
      personalInformation: false,
      development: false,
      additionalTags: []
    }
  ],
  status: "AVAILABLE",
  approvals: [],
  version: 1
}
const classifications = [
  {
    development: true,
    additionalTags: [],
    personalInformation: false,
    countriesRepresented: [[Object]],
    id: 'f4ef7035-5738-4185-bb69-c0e355ed54de',
    community: { id: 'a521b7d4-642c-4524-9c46-e4fa5e836a17', name: 'Systems' },
    subCommunity: { id: '48112e16-9abf-48ed-ae79-ab43844a32ec', name: 'Demo' },
    gicp: {
      id: '159d753e-c245-43eb-ba2b-7d29cb436c3d',
      name: 'Unclassified'
    }
  }
]
const permission = {
  group: 'group1',
  version: 1,
  entitlements: ['access']
};

const permissionsReport = [{
  group: 'group1',
  version: 1,
  id: 'fake-id-1',
  name: 'fake-name-1',
  startDate: 'fake-date-1',
  endDate: 'fake-end-date-1',
  status: 'AVAILABLE',
  entitlements: [
    {
      community: "Product",
      countriesRepresented: [
        "ALL"
      ],
      gicp: "Unclassified",
      personalInformation: false,
      development: false,
      additionalTags: []
    }
  ]
}, {
  group: 'group2',
  version: 1,
  id: 'fake-id-2',
  name: 'fake-name-2',
  startDate: 'fake-date-2',
  endDate: 'fake-end-date-2',
  status: 'AVAILABLE',
  entitlements: [
    {
      community: "Product",
      countriesRepresented: [
        "ALL"
      ],
      gicp: "Unclassified",
      personalInformation: false,
      development: false,
      additionalTags: []
    }
  ]
}];

const users = [
  {
    id: '12345',
    email: 'test@johndeere.com',
    displayName: "testUser123"
  },
  {
    id: '123456',
    email: 'test2@johndeere.com',
    displayName: "test2User123"
  },
  {
    id: '1234567',
    email: 'test3@johndeere.com',
    displayName: "test3User123"
  },
]
const permissions = [{
  group: 'group1',
  version: 1,
  entitlements: ['access']
}, {
  group: 'group2',
  version: 1,
  entitlements: ['noaccess', 'access']
}];

const datasets = [{
  name: 'ds1',
  version: 1,
  classifications: ['noaccess', 'access']
}, {
  name: 'ds2',
  version: 1,
  classifications: ['access']
}];

const datasetReportHeader = [
  { label: 'Dataset', key: 'dataset' },
  { label: 'Dataset ID', key: 'datasetID' },
  { label: 'Permission Name', key: 'permissionName' },
  { label: 'Permission ID', key: 'permissionID' },
  { label: 'Permission Start Date', key: 'permissionStartDate' },
  { label: 'Permission End Date', key: 'permissionEndDate' },
  { label: 'AD Group', key: 'adGroup' },
  { label: 'User Name', key: 'displayName' },
  { label: 'Email', key: 'email' }
]

const getSpy = jest.fn().mockResolvedValue(null);
const setSpy = jest.fn();

describe('accessService test suite', () => {
  beforeEach(() => {
    jest.spyOn(accessUtility, 'canAccess').mockImplementation((entitlements, classifications) => {
      return !classifications.includes('noaccess') && !entitlements.includes('noaccess');
    });

    jest.spyOn(datasetService, 'getLatestDatasets').mockResolvedValue(datasets);
    jest.spyOn(permissionService, 'listAllForStatus').mockResolvedValue(permissions);

    jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue({
      get: getSpy,
      set: setSpy
    });
  });

  it('should get datasets from cache', async () => {
    const getSpy = jest.fn().mockResolvedValue(datasets);
    const setSpy = jest.fn();
    jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue({ get: getSpy, set: setSpy });
    const result = await accessService.getDatasetsForEntitlements(permission.entitlements);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(datasets[1]);
    expect(setSpy).toHaveBeenCalledTimes(0);
    expect(getSpy).toHaveBeenCalledTimes(1);
  })

  it('should cache datasets when not already cached', async () => {
    const result = await accessService.getDatasetsForEntitlements(permission.entitlements);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(datasets[1]);
    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(getSpy).toHaveBeenCalledTimes(1);
  })

  it('should get accessible datasets when passing entitlements directly', async () => {
    const result = await accessService.getDatasetsForEntitlements(permission.entitlements);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(datasets[1]);
  });

  it('should fail to get accessible datasets when passing entitlements directly if datasets cannot be loaded', () => {
    jest.spyOn(datasetService, 'getLatestDatasets').mockRejectedValue('Ahh!');
    const result = accessService.getDatasetsForEntitlements(permission.entitlements);
    return expect(result).rejects.toMatch('Ahh!');
  });


  describe('Access from EDL Data Catalog ACLS Service tests', () => {
    const type = "com.deere.enterprise.datalake.sometype";
    const edlGroups = [
      {
        type,
        "roles": [
          {
            "name": "EDG-Customer",
            "roleType": "human",
            "roleOwner": "EDG-Customer",
            "actions": [
              "read"
            ]
          },
          {
            "name": "AWS-ANALYTICS",
            "roleType": "human",
            "roleOwner": "AWS-ANALYTICS",
            "actions": [
              "read"
            ]
          }
        ]
      },
      {
        type: type + 'one',
        "roles": []
      }
    ];

    const userGroups = [
      'AWS-ANALYTICS'
    ]

    it('should generate user list when given datasetId', async () => {
      const expectedFirstResult = {
        dataset: 'Core Manufacturing Product Catalog Data',
        datasetID: 'com.deere.enterprise.datalake.enhance.core.manufacturing.ProductCatalogData',
        permissionName: 'fake-name-1',
        permissionID: 'fake-id-1',
        permissionStartDate: 'fake-date-1',
        permissionEndDate: 'fake-end-date-1',
        adGroup: 'group1',
        displayName: 'testUser123',
        email: 'test@johndeere.com'
      };
      datasetService.getDataset.mockResolvedValue(sourceDatasets);
      jest.spyOn(permissionService, 'listAllForStatus').mockResolvedValue(permissionsReport);
      userService.getUsersForGroup.mockResolvedValue(users);

      const result = await accessService.generateUserList('fake-id');
      expect(result['data'][0]).toEqual(expectedFirstResult);
      expect(result['datasetReportHeader']).toEqual(datasetReportHeader);
    })
    it('should generate list with no users found if okta returns no users', async () => {
      const expectedFirstResult = {
        dataset: 'Core Manufacturing Product Catalog Data',
        datasetID: 'com.deere.enterprise.datalake.enhance.core.manufacturing.ProductCatalogData',
        permissionName: 'fake-name-1',
        permissionID: 'fake-id-1',
        permissionStartDate: 'fake-date-1',
        permissionEndDate: 'fake-end-date-1',
        adGroup: 'group1',
        displayName: 'No users for policy',
        email: ''
      };
      datasetService.getDataset.mockResolvedValue(sourceDatasets);
      jest.spyOn(permissionService, 'listAllForStatus').mockResolvedValue(permissionsReport);
      userService.getUsersForGroup.mockResolvedValue({ error: 'Failed to get users' });

      const result = await accessService.generateUserList('fake-id');
      expect(result['data'][0]).toEqual(expectedFirstResult);
      expect(result['datasetReportHeader']).toEqual(datasetReportHeader);
    })

    it('should determine a user has access', async () => {
      edlApiHelper.get.mockResolvedValueOnce(edlGroups);

      const result = await accessService.getUserAccessForDataset(type, userGroups);

      expect(result).toEqual(true);
    });

    it('should only compare against groups for type specified', async () => {
      edlApiHelper.get.mockResolvedValueOnce(edlGroups);

      const result = await accessService.getUserAccessForDataset(type + 'one', userGroups);

      expect(result).toEqual(false);
    });

    it('should get groups from EDL Data Catalog to determine a user has access', async () => {
      edlApiHelper.get.mockResolvedValueOnce(edlGroups);

      const result = await accessService.getUserAccessForDataset(type, userGroups);

      expect(edlApiHelper.get).toHaveBeenCalledWith(edlCatalog + '/v1/acls?type=' + type);
    });

    it('should get groups from EDL Data Catalog to determine a user does not have access', async () => {
      const updatedEdlGroups = [
        {
          type,
          roles: [
            edlGroups[0].roles[0]
          ]
        }
      ];
      edlApiHelper.get.mockResolvedValueOnce(updatedEdlGroups);

      const result = await accessService.getUserAccessForDataset(type, userGroups);

      expect(result).toEqual(false);
    });

    it('should handle empty groups from EDL Data Catalog to determine a user does not have access', async () => {
      const updatedEdlGroups = [];
      edlApiHelper.get.mockResolvedValueOnce(updatedEdlGroups);

      const result = await accessService.getUserAccessForDataset(type, userGroups);

      expect(result).toEqual(false);
    });

    it('should handle error from EDL Data Catalog', () => {
      const error = 'Boom';
      edlApiHelper.get.mockRejectedValueOnce(error);

      const result = accessService.getUserAccessForDataset(type, userGroups);

      return expect(result).rejects.toThrow('An unexpected issue occurred when retrieving roles from EDL Data Catalog.');
    });

    it('should validate that type is provided', () => {
      edlApiHelper.get.mockResolvedValueOnce(edlGroups);

      const result = accessService.getUserAccessForDataset('', userGroups);

      return expect(result).rejects.toThrow('Dataset name is required.');
    });

    it('should throw error when okta unavailable', () => {
      const error = new Error('An unexpected issue occurred when generating user access list.')
      datasetService.getDataset.mockResolvedValue(sourceDatasets);
      jest.spyOn(permissionService, 'listAllForStatus').mockResolvedValue(permissionsReport);
      userService.getUsersForGroup.mockRejectedValue(error);

      const result = accessService.generateUserList('fake-id');
      return expect(result).rejects.toThrow(error);
    })
  });
  it('should get entitlements for specific classifications', async () => {
    const expectedEntitlements = {"entitlements": ["Systems,Demo"]}
    permissionService.listAllForStatus.mockResolvedValue([]);
    const result = await accessService.getPermissionsForClassifications(classifications);
    expect(permissionService.listAllForStatus).toHaveBeenCalledWith(expectedEntitlements);
  })

  it('should get permissions for specific classifications', async () => {
    let classifications = [
      {
        "id": "daade0b2-42f3-4d37-9382-3dcba20ef86f",
        "community": {
          "id": "a521b7d4-642c-4524-9c46-e4fa5e836a17",
          "name": "Information Technology"
        },
        "subCommunity": {
          "id": "48112e16-9abf-48ed-ae79-ab43844a32ec",
          "name": "Demo"
        },
        "countriesRepresented": [
          {
            "id": "9693d47b-71f9-408a-a7eb-14ee09ea8645",
            "name": "IN",
            "label": "India"
          }
        ],
        "gicp": {
          "id": "10710b7a-7391-4860-a18d-1d7edc746fe7",
          "name": "Public"
        },
        "additionalTags": ["test"],
        "development": false,
        "personalInformation": false,
        "actions": null
      }
    ]

    permissionService.listAllForStatus.mockResolvedValue(listAllTestData);
    let result = await accessService.getPermissionsForClassifications(classifications);
    expect(result.length).toEqual(3);


  })
});
