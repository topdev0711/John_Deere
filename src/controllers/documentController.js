const documentService = require('../services/documentService');
const { createLoggerWithAttributes } = require('../utilities/logCreator');
const featureToggleService = require("../services/featureToggleService");
const conf = require('../../conf');
const { StatusCodes } = require('http-status-codes');
const { FORBIDDEN } = StatusCodes;

const disableMessage = "Error: Endpoint Disabled please reach out to EDL Catalog Support for assistance"

async function isApiDisabled() {
  let documentsToggle = !!(await featureToggleService.getToggle(conf.getConfig().documentControllerFlag))?.enabled
  documentsToggle = (documentsToggle) ? documentsToggle : false;
  return documentsToggle
}

function getOtherVars(collection, id, version) {
  const message = {};
  if (collection) message.collection = collection;
  if (id) message.id = id;
  if (version) message.version = version;
  return { message };
}

function setupLogger(req, res, methodName, collection, id, version) {
  const logger = createLoggerWithAttributes(req, res, 'documents', methodName, id, version);
  logger.setOtherVars(getOtherVars(collection, id, version));
  documentService.setLogger(logger);
  return logger;
}

function registerRoutes(server) {
  const isAdmin = (username) => ['cl98561', 'br79641', '0oaj75755xAF3dJgQ0h7', "0oa61niur1qpKMeBU1t7", 'EDL'].includes(username);

  server.get('/api-external/documents/:collection/ids/:id/versions/:version', (req, res, done) => {
    isApiDisabled().then(disabled => {
      if (!disabled) res.status(FORBIDDEN).send(disableMessage)
      else {
      const { collection, id, version } = req.params;
      const log = setupLogger(req, res, '(external) get document', collection, id, version);
      log.info('start getting document');
      documentService.searchByIdAndVersion(collection, id, version)
        .then((result) => {
          log.info('completed getting document');
          res.json(result);
        })
        .catch(e => {
          log.error(e.stack);
          done(e);
        });
      }
    })
  });

  server.post('/api-external/documents/:collection', (req, res, done) => {
    isApiDisabled().then(disabled => {
      if (!disabled) res.status(FORBIDDEN).send(disableMessage)
      else {
        const { collection } = req.params;
        const log = setupLogger(req, res, '(external) save', collection);
        if (isAdmin(req.user.username)) {
          log.info('start saving documents');
          documentService.putDocument(collection, req.body)
            .then(result => {
              log.info('completed saving documents');
              res.json(result);
            })
            .catch(e => {
              log.error(e.stack);
              done(e);
            });
        } else {
          res.json('Only admins can run this command.');
        }
      }
    })
  });

  server.get('/api-external/documents/:collection', (req, res, done) => {
    isApiDisabled().then(disabled => {
      if (!disabled) res.status(FORBIDDEN).send(disableMessage)
      else {
        const { collection } = req.params;
        const log = setupLogger(req, res, '(external) get all documents', collection);
        log.info('start getting documents');
        documentService.getRecords(collection)
          .then((results) => {
            log.info('completed getting documents');
            res.json({ collection, totalRecords: results.length, sample: results.slice(-2) })
          })
          .catch(e => {
            log.error(e.stack);
            done(e);
          });
      }
    })
  })
}

module.exports = { registerRoutes };
