import { getParams } from './apiHelper'

async function getFeatureToggles() {
  const res = await fetch(`/api/toggles`, getParams);
  return res.json();
}

async function getFeatureToggle(name) {
  const res = await fetch(`/api/toggles/${name}`, getParams);
  return res.json();
}

module.exports = { getFeatureToggles, getFeatureToggle };
