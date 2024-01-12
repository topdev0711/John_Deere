const metricsDao = require('../../../src/data/metricsDao');
const dynamo = require('../../../src/data/dynamo');
const dynamoTestUtils = require('./dynamoTestUtils');
const conf = require('../../../conf');

const confSpy = jest.spyOn(conf, 'getConfig');


jest.mock('../../../src/data/dynamo');

describe('metricsDao Test Suite', () => {
  const metrics = [
    {
      "year": "2021", 
      "month": "1", 
      "application": "my-app", 
      "interactiveDbus": "4", 
      "automatedDbus": "3", 
      "interactiveCost": "4000000", 
      "automatedCost": "150"
    },
    {
      "year": "2021", 
      "month": "2", 
      "application": "my-app", 
      "interactiveDbus": "2", 
      "automatedDbus": "1", 
      "interactiveCost": "2000000", 
      "automatedCost": "50"
    }
  ];

  beforeEach(() => {
    confSpy.mockImplementation(() => ({ metricsTable: "table" }));
  })

  afterEach(() => {
    confSpy.mockReset();
  });

  it('should get metrics for given apps', async () => {
    const keys = ['loadAll', 'exec', 'promise', 'collectItems'];
    const query = dynamoTestUtils.createFunction(keys, metrics);
    dynamo.define.mockReturnValue({query});

    const results = await metricsDao.getMetrics("my-app");

    expect(results).toEqual(metrics);
  });
});