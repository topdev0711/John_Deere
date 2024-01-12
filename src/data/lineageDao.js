const conf = require('../../conf');
const lineageService = require('../services/lineageService');
let log = require('edl-node-log-wrapper');

function setLogger(logger) {
  log = logger;
  lineageService.setLogger(logger);
}

async function getLineageInfo() {

  try {
    const lineageInfo = await lineageService.getSourceDBDetails();
    log.info("Received Lineage Info")

    const aggLineageInfo = {};
    lineageInfo.forEach(item => {
      if (!aggLineageInfo[item.datatype]) {
        aggLineageInfo[item.datatype] = {
          databases: [item.database],
          servers: [item.server],
          tableNames: [...item.tableName.trim().split(',')]
        }
      } else {
        aggLineageInfo[item.datatype].databases.push(item.database.trim().toLowerCase());
        aggLineageInfo[item.datatype].servers.push(item.server.trim().toLowerCase());
        aggLineageInfo[item.datatype].tableNames.push(...item.tableName.trim().split(','));
      }
    });
    log.info(aggLineageInfo);
    return aggLineageInfo
  } catch (e) {
    log.error(e.stack);
    log.error(e)
    throw new Error('An unexpected error occurred when getting dataset from OpenSearch.');
  }

}

async function getLineageInfoByDST() {

  try {
    const lineageInfo = await lineageService.getSourceDBDetails();
    log.info("Received Lineage Info")

    const aggLineageInfo = {};
    lineageInfo.forEach(item => {
      if (!aggLineageInfo[item.database.toLowerCase()]) {
        aggLineageInfo[item.database.toLowerCase()] = [item.datatype]
      } else {
        aggLineageInfo[item.database.toLowerCase()].push(item.datatype);
      }

      if (!aggLineageInfo[item.server.toLowerCase()]) {
        aggLineageInfo[item.server.toLowerCase()] = [item.datatype]
      } else {
        aggLineageInfo[item.server.toLowerCase()].push(item.datatype);
      }

      if (!aggLineageInfo[item.tableName.toLowerCase()]) {
        aggLineageInfo[item.tableName.toLowerCase()] = [item.datatype]
      } else {
        aggLineageInfo[item.tableName.toLowerCase()].push(item.datatype);
      }

    });
    log.info(aggLineageInfo);
    return aggLineageInfo
  } catch (e) {
    log.error(e.stack);
    log.error(e)
    throw new Error('An unexpected error occurred when getting dataset from OpenSearch.');
  }

}

module.exports = { getLineageInfo, getLineageInfoByDST, setLogger }