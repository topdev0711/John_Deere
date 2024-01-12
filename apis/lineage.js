import {getParams, useNoParamHandler} from './apiHelper'

const getLineage = async resource => {
  if(!resource) return {} // in case resource param is undefined, don't call the service
  const res = await fetch(`/api/lineage/${resource}`, getParams);
  return res.json();
}

const getSourceDBDetails = async () => {
  const res = await fetch('/api/lineage/sourcedb', getParams);
  return res.json();
}

const getSourceDBFilters = async () => {
  const res = await fetch(`/api/lineage/sourcedb/filters`, getParams);
  return res.json();
}

const useSourceDbFilters = () => useNoParamHandler('/api/lineage/sourcedb')


module.exports = { getLineage, getSourceDBDetails, getSourceDBFilters, useSourceDbFilters };
