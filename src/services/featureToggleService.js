let log = require('edl-node-log-wrapper');
const { getFt } = require('../utilities/edlApiHelper');
const { getConfig, getEnv } = require('../../conf');
const env = (!getEnv() || getEnv() == 'local') ? 'devl' : getEnv();
const conf = require("../../conf");

const oneMinute = 60;
const defaultTtl = oneMinute * 1;

const setLogger = logger => {log = logger;}
const config = getConfig();
const { toggleServiceUrl } = config;
const TOGGLES = 'toggles';

const transform = toggle => ({[toggle.name.replace(env + ".", "")] : toggle.toggle});
const isEnvToggle = toggle => toggle.name.startsWith(env + ".");
const mergeToggles = (toggles, toggle) => ({...toggles, ...transform(toggle)});
const transformList = toggles => toggles.filter(isEnvToggle).reduce(mergeToggles, {});

const findToggles = async () => {
  const url = `${toggleServiceUrl}/toggles`;
  const togglesRaw = await getFt(url);
  return transformList(togglesRaw);
}

const getToggles = async (status = 'cached') => {
  const cache = await conf.getRedisCacheManager(defaultTtl);
  const cachedToggles = await cache.get(TOGGLES);
  if(status === 'cached' && cachedToggles) return cachedToggles;
  const newToggles = await findToggles();
  if (newToggles) {
    cache.set(TOGGLES, newToggles);
  }
  return newToggles;
};

const findToggle = async toggleName => {
  const url = `${toggleServiceUrl}/toggles/${env}.${toggleName}`;
  const toggleRaw = await getFt(url);
  return {...toggleRaw.toggle};
}

const getToggle = async (toggleName, status = 'cached') => {
  const cache = await conf.getRedisCacheManager(defaultTtl);
  const cachedToggle = await cache.get(toggleName);
  if(status === 'cached' && cachedToggle) return cachedToggle;

  const newToggle = await findToggle(toggleName);
  cache.set(toggleName, newToggle);
  return newToggle;
};

module.exports = {setLogger, getToggles, getToggle};
