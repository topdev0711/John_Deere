const conf = require('../conf');
const { connectDB } = require('./data/mongoClient');
let log = require("edl-node-log-wrapper");
try{
  const tracer = require('dd-trace').init()
}
catch(e) {
  console.log("Datadog Trace Failed to start: ", e)
}
  

conf.initConfig().then(config => {
  const express = require('express');
  const passport = require('passport');
  const session = require('express-session')
  const OAuth2Strategy = require('passport-oauth2').Strategy;
  const jwt = require('jsonwebtoken');
  const next = require('next');
  const fetch = require('node-fetch');
  const bodyParser = require('body-parser');
  const redisStore = require('connect-redis')(session);

  const app = next({ dev: config.isLocal });

  const strategy = new OAuth2Strategy({
    authorizationURL: `${config.oktaBaseUrl}/authorize?state=login&scope=openid%20profile%20groups`,
    tokenURL: `${config.oktaBaseUrl}/token`,
    clientID: config.oktaClient,
    clientSecret: config.oktaSecret,
    callbackURL: config.authCallback
  }, (accessToken, _refreshToken, profile, cb) => {
    const { sub: email, iss: url } = jwt.decode(accessToken);
    const {
      given_name: firstName,
      family_name: lastName,
      name,
      groups = []
    } = profile;
    const [awsGroups, edgGroups, g90Groups] = groups;
    cb(null, {
      url,
      name,
      firstName,
      lastName,
      email,
      username: email.split('@')[0],
      groups: (awsGroups || []).concat(edgGroups || []).concat(g90Groups || [])
    });
  });

  strategy.userProfile = function (accessToken, done) {
    fetch(`${config.oktaBaseUrl}/userinfo`, {headers: {'Authorization': `Bearer ${accessToken}`}})
      .then(data => data.json())
      .then(data => done(null, data))
      .catch(err => done(err))
  };

  passport.use(strategy);
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  app.prepare().then(async () => {
    const server = express();
    const oneSec = 1000;
    // Increase session time to 6 hours
    const maxAge = 6 * 60 * 60 * oneSec;

    const redisClient = await conf.connectRedis();
    redisClient.on('error', (err) => log.error('Redis error: ', err));
    const sessionStore = new redisStore({ client: redisClient, ttl: maxAge });

    const cookieName = '_redisSessionCache';

    server.use(session({
      maxAge,
      secret: config.cookieSalt,
      name: cookieName,
      resave: false,
      saveUninitialized: true,
      cookie: { maxAge },
      store: sessionStore,
    }));

    server.use(passport.initialize());
    server.use(passport.session());
    server.use(bodyParser.urlencoded({ extended: true, limit: '6mb' }));
    server.use(bodyParser.json({limit: '6mb'}));

    const http = require('http').createServer(server);

    const { Routes } = require('./Routes');
    const routes = new Routes(app, server, config, passport);
    routes.configureRoutes();

    connectDB(config.docDbConnection);

    http.listen(process.env.PORT || 3000, () => {
      log.info('Ready on port ' + (process.env.PORT || 3000));
      const CronJob = require('cron').CronJob;
      const job = new CronJob('0 0 * * *', async () => {
        try {
          const result = await require('./tasks/expirationNotifier').run();
          log.info('expiration notifier run: ', result);
        } catch (cronErr) {
          log.info('expiration notifier run failed: ', cronErr);
        }
      }, null, false, 'America/Chicago');
      job.start();
    });
  }).catch(ex => {
    log.error(ex.stack);
    process.exit(1);
  });
});
