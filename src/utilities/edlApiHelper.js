const conf = require('../../conf');
const jswt = require('jsonwebtoken');
const https = require('https')
const originalFetch = require('node-fetch');
const fetch = require('fetch-retry')(originalFetch);
const { BAD_REQUEST, INTERNAL_SERVER_ERROR } = require('http-status-codes');
const { ftOktaOAuthUrl, ftOktaClient, ftOktaSecret, oktaOAuthUrl, oktaClient, oktaSecret, oktaDClient, oktaApiPrivateKey, oktaApiBaseUrl, oneCloudOktaOAuthUrl, oneCloudOktaClient, oneCloudOktaSecret, accounts, oneCloudUrl, pnoOAuthUrl, pnoUrl } = require('../../conf').getConfig();
let log = require("edl-node-log-wrapper");
const setLogger = logger => log = logger;
const oneMinute = 60;
const ttlInSeconds = 4 * oneMinute;
const alreadyExists = 'Task Already Exists';

async function getParams(method) {
  const edlToken = await getJwt();
  return { method, headers: { 'Authorization': `Bearer ${edlToken}` } };
}

async function getParamsFt(method) {
  const ftToken = await getFtJwt();
  return { method, headers: { 'Authorization': `Bearer ${ftToken}` }, retries: 3, retryDelay: 2000 };
}

async function getParamsInternalOktaAdmin(method) {
  const internalOktaAdminToken = await getInternalOktaAdminJwt();
  return { method, headers: { 'Authorization': `Bearer ${internalOktaAdminToken}` }, retries: 3, retryDelay: 2000 };
}

async function createJWT() {
  try {
    const signOptions = {
      audience: `${oktaApiBaseUrl}/oauth2/v1/token`,
      issuer: oktaDClient,
      subject: oktaDClient,
      expiresIn: '1h',
      algorithm: 'RS256'
    }
    return jswt.sign(payload = {}, oktaApiPrivateKey, signOptions)
  }
  catch (err) {
    log.error(err);
    throw new Error('Failed to get Okta token');
  }
}

async function getDynamicOktaToken() {
  let params = new URLSearchParams();
  const webToken = await createJWT();
  params.append('grant_type', 'client_credentials');
  params.append('scope', 'okta.groups.read');
  params.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
  params.append('client_assertion', webToken);

  try {
    const creds = await fetch(`${oktaApiBaseUrl}/oauth2/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Accept': 'application/json'
      },
      body: params
    });
    return await creds.json();
  } catch (err) {
    log.error(err);
    throw new Error('Failed to get Okta token');
  }
}

async function getOktaParams(method) {
  const token = await getDynamicOktaToken();
  return {
    method,
    headers: {
      'Authorization': `Bearer ${token.access_token}`
    }
  };
}

async function getJwt() {
  const cache = await conf.getRedisCacheManager(ttlInSeconds);
  let jwt = await cache.get('edlHelperJWT');
  if (!jwt) {
    jwt = await requestOAuth2Token();
    const apiCache = await conf.getRedisCacheManager(ttlInSeconds);
    await apiCache.set('edlHelperJWT', jwt);
  }
  return jwt;
}

async function getPnOJwt() {
  const cache = await conf.getRedisCacheManager(ttlInSeconds);
  let jwt = await cache.get('pnoJWT');
  if (!jwt) {
    jwt = await requestPnOOAuth2Token();
    await cache.set('pnoJWT', jwt);
  }
  return jwt;
}

async function requestOAuth2Token() {
  try {
    const tokenResponse = await fetch(`${oktaOAuthUrl}/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
      body: `client_id=${oktaClient}&client_secret=${oktaSecret}&grant_type=client_credentials`
    });
    return (await tokenResponse.json()).access_token;
  } catch (error) {
    log.error(error);
    error.statusCode = INTERNAL_SERVER_ERROR
    throw error;
  }
}

function handleError(statusCode, errorMessage) {
  const error = new Error(errorMessage);
  error.statusCode = statusCode;
  throw error;
}

function createAlreadyExistsError() {
  const error = new Error(alreadyExists);
  error.statusCode = BAD_REQUEST;
  throw error;
}

async function sendRequest(uri, params) {
  try {
    log.debug(`Sending request for ${uri}`);
    const response = await fetch(uri, params);
    log.debug(`Received response code ${response.status}`)
    const bodyJson = await response.json();
    if (response.ok) {
      if (bodyJson.message === alreadyExists) createAlreadyExistsError();
      return bodyJson;
    }
    handleError(response.status, bodyJson?.message);

  } catch (error) {
    log.error('Failed with error: ', error.stack);
    throw error;
  }
}

