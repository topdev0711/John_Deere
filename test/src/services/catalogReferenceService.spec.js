const collibra = require('../../../src/data/collibraDao');
const catalogReferenceService = require('../../../src/services/catalogReferenceService');

jest.mock('../../../src/data/collibraDao');

const communities = [{name: 'someCommunity', id: '1', approver: 'AWS-GIT-DWIS-DEV'}];
const businessValues = [{name: 'someBusinessValues', id: '3'}];
const categories = [{name: 'someCategories', id: '5'}];
const phases = [{name: 'enhance', id: '6'}, {name: 'raw', id: '8'}, {name: 'model', id: '9'}, {
  name: 'enhance foo',
  id: '7'
}];
const technologies = [{name: 'someTechnologies', id: '7'}];
const physicalLocations = [{name: 'somePhysicalLocations', id: '8'}];
const gicp = [{name: 'someGicp', id: '10'}];
const countries = [{name: 'someCountry', id: '12'}];
const subCommunities = [{name: 'subcomm', id: '101'}];
const approver = 'AWS-GIT-DWIS-DEV';
const entitlement =
  {
    community: "someCommunity",
    subCommunity: "subcomm",
    gicp: "someGicp",
    countriesRepresented: ["someCountry"],
    additionalTags: ["someAdditionalTag"],
    personalInformation: true,
    development: true
  };
const referencedEntitlement = {
  "additionalTags": [
    "someAdditionalTag"
  ],
  "community": "1",
  "countriesRepresented": [
    "12"
  ],
  "development": true,
  "gicp": "10",
  "personalInformation": true,
  "subCommunity": "101"
};

const dataset = {
  category: 'someCategories',
  status: 'PENDING',
  environmentName: 'someEnvironments',
  phase: 'enhance',
  technology: 'someTechnologies',
  physicalLocation: 'somePhysicalLocations',
  classifications: [
    {
      community: 'someCommunity',
      subCommunity: 'subcomm',
      countriesRepresented: ['someCountry'],
      gicp: 'someGicp'
    }
  ]
};

function mockAllReferences() {
  collibra.getCommunityNames.mockReturnValue(communities);
  collibra.getBusinessValues.mockReturnValue(businessValues);
  collibra.getCategories.mockReturnValue(categories);
  collibra.getPhases.mockReturnValue(phases);
  collibra.getTechnologies.mockReturnValue(technologies);
  collibra.getPhysicalLocations.mockReturnValue(physicalLocations);
  collibra.getGicp.mockReturnValue(gicp);
  collibra.getCountryCodes.mockReturnValue(countries);
  collibra.getSubCommunities.mockReturnValue(subCommunities);
  collibra.getApprover.mockReturnValue(approver);
}

describe('catalogReferenceService tests', () => {
  beforeEach(() => mockAllReferences());

  it('should get referenced entitlements', () => {
    const actualEntitlement = catalogReferenceService.getReferencedPermissionEntitlement(entitlement);
    expect(actualEntitlement).toEqual(referencedEntitlement);
  });

  it('should fail to get entitlements when one of the references is not found', () => {
    collibra.getCommunityNames.mockReturnValue([]);
    const actualError = () => catalogReferenceService.getReferencedPermissionEntitlement(entitlement);
    return expect(actualError).toThrowError(new Error('Could not find reference for communities'));
  });

  it('should get referenced fields in dataset',  () => {
    const actualReferences = catalogReferenceService.getDatasetReferences(dataset);
    const expectedReferences = {
      category: '5',
      phase: '6',
      technology: '7',
      physicalLocation: '8',
      classifications: [
        {
          community: '1',
          subCommunity: '101',
          countriesRepresented: ['12'],
          gicp: '10'
        }
      ],
    };

    expect(actualReferences).toEqual(expectedReferences);
  });

  it('should ignore classification id if present in request',  () => {
    const classifications = [
      {
        id: 'anyId',
        community: 'someCommunity',
        subCommunity: 'subcomm',
        countriesRepresented: ['someCountry'],
        gicp: 'someGicp'
      }
    ]
    const actualReferences = catalogReferenceService.getDatasetReferences({...dataset, classifications});
    const expectedReferences = {
      category: '5',
      phase: '6',
      technology: '7',
      physicalLocation: '8',
      classifications: [
        {
          id: 'anyId',
          community: '1',
          subCommunity: '101',
          countriesRepresented: ['12'],
          gicp: '10'
        }
      ],
    };

    expect(actualReferences).toEqual(expectedReferences);
  });

  it('should fail to get referenced field in dataset when provided an invalid value', () => {
    collibra.getCommunityNames.mockReturnValue([]);
    const actualError = () => catalogReferenceService.getDatasetReferences(dataset);
    return expect(actualError).toThrowError(new Error('Could not find reference for communities'));
  });
});
