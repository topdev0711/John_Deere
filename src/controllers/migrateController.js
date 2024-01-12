const migrationService = require('../services/migrationService');
const { createLoggerWithAttributes } = require('../utilities/logCreator');

function registerRoutes(server) {
  server.post('/api-external/migrate-missing-tables', (req, res) => {
    const dryrun = req.query.dryrun === undefined || req.query.dryrun === 'true';
    const skipEdl = req.query.skipedl === undefined || req.query.skipedl === 'true';

    const log = createLoggerWithAttributes(req, res, 'metastore', '(external) save tables');
    migrationService.setLogger(log);
    log.info(`start migrating missing tables dryrun: ${dryrun} and skipEdl: ${skipEdl}`);
    migrationService.migrateMissingTables(dryrun, skipEdl)
    .then(migrated => {
      log.info('completed migrating missing tables');
      res.json(migrated);
    })
    .catch(error => {
      log.error(error);
      res.send('Received error: ' + JSON.stringify(error));
    });
  });
}

module.exports = { registerRoutes };
