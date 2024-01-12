const healthService = require('../services/healthService');
const availabilityService = require('../services/availabilityService');
const { createLoggerWithAttributes } = require('../utilities/logCreator');
const { OK } = require('http-status-codes');


function registerRoutes(server) {
  server.get('/api/health', (req, res) => res.json({ status: Date.now() }));

  server.get('/api/healthcheck', (req, res) => healthService.checkHealth().then(result => res.json(result)));

  server.get('/api-external/available', (req, res) => {
    const logger = createLoggerWithAttributes(req, res, 'health-controller', 'getAvailability');
    availabilityService.setLogger(logger);
    availabilityService.getAvailability().then(result => res.status(OK).json(result));
  });
}

module.exports = { registerRoutes };
