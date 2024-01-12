const { INTERNAL_SERVER_ERROR, OK } = require('http-status-codes');
const accessService = require('../services/accessService');
const { createLoggerWithAttributes } = require('../utilities/logCreator');
const AclsService = require("../services/AclsService");
const HttpErrorHandler = require('../services/HttpErrorHandler');

function setupLogger(req, res, microservice, methodName, id, version) {
  const logger = createLoggerWithAttributes(req, res, microservice, methodName, id, version);
  accessService.setLogger(logger);
  return logger;
}

const getAcls = async (req, res) => {
  const logger = createLoggerWithAttributes(req, res, 'jdc-acls', 'getAcls');
  const acls = new AclsService(req.query);
  acls.setLogger(logger);

  logger.info('getting acls');
  try {
    const response = await acls.getAcls();
    logger.info('completed getting acls');
    res.status(OK).json(response);
  } catch (e) {
    logger.error(`failed to get acls with error: ${e.stack}`);
    const httpErrorHandler = new HttpErrorHandler();
    const errorMessage = e.message;
    const status = httpErrorHandler.getStatus(errorMessage);
    res.status(status).json({errorMessage});
  }
}

function registerRoutes(server) {
  server.post('/api/accessible-datasets', (req, res, done) => {
    const log = setupLogger(req, res, 'accessible-datasets', 'getDatasetsForEntitlements');
    log.info('Finding datasets for provided entitlements');
    accessService.getDatasetsForEntitlements(req.body)
      .then(datasets => {
        log.info('sending found datasets');
        res.json(datasets);
      })
      .catch(e => {
        log.error(e.stack);
        done('unable to fetch datasets for entitlements');
      });
  });

  server.post('/api/allowed-permissions', (req, res, done) => {
    const log = setupLogger(req, res,'accessible-datasets','getPermissionsForClassifications');
    log.info('Finding allowed permissions for provided classifications');
    accessService.getPermissionsForClassifications(req.body)
      .then(permissions => {
        log.info('sending allowed permissions for provided classifications');
        res.json(permissions);
      })
      .catch(e => {
        log.error(e.stack);
        done('unable to fetch permissions for classifications');
      });
  });

  server.get('/api/accessible-dataset/:name', (req, res) => {
    const { params: { name: id }, user: { groups }} = req;
    const log = setupLogger(req, res, 'accessible-datasets','getUserAccessForDataset', id);
    log.info('Finding accessibility for dataset: ', id);
    accessService.getUserAccessForDataset(id, groups)
      .then(hasAccess => {
        log.info('sending accessibility for dataset: ', id);
        res.json(hasAccess);
      })
      .catch(error => {
        log.error('unable to determine user access for dataset');
        res.status(INTERNAL_SERVER_ERROR).json(error);
      });
  });

  server.get('/api/dataset-permission-report/:dataset', (req, res) => {
    const { dataset: id } = req.params;
    const log = setupLogger(req, res, 'dataset-permission-report', id);
    log.info('start generating user list');
    accessService.generateUserList(id)
      .then(contents => {
        log.info('completed generating user list');
        res.status(OK).json(contents);
      })
      .catch(error => {
        log.error(error.message);
        res.status(INTERNAL_SERVER_ERROR).json({error: error.message});
      });
  });

  server.route('/api-external/acls')
    .get(getAcls);
}

module.exports = { registerRoutes };
