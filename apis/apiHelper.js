// Unpublished Work © 2021-2022 Deere & Company.
import useSWR from 'swr';
const getParams = { credentials: 'same-origin', method: 'GET', headers: { 'Content-Type': 'application/json' } };

const createPostParams = body => ({
  credentials: 'same-origin',
  method: 'POST',
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json'},
  body: JSON.stringify(body)
});


const createPostParamsNoBody = () => ({
  credentials: 'same-origin',
  method: 'POST',
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json'}
});

const createDeleteParams = body => ({
  credentials: 'same-origin',
  method: 'DELETE',
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json'},
  body: JSON.stringify(body)
});

const createDeleteParamsNoBody = () => ({
  credentials: 'same-origin',
  method: 'DELETE',
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json'}
});

const getFetchHandleError = async url => {
  const response = await fetch(url, getParams);
  const data = await response.json();
  if (response.ok) return data;

  console.error(`failed to get ${url} with error: ${data}`)
  throw new Error(data);
}

const useNoParamHandler = url => {
  return useSWR(url, getFetchHandleError);
}

const useFetch = async call => {
  try {
    const data = await call;
    return {data};
  } catch (e) {
    return {error: e.message ? e.message : e.name};
  }
};

module.exports = { getParams, createPostParams, createDeleteParams, createPostParamsNoBody, createDeleteParamsNoBody, useNoParamHandler, useFetch };
