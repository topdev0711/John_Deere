const edlApiHelper = require('../../../src/utilities/edlApiHelper');
const lineageService = require('../../../src/services/lineageService');
jest.mock('../../../src/utilities/edlApiHelper');


describe('lineageService Test Suite', () => {

const lineageData  = {
    "task_id": "367e4487-af31-41e7-80d2-a852f795afd4",
    "source": {
        "type": "IBM_zos",
        "namespace": "ADVACTT.ACCT_DUMMY"
    },
    "destination": {
        "name": "TBD",
        "datatype": "com.deere.enterprise.datalake.enhance.mdi_load_test",
        "type": "schema",
        "namespace": "com.deere.enterprise.datalake.enhance.mdi_load_test@81.0.0"
    },
    "created": "2022-04-21T17:20:27.242Z"
};
it('should get lineage for resource', async () => {
    edlApiHelper.get.mockResolvedValue(lineageData);
    let jsonRes = await lineageService.getLineage('ADVACTT.ACCT_DUMMY');
    expect(jsonRes).toEqual(lineageData);
  });

});