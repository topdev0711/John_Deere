const adapter = require('../services/externalToInternalPermissionAdapter');
const controllerHandlers = require('./controllerHandlers');
const permissionService = require('../services/permissionService');
const permissionSearchService = require('../services/permissionSearchService');
const featureToggleService = require('../services/featureToggleService');
const remediationService = require('../services/remediationService');
const format = require('../utilities/format');
const { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND, OK, GONE } = require('http-status-codes');
const { createLoggerWithAttributes } = require('../utilities/logCreator');
const errorStatusCode = require("../utilities/errorStatusCode");
const conf = require('../../conf');
const {ALL_STATUSES} = require("../services/statusService");
const {isAdmin} = conf.getConfig();

const { getStatusCode, createErrorMessage, handleInternalUnauthorized } = controllerHandlers;
const handleUnauthorized = res => handleInternalUnauthorized(new Error('Not an admin. User is not authorized'), res);

function setupLogger(req, res, methodName, id, version) {
  const logger = createLoggerWithAttributes(req, res, 'permissions', methodName, id, version);
  controllerHandlers.setLogger(logger);
  permissionService.setLogger(logger);
  remediationService.setLogger(logger);
  return logger;
}

function findPermissions(req, res, log) {
  permissionSearchService.findPermissions({_query : req.query, _user : req.user})
    .then(response => {
      log.info('completed getting permissions from Opensearch');
      res.status(OK).json(response)
    })
    .catch(e => {
      log.error(e.stack);
      permissionService.searchForPermission(req.query)
        .then(response => {
          log.info('completed getting permissions from DocumentDB');
          res.status(OK).json(response)
        })
        .catch(e => {
          log.error(e.stack);
          res.json(INTERNAL_SERVER_ERROR).json({error: 'unable to fetch permissions from DocumentDB'});
        });
    });
}

function findPermissionsCount(req, res, log) {
  permissionSearchService.findPermissionsCount({_query : req.query, _user : req.user})
    .then(response => {
      log.info('completed getting count of permissions for search');
      res.status(OK).json(response);
    }).catch(e => {
      log.error(e.stack);
      res.status(INTERNAL_SERVER_ERROR).json({error: 'unable to get search permission count'});
  });
}

const fetchPerms = (req, res, log) => {
  return permissionService.searchForPermission(req.query)
    .then(permissions => {
      log.info('completed getting permissions')
      res.json(permissions);
    })
    .catch(e => {
      log.error(e.stack);
      res.status(INTERNAL_SERVER_ERROR).json({error: 'unable to fetch permissions'});
    });
};

