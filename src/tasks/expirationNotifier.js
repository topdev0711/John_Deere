const notificationService = require('../services/notificationService');
const permissionService = require('../services/permissionService');
const millisInDay = 24 * 60 * 60 * 1000;
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  notificationService.setLogger(logger);
  permissionService.setLogger(logger);
}

async function run(notifyAll = false) {
  const permissions = await permissionService.getLatestPermissions();
  const lastRun = new Date().setHours(0,0,0,0);
  const nextRun = new Date(lastRun + millisInDay);
  const newAndEndedPermissions = permissions.filter(p => {
    return isEndDated(p.endDate, nextRun, lastRun, notifyAll) || isEffective(p.startDate, nextRun, lastRun, notifyAll);
  });

  return Promise.all(newAndEndedPermissions.map(({id, version}) => {
    return notificationService.sendPermissionNotification(id, version);
  }));
}

function isEndDated(endDate, nextRun, lastRun, notifyAll) {
  if (!endDate) return false;
  const permissionEnd = (new Date(endDate)).getTime();
  if (notifyAll) {
    return permissionEnd < nextRun;
  }
  return permissionEnd < nextRun && permissionEnd >= lastRun;
}

function isEffective(startDate, nextRun, lastRun, notifyAll) {
  const permissionStart = (new Date(startDate)).getTime();
  if(notifyAll) {
    return permissionStart < nextRun;
  }
  return permissionStart < nextRun && permissionStart >= lastRun
}

module.exports = { setLogger, run };
