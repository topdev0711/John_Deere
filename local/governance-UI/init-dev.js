const fullDatasets = require('./data/datasetDatabaseData.json');
const fullPermissions = require('./data/permissionsDatabaseData.json');
const permissionMapping = require('./tableDefinitions/PermissionsOpensearchMapping.json');
const datasetMapping = require('./tableDefinitions/DatasetsOpenSearchMapping.json');
const { Client } = require("@opensearch-project/opensearch");
const fs = require('fs');
const mongo = require('mongodb');

const localMongoConnection = 'mongodb://mongo:27017';

async function populateMongo() {
  const MongoClient = mongo.MongoClient;
  const ca = [fs.readFileSync("rds-combined-ca-bundle.pem")];
  const mongoOptions = {
    sslValidate: true,
    sslCA:ca,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    readConcern: "majority"
  };
  const client = await MongoClient.connect(localMongoConnection, mongoOptions);
  const recordsDb = client.db('records');
  await migrateRecords('datasets', recordsDb, fullDatasets);
  await migrateRecords('permissions', recordsDb, fullPermissions);
  await client.close();
  console.log('Populated Mongo');
}

const hasCompanyUseAccess = ({community, gicp}, permittedCommunities) => 'company use' === gicp?.name?.toLowerCase() && permittedCommunities.indexOf(community?.id) >= 0;
async function populateOpenSearch() {
  const client = new Client({node: "http://opensearch:9200/", ssl: {rejectUnauthorized: false}});
  try {
    await client.indices.delete({index: "dataset_v3"});
  } catch (e) {
    console.log(e);
  }

  await client.indices.create({index: "dataset_v3", body: datasetMapping});
  let datasets = {};
  fullDatasets.forEach(dataset => {
    const docId = dataset.id;
    if(!datasets.hasOwnProperty(docId)) {
      datasets[docId] = {
        'version': dataset['version'],
        'data': dataset
      };
    }
    else {
      if(datasets[docId]['version'] < dataset['version']) {
        datasets[docId]['version'] = dataset['version'];
        datasets[docId]['data'] = dataset;
      }
    }
  });
  console.log('Found ' + Object.keys(datasets).length + ' unique document(s)')
  let errors = 0;
  let permissibleCommunities = [
    "a7b76f9e-8ff4-4171-9050-3706f1f12188",
    "2e546443-92a3-4060-9fe7-22c2ec3d51b4",
    "75b382e2-46b8-4fe8-9300-4ed096586629",
    "a521b7d4-642c-4524-9c46-e4fa5e836a17"
  ]
  Object.keys(datasets).forEach(docId => {
    let accumEntitlements = new Set()
    let accumSubCommunitySet = new Set()
    delete datasets[docId]['data']['_id'];
    delete datasets[docId]['data']['physicalLocation']['name'];
    delete datasets[docId]['data']['environment'];
    let all_ca_values_valid = datasets[docId]['data']['classifications'].every(classification => hasCompanyUseAccess(classification, permissibleCommunities));
    for (let step = 0; step < datasets[docId]['data']['classifications'].length; step++) {
      let crIds = [];
      for(let step4 = 0; step4 < datasets[docId]['data']['classifications'][step]['countriesRepresented'].length; step4++) {
        crIds.push(datasets[docId]['data']['classifications'][step]['countriesRepresented'][step4]['id']);
      }
      crIds.sort();
      const crStr = "-" + crIds.join("-");
      const cId = datasets[docId]['data']['classifications'][step]['community']['id'];
      const sId = datasets[docId]['data']['classifications'][step]['subCommunity']['id'];
      const gicpId = datasets[docId]['data']['classifications'][step]['gicp']['id'];
      const development = datasets[docId]['data']['classifications'][step]['development'];
      const pi = datasets[docId]['data']['classifications'][step]['personalInformation'];
      const tags = datasets[docId]['data']['classifications'][step]['additionalTags']?.sort()?.join('-');
      let entitlementStr = cId + "-" + crStr + "-" + development + "-" + gicpId + "-" + pi + "-" + sId + "-" + tags
      accumEntitlements.add(entitlementStr)
      accumSubCommunitySet.add(datasets[docId]['data']['classifications'][step]['subCommunity']['id'])
    }
    for (let step1 = 0; step1 < datasets[docId]['data']['approvals'].length; step1++) {
      delete datasets[docId]['data']['approvals'][step1]['commentHistory'];
    }
    for (let step2 = 0; step2 < datasets[docId]['data']['views'].length; step2++) {
      delete datasets[docId]['data']['views'][step2]['createdAt']
    }
    datasets[docId]['data']['lockedBy'] = 'NONE';
    datasets[docId]['data']['entitlementsStrArray'] = Array.from(accumEntitlements)
    datasets[docId]['data']['subCommunityStrArray'] = Array.from(accumSubCommunitySet)
    datasets[docId]['data']['entitlementsCount'] = accumEntitlements.size
    datasets[docId]['data']['hasAllCompanyUseFlag'] = all_ca_values_valid

    try{
      console.log ("'"+docId+"'"+" => "+datasets[docId]['data']['id'] + " == " + datasets[docId]['version'] + " == " + datasets[docId]['data']['status'] + "==" + datasets[docId]['data']['hasAllCompanyUseFlag'] + "==" + datasets[docId]['data']['subCommunityStrArray'])
      client.index({index: "dataset_v3", body : datasets[docId]['data'], id : datasets[docId]['data']['id']})
    }
    catch(e) {
        console.log ("'"+documentVersion+"'"+" "+latestDocuments[documentVersion]['data']['id'] + " == " + str(latestDocuments[documentVersion]['version']) + " == " + latestDocuments[documentVersion]['data']['status'])
        console.log(e)
        errors+=1;
    }
  })
  console.log("Num of errors - ",errors)
}

