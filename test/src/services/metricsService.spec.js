// Unpublished Work © 2021-2022 Deere & Company.
const metricsService = require('../../../src/services/metricsService');
const featureToggleService = require('../../../src/services/featureToggleService');
const metricsDao = require('../../../src/data/metricsDao');
const edlApiHelper = require('../../../src/utilities/edlApiHelper');

jest.mock('../../../src/data/metricsDao');
jest.mock('../../../src/utilities/edlApiHelper');
jest.mock('../../../src/services/featureToggleService');

describe('metricsService Test Suite', () => {
  const applications = [ "my-app", "other-app" ];
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
  const completenessMetrics = 
  {
    "tableName": "test.table1",
    "createTime": "2022-02-16T18:42:39.297Z",
    "updateTime": "2022-02-16T18:42:39.297Z",
    "total": 100000,
    "fields": [
        {
            "name": "id",
            "count": 100000
        },
        {
            "name": "cats",
            "count": 80000
        },
        {
          "name": "dogs",
          "count": 19000
        },
        {
          "name": "giraffes",
          "count": 52000
        },
        {
          "name": "lions",
          "count": 45000
        },
        {
          "name": "tigers",
          "count": 10000
        }
    ]
};

  it('should get metrics for apps', async () => {
    metricsDao.getMetrics
      .mockResolvedValueOnce(metrics)
      .mockResolvedValueOnce(metrics);
    const expectedResults = [...metrics, ...metrics];
    
    const results = await metricsService.getApplicationsMetrics(applications);

    expect(results).toEqual(expectedResults);
  });

  it('should handle empty applications array', async () => {
    const results = await metricsService.getApplicationsMetrics([]);

    expect(metricsDao.getMetrics).toHaveBeenCalledTimes(0);
    expect(results).toEqual([]);
  });

  it('should handle an error retrieving app metrics', async () => {
    const error = "Boom";
    metricsDao.getMetrics.mockRejectedValueOnce(error);
    
    await expect(metricsService.getApplicationsMetrics(applications))
      .rejects
      .toThrow(`Data lookup for applications failed: ${applications}`); 
  });

  it('should get timeliness metric for schema', async () => {
    schema_name = 'testSchema';
    dataset = '';
    frequency = '';
    from = '';
    to = '';

    edlApiHelper.get.mockResolvedValue({
      schema: schema_name,
      dataset: dataset,
      timeliness_percent: 50.0
    });

    let jsonRes = await metricsService.getTimelinessMetric(schema_name, dataset, frequency, from, to);
    expect(edlApiHelper.get).toHaveBeenCalledTimes(1);
    expect(jsonRes.schema).toEqual(schema_name);
    expect(jsonRes.dataset).toEqual(dataset);
    expect(jsonRes.timeliness_percent).toEqual(50.0);
  });

  it('should get latest completed quality metrics', async() => {
    edlApiHelper.get.mockResolvedValue([{}]);
    const tableName = 'test.table1';
    const metric = '';
    const status = 'COMPLETE';
    featureToggleService.getToggle.mockResolvedValue({ enabled: true });
    await metricsService.getMetric(tableName, metric, status);
    expect(edlApiHelper.get).toBeCalledWith(`http://host.docker.internal:8081/quality/TEST.TABLE1/versions/latest?source=collibra`, false);
  })

  it('should get latest quality metric', async() => {
    edlApiHelper.get.mockResolvedValue({});
    const tableName = 'test.table1';
    const metric = '';
    const status = null;
    featureToggleService.getToggle.mockResolvedValue({ enabled: true });
    await metricsService.getMetric(tableName, metric, status);
    expect(edlApiHelper.get).toBeCalledWith(`http://host.docker.internal:8081/quality/TEST.TABLE1/versions/latest?source=collibra`, false);
  })
});