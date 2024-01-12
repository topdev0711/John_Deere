const accessUtility = require('../../../src/utilities/accessUtility');

const testTags = {
  community: {name: 'comm1'},
  subCommunity: {name: 'subComm1'},
  gicp: {name: 'gicp1'},
  countriesRepresented: [{name: 'country2'}],
  additionalTags: ['tag1'],
  development: true,
  personalInformation: true
};

describe('accessUtility test suite', () => {
  it('should allow access for same tags', () => {
    const gov = [testTags];
    const ent = [testTags];
    expect(accessUtility.canAccess(ent, gov)).toEqual(true);
  });

  it('should allow access for ALL countries represented', () => {
    const gov = [testTags];
    const ent = [{...testTags, countriesRepresented: [{name: 'ALL'}]}];
    expect(accessUtility.canAccess(ent, gov)).toEqual(true);
  });

  it('should not allow access for lesser countries represented', () => {
    const gov = [testTags];
    const ent = [{...testTags, countriesRepresented: [{name: 'country1'}]}];
    expect(accessUtility.canAccess(ent, gov)).toEqual(false);
  });

  it('should allow access for ALL countries represented', () => {
    const gov = [testTags];
    const ent = [{...testTags, countriesRepresented: [{name: 'ALL'}]}];
    expect(accessUtility.canAccess(ent, gov)).toEqual(true);
  });

  it('should not allow access for lesser countries represented', () => {
    const gov = [testTags];
    const ent = [{...testTags, countriesRepresented: [{name: 'country1'}]}];
    expect(accessUtility.canAccess(ent, gov)).toEqual(false);
  });

  it('should allow access for same plus more additional tags', () => {
    const gov = [testTags];
    const ent = [{...testTags, additionalTags: ['tag1', 'tag2']}];
    expect(accessUtility.canAccess(ent, gov)).toEqual(true);
  });

  it('should allow access for ALL additional tags', () => {
    const gov = [testTags];
    const ent = [{...testTags, additionalTags: ['ALL']}];
    expect(accessUtility.canAccess(ent, gov)).toEqual(true);
  });

  it('should not allow access if lesser additional tags', () => {
    const gov = [testTags];
    const ent = [{...testTags, additionalTags: ['tag2']}];
    expect(accessUtility.canAccess(ent, gov)).toEqual(false);
  });

  it('should not allow access if lesser additional tags', () => {
    const gov = [testTags];
    const ent = [{...testTags, additionalTags: []}];
    expect(accessUtility.canAccess(ent, gov)).toEqual(false);
  });

  it('should not allow access if different gicp', () => {
    const gov = [testTags];
    const ent = [{...testTags, gicp: {name: 'gicp2'}}];
    expect(accessUtility.canAccess(ent, gov)).toEqual(false);
  });

  it('should not allow access if different sub community', () => {
    const gov = [testTags];
    const ent = [{...testTags, subCommunity: {name: 'subComm2'}}];
    expect(accessUtility.canAccess(ent, gov)).toEqual(false);
  });

  it('should not allow access if different community', () => {
    const gov = [testTags];
    const ent = [{...testTags, community: {name: 'comm2'}}];
    expect(accessUtility.canAccess(ent, gov)).toEqual(false);
  });

  it('should allow access for same tags plus extra block', () => {
    const gov = [testTags];
    const ent = [testTags, { ...testTags, community: {name: 'comm2'} }];
    expect(accessUtility.canAccess(ent, gov)).toEqual(true);
  });

  it('should not allow access if entitlements do not satisfy all governance blocks', () => {
    const gov = [testTags, { ...testTags, community: {name: 'comm2'} }];
    const ent = [testTags];
    expect(accessUtility.canAccess(ent, gov)).toEqual(false);
  });

  it('should not allow access if development is true on gov but false on ent', () => {
    const gov = [testTags];
    const ent = [{...testTags, development: false}];
    expect(accessUtility.canAccess(ent, gov)).toEqual(false);
  });

  it('should not allow access if pii is true on gov but false on ent', () => {
    const gov = [testTags];
    const ent = [{...testTags, personalInformation: false}];
    expect(accessUtility.canAccess(ent, gov)).toEqual(false);
  });

  it('should not allow access if development is false on gov but true on ent', () => {
    const gov = [{...testTags, development: false}];
    const ent = [testTags];
    expect(accessUtility.canAccess(ent, gov)).toEqual(false);
  });

  it('should not allow access if pii is false on gov but true on ent', () => {
    const gov = [{...testTags, personalInformation: false}];
    const ent = [testTags];
    expect(accessUtility.canAccess(ent, gov)).toEqual(false);
  });

  describe('remove duplicate governance', () => {

    const classification = {
      community: '10',
      subCommunity: '11',
      countriesRepresented: ['12', '13'],
      gicp: '14',
      id: '2345',
      personalInformation: false,
      development: false,
      additionalTags: ['tag']
    };

    const sampleEntitlements = [
      {
        id: '29c22cc0-7551-4064-a80f-504191bf4e28',
        actions: [ 'Read' ],
        community: 'Channel',
        subCommunity: 'Account AOR',
        countriesRepresented: [],
        gicp: 'Confidential',
        additionalTags: [],
        development: false,
        personalInformation: true
      },
      {
        id: 'a45e6aa9-ae0e-453f-9125-14928f6f7a46',
        actions: [ 'Read' ],
        community: 'Channel',
        subCommunity: 'Account AOR',
        countriesRepresented: [],
        gicp: 'Confidential',
        additionalTags: [],
        development: true,
        personalInformation: false
      },
      {
        id: '1987c598-50c4-40d6-9dcc-2f1de1c68017',
        actions: [ 'Read' ],
        community: 'Channel',
        subCommunity: 'Account AOR',
        countriesRepresented: [],
        gicp: 'Confidential',
        additionalTags: [],
        development: false,
        personalInformation: false
      }];

    it('when submitting a valid governance array it should remove duplicate classification blocks and ignore non-important keys', () => {
      const duplicateClassification = {...classification, id: 'a new id'};
      const newClassificationDev = {...classification, development: 'true'};
      const newClassification = {...classification, id: 'another new id', countriesRepresented: ['14']};
      const input = [duplicateClassification, newClassificationDev, classification, newClassification]
      const expected = [newClassificationDev, classification, newClassification];

      return expect(accessUtility.getUniqueGovernance(input)).toEqual(expected);
    });

    it('when submitting a valid governance array with no duplicates it should return the same array', () => {
      return expect(accessUtility.getUniqueGovernance(sampleEntitlements)).toEqual(sampleEntitlements);
    });
  });
});