async function sendRequestWithNoResponseBody(uri, params) {
  try {
    log.info(`Sending request ${uri}`);
    const response = await fetch(uri, params);
    if (!response.ok) handleError(response);
  } catch (error) {
    log.error('Failed with error: ', error.stack);
    throw error;
  }
}

async function get(baseUrl, useOktaBearer) {
  const params = useOktaBearer ? await getOktaParams('GET') : await getParams('GET');
  return sendRequest(baseUrl, params);
}

async function getFt(baseUrl) {
  const params = await getParamsFt('GET');
  return sendRequest(baseUrl, params);
}

async function apiDelete(baseUrl) {
  const params = await getParams('DELETE');
  return sendRequestWithNoResponseBody(baseUrl, params);
}

async function post(baseUrl, body) {
  try {
    const params = { body: JSON.stringify(body), ...(await getParams('POST')) };
    return await sendRequest(baseUrl, params);
  } catch (error) {
    log.info('got error in edl post helper ', error.stack);
    throw error;
  }
}

async function postWithInternalOktaAdminParams(baseUrl, body) {
  try {
    const params = { body: JSON.stringify(body), ...(await getParamsInternalOktaAdmin('POST')) };
    console.log(params)
    return await sendRequest(baseUrl, params);
  } catch (error) {
    log.info('got error in edl post helper with internalOktaAdminParams', error.stack);
    throw error;
  }
}

async function getWithInternalOktaAdminParams(baseUrl) {
  try {
    const params = {...(await getParamsInternalOktaAdmin('GET')) };
    console.log(params)
    return await sendRequest(baseUrl, params);
  } catch (error) {
    log.info('got error in edl get helper with internalOktaAdminParams', error.stack);
    throw error;
  }
}

async function postWithContentType(baseUrl, body) {
  try {
    const methodParams = await getParams('POST');
    methodParams.headers['Content-Type'] = 'application/json';
    const params = { body: JSON.stringify(body), ...methodParams };
    return await sendRequest(baseUrl, params);
  } catch (error) {
    log.info('got error in edl post helper ', error.stack);
    throw error;
  }
}

async function requestOneCloudOAuth2Token() {
  try {
    const tokenResponse = await fetch(`${oneCloudOktaOAuthUrl}/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
      body: `client_id=${oneCloudOktaClient}&client_secret=${oneCloudOktaSecret}&grant_type=client_credentials`
    });
    return (await tokenResponse.json()).access_token;
  } catch (error) {
    log.error(error.stack);
    error.statusCode = INTERNAL_SERVER_ERROR
    throw error;
  }
}

async function requestFtOAuth2Token() {
  try {
    const tokenResponse = await fetch(`${ftOktaOAuthUrl}/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
      body: `client_id=${ftOktaClient}&client_secret=${ftOktaSecret}&grant_type=client_credentials`
    });
    const body = await tokenResponse.json();
    return body.access_token;
  } catch (error) {
    log.error(error.stack);
    error.statusCode = INTERNAL_SERVER_ERROR
    throw error;
  }
}

