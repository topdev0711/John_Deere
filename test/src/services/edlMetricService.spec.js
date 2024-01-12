const edlMetricService = require('../../../src/services/edlMetricService');
const conf = require('../../../conf').getConfig();
const apiHelper = require('../../../src/utilities/edlApiHelper');
global.fetch =  require('jest-fetch-mock');

jest.mock('../../../src/utilities/edlApiHelper');

const ingestUrl = `${conf.edlFiles}/ingest-requests`;
const deleteUrl = `${conf.edlFiles}/delete-requests`;

const metadata = {
  dataType: 'com.deere.enterprise.datalake.enhance.dataset_for_run_submit',
  representation: 'com.deere.enterprise.datalake.enhance.dataset_for_run_submit@0.0.7',
};

const ingestRequest1 = {
  "requestId": "766720ed-6471-45a4-a09d-5957b6a4c9e6",
  "status": "COMPLETE",
  "errorMessage": "",
  "metaData": {
    "dataType": "com.deere.enterprise.datalake.enhance.dataset_for_run_submit",
    "contentType": "",
    "representation": "com.deere.enterprise.datalake.enhance.dataset_for_run_submit@0.0.7",
    "numberOfRecords": 3,
    "estimatedSize": 0.000007694,
    "startTime": "2021-07-01T14:22:05.127Z",
    "endTime": "2021-07-01T14:26:11.680Z"
  }
};

const ingestRequest2 = {
  "requestId": "774bab86-d5c8-4246-9bb6-d8aeb3518fa1",
  "status": "COMPLETE",
  "errorMessage": "",
  "metaData": {
    "dataType": "com.deere.enterprise.datalake.enhance.dataset_for_run_submit",
    "contentType": "",
    "representation": "com.deere.enterprise.datalake.enhance.dataset_for_run_submit@0.0.7",
    "numberOfRecords": 3,
    "estimatedSize": 0.000002793,
    "startTime": "2021-06-30T14:06:11.763Z",
    "endTime": "2021-06-30T14:12:42.426Z"
  }
}

const ingestRequest3 = {
  "requestId": "fc691a67-fbb6-4be0-9511-a374c4910db0",
  "status": "COMPLETE",
  "errorMessage": "",
  "metaData": {
    "dataType": "com.deere.enterprise.datalake.enhance.dataset_for_run_submit",
    "contentType": "",
    "representation": "com.deere.enterprise.datalake.enhance.dataset_for_run_submit@0.0.7",
    "numberOfRecords": 3,
    "estimatedSize": 0.000002793,
    "startTime": "2021-06-30T12:01:03.170Z",
    "endTime": "2021-06-30T12:07:49.358Z"
  }
}

const ingestLoadHistory = {"requests": [ingestRequest1, ingestRequest2, ingestRequest3]};

const deleteRequest1 = {
  "requestId": "30a038ba-81fe-415e-96e5-3f11c32eb84d",
  "status": "COMPLETE",
  "errorMessage": "",
  "metaData": {
    "dataType": "com.deere.enterprise.datalake.enhance.dataset_for_run_submit",
    "contentType": "",
    "representation": "com.deere.enterprise.datalake.enhance.dataset_for_run_submit@0.0.7",
    "numberOfRecords": 1,
    "startTime": "2021-07-02T09:26:28.173Z",
    "endTime": "2021-07-02T09:30:10.558Z"
  }
};

const deleteRequest2 = {
  "requestId": "158d286a-e0a5-49c9-87fb-9034c477d132",
  "status": "COMPLETE",
  "errorMessage": "",
  "metaData": {
    "dataType": "com.deere.enterprise.datalake.enhance.dataset_for_run_submit",
    "contentType": "",
    "representation": "com.deere.enterprise.datalake.enhance.dataset_for_run_submit@0.0.7",
    "numberOfRecords": 1,
    "startTime": "2021-07-01T14:33:21.624Z",
    "endTime": "2021-07-01T14:36:34.929Z"
  }
};

