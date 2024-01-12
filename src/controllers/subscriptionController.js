const subscriptionService = require('../services/subscriptionService');
const format = require('../utilities/format');
const { BAD_REQUEST, OK } = require('http-status-codes');
const { createLoggerWithAttributes } = require('../utilities/logCreator');

function setupLogger(req, res, methodName, id, version) {
  const logger = createLoggerWithAttributes(req,  res, 'workflow-calls', methodName, id, version);
  res.set({'X-Correlation-Id': logger.getCorrelationId()});
  subscriptionService.setLogger(logger);
  return logger;
}

function registerRoutes(server) {

  server.post('/api/subscriptions', (req, res) => {
    const log = setupLogger(req, res, 'create subscriptions');
    log.info('start creating subscription');
    subscriptionService.subscribe(req.body)
    .then(response => {
      if (response instanceof Error) throw response;
      log.info('completed subscription call',response);
      res.status(OK).json(response)
    })
    .catch(e => {
      log.error('inside workflow controller post subscritpion with error:', e);
      const error = decodeURI(format.formatValidationErrors(e));
      const status = error.statusCode? error.statusCode : BAD_REQUEST
      res.status(status).json({ error } );
    });
  })

  server.get('/api/v1/subscriptions/:dataType', (req, res) => {
    console.log('Calling controller API')
    const { dataType } = req.params;
    const log = setupLogger(req, res, 'Get list of subscriptions');
    log.info('Calling list of subscriptions');
    subscriptionService.listSubscriptions(dataType)
    .then(response => {
      if (response instanceof Error) throw response;
      log.info('completed subscription call',response);
      res.status(OK).json(response)
    })
    .catch(e => {
      log.error('inside subscription controller get subscritpion list with error:', e);
      const error = decodeURI(format.formatValidationErrors(e));
      const status = error.statusCode? error.statusCode : BAD_REQUEST
      res.status(status).json({ error } );
    });
})

  
}

module.exports = { registerRoutes };
