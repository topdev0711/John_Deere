import { getParams, createPostParams } from './apiHelper'

async function accessibleDatasets(name) {
  const res = await fetch(`/api/accessible-dataset/${name}`, getParams);
  return res.json();
}

async function allowedPermissions(classifications) {
  const res = await fetch(`/api/allowed-permissions`, createPostParams(classifications));
  return res.json();
}


async function getUserListForDataset(datasetId) {
  const res = await fetch(`/api/dataset-permission-report/${datasetId}`, getParams);
  return res.json();

}

module.exports = { accessibleDatasets, allowedPermissions, getUserListForDataset };
