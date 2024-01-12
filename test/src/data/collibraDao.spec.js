global.fetch = require('jest-fetch-mock');
const conf = require('../../../conf');
const spyConf = jest.spyOn(conf, 'getConfig');
const collibra = require('../../../src/data/collibraDao');

describe('collibraDao tests', () => {
  beforeEach(() => spyConf.mockImplementation(() => ({isLocal: false})));
  afterEach(() => spyConf.mockReset());

  const systemsId = 'a521b7d4-642c-4524-9c46-e4fa5e836a17';

  it('should get approvers', () => {
    const actualApprover = collibra.getApprover(systemsId)
    expect(actualApprover).toEqual('G90_COLLIBRA_APPROVER_SYSTEMS');
  });

  it('should get business values', () => {
    const actualBusinessValues = collibra.getBusinessValues();
    const expectedBusinessValues = require(`../../../src/data/reference/business-values.json`);
    expect(actualBusinessValues).toEqual(expectedBusinessValues);
  });

  it('should get categories', () => {
    const actualCategories = collibra.getCategories();
    const expectedCategories = require(`../../../src/data/reference/categories.json`);
    expect(actualCategories).toEqual(expectedCategories);
  });

  it('should get communities', () => {
    const actualCommunities = collibra.getCommunityNames();
    const expectedCommunities = require(`../../../src/data/reference/communities.json`);
    expect(actualCommunities).toEqual(expectedCommunities);
  });

  it('should get countries', () => {
    const actualCountryNames = collibra.getCountryCodes();
    const expectedCountryNames = require(`../../../src/data/reference/countries.json`);
    expect(actualCountryNames).toEqual(expectedCountryNames);
  });

  it('should get gicp', () => {
    const actualGicp = collibra.getGicp();
    const expectedGicp = require(`../../../src/data/reference/gicp.json`);
    expect(actualGicp).toEqual(expectedGicp);
  });

  it('should get phases', () => {
    const actualPhases = collibra.getPhases();
    const expectedPhases = require(`../../../src/data/reference/phases.json`);
    expect(actualPhases).toEqual(expectedPhases);
  });

  it('should get physical locations', () => {
    const actualPhysicalLocations = collibra.getPhysicalLocations();
    const expectedPhysicalLocations = require(`../../../src/data/reference/physical-locations.json`);
    expect(actualPhysicalLocations).toEqual(expectedPhysicalLocations);
  });

  it('should get subcommunities', () => {
    const actualCommunities = collibra.getSubCommunities(systemsId);
    const expectedCommunities = [
      {
        "id": "27d2e7c6-1b27-4904-80e9-fb11f6c8484a",
        "name": "Cloud Financials",
        "enabled": true,
        "communityId": "a521b7d4-642c-4524-9c46-e4fa5e836a17",
        "approver": "G90_Collibra_Approver_Information_Technology_Cloud_Financials"
      },
      {
        'id': '48112e16-9abf-48ed-ae79-ab43844a32ec',
        'name': 'Demo',
        "enabled": true,
        'communityId': 'a521b7d4-642c-4524-9c46-e4fa5e836a17',
        'approver': 'G90_COLLIBRA_APPROVER_SYSTEMS'
      },
      {
        'id': '53b001e4-b0ac-416d-aebf-a2d91c29ce7d',
        'name': 'Logs',
        "enabled": true,
        'communityId': 'a521b7d4-642c-4524-9c46-e4fa5e836a17',
        'approver': 'G90_COLLIBRA_APPROVER_SYSTEMS'
      },
      {
        'id': 'b9677668-3d02-434e-896f-7271b3221cc7',
        'name': 'Metrics',
        "enabled": true,
        'communityId': 'a521b7d4-642c-4524-9c46-e4fa5e836a17',
        'approver': 'G90_COLLIBRA_APPROVER_SYSTEMS'
      },
      {
        "id": "605983c2-8ba2-4e42-8e33-22795fd7f777",
        "name": "Security-IAM",
        "enabled": true,
        "communityId": "a521b7d4-642c-4524-9c46-e4fa5e836a17",
        "approver": "G90_COLLIBRA_APPROVER_SYSTEMS_SECURITY_IAM"
      },
      {
        "id": "611ca9b0-5f33-4522-baca-a4b2fced9878",
        "name": "Tech Stack",
        "enabled": true,
        "communityId": "a521b7d4-642c-4524-9c46-e4fa5e836a17",
        "approver": "G90_COLLIBRA_APPROVER_SYSTEMS_TECH_STACK"
      },
      {
        "id": "742c3258-8ebd-48b8-b3db-eed4814bc4b0",
        "enabled": true,
        "name": "Infrastructure and Operations",
        "communityId": "a521b7d4-642c-4524-9c46-e4fa5e836a17",
        "approver": "G90_COLLIBRA_APPROVER_INFORMATION_TECHNOLOGY_IO"
      },
      {
        'id': 'a302f4cd-eeb1-4258-89d7-6ab0f81af0e2',
        'name': 'Technical Proficiency',
        "enabled": true,
        'communityId': 'a521b7d4-642c-4524-9c46-e4fa5e836a17',
        'approver': 'G90_COLLIBRA_APPROVER_SYSTEMS_TECHNICAL_PROFICIENCY'
      }
    ]
    expect(actualCommunities).toEqual(expectedCommunities);
  });

  it('should get technologies', () => {
    const actualTechnologies = collibra.getTechnologies();
    const expectedTechnologies = require(`../../../src/data/reference/technologies.json`);
    expect(actualTechnologies).toEqual(expectedTechnologies);
  });

  it('should approver when in local config', () => {
    spyConf.mockImplementation(() => ({isLocal: true}))
    const actualApprover = collibra.getApprover(systemsId);
    expect(actualApprover).toEqual('AWS-GIT-DWIS-DEV');
  });

  it('should get community information', () => {
    const communityId = 'a521b7d4-642c-4524-9c46-e4fa5e836a17';
    const actualCommunity = collibra.getCommunity(communityId);
    const expectedCommunity = {
      "id": "a521b7d4-642c-4524-9c46-e4fa5e836a17",
      "name": "Information Technology",
      "approver": "G90_COLLIBRA_APPROVER_SYSTEMS"
    }

    expect(actualCommunity).toEqual(expectedCommunity);
  });

  it('has subCommunity', () => {
    const existingSubCommunity = 'a302f4cd-eeb1-4258-89d7-6ab0f81af0e2';
    expect(collibra.hasSubCommunity(existingSubCommunity)).toEqual(true);
  });

  it('does not have subCommunity', () => {
    const nonExistingSubCommunity = 'adv';
    expect(collibra.hasSubCommunity(nonExistingSubCommunity)).toEqual(false);
  });

  it('should get subCommunity information from subCommunity id', () => {
    const existingSubCommunity = 'a302f4cd-eeb1-4258-89d7-6ab0f81af0e2';
    const actualSubCommunity = collibra.getSubCommunityFromId(existingSubCommunity);
    const expectedSubCommunity = {
        id: 'a302f4cd-eeb1-4258-89d7-6ab0f81af0e2',
        name: 'Technical Proficiency',
        "enabled": true,
        communityId: 'a521b7d4-642c-4524-9c46-e4fa5e836a17',
        approver: 'G90_COLLIBRA_APPROVER_SYSTEMS_TECHNICAL_PROFICIENCY'
      }

      expect(actualSubCommunity).toEqual(expectedSubCommunity);
  });
});
