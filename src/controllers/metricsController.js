// Unpublished Work © 2021-2022 Deere & Company.
const { OK, INTERNAL_SERVER_ERROR } = require('http-status-codes');
const metricsService = require('../services/metricsService');
const { createLoggerWithAttributes } = require('../utilities/logCreator');

function setupLogger(req, res, methodName, id, version) {
  const logger = createLoggerWithAttributes(req, res, 'metrics', methodName, id, version);
  metricsService.setLogger(logger);
  return logger;
}

function registerRoutes(server) {
  server.get('/api/metrics', (req, res, _done) => {
    const applications = (req.query.applications || "").split(',');
    const log = setupLogger(req, res, 'get metrics');
    log.info('start getting metrics');
    metricsService.getApplicationsMetrics(applications)
      .then(metrics => {
        log.info('completed getting metrics');
        res.status(OK).json(metrics);
      })
      .catch(error => {
        log.error(error);
        res.status(INTERNAL_SERVER_ERROR).json(error);
      });
  });

  server.get('/api/metrics/timeliness', (req, res, _done) => {
    const log = setupLogger(req, res, '(schema-metrics) get metrics');
    log.info('getting timeliness metrics');
    const {schema_name, dataset, frequency, from, to} = req.query;
    metricsService.getTimelinessMetric(schema_name, dataset, frequency, from, to)
      .then(metrics => {
        log.info('completed getting timeliness metrics');
        res.status(OK).json(metrics);
      })
      .catch(error => {
        log.error(error);
        res.status(INTERNAL_SERVER_ERROR).json(error);
      });
  });

  server.get('/api/metrics/quality/:tableName', (req, res) => {
    const log = setupLogger(req, res, 'get-quality-metrics');
    log.info('getting quality metrics');
    const { params: {tableName}, query: {metric, status} } = req;

    metricsService.getMetric(tableName, metric, status)
      .then(metrics => {
        log.info('completed getting quality metrics');
        res.status(OK).json(metrics);
      })
      .catch(error => {
        log.error(error);
        res.status(INTERNAL_SERVER_ERROR).json(error);
      });
  });

  server.post('/api/metrics/quality/:tableName', (req, res) => {
    const log = setupLogger(req, res, 'create-quality-metric');
    const { params: {tableName} } = req;
    metricsService.postMetric(tableName)
      .then((response) => {
        log.info('completed posting quality metrics');
        res.status(OK).json(response);
      })
      .catch(error => {
        log.error(error);
        res.status(INTERNAL_SERVER_ERROR).json(error);
      });
  });

  server.get('/api-external/metrics', (req, res, _done) => {
    const applications = (req.query.applications || "").split(',');
    const log = setupLogger(req, res, '(external) get metrics');
    log.info('start getting metrics');
    metricsService.getApplicationsMetrics(applications)
      .then(metrics => {
        log.info('completed getting metrics');
        res.status(OK).json(metrics);
      })
      .catch(error => {
        log.error(error);
        res.status(INTERNAL_SERVER_ERROR).json(error);
      });
  });

}

module.exports = { registerRoutes }
