let log = require('edl-node-log-wrapper');
const OktaJwtVerifier = require('@okta/jwt-verifier');
const {StatusCodes} = require('http-status-codes');
const permissionService = require('../src/services/permissionService');

const {FORBIDDEN, INTERNAL_SERVER_ERROR, OK } = StatusCodes;

class Routes {
  constructor(nextApp, server, config, passport) {
    this.server = server;
    this.nextApp = nextApp;
    this.config = config;
    this.oktaJwtVerifier = new OktaJwtVerifier({issuer: `${config.oktaOAuthUrl}`});
    this.passport = passport;
  }

  getControllers = () => {
    const aclController = require('./controllers/aclController');
    const announcementsController = require('./controllers/announcementsController');
    const applicationController = require('./controllers/applicationController');
    const datasetController = require('./controllers/datasetController');
    const documentController = require('./controllers/documentController');
    const healthController = require('./controllers/healthController');
    const metastoreController = require('./controllers/metastoreController');
    const metricsController = require('./controllers/metricsController');
    const lineageController = require('./controllers/lineageController');
    const migrationController = require('./controllers/migrateController');
    const permissionController = require('./controllers/permissionController');
    const referenceController = require('./controllers/referenceController');
    const remediationController = require('./controllers/remediationController');
    const schemaController = require('./controllers/schemaController');
    const usabilityController = require('./controllers/usabilityController');
    const userController = require('./controllers/userController');
    const workflowController = require('./controllers/workflowController');
    const subscriptionController = require('./controllers/subscriptionController');
    const featureToggleController = require('./controllers/featureToggleController');

    return [
      aclController,
      announcementsController,
      applicationController,
      datasetController,
      documentController,
      healthController,
      metastoreController,
      metricsController,
      lineageController,
      migrationController,
      permissionController,
      referenceController,
      remediationController,
      schemaController,
      userController,
      usabilityController,
      workflowController,
      subscriptionController,
      featureToggleController
    ];
  }

  handleUserSessionCall = (req, res) => {
    if (req?.user != null) {
      res.status(OK).json(req.user);
    } else {
      res.redirect('/api/login');
    }
  }

  handleExternalApiCalls = (req, done, res) => {
    const isScopeIncluded = (clientScopes, scope) => { return clientScopes.includes(scope) };
    const isModifyingCall = (req, jwt) => ['PATCH', 'POST', 'PUT', 'DELETE'].includes(req.method) && isScopeIncluded(jwt.claims.scp, 'write:jdcatalog');
    const isGetCall = (req, jwt) => req.method === 'GET' && isScopeIncluded(jwt.claims.scp, 'read:jdcatalog');
    const isValidExternalCall = (req, jwt) => isModifyingCall(req, jwt) || isGetCall(req, jwt);

    if (req.headers.authorization != null) {
      const token = req.headers.authorization.replace('Bearer ', '');
      this.oktaJwtVerifier.verifyAccessToken(token, 'edl')
        .then(jwt => {
          let user = this.config.approvers.find(approver => approver.client_id === jwt.claims.cid);
          req.user = user || {
            username: jwt.claims.cid,
            groups: []
          };

          // if user is not found in system-approvers.js, then fetch the corresponding AD group
          if (!!!user) {
            let query = {clientId: jwt.claims.cid}
            permissionService.searchForPermission(query)
                .then(permissions => {
                  if (!!permissions && permissions.length !== 0) {
                    req.user.groups = [...new Set(permissions.map(permission => permission.group))]
                  }
                })
                .catch(e => {
                  log.error(e.stack);
                });
          }
          req.user.isAdmin = jwt.claims.scp.includes('admin:jdcatalog');
          if (isValidExternalCall(req, jwt)) {
            done();
          } else {
            res.status(FORBIDDEN).send('Unauthorized due to missing scopes');
          }
        })
        .catch(err => {
          log.error('Error:', err.stack);
          res.status(FORBIDDEN).send(`Error: ${err.userMessage}`);
        });
    } else {
      res.status(FORBIDDEN).send('Unauthorized to access this resource');
    }
  }

  handleWebAppCalls = (req, res) => {
    req.announcementService = require('./services/announcementService');
    req.datasetService = require('./services/datasetService');
    req.featureToggleService = require('./services/featureToggleService');
    req.applicationService = require('./services/applicationService');
    req.metastoreService = require('./services/metastoreService');
    req.permissionService = require('./services/permissionService');
    req.referenceService = require('./services/referenceService');
    req.serverDomain = this.config.domain;

    const handle = this.nextApp.getRequestHandler();
    handle(req, res);
  }

  configureRoutes = () => {
    this.server.all('*', (req, res, done) => {
      const isApi = req.path.includes('/api/');
      const isLogin = req.path.includes('/api/login');
      const isStatic = req.path.includes('/static');
      const isHealth = req.path.includes('/api/health');
      const isSessionUserCall = req.path.includes('/api/session/user');
      const isApiExternal = req.path.includes('/api-external/');
      const isHome = req.path === '/';

      const isHeaderPage = req => ['/catalog', '/approvals', '/docs', '/contact'].some(url => req.path.startsWith(url));

      if (isHealth) {
        done();
      } else if (isSessionUserCall) {
        this.handleUserSessionCall(req, res);
      } else if (isApiExternal) {
        this.handleExternalApiCalls(req, done, res);
      } else if (!req.user && !isLogin && !isStatic) {
        if (isHeaderPage(req)) {
          req.session.returnTo = req?.url;
        }
        res.redirect('/api/login');
      } else if (isApi) {
        done();
      } else if (isHome) {
        res.redirect('/catalog')
      } else {
        this.handleWebAppCalls(req, res);
      }
    });

    this.server.get('/api/login', this.passport.authenticate('oauth2'));

    this.server.get('/api/login/callback', (req, res, done) => {
      this.passport.authenticate('oauth2')(req, res, done)
    }, (req, res) => res.redirect(req.session.returnTo || '/'));

    this.getControllers().forEach(controller => controller.registerRoutes(this.server));
  }
}

module.exports = { Routes };
