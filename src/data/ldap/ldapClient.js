const ldap = require('ldapjs');
const fs = require('fs');
const path = require('path');
const queryString = require('querystring');
const tls = require('tls');
const conf = require('../../../conf');
let log = require('edl-node-log-wrapper');
const async = require('async');
const promiseRetry = require('promise-retry');

let retryParams = {
  retries: 3,
  factor: 1,
  minTimeout: 5000,
  maxTimeout: 9000,
  randomize: true,
};
const { ldapCreds : { username, password } } = conf.getConfig();
const setRetryParams = params => retryParams = params;
const setLogger = logger => log = logger;

function closeConnection(client) {
  client.unbind();
  client.destroy();
}

const config = {
  url: 'ldaps://query.JDNET.DEERE.COM',
  reconnect: true,
  tlsOptions: {
    host: 'query.JDNET.DEERE.COM',
    port: '636',
    checkServerIdentity: (host, cert) => {
      if (cert && !cert.subject && /(IP|DNS|URL)/.test(cert.subjectaltname))
        cert.subject = queryString.parse("")
      return tls.checkServerIdentity(host, cert);
    },
    ca: [fs.readFileSync(path.resolve(__dirname, "corporateroot.cer"))]
  }
};

function callSearch(filter, attributes) {
  return new Promise((resolve, reject) => {
    const ldapClient = ldap.createClient(config);
    ldapClient.bind(`jdnet\\${username}`, password, err => {
      if (err) {
        log.error('failed to bind');
        ldapClient.destroy();
        return reject(err);
      }
      const opts = {filter, scope: 'sub', attributes};
      ldapClient.search('dc=jdnet,dc=deere,dc=com', opts, (err, res) => {
        if (err) {
          log.error('search failed');
          closeConnection(ldapClient)
          return reject(err);
        }
        let entries = [];
        res.on('searchEntry', entry => entries.push(entry.object));
        res.on('end', () => {
          closeConnection(ldapClient);
          return resolve(entries);
        });
        res.on('error', (err) => {
          log.error('search failed on error');
          closeConnection(ldapClient);
          return reject(err);
        });
      });
    });
  });
}

const search = (filter, attributes) => {
  const searchWithRetry = async (retry, attempt) => {
    try {
      return (await callSearch(filter, attributes));
    } catch (e) {
      if ((attempt-1) >= retryParams.retries) throw e;
      retry();
    }
  }

  return promiseRetry(searchWithRetry, retryParams);
}

function multiSearch(client, opts, callback) {
  let response = {};
  client.search('dc=jdnet,dc=deere,dc=com', opts, (err, search) => {
    if(err) {
      callback(err);
    } else {
      search.on('searchEntry', (entry) => {
        response = entry.object;
      });

      search.on('error', (err) => {
        if (err) {
          callback(err);
        }
      });

      search.on('end', () => {
        callback(null, response);
      });
    }
  });
}

function callSearchArray(filterParam, attributes, paramsArray) {
  const addFilter = (param) => {
    return {
      filter: filterParam.replace('${param}', param),
      scope: 'sub',
      attributes
    }
  }

  return new Promise((resolve, reject) => {
    const ldapClient = ldap.createClient(config);
    ldapClient.bind(`jdnet\\${username}`, password, err => {
      if (err) {
        log.error('failed to bind');
        ldapClient.destroy();
        return reject(err);
      } else {
        async.parallel(
          paramsArray.map(param => pcallback => multiSearch(ldapClient, addFilter(param), pcallback))
          , (err, results) => {
            ldapClient.unbind();
            ldapClient.destroy();

            if (err) {
              console.log('Error:', err);
              return reject(err);
            } else {
              return resolve(results);
            }
          });
      }
    });
  });
}

const searchArray = (filterParam, attributes, paramsArray) => {
  const searchArrayWithRetry = async (retry, attempt) => {
    try {
      const response = await callSearchArray(filterParam, attributes, paramsArray);
      return response;
    } catch (e) {
      if ((attempt-1) >= retryParams.retries) throw e;
      retry();
    }
  }

  return promiseRetry(searchArrayWithRetry, retryParams);
}

module.exports = { setLogger, setRetryParams, search, searchArray };
