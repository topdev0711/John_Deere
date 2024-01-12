const ResponseCache = require('../../../src/controllers/responseCache');

jest.mock('cache-manager');

describe('ResponseCache test suite', () => {
  it('gets cached value', (done) => {
    const callback = jest.fn();
    const mockGet = jest.fn().mockResolvedValue({id: 'foo'});
    const mockJson = jest.fn().mockImplementation(() => done());
    const cache = new ResponseCache();
    cache.overrideCache({ get: mockGet })
    cache.getOrUpdate({ url: 'url' }, { json: mockJson }, callback);
    expect(mockGet).toBeCalledWith('url');
    expect(callback).toBeCalledTimes(0);
  });

  it('invalidates cache', () => {
    const delCallback = jest.fn().mockResolvedValue(1);
    const cache = new ResponseCache();
    cache.overrideCache({ deleteAll: delCallback })
    cache.invalidate(null, null, jest.fn());
    expect(delCallback).toBeCalledTimes(1);
  });
});
