/**
 * @jest-environment node
 */

const opensearchDao = require('../../../src/data/opensearchDao');
const scenario1Obj = require('./TestData/OpensearchDaoScenario1.json');
const scenario2Obj = require('./TestData/OpensearchDaoScenario2.json');
const scenario3Obj = require('./TestData/OpensearchDaoScenario3.json');

jest.mock('../../../src/data/lineageDao')

describe('opensearchDao tests', () => {
    it('should generate params in correct structure to search opensearch', async () => {
        const input = {'searchTerm': 'Demo', 'phase': ['raw', 'Enhanced'], 'subCommunities': ['A and I Products Parts IT Business Intelligencex'], 'custodianVisibleToggle':true};
        const output = await opensearchDao.buildFetchQuery(input, 0, 20);
        expect(output).toMatchObject(scenario1Obj);
    });

    it('should generate params in correct structure to search opensearch - Community', async () => {
        const input = {'searchTerm': 'Demo', 'communities': ['Systems', 'Finance'], 'personalInformation': true, 'development': true, 'custodianVisibleToggle':true};
        const output = await opensearchDao.buildFetchQuery(input, 0, 20);
        expect(output).toMatchObject(scenario2Obj);
    });

    it('should generate params in correct structure to search opensearch - Custodian', async () => {
        const input = {'searchTerm': 'Demo', 'custodians': ['Systems', 'Finance'], 'custodianVisibleToggle':true};
        const output = await opensearchDao.buildFetchQuery(input, 0, 20);
        expect(output).toMatchObject(scenario3Obj);
    });
});
