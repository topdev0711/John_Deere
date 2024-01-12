const adapter = require('../services/externalToInternalDatasetAdapter');
const controllerHandlers = require('./controllerHandlers');
const datasetReferenceService = require('../services/datasetReferenceService');
const datasetService = require('../services/datasetService');
const datasetSearchService = require('../services/datasetSearchService');
const edlMetricService = require('../services/edlMetricService');
const permissionService = require('../services/permissionService');
const predictionService = require('../services/predictionService');
const errorStatusCode = require('../utilities/errorStatusCode');
const _ = require('lodash');
const s3Service = require('../data/s3');
const conf = require('../../conf');
const format = require('../utilities/format');
const { performance } = require('perf_hooks');
const { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND, OK, MULTI_STATUS } = require('http-status-codes');
const config = conf.getConfig();
const { attachmentsBucket, isAdmin, metastoreBucket } = config;
const { createLoggerWithAttributes } = require('../utilities/logCreator');
const {ALL_STATUSES} = require("../services/statusService");
const {multerUploadFile, upload} = require("../data/s3");
const { getStatusCode, createErrorMessage, handleInternalUnauthorized } = controllerHandlers;
const handleUnauthorized = res => handleInternalUnauthorized(new Error('Not an admin. User is not authorized'), res);

function setupLogger(req, res, methodName, id, version) {
  const logger = createLoggerWithAttributes(req, res, 'datasets', methodName, id, version);
  adapter.setLogger(logger);
  controllerHandlers.setLogger(logger);
  datasetReferenceService.setLogger(logger);
  datasetService.setLogger(logger);
  datasetSearchService.setLogger(logger);
  edlMetricService.setLogger(logger);
  predictionService.setLogger(logger);
  permissionService.setLogger(logger);
  s3Service.setLogger(logger);
  return logger;
}

function setBenchmark(start, end, res) {
  const timeTook = (end - start) / 1000;
  res.setHeader('X-DEERE-JDC-BENCHMARK', `${timeTook} seconds`);
}

const getId = request => request.params.id;
const getVersion = request => Number(request.params.version);
const isDetailed = request => {
  const detailed = request.query.isDetailed;
  if (!detailed) return true;
  return detailed === 'true';
};
const getIsoDatetime = () => new Date().toISOString();

function findDatasets(req, res, log) {
  log.info('start getting datasets');
  datasetSearchService.findDatasets({_query : req.query, _user : req.user})
    .then(response => {
      log.info('completed getting datasets from Opensearch');
      res.status(OK).json(response)
    })
    .catch(e => {
      log.error(e.stack);
      datasetService.searchForDataset(req.query)
        .then(response => {
          log.info('completed getting datasets from Document DB');
          res.status(OK).json(response)
        })
        .catch(e => {
          log.error(e.stack);
          res.json(INTERNAL_SERVER_ERROR).json({error: 'unable to fetch datasets from DocumentDB'});
        });
    });
}

function findDatasetsCounts(req, res, log) {
  datasetSearchService.findDatasetsCount({_query : req.query, _user : req.user})
    .then(response => {
      log.info('completed getting count of datasets for search');
      res.status(OK).json(response);
    }).catch(e => {
      log.error(e.stack);
      res.status(INTERNAL_SERVER_ERROR).json({error: 'unable to get search dataset count'});
  });
}

