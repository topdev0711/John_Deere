const fetch = require('node-fetch');
const fs = require('fs');
const throttle = require('p-throttle');

const conf = require('./conf.js').getConfig();
const JDC = 'https://data-catalog-dev.deere.com/api-external';

async function getToken() {
  const tokenResponse = await fetch(`${conf.oktaOAuthUrl}/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'Cache-Control': 'no-cache' },
    body: `client_id=${conf.oktaClient}&client_secret=${conf.oktaSecret}&grant_type=client_credentials`
  });
  const token = (await tokenResponse.json()).access_token;
  console.log('token from Okta received');
  return token;
}

function saveFile(filename, data) {
  fs.writeFileSync(`./local/governance-ui/data/${filename}`, JSON.stringify(data, null, 2));
}

async function getDatasets(token) {
  const response = await fetch(`${JDC}/datasets?community=systems`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`}
  });
  return response.json();
}

function dereferenceObj(obj) {
  return obj.id;
}

function dereferenceArray(arrayObj) {
  return arrayObj.map(dereferenceObj);
}

function dereferenceClassification(classification) {
  classification.countriesRepresented = dereferenceArray(classification.countriesRepresented);
  classification.community = dereferenceObj(classification.community);
  classification.subCommunity = dereferenceObj(classification.subCommunity);
  classification.gicp = dereferenceObj(classification.gicp);
}

function saveDatasets(data) {
  saveFile('datasetDatabaseData.json', data);
  console.log(`${data.length} datasets saved`);
}

async function saveSchemas(token, datasets) {
  let schemaCnt = 0;
  const discoveredSchemas = [];

  const throttled = throttle(async dataset => {
    const url = `${JDC}/datasets/${dataset.id}`;
    const datasetResult = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`}
    });

    let datasetDetails;
    try {
      datasetDetails = await datasetResult.json();
    } catch(e) {
      console.error(`${datasetResult.status}: failed to fetch ${dataset.name} (${dataset.id})`);
      return;
    }

    (datasetDetails.schemas || []).forEach(schema => {
      saveFile(`schemas/${schema.id}.json`, schema);
      schemaCnt++;
    });

    (datasetDetails.discoveredSchemas || []).forEach(schema => {
      saveFile(`schemas/${schema.id}.json`, schema);
      discoveredSchemas.push({
        datasetId: schema.datasetId,
        discovered: schema.discovered,
        id: schema.id,
        testing: true
      });
    });
  }, 5, 1000);

  await Promise.all(datasets.map(dataset => throttled(dataset)));
  console.log(`${schemaCnt} schemas saved`);

  saveFile(`discovered-schemas.json`, discoveredSchemas);
  console.log(`${discoveredSchemas.length} discovered schemas saved`);
}

async function getPermissions(token) {
  const response = await fetch(`${JDC}/permissions`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`}
  });
  return (await response.json())
    .filter(permission => {
      return permission.entitlements.some(entitlement => {
        return entitlement.community.name.toLowerCase() === 'systems';
      })
    });
}

function savePermissions(permissions) {
  saveFile('permissionsDatabaseData.json', permissions);
  console.log(`${permissions.length} permissions saved`);
}

function saveViews(views){
  saveFile('views.json', views);
  console.log(`${views.length} views saved`);
}

function saveTables(tables){
  saveFile('tables.json', tables);
  console.log(`${tables.length} tables saved`);
}


async function getViews(token) {
  const response = await fetch(`${JDC}/views`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`}
  });
  return (await response.json());
}

async function getTables(token) {
  const response = await fetch(`${JDC}/tables`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`}
  });
  return (await response.json());
}

async function refreshLocal() {
  const token = await getToken();

  const datasets = await getDatasets(token);
  console.log('datasets fetched');
  saveDatasets(datasets);
  await saveSchemas(token, datasets);

  const permissions = await getPermissions(token);
  console.log('permissions fetched');
  savePermissions(permissions);

  const views = await getViews(token);
  console.log('views fetched');
  saveViews(views);

  const tables = await getTables(token);
  console.log('tables fetched');
  saveTables(tables);

  console.log('local data has been refreshed');
}

refreshLocal();
