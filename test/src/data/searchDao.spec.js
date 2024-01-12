const searchDao = require('../../../src/data/searchDao');
const elasticsearch = require('elasticsearch');
const awsCreds = require('http-aws-es');

jest.mock('elasticsearch');
jest.mock('http-aws-es');
jest.mock('../../../conf', () => {
  return {
    getConfig() {
      return {esHost: 'host' + process.env.APP_ENV, region: 'foo'}
    }
  }
});

const originalEnv = process.env.APP_ENV;

describe('searchDao tests', () => {
  let indexFn, searchFn, bulkFn, updateByQueryFn;

  beforeEach(() => {
    indexFn = jest.fn().mockResolvedValue([]);
    searchFn = jest.fn().mockResolvedValue({hits: {hits: []}});
    bulkFn = jest.fn().mockResolvedValue([]);
    updateByQueryFn = jest.fn().mockResolvedValue();
    elasticsearch.Client.mockImplementation(() => ({
      index: indexFn,
      search: searchFn,
      bulk: bulkFn,
      updateByQuery: updateByQueryFn
    }));
  });

  afterEach(() => {
    process.env.APP_ENV = originalEnv;
  });

  it('should index item', async () => {
    const body = {id: 'foo', version: 1, foo: 'bar'};
    await searchDao.upsert('perms', body);
    expect(indexFn).toBeCalledWith({
      index: 'perms',
      refresh: 'wait_for',
      type: 'perm',
      id: 'foo--1',
      body
    });
  });

  it('should search by status', async () => {
    searchFn.mockResolvedValue({
      hits: {
        hits: [{_source: {foo: 'bar'}}]
      }
    });

    const results = await searchDao.searchByStatus('perms', ['foo']);
    expect(searchFn).toBeCalledWith({
      index: 'perms',
      body: {
        query: {
          bool: {
            filter: [
              {
                terms: {
                  'status.keyword': ['foo']
                }
              }
            ]
          }
        },
        size: 10000
      }
    });

    expect(results).toEqual([{foo: 'bar'}]);
  });

  it('should search by status with default', async () => {
    await searchDao.searchByStatus('perms');
    expect(searchFn).toBeCalledWith({
      index: 'perms',
      body: {
        query: {
          bool: {
            filter: [
              {
                terms: {
                  'status.keyword': ['AVAILABLE']
                }
              }
            ]
          }
        },
        size: 10000
      }
    });
  });

  it('should search by id and version', async () => {
    await searchDao.searchByIdAndVersion('dataset', 'id', 'version');

    expect(searchFn).toBeCalledWith({
      index: 'dataset',
      body: {
        query: {
          bool: {
            must: [
              {
                match: {
                  'id':  'id'
                }
              },
              {
                match: {
                  'version':  'version'
                }
              }
            ]
          }
        },
        size: 1
      }
    });
  });

  it('should search by just ID', async () => {
    await searchDao.searchByIdAndVersion('dataset', 'id');

    expect(searchFn).toBeCalledWith({
      index: 'dataset',
      body: {
        query: {
          bool: {
            must: [
              {
                match: {
                  'id':  'id'
                }
              }
            ]
          }
        },
        size: 10000
      }
    });
  });

  it('should bulk index', async () => {
    const items = [{id: '1', version: 1, environment: {}}, {id: '2', version: 1, environment: {}}];

    await searchDao.bulkUpsert('things', items);

    expect(bulkFn).toBeCalledWith({
      body: [
        {index: {_id: '1--1', _index: 'things', _type: 'thing'}},
        items[0],
        {index: {_id: '2--1', _index: 'things', _type: 'thing'}},
        items[1]
      ]
    });
  });

  it('should update property for id and field', async () => {
    await searchDao.updatePropertyForId('datasets', 'id1', 'discoveredSchemas', ['new value'])
    expect(updateByQueryFn).toBeCalledWith({
      index: 'datasets',
      refresh: true,
      waitForCompletion: true,
      body: {
        "script": {
          "source": "ctx._source['discoveredSchemas'] = [\"new value\"]",
          "lang": "painless"
        },
        "query": {
          "term": {
            "id.keyword": "id1"
          }
        }
      }
    })
  });

  it('should fail to update property for id and field', () => {
    updateByQueryFn.mockRejectedValue('error');
    const result = searchDao.updatePropertyForId('datasets', 'id1', 'discoveredSchemas', ['new value']);
    return expect(result).rejects.toEqual(new Error('failed to update property'));
  });

  it('should search by dateFilter for updatedAt', async () => {
    searchFn.mockResolvedValue({
      hits: {
        hits: [{_source: {foo: 'bar'}}]
      }
    });

    const group = undefined;
    const clientId = undefined;
    const queryParams = {
      dateFilter: 'updatedAt',
      start: '2020-06-20T00:00:00.000Z',
      end: '2020-07-20T00:00:00.000Z'
    };
    const results = await searchDao.searchByStatus('perms', ['AVAILABLE'], group, clientId, queryParams);
    expect(searchFn).toBeCalledWith({
      index: 'perms',
      body: {
        query: {
          bool: {
            filter: [
              {
                "terms": {
                  "status.keyword": [
                    "AVAILABLE"
                  ]
                }
              },
              {
                "range": {
                  "updatedAt": {
                    "gte": "2020-06-20T00:00:00.000Z",
                    "lte": "2020-07-20T00:00:00.000Z"
                  }
                }
              }
            ]
          }
        },
        size: 10000
      }
    });

    expect(results).toEqual([{foo: 'bar'}]);
  });

  it('should search by dateFilter for createdAt', async () => {
    searchFn.mockResolvedValue({
      hits: {
        hits: [{_source: {foo: 'bar'}}]
      }
    });

    const group = undefined;
    const clientId = undefined;

    const queryParams = {
      dateFilter: 'createdAt',
      start: '2020-06-20T00:00:00.000Z',
      end: '2020-07-20T00:00:00.000Z'
    };
    const results = await searchDao.searchByStatus('perms', ['AVAILABLE'], group, clientId, queryParams);
    expect(searchFn).toBeCalledWith({
      index: 'perms',
      body: {
        query: {
          bool: {
            filter: [
              {
                "terms": {
                  "status.keyword": [
                    "AVAILABLE"
                  ]
                }
              },
              {
                "range": {
                  "createdAt": {
                    "gte": "2020-06-20T00:00:00.000Z",
                    "lte": "2020-07-20T00:00:00.000Z"
                  }
                }
              }
            ]
          }
        },
        size: 10000
      }
    });

    expect(results).toEqual([{foo: 'bar'}]);
  });

  it('should search by dateFilter with only start date provided', async () => {
    searchFn.mockResolvedValue({
      hits: {
        hits: [{_source: {foo: 'bar'}}]
      }
    });

    const group = undefined;
    const clientId = undefined;
    const queryParams = {
      dateFilter: 'updatedAt',
      start: '2020-06-20T00:00:00.000Z'
    };
    const results = await searchDao.searchByStatus('perms', ['AVAILABLE'], group,  clientId, queryParams);
    expect(searchFn).toBeCalledWith({
      index: 'perms',
      body: {
        query: {
          bool: {
            filter: [
              {
                "terms": {
                  "status.keyword": [
                    "AVAILABLE"
                  ]
                }
              },
              {
                "range": {
                  "updatedAt": {
                    "gte": "2020-06-20T00:00:00.000Z"
                  }
                }
              }
            ]
          }
        },
        size: 10000
      }
    });

    expect(results).toEqual([{foo: 'bar'}]);
  });

  it('should search by status, group, dateFilter', async () => {
    searchFn.mockResolvedValue({
      hits: {
        hits: [{_source: {foo: 'bar'}}]
      }
    });

    const group = ['AWS-AE-OPS-SUPPORT'];
    const clientId = undefined;
    const queryParams = {
      dateFilter: 'updatedAt',
      start: '2020-06-20T00:00:00.000Z',
      end: '2020-07-20T00:00:00.000Z'
    };
    const results = await searchDao.searchByStatus('perms', ['AVAILABLE'], group, clientId, queryParams);
    expect(searchFn).toBeCalledWith({
      index: 'perms',
      body: {
        query: {
          bool: {
            filter: [
              {
                "terms": {
                  "status.keyword": [
                    "AVAILABLE"
                  ]
                }
              },
              {
                "terms": {
                  "group.keyword": [
                    "AWS-AE-OPS-SUPPORT"
                  ]
                }
              },
              {
                "term": {
                  "roleType.keyword": "human"
                }
              },
              {
                "range": {
                  "updatedAt": {
                    "gte": "2020-06-20T00:00:00.000Z",
                    "lte": "2020-07-20T00:00:00.000Z"
                  }
                }
              }
            ]
          }
        },
        size: 10000
      }
    });

    expect(results).toEqual([{foo: 'bar'}]);
  });

  it('should search by status, clientId, dateFilter', async () => {
    searchFn.mockResolvedValue({
      hits: {
        hits: [{_source: {foo: 'bar'}}]
      }
    });

    const group = undefined;
    const clientId = ['client-id'];
    const queryParams = {
      dateFilter: 'updatedAt',
      start: '2020-06-20T00:00:00.000Z',
      end: '2020-07-20T00:00:00.000Z'
    };
    const results = await searchDao.searchByStatus('perms', ['AVAILABLE'], group, clientId , queryParams);
    expect(searchFn).toBeCalledWith({
      index: 'perms',
      body: {
        query: {
          bool: {
            filter: [
              {
                "terms": {
                  "status.keyword": [
                    "AVAILABLE"
                  ]
                }
              },
              {
                "terms": {
                  "clientId.keyword": [
                    "client-id"
                  ]
                }
              },
              {
                "term": {
                  "roleType.keyword": "system"
                }
              },
              {
                "range": {
                  "updatedAt": {
                    "gte": "2020-06-20T00:00:00.000Z",
                    "lte": "2020-07-20T00:00:00.000Z"
                  }
                }
              }
            ]
          }
        },
        size: 10000
      }
    });

    expect(results).toEqual([{foo: 'bar'}]);
  });

});