function registerRoutes(server) {
  server.get('/api/datasets', (req, res, done) => {
    const log = setupLogger(req, res, 'get datasets');
    log.info('start getting datasets');

    datasetService.searchForDataset(req.query)
      .then(response => {
        log.info('completed getting datasets from Document DB');
        res.status(OK).json(response)
      })
      .catch(e => {
        log.error(e.stack);
        done('unable to fetch datasets from DocumentDB');
      });
  });

  server.get('/api/datasets/v2', (req, res) => {
    const log = setupLogger(req, res, 'get datasets v2');
    const call = req.query.count === 'true' ? findDatasetsCounts : findDatasets;
    call(req, res, log);
  });

  server.get('/api/datasets/:id/schemas/linked-datasets', (req, res, done) => {
    const id = getId(req);
    const log = setupLogger(req, res, 'get linked-datasets', id);
    log.info('start getting linked-datasets');
    datasetService.searchForLinkedDatasets(id, req.query.status)
      .then(datasets => {
        log.info('completed getting linked-datasets');
        res.status(OK).json(datasets)
      })
      .catch(e => {
        log.error(e.stack);
        done('unable to fetch linked datasets');
      });
  });

  server.get('/api/datasets/:id/linked-schemas/linked-datasets', (req, res, done) => {
    const id = getId(req);
    const log = setupLogger(req, res, 'get linked-schemas linked-datasets', id);
    log.info('start getting linked-schemas linked-datasets');
    datasetService.searchForLinkedDatasetsWithLinkedSchemas(id)
      .then(response => {
        log.info('completed getting linked-schemas linked-datasets');
        res.json(response);
      })
      .catch(e => {
        log.error(e.stack);
        done('unable to fetch linked datasets');
      });
  });

  server.get('/api/datasets/:id/lineages', (req, res, done) => {
    const id = getId(req);
    const log = setupLogger(req, res, 'get lineages', id);
    log.info('start getting lineages');
    const { type } = req.query;
    if (!type) throw new Error("Operation not supported without type");

    datasetService.getLineages(id, type)
      .then(response => {
        log.info('completed getting lineages');
        res.json(response);
      })
      .catch(e => {
        log.error(e.stack);
        done('unable to fetch downstream datasets');
      });
  });

  server.get('/api/datasets/approvals', (req, res, done) => {
    const log = setupLogger(req, res, 'get user approvals');
    log.info('start getting user approvals');
    datasetService.findAllForApproval(req.user)
      .then(response => {
        log.info('completed getting user approvals');
        res.json(response);
      })
      .catch(e => {
        log.error(e.stack);
        done({ error: e.message });
      });
  });

  function getFilesMetadata(req, res) {
    const id = getId(req);
    const version = getVersion(req);
    const log = setupLogger(req, res, 'get dataset files metadata', id, version);
    log.info('start getting get dataset files metadata');
    datasetService.getDatasetContents(getId(req), getVersion(req), req.headers.next, req.headers.prefix)
      .then(contents => {
        log.info('completed getting dataset contents');
        res.status(OK).json(contents);
      })
      .catch(e => {
        log.error(e.stack);
        const error = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({ error });
      });
  }

  server.get('/api/datasets/:id/versions/:version/files', (req, res) => getFilesMetadata(req, res));
  server.get('/api-external/datasets/:id/versions/:version/files', (req, res) => getFilesMetadata(req, res));

  server.get('/api/datasets/:id/versions', (req, res, done) => {
    const id = getId(req);
    const log = setupLogger(req, res, 'get dataset versions', id);
    log.info('start getting dataset versions');
    datasetService.getAllDatasetVersions(id)
      .then(response => {
        log.info('completed getting versions');
        res.json(response);
      })
      .catch(e => {
        log.error(e.stack);
        done({ error: e.message });
      });
  });

  server.get('/api/datasets/:id/versions/:version/attachments', (req, res) => {
    const id = getId(req);
    const version = getVersion(req);
    const log = setupLogger(req, res, 'get dataset attachments', id, version);
    log.info('start getting attachments');
    datasetService.getAttachments(`${id}-${version}/`)
      .then(contents => {
        log.info('completed getting attachments');
        res.status(OK).json(contents);
      })
      .catch(e => {
        log.error(e.stack);
        const error = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({ error });
      });
  });

  server.get('/api/datasets/staged-attachments/:uuid', (req, res) => {
    const { uuid: id } = req.params;
    const log = setupLogger(req, res, 'get staged attachment', id);
    log.info('start getting attachment');
    datasetService.getAttachments(`staged/${id}/`)
      .then(contents => {
        log.info('completed getting attachment');
        res.status(OK).json(contents);
      })
      .catch(e => {
        log.error(e.stack);
        const error = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({ error });
      });
  });

  server.delete('/api/datasets/staged/:uuid/:fileName', (req, res) => {
    const { fileName, uuid: id } = req.params.uuid;
    const log = setupLogger(req, res, 'delete attachment');
    log.setOtherVars({ id, message: { fileName } });
    log.info('start deleting attachment');
    const key = `staged/${id}/${fileName}`
    s3Service.deleteAttachment(attachmentsBucket, key)
      .then(() => {
        log.info('completed deleting attachment');
        res.status(OK).json({ message: 'Successfully deleted' });
        res.end();
      })
      .catch(e => {
        log.error(e.stack);
        res.status(INTERNAL_SERVER_ERROR).json({ success: false, error: { message: `delete failed ${e.message}` } });
        res.end();
      });
  });

  server.get('/api/raw-datasets', (req, res, done) => {
    const log = setupLogger(req, res, 'get raw datasets');
    log.info('start getting raw datasets');
    const startTime = performance.now();
    datasetService.getRawDatasets(req.query.status ? [].concat(req.query.status) : undefined)
      .then(datasets => {
        log.info('completed getting raw datasets');
        const endTime = performance.now();
        setBenchmark(startTime, endTime, res);
        res.json(datasets);
      })
      .catch(e => {
        log.error(e.stack);
        done('unable to fetch raw datasets');
      });
  });

  function getDataset(req, res, isDetailed, done, id, version) {
    const log = setupLogger(req, res, 'get dataset', id);
    log.info('start getting dataset');
    const statuses = req.query.status ? [].concat(req.query.status) : ALL_STATUSES;
    const formattedStatuses = statuses.map(status => status.toUpperCase());
    datasetService.getDataset(isDetailed, id, version, formattedStatuses)
      .then(dataset => {
        log.info('completed getting dataset');
        res.status(OK).json(dataset);
      })
      .catch(e => {
        log.error(e.stack);
        const status = e.statusCode ? e.statusCode : NOT_FOUND;
        log.info(`the status in error is: ${status}`);
        const error = status === NOT_FOUND ? `Could not find dataset with id: ${id}` : e.message;
        res.status(status).json({ error });
      });
  }

  function getDatasetExternal(req, res, isDetailed, id, version) {
    const log = setupLogger(req, res, '(external) get dataset', id, version);
    log.info('start getting dataset');
    const statuses = req.query.status ? [].concat(req.query.status): ALL_STATUSES;
    const formattedStatuses = statuses.map(status => status.toUpperCase());
    datasetService.getDataset(isDetailed, id, version, formattedStatuses)
      .then(dataset => {
        log.info('completed getting dataset');
        res.status(OK).json(dataset);
      })
      .catch(e => {
        log.error(e.stack);
        const status = e.statusCode ? e.statusCode : NOT_FOUND;
        log.info(`the status in error is: ${status}`);
        const error = status === NOT_FOUND ? `Could not find dataset with id: ${id}` : e.message;
        res.status(status).json({ error });
      });
  }

  function deleteDatasetExternal(req, res) {
    const id = getId(req);
    const version = getVersion(req);
    const log = setupLogger(req, res, '(external) delete dataset', id, version);
    log.info('start deleting dataset');
    datasetService.deleteDataset(getId(req), req.body.requestComments, req.user)
      .then((dataset) => {
        log.info('completed deleting dataset');
        return res.status(OK).json(dataset);
      })
      .catch(e => {
        log.error(e.stack);
        const error = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({ error });
      });
  }

  server.get('/api/datasets/:id/:version', (req, res, done) => getDataset(req, res, isDetailed(req), done, getId(req), req.params.version));

  server.get('/api/datasets/:id', (req, res, done) => getDataset(req, res, isDetailed(req), done, getId(req)));

  server.get('/api/datasets/:id/versions/:version', (req, res, done) => getDataset(req, res, isDetailed(req), done, getId(req), req.params.version));

  server.post('/api/datasets', (req, res, _done) => {
    const log = setupLogger(req, res, 'create dataset');
    log.info('start creating dataset');
    datasetService.saveDataset(req.body, req.user)
      .then(() => {
        log.info('completed creating dataset');
        res.end();
      })
      .catch(e => {
        log.error(e.stack);
        const error = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({ error });
      });
  });

  server.post('/api/datasets/:id/versions/:version', (req, res) => {
    const datasetId = getId(req);
    const datasetVersion = getVersion(req)
    const log = setupLogger(req, res, 'update dataset', datasetId, datasetVersion);
    log.info('start updating dataset');
    datasetService.updateDataset(datasetId, datasetVersion, req.body, req.user)
      .then(({ id, version }) => datasetService.getDataset(isDetailed(req), id, version))
      .then(() => {
        log.info('completed updating dataset');
        res.end();
      })
      .catch(e => {
        log.error(e.stack);
        const error = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({ error });
      });
  });

  server.post('/api/datasets/:id/versions/:version/published-paths', (req, res) => {
    const datasetId = getId(req);
    const datasetVersion = getVersion(req)
    const log = setupLogger(req, res, 'update published paths', datasetId, datasetVersion);
    log.info('start updating published paths');
    datasetService.updatePublishedPaths(getId(req), getVersion(req), req.body, req.user)
      .then(({ id, version }) => datasetService.getDataset(isDetailed(req), id, version))
      .then(() => {
        log.info('completed updating published paths');
        res.end();
      })
      .catch(e => {
        log.error(e.stack);
        const error = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({ error });
      });
  });

  server.post('/api/datasets/delete-file', (req, res) => {
    const log = setupLogger(req, res, 'delete file');
    log.info('start deleting file');
    s3Service.deleteS3Object(req.body)
      .then((data) => {
        log.info('completed deleting file');
        res.status(OK).json({ message: 'Successfully deleted' });
        res.end();
      })
      .catch(e => {
        log.error(e.stack);
        res.status(INTERNAL_SERVER_ERROR).json({ success: false, error: { message: `delete failed ${e.message}` } });
        res.end();
      });
  });

  server.post('/api/datasets/upload-file', upload.single('file'), multerUploadFile);

  //api for move/rename file
  server.post('/api/datasets/move-file', (req, res) => {
    const log = setupLogger(req, res, 'move file');
    log.info('start moving file');
    try {
      const old_file_path = req.body.oldFilePath;
      const new_file_path = req.body.newFilePath;
      const bucket = req.body.bucket;
      const datasetAccount = req.body.account;
      log.info(bucket, old_file_path, new_file_path, datasetAccount)
      s3Service.moveFile(bucket, old_file_path, new_file_path, datasetAccount)
        .then(() => {
          log.info('completed moving file');
          res.send("File moved/renamed successfully");
          res.end();
        })
        .catch(e => {
          res.send("move/rename failed");
          log.error('move or rename failed', e.stack);
          handleInternalUnauthorized(e, res)
        });
    } catch (error) {
      log.error(error.stack);
      throw error;
    }
  });

  server.post('/api/datasets/download-file', (req, res) => {
    const log = setupLogger(req, res, 'download file');
    log.info(`start downloading file bucket : ${req.headers.bucket}, key : ${req.headers.key}, account : ${req.headers.account}.`);
    const promise = s3Service.downloadFile(req.headers.bucket, req.headers.key, req.headers.account);
    promise.then((data) => {
      log.info('completed downloading file');
      res.send(data.Body);
      res.status(OK);
      res.end();
    }).catch((err) => {
      log.error(`download failed for bucket : ${req.headers.bucket}, key : ${req.headers.key}, account : ${req.headers.account}.`, err.stack);
      res.status(INTERNAL_SERVER_ERROR).send({ message: `Error while downloading the file ... Please try again or contact EDL Team.` });
      res.end();
    });
  });

  server.post('/api/datasets/:id/:version/approve', (req, res) => {
    const id = getId(req);
    const version = getVersion(req);
    const log = setupLogger(req, res, 'approve', id, version);
    log.info('start approve');
    datasetService.approveDataset(id, version, req.user)
      .then(() => datasetService.getDataset(isDetailed(req), id, version))
      .then(() => {
        log.info('completed approve');
        res.end();
      })
      .catch(e => handleInternalUnauthorized(e, res));
  });

  server.post('/api/datasets/:id/:version/reject', (req, res) => {
    const id = getId(req);
    const version = getVersion(req);
    const log = setupLogger(req, res, 'reject', id, version);
    log.info('start reject');
    datasetService.rejectDataset(id, version, req.body.reason, req.user)
      .then(() => {
        log.info('completed reject');
        res.end();
      })
      .catch(e => handleInternalUnauthorized(e, res));
  });

  server.post('/api/datasets/:id/:version/lock', (req, res) => {
    const id = getId(req);
    const version = getVersion(req);
    const log = setupLogger(req, res, 'lock', id, version);
    log.info('start lock');
    const lockInfo = { username: req.user.username, name: req.user.name, lockDate: getIsoDatetime() };
    datasetService.lockDataset(id, version, lockInfo)
      .then(() => {
        log.info('complete lock');
        res.end();
      })
      .catch(e => handleInternalUnauthorized(e, res));
  });

  server.post('/api/datasets/:id/:version/unlock', (req, res) => {
    const id = getId(req);
    const version = getVersion(req);
    const log = setupLogger(req, res, 'unlock', id, version);
    log.info('start unlock');
    datasetService.unlockDataset(id, version, req.user.username, req.user.groups)
      .then(() => {
        log.info('completed unlock');
        res.end();
      })
      .catch(e => handleInternalUnauthorized(e, res));
  });

  server.delete('/api-external/datasets/:id/versions/:version', (req, res) => {
    const id = getId(req);
    const version = getVersion(req);
    const log = setupLogger(req, res, '(external) delete dataset', id, version);
    log.info('start deleting dataset');
    datasetService.deletePendingDataset(id, version, req.user)
      .then(() => {
        log.info('completed deleting dataset');
        res.status(OK).json({ id, version });
      })
      .catch(e => handleInternalUnauthorized(e, res));
  });

  server.delete('/api/datasets/:id/versions/:version', (req, res) => {
    const id = getId(req);
    const version = getVersion(req);
    const log = setupLogger(req, res, 'delete pending dataset', id, version);
    log.info('start deleting pending dataset');
    datasetService.deletePendingDataset(id, version, req.user)
      .then(() => {
        log.info('completed deleting pending dataset');
        res.end();
      })
      .catch(e => handleInternalUnauthorized(e, res));
  });

  server.delete('/api-external/datasets/:id', (req, res) => deleteDatasetExternal(req, res));

  server.delete('/api/datasets/:id', (req, res) => {
    const id = getId(req);
    const log = setupLogger(req, res, 'delete dataset', id);
    log.info('start deleting dataset');
    datasetService.deleteDataset(id, req.body.requestComments, req.user)
      .then(() => {
        log.info('completed deleting dataset');
        res.end();
      })
      .catch(e => {
        log.error(e.stack);
        const error = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({ error });
      });
  });

  server.get('/api-external/datasets', (req, res) => {
    const { query } = req;
    const log = setupLogger(req, res, '(external) get datasets');
    log.info('start getting datasets');
    datasetService.searchForDataset(query)
      .then((datasets) => {
        log.info('completed getting datasets');
        res.status(OK).json(datasets);
      })
      .catch(e => {
        log.error(e.stack);
        res.status(INTERNAL_SERVER_ERROR).json({ error: e.message });
      });
  });

  server.get('/api-external/datasets/approvals', (req, res, done) => {
    const log = setupLogger(req, res, 'get approvals');
    log.info('start getting approvals');
    datasetService.findAllForApproval(req.user)
      .then(response => {
        log.info('completed getting approvals');
        res.status(OK).json(response);
      })
      .catch(e => {
        log.error(e.stack);
        done({ error: e.message });
      });
  });

  server.get('/api-external/datasets/:id', (req, res) => getDatasetExternal(req, res, isDetailed(req), getId(req)));

  server.get('/api-external/datasets/:id/versions/:version', (req, res) => getDatasetExternal(req, res, isDetailed(req), getId(req), req.params.version));

  server.get('/api-external/datasets/:id/versions', (req, res) => {
    const id = getId(req);
    const log = setupLogger(req, res, '(external) get versions', id);
    log.info('start getting dataset versions');
    datasetService.getAllDatasetVersions(id)
      .then(response => {
        log.info('completed getting versions');
        res.status(OK).json(response);
      })
      .catch(e => {
        log.error(e.stack);
        const status = e.statusCode ? e.statusCode : NOT_FOUND;
        const error = status === NOT_FOUND ? `Could not find any version of dataset with id: ${id}` : e.message;
        res.status(status).json({ error });
      });
  });

  server.post('/api-external/datasets/:id/versions/:version/approve', (req, res) => {
    const id = getId(req);
    const version = getVersion(req);
    const sendEmail = req.query.sendEmail && JSON.parse(req.query.sendEmail);
    const log = setupLogger(req, res, '(external) approve', id, version);
    log.info('start approve with sendEmail flag : ', sendEmail);
    datasetService.approveDataset(id, version, req.user, req.body.details, sendEmail)
      .then(() => datasetService.getDataset(isDetailed(req), id, version))
      .then(() => {
        log.info('complete approve with sendEmail flag :', sendEmail);
        res.end();
      })
      .catch(e => handleInternalUnauthorized(e, res));
  });

  server.post('/api-external/datasets/:id/versions/:version/reject', (req, res) => {
    const id = getId(req);
    const version = getVersion(req);
    const log = setupLogger(req, res, '(external) reject', id, version);
    log.info('start reject');
    datasetService.rejectDataset(id, version, req.body.reason, req.user)
      .then(() => {
        log.info('completed reject');
        res.end();
      })
      .catch(e => handleInternalUnauthorized(e, res));
  });

  server.post('/api-external/datasets', (req, res) => {
    const log = setupLogger(req, res, '(external) create dataset');
    log.info('start creating dataset');
    adapter.adaptNewDataset(req.body, req.user.username)
      .then(dataset => datasetService.saveDataset(dataset, req.user))
      .then(response => {
        log.info('completed creating dataset');
        res.status(OK).json(response);
      })
      .catch(e => res.status(getStatusCode(e)).json({ error: createErrorMessage(e) }))
  });

  server.post('/api-external/datasets/:id/schemas', (req, res) => {
    const id = getId(req);
    const log = setupLogger(req, res, '(external) add schemas', id);
    log.info('start adding schemas');
    if (req.body.schemas) {
      datasetService.addSchemasToDataset(id, req.body.schemas)
        .then(response => {
          log.info('completed adding schemas');
          res.status(MULTI_STATUS).json(response);
        })
        .catch(e => res.status(getStatusCode(e)).json({ error: createErrorMessage(e) }))
    } else {
      res.status(BAD_REQUEST).json({ error: "Schemas are required for submission." })
    }
  });

  server.delete('/api-external/datasets/:id/schemas/:schemaId', (req, res) => {
    const id = getId(req);
    const { schemaId } = req.params;
    const log = setupLogger(req, res, '(external) delete schema');
    log.setOtherVars({ id, schemaId });
    log.info('start deleting schema');
    datasetService.removeSchemaFromDataset(id, req.params.schemaId)
      .then(() => {
        log.info('completed deleting schema');
        res.end();
      })
      .catch(e => res.status(getStatusCode(e)).json({ error: createErrorMessage(e) }))
  });

  server.post('/api-external/datasets/query', (req, res) => {
    const log = setupLogger(req, res, '(external) get referenced');
    log.info('start getting referenced datasets');
    datasetReferenceService.getReferencedDatasets(req.body)
      .then(response => {
        log.info('completed getting referenced datasets');
        res.status(OK).json(response);
      })
      .catch(e => res.status(INTERNAL_SERVER_ERROR).json(e))
  });

  server.post('/api-external/datasets/:id', (req, res) => {
    const datasetId = getId(req);
    const log = setupLogger(req, res, '(external) update dataset', datasetId);
    log.info('start updating dataset');
    adapter.adaptExistingDataset(datasetId, req.body, req.user.username)
      .then(dataset => datasetService.updateDataset(getId(req), dataset.version, dataset, req.user))
      .then(({ id, version }) => datasetService.getDataset(isDetailed(req), id, version))
      .then(dataset => {
        log.info('completed updating dataset');
        res.status(OK).json({ id: dataset.id, version: dataset.version });
      })
      .catch(e => res.status(getStatusCode(e)).json({ error: createErrorMessage(e) }))
  });

  server.post('/api/datasets/create-table', (req, res) => {
    const log = setupLogger(req, res, 'create table');
    log.info('start creating table');
    datasetService.createTable(req.body)
      .then(ctres => {
        log.info('completed creating table');
        res.status(OK).json({ message: ctres.responseMessage });
      })
      .catch(e => {
        log.error('Error:', e.stack);
        const error = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({ error });
      });
  });

  server.post('/api/datasets/predict-community', (req, res) => {
    const log = setupLogger(req, res, 'predict community');
    log.info('start predicting community');
    predictionService.predictCommunity(req.body)
      .then(prediction => {
        log.info('completed predicting community');
        res.status(OK).json(prediction)
      })
      .catch(e => {
        log.error('Error:', e.stack);
        res.status(getStatusCode(e)).json({ error: createErrorMessage(e) });
      });
  });

  server.get('/api/datasets/load-history', (req, res) => {
    const {query: {metadata}} = req;
    const [dataType, representation] = metadata.split(",");
    const log = setupLogger(req, res, 'load history');
    log.info('start loading history');
    edlMetricService.getLoadHistory({dataType, representation})
      .then(loadHistory => {
        log.info('completed loading history');
        res.status(OK).json(loadHistory);
      })
      .catch(e => {
        log.error('Error:', e.stack);
        res.status(getStatusCode(e)).json({ error: createErrorMessage(e) });
      });
  });

  server.post('/api/load-history', (req, res) => {
    const log = setupLogger(req, res, 'load history');
    log.info('start loading history');
    edlMetricService.getLoadHistory(req.body)
      .then(loadHistory => {
        log.info('completed loading history');
        res.status(OK).json(loadHistory);
      })
      .catch(e => {
        log.error('Error:', e.stack);
        res.status(getStatusCode(e)).json({ error: createErrorMessage(e) });
      });
  });

  server.post('/api-external/load-history', (req, res) => {
    const log = setupLogger(req, res, 'load history');
    log.info('start loading history');
    edlMetricService.getLoadHistory(req.body)
      .then(loadHistory => {
        log.info('completed loading history');
        res.status(OK).json(loadHistory);
      })
      .catch(e => {
        log.error('Error:', e.stack);
        res.status(getStatusCode(e)).json({ error: createErrorMessage(e) });
      });
  });

  server.post('/api/datasets/:id/versions/:version/views/permissions', (req, res) => {
    const id = getId(req);
    const version = getVersion(req);
    const log = setupLogger(req, res, 'get permissions for views', id, version);

    if (!req.body || !req.body.length) {
      return res.status(BAD_REQUEST).json({ error: "No views provided in the input to search permissions." });
    }

    permissionService.getPermissionsForDatasetViews(req.body)
      .then(response => res.status(OK).json(response))
      .catch(e => {
        log.error('Error:', e.stack);
        res.status(getStatusCode(e)).json({ error: createErrorMessage(e) });
      });
  });

  server.patch('/api-external/datasets', (req, res) => {
    const { body, query: { update } } = req;
    const log = setupLogger(req, res, 'update reference data');
    if (!isAdmin(req.user)) return handleUnauthorized(res);

    log.info('started updating the reference data');
    datasetService.updateReferenceData({ ...body, update })
      .then(() => {
        log.info('completed updating the reference data');
        res.status(OK).json({ message: 'Successfully updated the reference data' });
      })
      .catch(e => {
        log.error(e.stack);
        res.status(errorStatusCode.getStatusCode(e)).json({ error: e.message });
      });
  });

  server.get('/api-external/legacy/types', (req, res) => {
    const log = setupLogger(req, res, 'get legacy all types');
    console.log('metastoreBucket', metastoreBucket);
    s3Service.getFile(metastoreBucket, 'types/allTypes.json').then((data) => {
      log.info('Completed getting legacy all types');
      res.status(OK).json(data);
    })
      .catch(e => {
        log.error(e.stack);
        res.status(errorStatusCode.getStatusCode(e)).json({ error: e.message });
      });
  });
}

module.exports = { registerRoutes };