const deleteRequest3 = {
  "requestId": "eb77b2cf-1d24-40c5-b7d8-a7856ffb3d75",
  "status": "COMPLETE",
  "errorMessage": "",
  "metaData": {
    "dataType": "com.deere.enterprise.datalake.enhance.dataset_for_run_submit",
    "contentType": "",
    "representation": "com.deere.enterprise.datalake.enhance.dataset_for_run_submit@0.0.7",
    "numberOfRecords": 2,
    "startTime": "2021-07-01T14:10:56.691Z",
    "endTime": "2021-07-01T14:14:19.978Z"
  }
};

const deleteLoadHistory = {"requests": [deleteRequest1, deleteRequest2, deleteRequest3]};

const noIngestLoadHistory = { requests: [] };
const noDeleteLoadHistory = { requests: [] };

describe('edlMetrics Service tests for both Ingest & Delete Requests', () => {

  beforeEach(() => {
    apiHelper.getFilesApi.mockResolvedValueOnce(ingestLoadHistory).mockResolvedValueOnce(deleteLoadHistory);
  });

  it('should fetch ingest request & delete request for load history sorted by startTime', async () => {
    const actualLoadHistory = await edlMetricService.getLoadHistory(metadata);

    const expectedLoadHistory = [ deleteRequest1, deleteRequest2, ingestRequest1, deleteRequest3, ingestRequest2, ingestRequest3];
    expect(actualLoadHistory).toEqual(expectedLoadHistory);

    expect(apiHelper.getFilesApi).toHaveBeenCalledWith(ingestUrl, metadata);
    expect(apiHelper.getFilesApi).toHaveBeenCalledWith(deleteUrl, metadata);
  });

  it('should have ingest requests only when delete request call fails', async () => {
    apiHelper.getFilesApi.mockReset();
    apiHelper.getFilesApi.mockResolvedValueOnce(ingestLoadHistory).mockRejectedValueOnce(new Error('Unable to fetch load history'));
    const actualLoadHistory = await edlMetricService.getLoadHistory(metadata);
    expect(actualLoadHistory).toEqual(ingestLoadHistory.requests);
  });
});

describe('edlMetrics Service tests for Ingest Requests', () => {
  beforeEach(() => {
    apiHelper.getFilesApi.mockResolvedValueOnce(ingestLoadHistory).mockResolvedValueOnce(noDeleteLoadHistory);
  });

  it('should return ingest load history if delete load history not present', async () => {
    const actualLoadHistory = await edlMetricService.getLoadHistory(metadata);
    expect(actualLoadHistory).toEqual(ingestLoadHistory.requests);
    expect(apiHelper.getFilesApi).toHaveBeenCalledWith(ingestUrl, metadata);
    expect(apiHelper.getFilesApi).toHaveBeenCalledWith(deleteUrl, metadata);
  });
});

describe('edlMetrics Service tests for Delete Requests', () => {
  beforeEach(() => {
    apiHelper.getFilesApi.mockResolvedValueOnce(noIngestLoadHistory).mockResolvedValueOnce(deleteLoadHistory);
  });

  it('should return delete load history if ingest load history not present', async () => {
    const actualLoadHistory = await edlMetricService.getLoadHistory(metadata);
    expect(actualLoadHistory).toEqual(deleteLoadHistory.requests);
    expect(apiHelper.getFilesApi).toHaveBeenCalledWith(ingestUrl, metadata);
    expect(apiHelper.getFilesApi).toHaveBeenCalledWith(deleteUrl, metadata);
  });
});

describe('edlMetrics Service tests for empty requests', () => {
  beforeEach(() => {
    apiHelper.getFilesApi.mockResolvedValueOnce(noIngestLoadHistory).mockResolvedValueOnce(noDeleteLoadHistory);
  });

  it('should return \" No Load History found \" if neither ingest nor delete request present', async () => {
      const aggregatedResult = [ ...noIngestLoadHistory.requests, ...noDeleteLoadHistory.requests ];
      const actualLoadHistory = await edlMetricService.getLoadHistory(metadata);
      expect(actualLoadHistory).toEqual(aggregatedResult);
  });
});