async function requestPnOOAuth2Token() {
  try {
    const tokenResponse = await fetch(`${pnoOAuthUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
      body: `client_id=${oktaClient}&client_secret=${oktaSecret}&grant_type=client_credentials&scope=mdm-people-search-api-development`
    });
   const body = await tokenResponse.json();
    return body.access_token;
  } catch (error) {
    log.error(error.stack);
    error.statusCode = INTERNAL_SERVER_ERROR
    throw error;
  }
}

async function requestInternalOktaAdminOAuth2Token() {
  try {
    const credentials = await conf.getAdminCredentialsInternal();
    const tokenResponse = await fetch(credentials[2], {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
      body: `client_id=${credentials[0]}&client_secret=${credentials[1]}&grant_type=client_credentials`
    });
    const body = await tokenResponse.json();
    return body.access_token;
  } catch (error) {
    log.error(error.stack);
    error.statusCode = INTERNAL_SERVER_ERROR
    throw error;
  }
}

async function getOneCloudJwt() {
  const cache = await conf.getRedisCacheManager(ttlInSeconds);
  let oneCloudJwt = await cache.get('onecloud_jwt');
  if (!oneCloudJwt) {
    oneCloudJwt = await requestOneCloudOAuth2Token();
    const apiCache = await conf.getRedisCacheManager(ttlInSeconds);
    await apiCache.set('onecloud_jwt', oneCloudJwt);
  }
  return oneCloudJwt;
}

async function getFtJwt() {
  const cache = await conf.getRedisCacheManager(ttlInSeconds);
  const cachedJwt = await cache.get('ft_jwt');
  if (cachedJwt) return cachedJwt;

  log.debug('start getting new ftJwt');
  const newJwt = await requestFtOAuth2Token();
  log.debug('completed getting new ftJwt');
  if (newJwt) {
    await cache.set('ft_jwt', newJwt);
  }
  log.debug('cached ftJwt');
  return newJwt;
}


async function getEDLMetadata(index, searchQuery, bodyOveride = null) {
  const confCall = conf.getConfig();
  const token = await getJwt();
  const metadataUrl = confCall.edlCatalog;
  const bodyToJSON = JSON.stringify(bodyOveride);
  try {
    const body = !!bodyToJSON ? bodyToJSON : {index, "query" : searchQuery};

    let params = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body
    }
    if (process.env.NODE_ENV === 'development') {
      params.agent = new https.Agent({
        rejectUnauthorized: false
      });
    }

    const response = await fetch(`${metadataUrl}/v1/search`, params);
    if(!response.ok){
      const errorResponse = await response.json();
      const error = new Error(errorResponse.message || 'Internal Server error occurred');
      error.response = errorResponse;
      throw error
    }
    const tokenResponse = await response.json();
    log.debug(`tokenResponse received: ${JSON.stringify(tokenResponse)}`);
    return tokenResponse.map(record => record._source);
  } catch (error) {
    log.error(error.stack);
    error.statusCode = INTERNAL_SERVER_ERROR
    throw error;
  }
}

async function getInternalOktaAdminJwt() {
  const cache = await conf.getRedisCacheManager(ttlInSeconds);
  const cachedJwt = await cache.get('internal_okta_admin_jwt');
  if (cachedJwt) return cachedJwt;

  log.info('start getting new internalOktaAdminJwt');
  const newJwt = await requestInternalOktaAdminOAuth2Token();
  log.info('completed getting new internalOktaAdminJwt');
  await cache.set('internal_okta_admin_jwt', newJwt);
  log.info('cached internalOktaAdminJwt');
  return newJwt;
}

async function constructQuery(custodianOptions) {
  let subqueries = [];
  custodianOptions?.forEach((group, index) => {
    subqueries[index] = `q${index}:applications{name authorizations(roles:"product_developer",racfId:"${group}"){subject} isDeleted applicationEnvironments{location} buisinessApplicationName configurationItems{assignmentGroup supportGroup shortDescription comments} teamPdl}`
  })
  return `{${subqueries}}`
}

async function getApplicationParams(method, groups, userId) {
  const oneCloudToken = await getOneCloudJwt();
  const query = await constructQuery(groups);
  return { method, headers: { 'Authorization': `Bearer ${oneCloudToken}`, 'Content-Type': 'application/json', 'X-USERID': userId }, body: JSON.stringify({ query }) };
}

async function getApplicationsParamsWithoutGroups(method, userId) {
  const oneCloudToken = await getOneCloudJwt();
  const query = `
  query getAllApplications {
  applications {
    name
    isDeleted
  }
}
`;
  return { method,
    headers:
        {
          'Authorization': `Bearer ${oneCloudToken}`,
          'Content-Type': 'application/json' ,
          'X-USERID': userId
        },
    body: JSON.stringify({
      query,
    }),
  };
}

async function getBusinessApplicationParams(method, userId) {
  const oneCloudToken = await getOneCloudJwt();
  const query = `
  query getBusinessApplications($active: Boolean!) {
    businessApplications(active: $active) {
      name
      displayName
      productName
      apmAppNumber
      installStatus
    }
  }
`;
  return { method,
    headers:
    {
      'Authorization': `Bearer ${oneCloudToken}`,
          'Content-Type': 'application/json' ,
      'X-USERID': userId
    },
    body: JSON.stringify({
      query,
      variables: { active: true },
    }),
  };
}

async function getApplications(path, groups = [], userId) {
  let params
  if (groups.length > 0) {
    params = await getApplicationParams('POST', groups, userId);
  } else {
    params = await getApplicationsParamsWithoutGroups('POST', userId);
  }
  return sendRequest(`${oneCloudUrl}${path}`, params)
}

async function getBusinessApplications(path, userId) {
  const cache = await conf.getRedisCacheManager(ttlInSeconds);
  const cachedResponse = await cache.get(`business_app_for_${userId}`);
  if (cachedResponse) return cachedResponse;
  log.info(`Didn't fetch response for business_app_for_${userId} in cache`)
  const params = await getBusinessApplicationParams('POST', userId);
  let response = await sendRequest(`${oneCloudUrl}${path}`, params);
  await cache.set(`business_app_for_${userId}`, response);
  log.info(`Persisted response for business_app_for_${userId} in cache`)
  return response
}

async function getOneCloudApi(path) {
  const oneCloudToken = await getOneCloudJwt();
  const params = { method: 'GET', headers: { 'Authorization': `Bearer ${oneCloudToken}` } };
  return sendRequest(`${oneCloudUrl}${path}`, params);
}

async function deleteOneCloudApi(path) {
  const oneCloudToken = await getOneCloudJwt();
  const params = { method: 'DELETE', headers: { 'Authorization': `Bearer ${oneCloudToken}` } };
  log.info('deleting: ', `${oneCloudUrl}${path}`);
  const response = await fetch(`${oneCloudUrl}${path}`, params);
  if (!response.ok) {
    log.log(JSON.stringify(response));
    const error = new Error('Error in deleting!');
    error.statusCode = INTERNAL_SERVER_ERROR;
    throw error;
  }
  log.info('Successfully deleted application');
  return response;
}

async function createApplication(path, body) {
  const oneCloudToken = await getOneCloudJwt();
  const params = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${oneCloudToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
  return sendRequest(`${oneCloudUrl}${path}`, params);
}

async function editApplication(applicationName, body) {
  const oneCloudToken = await getOneCloudJwt();
  const params = { method: 'PUT', headers: { 'Authorization': `Bearer ${oneCloudToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
  return sendRequest(`${oneCloudUrl}application-registry/applications/${applicationName}`, params);
}

async function getFilesApi(uri, metadata) {
  const edlToken = await getJwt();
  const params = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${edlToken}`,
      ...metadata && { 'X-Deere-Metadata': Buffer.from(JSON.stringify(metadata)).toString('base64') }
    }
  };
  try {
    log.info(`Sending request for ${uri}`);
    const response = await fetch(uri, params);
    log.info(`Received response code ${response.status}`)
    if (response.ok) {
      const bodyJson = await response.json();
      if (bodyJson.message === alreadyExists) createAlreadyExistsError();
      return bodyJson;
    }
    else if (response.status === 404)
      return { requests: [] };
    const errorBody = await response.text();
    if (errorBody.toLowerCase().includes('not found'))
      return { requests: [] };

    log.error(`failed to send request for uri: ${uri} with metadata: ${JSON.stringify(metadata)}`);
    handleError(response.status, errorBody);
  }
  catch (ex) {
    log.error('Get Files API Failed to Fetch response', ex.stack);
    throw ex;
  }
}
async function getPnODetailsForUser(userId) {
  const pnoToken = await getPnOJwt();
  const body = JSON.stringify({
    "userId": [
      userId
    ]
  });
  const params = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${pnoToken}`,
      'Content-Type': 'application/json'
    },
    body: body,
    redirect: 'follow'
  };
  if (process.env.NODE_ENV === 'development') {
    params.agent = new https.Agent({
      rejectUnauthorized: false
    });
  }
  try {
    log.debug(`Sending PnO request for ${userId}`);
    const response = await fetch(pnoUrl, params);
    log.debug(`Received response code from PnO : ${response.status}`)
    if (response.ok) {
      return await response.json();
    }
  }
  catch (ex) {
    log.error('PnO call failed to fetch response', ex.stack);
  }
  return []

}

module.exports = {
  setLogger,
  post,
  postWithContentType,
  apiDelete,
  get,
  getApplications,
  constructQuery,
  getOneCloudApi,
  deleteOneCloudApi,
  createApplication,
  editApplication,
  sendRequest,
  getFilesApi,
  getEDLMetadata,
  getFt,
  getParams,
  postWithInternalOktaAdminParams,
  getWithInternalOktaAdminParams,
  getBusinessApplications,
  getPnODetailsForUser
}
