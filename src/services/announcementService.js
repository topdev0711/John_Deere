const announcementsDao = require('../data/announcementsDao');
const announcementModel = require('../model/announcementModel');
let log = require('edl-node-log-wrapper');

const setLogger = logger => {
  log = logger;
  announcementsDao.setLogger(logger);
};

const getIsoDatetime = () => new Date().toISOString();

async function getAnnouncements(start, end) {
  if (start && end) return announcementsDao.getAnnouncementsRange(start, end)
  else if (!start && !end) return announcementsDao.getAnnouncements()
  else throw new Error("Invalid query parameters, valid parameters include start and end or no query parameters")
}

function validatePermission(user) {
  if (!user.isAdmin) throw new Error("Permission denied");
}

function validate(body, user) {
    validatePermission(user);
    announcementModel.validate(body);
}

async function saveAnnouncement(body, user, timestamp = getIsoDatetime()) {
  validate(body, user);
  log.info(`saving announcement ${body.title}`);
  const announcement = {...body, createdAt: timestamp, updatedAt: timestamp};
  return announcementsDao.saveAnnouncement(announcement);
}

module.exports = { setLogger, getAnnouncements, saveAnnouncement };
