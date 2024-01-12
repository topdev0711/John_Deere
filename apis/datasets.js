// Unpublished Work © 2022 Deere & Company.
import useSWR from 'swr'
import {getParams, createPostParams, createDeleteParams, createPostParamsNoBody, createDeleteParamsNoBody} from './apiHelper';
import {createQueryParams} from "../components/searchUtils";

const swrSecond = 1000;

async function getFetch(url) {
  const response = await fetch(url, getParams);
  if (!response.ok) throw Error(response.statusText);
  return response.json();
}

async function getFetchHandleError(url) {
  let currentUrl = url[1] ? `${url[0]}?${url[1]}` : url[0];
  const response = await fetch(currentUrl, getParams);
  const data = await response.json();
  if (!response.ok) throw Error(data);
  return data;
}

async function postFetch(url) {
  const response = await fetch(url, getParams);
  if (!response.ok) throw Error(response.statusText);
  return response.json();
}

async function getDataset(id) {
  const response = await fetch(`/api/datasets/${id}`, getParams);
  return response.json();
}

const useDatasets = (queryJson) => {
  const queryParams = createQueryParams(queryJson);
  return useSWR(['/api/datasets/v2', queryParams], getFetchHandleError, { refreshInterval: 60 * swrSecond });
};

async function getVersionedDataset(id, version, status) {
  const statuses = status ? [].concat(status).map(status => `status=${status}`) : [];
  const queryString = statuses.length ? `?${statuses.join('&')}` : '';
  const url = `/api/datasets/${id}/versions/${version}${queryString}`;
  return getFetch(url);
}

async function getDatasetWithQuery(query) {
  try {
    const response = await fetch('/api/datasets/v2' + query);
    return response.json();
  } catch (e) {
    console.error(`failed search for dataset with error: ${e.stack}`);
    return [];
  }
}

async function getDatasetSearchCount(baseQuery) {
  try {
    const countPrefix = baseQuery.length ? '&' : '?';
    const query = baseQuery + countPrefix + 'count=true';
    const response = await fetch('/api/datasets/v2' + query);
    return response.json();
  } catch (e) {
    console.error(e.stack);
    return '';
  }
}

function deleteDataset(id, requestBody) {
  return fetch(`/api/datasets/${id}`, createDeleteParams(requestBody));
}

function postDataset(dataset, requestBody) {
  const endpoint = dataset ? `/api/datasets/${requestBody.id}/versions/${requestBody.version}` : '/api/datasets';
  return fetch(endpoint, createPostParams(requestBody));
}

function postPublishedPaths(id, version, path, comments) {
  return fetch(`/api/datasets/${id}/versions/${version}/published-paths`, createPostParams({path, comments}));
}

function findApplications() {
  return fetch(`/api/applications?lite=true`, getParams);
}

function predictCommunity(body) {
  return fetch('/api/datasets/predict-community', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });
}

function lockDataset({id, version}) {
  return fetch(`/api/datasets/${id}/${version}/lock`, {credentials: 'same-origin', method: 'POST'});
}

function unlockDataset({id, version}) {
  return fetch(`/api/datasets/${id}/${version}/unlock`, {credentials: 'same-origin', method: 'POST'});
}

async function getAllVersions(id) {
  const res = await fetch(`/api/datasets/${id}/versions`, getParams);
  return res.json();
}

async function getLinkedDatasetsForDatasetSchema(id, status) {
  const res = await fetch(`/api/datasets/${id}/schemas/linked-datasets?status=${status}`, getParams);
  return res.json();
}

async function getDatasetsForSchema(id) {
  const res = await fetch(`/api/datasets/${id}/linked-schemas/linked-datasets`, getParams);
  return res.json();
}

async function getAllAvailableDatasets() {
  const res = await fetch(`/api/datasets`, getParams);
  return res.json();
}

async function getAllAvailableDatasetSummaries() {
  const res = await fetch(`/api/datasets?summary=true`, getParams);
  return res.json();
}

async function getLineages(id, type) {
  const res = await fetch(`/api/datasets/${id}/lineages?type=${type}`, getParams);
  return res.json();
}

async function getDetailedDataset(detailed, id, version) {
  const fetchUrl = version ? `/api/datasets/${id}/${version}?isDetailed=${detailed}` : `/api/datasets/${id}?isDetailed=${detailed}`;
  const res = await fetch(fetchUrl, {credentials: 'same-origin'});
  return res.json();
}

function useDataset(id, version, status) {
  const statuses = status ? [].concat(status).map(status => `status=${status}`) : [];
  const queryString = statuses.length ? `?${statuses.join('&')}` : '';
  const url = `/api/datasets/${id}/versions/${version}${queryString}`;
  return useSWR(url, getFetch);
}

async function loadPermissionsWithAccessToDatasetView(id, version, requestBody) {
  if (!requestBody.length) return [];

  const endpoint = `/api/datasets/${id}/versions/${version}/views/permissions`;
  const res = await fetch(endpoint, createPostParams(requestBody));
  return res.json();
}

async function fetchRecentlyModifiedDatasets() {
  const res = await fetch(`/api/datasets?orderBy=EDL&limit=5`, getParams);
  return res.json();
}

async function postApproval(id, version) {
  const url = `/api/datasets/${id}/${version}/approve`;
  return fetch(url, createPostParamsNoBody());
}

async function deleteApprovalRequest(id, version) {
  const url = `/api/datasets/${id}/versions/${version}`;
  return fetch(url, createDeleteParamsNoBody());
}

async function postRejection(id, version, body) {
  const url = `/api/datasets/${id}/${version}/reject`;
  return fetch(url, createPostParams(body));
}

async function fetchLoadHistory({dataType, representation}) {
  const metadata = `${dataType},${representation}`;
  const response = await fetch(`/api/datasets/load-history?metadata=${metadata}`, getParams);
  const responseBody = await response.json();
  if (response.ok) return responseBody;
  throw new Error(responseBody);
}

async function useLoadHistory({dataType, representation}) {
  const metadata = `${dataType},${representation}`;
  return useSWR(['/api/datasets/load-history', metadata], getFetchHandleError);
}

module.exports = {
  useDatasets,
  getDataset,
  getVersionedDataset,
  getDatasetWithQuery,
  getDatasetSearchCount,
  deleteDataset,
  postDataset,
  postPublishedPaths,
  findApplications,
  predictCommunity,
  lockDataset,
  unlockDataset,
  getAllVersions,
  getAllAvailableDatasets,
  getLinkedDatasetsForDatasetSchema,
  getDatasetsForSchema,
  getAllAvailableDatasetSummaries,
  getLineages,
  getDetailedDataset,
  useDataset,
  loadPermissionsWithAccessToDatasetView,
  fetchRecentlyModifiedDatasets,
  postApproval,
  postRejection,
  deleteApprovalRequest,
  useLoadHistory
};
