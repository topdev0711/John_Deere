const workflowService = require('../services/workflowService');
const format = require('../utilities/format');
const { BAD_REQUEST, OK } = require('http-status-codes');
const { createLoggerWithAttributes } = require('../utilities/logCreator');

function setupLogger(req, res, methodName, id, version) {
  const logger = createLoggerWithAttributes(req,  res, 'workflow-calls', methodName, id, version);
  res.set({'X-Correlation-Id': logger.getCorrelationId()});
  workflowService.setLogger(logger);
  return logger;
}

function registerRoutes(server) {

  server.post('/api/create-endpoint', (req, res) => {
    const log = setupLogger(req, res, 'dms endpoints');
    log.info('start getting dms');
    workflowService.testEndpointConnection(req.body)
      .then(tasks => {
        log.info('completed getting dms endpoints');
        log.info(`tasks : ${JSON.stringify(tasks)}`);
        res.status(OK).json(tasks);
      })
      .catch(e => {
        log.error(e.stack);
        const error = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({ error });
      });
  });

  server.post('/api/test-endpoint', (req, res) => {
    const log = setupLogger(req, res, 'dms test endpoints');
    log.info('start testing dms');
    workflowService.testConnection(req.body)
      .then(tasks => {
        log.info('completed testing dms endpoints');
        log.info(`tasks : ${JSON.stringify(tasks)}`);
        res.status(OK).json(tasks);
      })
      .catch(e => {
        log.error(e.stack);
        const error = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({ error });
      });
  });

  server.get('/api/tasks/:datasetEnvName/managedTask/:isManagedTask', (req, res) => {
    const { datasetEnvName, isManagedTask } = req.params;
    const log = setupLogger(req, res, 'get managed tasks');
    log.setOtherVars({ message: { datasetEnvName, isManagedTask }});
    log.info('start getting managed tasks');
    workflowService.getTasks(datasetEnvName, isManagedTask)
      .then(tasks => {
        log.info('completed getting managed tasks');
        res.status(OK).json(tasks);
      })
      .catch(e => {
        log.error(e.stack);
        const error = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({ error });
      });
  });

  server.delete('/api/tasks/:taskId', (req, res) => {
    const { taskId: id } = req.params;
    const log = setupLogger(req, res, 'delete tasks', id);
    log.info(`start deleting task ${id}`);
    workflowService.deleteTask(id)
      .then(task => {
        log.info(`completed deleting task ${id}`);
        res.status(OK).json(task);
      })
      .catch(e => {
        log.error(e.stack);
        const error = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({ error });
      });
  });

  server.post('/api/tasks', (req, res) => {
    const log = setupLogger(req, res, 'create task');

    log.info('start creating task');
    workflowService.createTask(req.body)
      .then(task => {
          if (task instanceof Error) throw task;
          log.info('completed creating task');
          res.status(OK).json(task)
      })
      .catch(e => {
        log.error('inside workflow controller post with error:', e);
        const error = decodeURI(format.formatValidationErrors(e));
        const status = error.statusCode? error.statusCode : BAD_REQUEST
        res.status(status).json({ error } );
      });
  })

  server.post('/api/managedtasks', (req, res) => {
    const log = setupLogger(req, res, 'create managed task');

    log.info('start creating managed task');
    workflowService.createTask(req.body, true)
      .then(task => {
          if (task instanceof Error) throw task;
          log.info('completed creating managed task');
          res.status(OK).json(task)
      })
      .catch(e => {
        log.error('inside workflow controller post with error:', e);
        const error = decodeURI(format.formatValidationErrors(e));
        const status = error.statusCode? error.statusCode : BAD_REQUEST
        res.status(status).json({ error } );
      });
  })

  server.post('/api/configure-mdi', (req, res) => {
    workflowService.configureMDICrossAccount(req.body)
      .then(response => {
          if (response instanceof Error) throw response;
          res.status(OK).json(response)
      })
      .catch(e => {
        const error = decodeURI(format.formatValidationErrors(e));
        const status = error.statusCode? error.statusCode : BAD_REQUEST
        res.status(status).json({ error } );
      });
  })

  server.post('/api/v1/adhocRun', (req, res) => {
    const log = setupLogger(req, res, 'create adhoc run');
    log.info('Calling adhoc run Api');
    workflowService.adhocRun(req.body)
      .then(response => {
          if (response instanceof Error) throw response;
          log.info('completed adhoc run call',response);
          res.status(OK).json(response)
      })
      .catch(e => {
        log.error('inside workflow controller post with error:', e);
        const error = decodeURI(format.formatValidationErrors(e));
        const status = error.statusCode? error.statusCode : BAD_REQUEST
        res.status(status).json({ error } );
      });
  })

  server.post('/api/configure-mds', (req, res) => {
    workflowService.configureMDECrossAccount(req.body)
      .then(response => {
          if (response instanceof Error) throw response;
          res.status(OK).json(response)
      })
      .catch(e => {
        const error = decodeURI(format.formatValidationErrors(e));
        const status = error.statusCode? error.statusCode : BAD_REQUEST
        res.status(status).json({ error } );
      });
  })

  server.get('/api/mds-status', (req, res) => {
    let params = {
      accountNumber: req.query.accountNumber,
      rdsIpAddress: req. query.rdsIpAddress
    }
    workflowService.configureMDECrossAccountStatus(params)
      .then(response => {
          if (response instanceof Error) throw response;
          res.status(OK).json(response)
      })
      .catch(e => {
        const error = decodeURI(format.formatValidationErrors(e));
        const status = error.statusCode? error.statusCode : BAD_REQUEST
        res.status(status).json({ error } );
      });
  })

  server.post('/api/managedtasks/sharepointToken', (req, res) => {
    const log = setupLogger(req, res, 'sharepointToken created');
    log.info('start creating sharepointToken');
    workflowService.getSharepointToken(req.body)
      .then(tokenData => {
          res.status(OK).json(tokenData)
      })
      .catch(e => {
        res.status(BAD_REQUEST).json({ e } );
      });
  })

  server.post(`/api/Web/Lists`, (req, res) => {
    const log = setupLogger(req, res, 'Getting Lists');
    log.info(`start getting Lists`);
    workflowService.getSharepointLists(req.body)
    .then(jsonResponse => {
      log.info('Sharepoint Lists fetched');
        res.status(OK).json(jsonResponse)
    })
    .catch(e => {
      log.error(`Sharepoint Lists error ${e}`);
      res.status(BAD_REQUEST).json({ e } );
    });
  })

  server.post(`/api/Web/getbyTitle`, (req, res) => {
    const log = setupLogger(req, res, 'Getting LibraryFolders');
    log.info(`start getting LibraryFolders`);
    workflowService.getSharepointFolders(req.body)
    .then(jsonResponse => {
      log.info('Sharepoint LibraryFolders fetched');
        res.status(OK).json(jsonResponse)
    })
    .catch(e => {
      log.error(`Sharepoint LibraryFolders error ${e}`);
      res.status(BAD_REQUEST).json({ e } );
    });
  })

  server.post(`/api/Web/GetFolderByServerRelativeUrl`, (req, res) => {
    const log = setupLogger(req, res, 'Getting FileFolders');
    log.info(`start getting FileFolders`);
    workflowService.getSharepointFilesFolder(req.body)
    .then(jsonResponse => {
      log.info('Sharepoint FileFolders fetched');
        res.status(OK).json(jsonResponse)
    })
    .catch(e => {
      log.error(`Sharepoint FileFolders error ${e}`);
      res.status(BAD_REQUEST).json({ e } );
    });
  })

  server.get('/api/managedtasks/:custodian', (req, res) => {
    const { custodian } = req.params;
    const log = setupLogger(req, res, 'create managed task');
    log.setOtherVars({ message: { custodian } });
    log.info('start getting managed task');
    workflowService.isManagedIngest(custodian)
      .then(isManagedIngest => {
        log.info('completed getting managed task');
        res.status(OK).json(isManagedIngest);
      })
      .catch(e => {
        log.error(e.stack);
        const error = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({ error });
      });
  })

  server.delete('/api/managedtasks/:sourceType/:taskId', (req, res) => {
    const { sourceType: sourceType, taskId: id } = req.params;
    const log = setupLogger(req, res, 'delete managed task', id, ' source: ', sourceType);
    log.info(`start deleting managed task: ${id}, source: ${sourceType}`);
    workflowService.deleteTask( id, sourceType, true)
      .then(task => {
        log.info('completed deleting managed task');
        res.status(OK).json(task);
      })
      .catch(e => {
        log.error(e.stack);
        const error = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({ error });
      });
  })

  server.get('/api/tasks/:taskId/runs', (req, res) => {
    const { taskId: id } = req.params;
    const log = setupLogger(req, res, 'get task runs', id);
    log.info('start getting task runs');
    workflowService.getRunsForTask(req.params.taskId)
      .then(historyRuns => {
        log.info('completed getting task runs');
        res.status(OK).json(historyRuns);
      })
      .catch(e => {
        log.error(e.stack);
        const error = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({ error });
      });
  })

  server.get('/api/task/:taskId', (req, res) => {
    const { taskId: id } = req.params;
    const log = setupLogger(req, res, 'get task', id);
    log.info('start getting task');

    workflowService.getTask(id)
      .then(task => {
        log.info('competed getting task');
        res.status(OK).json(task);
      })
      .catch(e => {
        log.error(e.stack);
        const error = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({ error });
      });
  })
}

module.exports = { registerRoutes };