async function populateOpenSearchPermissions() {
  const client = new Client({
    node: "http://opensearch:9200/",
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.indices.delete({
      index: "permission_groups",
    });
  } catch (e) {
    console.log(e);
  }

  await client.indices.create({
    index: "permission_groups",
    body: permissionMapping,
  });

  let permissions = {};
  fullPermissions.forEach((permission) => {
    let docId = permission.id;
    if (!permissions.hasOwnProperty(docId)) {
      permissions[docId] = {
        version: permission["version"],
        data: permission,
      };
    } else {
      if (permissions[docId]["version"] < permission["version"]) {
        permissions[docId]["version"] = permission["version"];
        permissions[docId]["data"] = permission;
      }
    }
  });
  console.log(
    "Found " + Object.keys(permissions).length + " unique document(s)"
  );
  let groupedDocuments = {};
  Object.keys(permissions).forEach((docId) => {
    let groupName = permissions[docId]["data"]["group"];
    let clientId = permissions[docId]["data"]["clientId"];
    let roleType = permissions[docId]["data"]["roleType"];
    const key = clientId ? clientId : groupName;
    if (groupedDocuments[key]) {
      groupedDocuments[key]["permissions"] = [
        ...groupedDocuments[key]["permissions"],
        permissions[docId]["data"],
      ];
    } else {
      groupedDocuments[key] = {
        id: key,
        roleType: roleType,
        permissions: [permissions[docId]["data"]],
      };
    }
  });
  console.log(
    "Found " + Object.keys(groupedDocuments).length + " unique group(s)"
  );
  let errors = 0;
  Object.keys(groupedDocuments).forEach((group) => {
    let finalDocument = groupedDocuments[group];
    groupedDocuments[group]["permissions"].forEach(permission => {
      permission.count = 1;
      permission.approvals.forEach(approval => {
        if (approval.community?.id && typeof approval.community?.id === "object") {
            delete approval.community?.id;
        }
      })
    });

    try {
      console.log(
        "'" +
          group +
          "'" +
          " => " +
          groupedDocuments[group]["permissions"].length
      );
      client.index({
        index: "permission_groups",
        body: finalDocument,
        id: group,
      });
    } catch (e) {
      console.log(e);
      errors += 1;
    }
  });
  console.log("Num of errors - ", errors);
}

async function migrateRecords(collection, db, records) {
  const recordsCollection = db.collection(collection);
  const insertStatements = records.map(record => {
    return {
      insertOne: {
        document: {
          ...record,
          _id: record.id + '-' + record.version
        }
      }
    }
  });
  if(insertStatements && insertStatements.length > 0) {
    return recordsCollection.bulkWrite(insertStatements, { writeConcern: { j: true } });
  }
  console.log('There are no records to migrate to Mongo');
  return null;
}

async function init() {
  if (!process.env.LOAD_LOCAL_DATA) {
    console.log('skipping the loading of local data');
    return;
  }

  try {
    await populateMongo();
    await populateOpenSearch();
    await populateOpenSearchPermissions();
  } catch (ex) {
    console.log('Error while loading dev data:', ex);
  }
}

init();
