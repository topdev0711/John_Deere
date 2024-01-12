const dynamo = require('./dynamo');
const conf = require('../../conf');
let log = require('edl-node-log-wrapper');

const setLogger = logger => log = logger;
const getIsoDatetime = () => new Date().toISOString();

function model() {
  return dynamo.define(conf.getConfig().announcementsTable, {
    hashKey: 'title',
    rangeKey: 'startAt'
  });
}

function handleError(e) {
  log.error('failed to retrieve announcements with error: ', e);
  throw new Error('failed to retrieve announcements');
}

async function getAnnouncements() {
  try {
    const today = getIsoDatetime();
    const query = model().scan().where("startAt").lte(today).where("endAt").gte(today);
    log.debug('getting announcements for today');
    const records = await query.exec().promise();
    log.debug('got announcements for today');
    return records.collectItems();
  } catch (e) {
    handleError(e);
  }
}

async function getAnnouncementsRange(start, end) {
  try {
    const query = model().scan().where("startAt").gte(start).where("endAt").lte(end);
    log.debug(`getting announcements between ${start} and ${end}`);
    const records = await query.exec().promise();
    log.debug(`got announcements between ${start} and ${end}`);
    return records.collectItems();
  } catch (e) {
    handleError(e);
  }
}

async function saveAnnouncement(announcement) {
  try {
    log.debug('saving announcement ', announcement);
    const response = await model().create(announcement);
    log.debug('saved response');
    return response;
  } catch (e) {
    log.error('failed to save announcement with error: ', e);
    throw new Error('failed to save announcement');
  }
}

module.exports = { setLogger, getAnnouncements, saveAnnouncement, getAnnouncementsRange };
