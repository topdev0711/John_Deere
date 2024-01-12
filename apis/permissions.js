// Unpublished Work © 2022 Deere & Company.
import {getParams, createPostParams, createPostParamsNoBody, createDeleteParamsNoBody} from './apiHelper'
import {createQueryParams, createUrl} from "../components/searchUtils";
import useSWR from "swr";

const swrSecond = 1000;
const baseUrl = '/api/permissions';
const baseUrlv2 = '/api/v2/permissions';

function getUrl(id, version) {
  if(id && version) return `${baseUrl}/${id}/versions/${version}`;
  if(id) return `${baseUrl}/${id}`;
  return baseUrl;
}

function buildGETUrl(id, version) {
  if(id && version) return `${baseUrl}/${id}/${version}`;
  if(id) return `${baseUrl}/${id}`;
  return baseUrl;
}

function postPermission(permission) {
  const { id, version } = permission;
  return fetch(getUrl(id, version), createPostParams(permission));
}

async function getPermission(id, version) {
  const response = await fetch(buildGETUrl(id, version), {credentials: 'same-origin'});
  return response.json();
}

async function getFetch(url) {
  const response = await fetch(url, {credentials: 'same-origin'});
  return response.json();
}

async function getFetchHandleError(url) {
  let currentUrl = url[1] ? `${url[0]}?${url[1]}` : url[0];
  const response = await fetch(currentUrl, getParams);
  if (!response.ok) throw Error(response.statusText);
  return response.json();
}

function getGroupsPermissionsUrl(groups, roleTypes = []) {
  const groupQuery = groups.map(group => `group=${group}`).join('&');
  const statusQuery = 'status=AVAILABLE&status=PENDING&status=REJECTED';
  const roleTypeQuery = (roleTypes || []).map(role => `roleType=${role}`) .join('&');
  const queryParams = roleTypeQuery ? `${groupQuery}&${statusQuery}&${roleTypeQuery}` : `${groupQuery}&${statusQuery}`;
  return `${baseUrl}?${queryParams}`
}

async function getGroupsPermissions(groups, roleTypes = []) {
  const url = getGroupsPermissionsUrl(groups, roleTypes);
  return getFetch(url);
}

async function getAllVersions(id) {
  const res = await fetch(`${baseUrl}/${id}/versions`, getParams);
  return res.json();
}

async function getAllAvailablePermissions() {
  const res = await fetch(baseUrl, getParams);
  return res.json();
}

const useGetPermissionsSwr = (queryJson) => {
  const queryParams = createQueryParams(queryJson);
  return useSWR([baseUrlv2, queryParams], getFetchHandleError, { refreshInterval: 60 * swrSecond });
}

async function postApproval(id, version) {
  const url = `/api/permissions/${id}/${version}/approve`;
  return fetch(url, createPostParamsNoBody());
}

async function deleteApprovalRequest(id, version) {
  const url = `/api/permissions/${id}/versions/${version}`;
  return fetch(url, createDeleteParamsNoBody());
}

async function postRejection(id, version, body) {
  const url = `/api/permissions/${id}/${version}/reject`;
  return fetch(url, createPostParams(body));
}

module.exports = {
  postPermission,
  getPermission,
  getGroupsPermissions,
  getAllVersions,
  getAllAvailablePermissions,
  useGetPermissionsSwr,
  postApproval,
  postRejection,
  deleteApprovalRequest
};
