/**
 * @jest-environment node
 */

 const lineageDao = require('../../../src/data/lineageDao');
 const lineageService = require('../../../src/services/lineageService');
 
 jest.mock('../../../src/services/lineageService')
 
 describe('lineageDao tests', () => {
     beforeEach(() => {
 
     })
 
     it('should generate output in correct structure from lineage api', async () => {
         
         const input = [{datatype: 'env-1', database:'db1', server: 's1', tableName : 'tb1,tb2'}, {datatype: 'env-1', database:'db2', server: 's2', tableName : 'tb3'}]
         const outputE = {'env-1': {'databases': ['db1', 'db2'], 'servers': ['s1', 's2'], 'tableNames': ['tb1', 'tb2', 'tb3']}}

         lineageService.getSourceDBDetails.mockResolvedValue(input);
         const output = await lineageDao.getLineageInfo();
 
         expect(output).toEqual(outputE);
         
     });
 });