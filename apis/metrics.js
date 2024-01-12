// Unpublished Work © 2022 Deere & Company.
import useSWR from 'swr';
import { getParams, createPostParamsNoBody } from './apiHelper';

const getLatestMetric = async (tableName, getUri) => {
  const res = await fetch(getUri(tableName), getParams);
  if (!res.ok) throw Error(res.statusText);
  return res.json();
}

const getCompletedMetricsNonSwr = async (tableNames, getUri) => {

  for (const tableName of tableNames) {
    try {
      const metrics = await getLatestMetric(tableName, getUri);
      return metrics;
    } catch (e) {
      console.log(e);
    }
  }
  return {};
}

const getCompletedMetricsSwr = (tableNames, getUri) => {
  const qualityMetrics = async () => {
    for (const [, tableName] of tableNames.entries()) {
      try {
        const metrics = await getLatestMetric(tableName, getUri);
        if (metrics && Object.keys(metrics).length) return metrics;
      } catch (e) {
        console.log(e);
      }
    }
    return {};
  }
  return useSWR(`/api/metrics/quality/${tableNames[0]}?status[]=COMPLETE`, qualityMetrics);
}


const getLatestMetricsSwr = (tableNames, getUri) => {
  const qualityMetrics = async () => {
    for (const [, tableName] of tableNames.entries()) {
      try {
        const metrics = await getLatestMetric(tableName, getUri);
        if (metrics && Object.keys(metrics).length) return metrics;
      } catch (e) {
        console.log(e);
      }
    }
    return {};
  }
  return useSWR(`/api/metrics/quality/${tableNames[0]}`, qualityMetrics);
}

const getLatestCompletedMetricUri = tableName => `/api/metrics/quality/${tableName}?status[]=COMPLETE`;

const useQualityMetricsCompletedSwr = tableNames => getCompletedMetricsSwr(tableNames, getLatestCompletedMetricUri);

const useQualityMetricsCompletedNonSwr = tableNames => getCompletedMetricsNonSwr(tableNames, getLatestCompletedMetricUri);

const getLatestMetricUri = tableName => `/api/metrics/quality/${tableName}`;

const useLatestQualityMetricsSwr = tableNames => getLatestMetricsSwr(tableNames, getLatestMetricUri);

async function refreshMetrics(tableNames) {
  for (const [, tableName] of tableNames.entries()) {
    const response = await fetch(`/api/metrics/quality/${tableName}`, createPostParamsNoBody())
    console.log('Response from post: ', await response.json());
  }
}

module.exports = { refreshMetrics, useQualityMetricsCompletedSwr, useLatestQualityMetricsSwr, useQualityMetricsCompletedNonSwr };

