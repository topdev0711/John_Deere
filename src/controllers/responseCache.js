const { getRedisCacheManager } = require('../../conf');
class ResponseCache {
  constructor(ttl = 3600) {
    this.cache = async (ttl) => {
      await getRedisCacheManager(ttl);
    }

    this.getOrUpdate = (req, res, done) => {
      const key = req.originalUrl || req.url
      this.cache.get(key).then(value => {
        if (value != null) {
          res.json(value);
        } else {
          res.sendResponse = res.json;
          res.json = (body) => {
            this.cache.set(key, body);
            res.sendResponse(body);
          }
          done();
        }
      });
    }

    this.invalidate = async (_req, _res, done) => {
      await this.cache.deleteAll("/api*");
      done();
    }

    this.overrideCache = (cache) => {
      this.cache = cache;
    }
  }
}

module.exports = ResponseCache;