function registerRoutes(server) {
  server.get('/api/permissions', async (req, res) => {
    const log = setupLogger(req, res, 'get permissions');
    fetchPerms(req, res, log);
  });

  server.get('/api/v2/permissions', async (req, res) => {
    const log = setupLogger(req, res, 'get v2 permissions');
    log.info('start getting v2 permissions');
    const call = req.query.count === 'true' ? findPermissionsCount : findPermissions;
    call(req, res, log);
  });

  server.get('/api/permissions/approvals', (req, res, done) => {
    const log = setupLogger(req, res, 'get user approvals');
    log.info('start getting user approvals')
    permissionService.findAllForApproval(req.user)
      .then(response => {
        log.info('completed getting user approvals')
        res.json(response);
      })
      .catch(e => {
        log.error(e.stack);
        done({ error: e.message });
      });
  });

  function getPermission(req, res, done, id, version) {
    const log = setupLogger(req, res, 'get permission', id, version);
    log.info('start getting permission');
    permissionService.getPermission(id, version)
      .then(permission => {
        log.info('completed getting permission')
        res.json(permission);
      })
      .catch(e => {
        log.error(e.stack);
        done('unable to fetch permission');
      });
  }

  function getPermissionExternal(req, res, id, version) {
    const log = setupLogger(req, res, '(external) getPermission', id, version);
    log.info('start getting permission');
    const statuses = req.query.status ? [].concat(req.query.status) : ALL_STATUSES;
    const formattedStatuses = statuses.map(status => status.toUpperCase());

    permissionService.getPermission(id, version, formattedStatuses)
      .then(permission => {
        log.info('completed getting permission');
        res.status(OK).json(permission);
      })
      .catch(e => {
        log.error(e.stack);
        const isAliasError = e.message.includes('There are no previous permissions for id') || e.message.includes('There are no permissions for id: ');
        const status = e.statusCode ? e.statusCode : NOT_FOUND;
        const error = status === NOT_FOUND ? `Could not find permission with id: ${id}` : e.message;
        if(isAliasError) res.status(NOT_FOUND).json({ error: e.message });
        else res.status(status).json({ error });
      });
  }

  server.get('/api/permissions/:id', (req, res, done) => getPermission(req, res, done, req.params.id));

  server.get('/api/permissions/:id/versions', (req, res, done) => {
    const id = req.params.id;
    const log = setupLogger(req, res, 'get permission versions', id);
    log.info('start getting permission versions');
    permissionService.getAllPermissionVersions(id)
      .then(response => {
        log.info('completed getting permission versions');
        res.json(response);
      })
      .catch(e => {
        log.error(e.stack);
        done({ error: e.message });
      });
  });

  server.get('/api/permissions/:id/:version', (req, res, done) => getPermission(req, res, done, req.params.id, Number(req.params.version), req.params.status));

  server.delete('/api/permissions/:id/versions/:version', (req, res) => {
    const id = req.params.id;
    const version = Number(req.params.version);
    const log = setupLogger(req, res, 'delete permission', id, version);

    log.info('start deleting permission');
    permissionService.deletePermission(id, version, req.user.username)
      .then((permission) => {
        log.info('completed deleting permission');
        res.json(permission);
      })
      .catch(e => {
        log.error(e.stack);
        handleInternalUnauthorized(e, res)
      });
  });

  server.post('/api/permissions', (req, res) => {
    const log = setupLogger(req, res, 'create permission');
    log.info('start creating permission');
    permissionService.savePermission(req.body, req.user.username)
      .then(() => {
        log.info('completed creating permission');
        res.end();
      })
      .catch(e => {
        log.error(e.stack);
        const errorMessage = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({ error: errorMessage });
      });
  });

  server.post('/api/permissions/:id/versions/:version', (req, res) => {
    const id = req.params.id;
    const version = Number(req.params.version);
    const log = setupLogger(req, res, 'update permission', id, version);
    log.info('start updating permission');
    permissionService.updatePermission(id, version, req.body, req.user.username)
      .then(() => permissionService.getPermission(id, version))
      .then(() => {
        log.info('completed updating permission');
        res.end();
      })
      .catch(e => {
        log.error(e.stack);
        const errorMessage = decodeURI(format.formatValidationErrors(e));
        res.status(BAD_REQUEST).json({ error: errorMessage });
      });
  });

  server.post('/api/permissions/:id/:version/approve', (req, res) => {
    const { user, params: { id, version } } = req;
    const log = setupLogger(req, res, 'approve', id, version);
    const isPerm = !!version && version !== 'undefined';
    const approveType = isPerm ? 'permission' : 'remediation';

    log.info(`start approving ${approveType}`);
    const approve = isPerm ? permissionService.approvePermission(id, Number(version), user) : remediationService.approveRemediation(id, user);

    approve.then(() => isPerm ? permissionService.getPermission(id, version) : Promise.resolve())
      .then(() => {
        log.info(`completed approving ${approveType}`);
        res.end();
      })
      .catch(e => handleInternalUnauthorized(e, res));
  });

  server.post('/api/permissions/:id/:version/reject', (req, res) => {
    const { id, version } = req.params;
    const { reason } = req.body;
    const { user } = req;
    const isPerm = !!version && version !== 'undefined';
    const log = setupLogger(req, res, 'reject', id, version);
    const rejectType = isPerm ? 'permission' : 'remediation';
    log.info(`start rejecting ${rejectType}`);
    const reject = isPerm ? permissionService.rejectPermission(id, Number(version), reason, user) : remediationService.rejectRemediation(id, reason, user);

    reject.then(() => {
      log.info(`completed rejecting ${rejectType}`);
      res.end();
    }).catch(e => handleInternalUnauthorized(e, res));
  });

  server.post('/api/permissions/:id/:version/lock', (req, res) => {
    const { id, version } = req.params;
    const log = setupLogger(req, res, 'lock', id, version);
    log.info('start locking');
    permissionService.lockPermission(id, Number(version), req.user.username)
      .then(() => {
        log.info('completed locking');
        res.end();
      })
      .catch(e => handleInternalUnauthorized(e, res));
  });

  server.post('/api/permissions/:id/:version/unlock', (req, res) => {
    const { id, version } = req.params;
    const log = setupLogger(req, res, 'unlock', id, version);
    log.info('start unlocking');
    permissionService.unlockPermission(id, Number(version), req.user.username)
      .then(() => {
        log.info('completed unlocking');
        res.end();
      })
      .catch(e => handleInternalUnauthorized(e, res));
  });

  server.get('/api-external/permissions/approvals', (req, res, done) => {
    const log = setupLogger(req, res, '(external) find approvals');
    log.info('start finding approvals');
    permissionService.findAllForApproval(req.user)
      .then(response => {
        log.info('completed finding approvals');
        res.status(OK).json(response);
      })
      .catch(e => {
        log.error(e.stack);
        done({ error: e.message });
      });
  });

  server.get('/api-external/permissions', (req, res) => {
    const { query } = req
    const log = setupLogger(req, res, '(external) find permissions');
    log.info('start finding permissions');
    return permissionService.searchForPermission(query)
      .then(permissions => {
        log.info('completed finding permissions');
        res.json(permissions);
      })
      .catch(e => {
        log.error(e.stack);
        res.status(INTERNAL_SERVER_ERROR).json({ error: e.message });
      });
  });

  server.get('/api-external/permissions/:id/versions', (req, res) => {
    const { id } = req.params;
    const log = setupLogger(req, res, '(external) get permission versions', id);
    log.info('start getting permission versions');
    permissionService.getAllPermissionVersions(id)
      .then(response => {
        log.info('completed getting permission versions');
        res.status(OK).json(response);
      })
      .catch(e => {
        log.error(e.stack);
        log.error(e.stack);
        const status = e.statusCode ? e.statusCode : NOT_FOUND;
        const error = status === NOT_FOUND ? `Could not find any versions of permission with id: ${id}` : e.message;
        res.status(status).json({ error });
      });
  });

  server.post('/api-external/permissions/:id/versions/:version/approve', (req, res) => {
    const { id, version } = req.params;
    const log = setupLogger(req, res, '(external) approve', id, version);
    const sendEmail = req.query.sendEmail && JSON.parse(req.query.sendEmail);
    log.info('start approving');
    permissionService.approvePermission(id, Number(version), req.user, null, sendEmail)
      .then(() => permissionService.getPermission(id, Number(version)))
      .then(() => {
        log.info('completed approving');
        res.end();
      })
      .catch(e => {
        log.error(e.stack);
        res.status(INTERNAL_SERVER_ERROR).json({ error: e.message });
      });
  });

  server.post('/api-external/permissions/:id/versions/:version/reject', (req, res) => {
    const { id, version } = req.params;
    const log = setupLogger(req, res, '(external) reject', id, version);
    log.info('start rejecting');
    permissionService.rejectPermission(id, Number(version), req.body.reason, req.user)
      .then(() => {
        log.info('completed rejecting');
        res.end();
      })
      .catch(e => {
        log.error(e.stack);
        res.status(INTERNAL_SERVER_ERROR).json({ error: e.message });
      });
  });

  server.get('/api-external/permissions/:id', (req, res) => getPermissionExternal(req, res, req.params.id));

  server.get('/api/permissions/:id/versions/:version', (req, res) => getPermission(req, res, req.params.id, Number(req.params.version), req.params.status));
  server.get('/api-external/permissions/:id/versions/:version', (req, res) => getPermissionExternal(req, res, req.params.id, req.params.version,req.params.status));

  server.post('/api-external/permissions', (req, res) => {
    const log = setupLogger(req, res, '(external) create permission');
    log.info('start creating permission');
    adapter.adaptNewPermission(req.body)
      .then(permission => permissionService.savePermission(permission, req.user.username))
      .then(response => {
        log.info('completed creating permission');
        return res.status(OK).json(response)
      })
      .catch(e => res.status(BAD_REQUEST).json({ error: createErrorMessage(e) }))
  });

  server.post('/api-external/permissions', (_req, res) => {
    res.status(GONE).json({ error: 'Posting permissions externally is not enabled.' });
  });

  server.post('/api-external/permissions/:id', (req, res) => {
    const { id } = req.params;
    const log = setupLogger(req, res, '(external) update permission', id);
    log.info('start updating permission');
    adapter.adaptExistingPermission(id, req.body, req.user.username)
      .then(permission => permissionService.updatePermission(req.params.id, permission.version, permission, req.user.username))
      .then(({ id, version }) => permissionService.getPermission(id, version))
      .then(permission => {
        log.info('completed updating permission');
        return res.status(OK).json({ id: permission.id, version: permission.version })
      })
      .catch(e => res.status(getStatusCode(e)).json({ error: createErrorMessage(e) }))
  });

  server.patch('/api-external/permissions', (req, res) => {
    const { body, query: { update } } = req;
    const log = setupLogger(req, res, 'update reference data');

    if (!isAdmin(req.user)) return handleUnauthorized(res);

    log.info('started updating the reference data');
    permissionService.updateReferenceData({ ...body, update })
      .then(() => {
        log.info('completed updating the reference data');
        res.status(OK).json({ message: 'Successfully updated the reference data' });
      })
      .catch(e => {
        log.error(e.stack);
        res.status(errorStatusCode.getStatusCode(e)).json({ error: e.message });
      });
  });
}

module.exports = { registerRoutes };
