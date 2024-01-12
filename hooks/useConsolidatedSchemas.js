import {useState} from 'react';
import { compareVersions } from 'compare-versions';
const reduceArrayToObject = (previous, current) => ({...previous, ...current});
const findLatestNonTestingVersion = statuses => {
  const testingStatusArray = Object.entries(statuses);
  const nonTestingVersions = testingStatusArray.filter(([version, status]) => status === false);
  if (!nonTestingVersions || !nonTestingVersions.length) return testingStatusArray[0];
  return nonTestingVersions[0];
}

const createConsolidatedSchemas = schemaSummaries => {
  const schemaNames = schemaSummaries.map(schema => schema.name);
  const findSchemaSummary = (name, version) => {
    return schemaSummaries.find(schema => schema.name === name && schema.version === version);
  }
  const getSchema = name => {
    const hasName = schema => schema.name === name;
    const getVersion = schema => schema.version;
    const versions = schemaSummaries.filter(hasName).map(getVersion).sort(compareVersions).reverse();
    const selectedVersion = versions.find(version => !findSchemaSummary(name, version)?.testing) || versions[0];
    const testingStatus = schemaSummaries.filter(hasName).map(schema => ({[schema.version]: schema.testing})).reduce(reduceArrayToObject, {});
    const hasDiff = schemaSummaries.filter(hasName).some(({diffStatus}) => diffStatus && diffStatus !== 'unchanged');
    return {name, versions, selectedVersion, testingStatus, hasDiff };
  }

  const output = schemaNames.map(getSchema).reduce((unique, o) => {
    if(!unique.some(obj => obj.name === o.name)) {
      unique.push(o);
    }
    return unique;
  },[]);
  return output;
}

const useConsolidatedSchemas = schemaSummaries => useState(createConsolidatedSchemas(schemaSummaries));

module.exports = { useConsolidatedSchemas, createConsolidatedSchemas };
