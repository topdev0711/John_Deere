const edlApiHelper = require('../../../src/utilities/edlApiHelper');
const conf = require('../../../conf');
const config = conf.getConfig();

jest.mock('node-fetch', () => require('fetch-mock-jest').sandbox())
const fetch = require('node-fetch')
jest.mock('cache-manager');

const mockCache = {
  get: async () => {},
  set: async () => {}
};

const error = 'some error';
const failedResponse = {
  status: 400,
  body: { message: error }
};

describe('edlApiHelper tests', () => {
  beforeEach(() => {
    jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue(mockCache);
  });

  afterEach(() => {
    fetch.mockReset();
  });

  it('should get using baseurl', async () => {
    const response = {
      status: 200,
      body: {'data': 'some data'}
    };
    const okta_response = {
      status: 200,
      body: [{access_token: 'some-token'}]
    };
    fetch
      .mock('http://fake-get-url', response)
      .mock(`${config.oktaOAuthUrl}/v1/token`, okta_response);

    const result = await edlApiHelper.get('http://fake-get-url');

    expect(result).toEqual({data: 'some data'});
    expect(fetch).toHaveFetchedTimes(2);
    expect(fetch).toHaveFetchedTimes(1, 'http://fake-get-url');
    expect(fetch).toHaveFetchedTimes(1, `${config.oktaOAuthUrl}/v1/token`);
  });

  it('should return error from get url', () => {
    const okta_response = {
      status: 200,
      body: [{access_token: 'some-token'}]
    };
    fetch
      .mock('http://fake-get-url', failedResponse)
      .mock(`${config.oktaOAuthUrl}/v1/token`, okta_response);

    return expect(edlApiHelper.get('http://fake-get-url')).rejects.toThrow('error');
  });

  it('should make a delete request', async () => {
    const response = {
      status: 200,
      body: {'data': 'some data'}
    };
    const okta_response = {
      status: 200,
      body: [{access_token: 'some-token'}]
    };
    fetch
      .mock('http://fake-get-url', response)
      .mock(`${config.oktaOAuthUrl}/v1/token`, okta_response);

    const result = await edlApiHelper.apiDelete('http://fake-get-url');

    expect(result).toEqual(undefined);
    expect(fetch).toHaveFetchedTimes(2);
    expect(fetch).toHaveFetchedTimes(1, 'http://fake-get-url');
    expect(fetch).toHaveFetchedTimes(1, `${config.oktaOAuthUrl}/v1/token`);
  });

  it('should return error attempting to delete', () => {
    fetch
      .mock('http://fake-get-url', failedResponse)
      .mock(`${config.oktaOAuthUrl}/v1/token`, failedResponse);

    return expect(edlApiHelper.get('http://fake-get-url')).rejects.toThrow('error');
  });

  it('should make a create request', async () => {
    const response = {
      status: 200,
      body: {'data': 'some data'}
    };
    const okta_response = {
      status: 200,
      body: [{access_token: 'some-token'}]
    };
    fetch
      .mock('http://fake-get-url', response)
      .mock(`${config.oktaOAuthUrl}/v1/token`, okta_response);

    const result = await edlApiHelper.post('http://fake-get-url', {data: 'some data'});

    expect(result).toEqual({data: 'some data'});
    expect(fetch).toHaveFetchedTimes(2);
    expect(fetch).toHaveFetchedTimes(1, 'http://fake-get-url');
    expect(fetch).toHaveFetchedTimes(1, `${config.oktaOAuthUrl}/v1/token`);
  });

  it('should return error attempting to create', () => {
    fetch
      .mock('http://fake-get-url', failedResponse)
      .mock(`${config.oktaOAuthUrl}/v1/token`, failedResponse);
    return expect(edlApiHelper.post('http://fake-get-url', {data: 'some data'})).rejects.toThrow('error');
  });

  it('should make a post request with content type', async () => {
    const response = {
      status: 200,
      body: {'data': 'some data'}
    };
    const okta_response = {
      status: 200,
      body: [{access_token: 'some-token'}]
    };
    fetch
      .mock('fake-post-url', response)
      .mock(`${config.oktaOAuthUrl}/v1/token`, okta_response);

    const result = await edlApiHelper.postWithContentType('fake-post-url', {data: 'some data'});

    expect(result).toEqual({data: 'some data'});
    expect(fetch).toHaveFetchedTimes(2);
    expect(fetch).toHaveFetchedTimes(1, `${config.oktaOAuthUrl}/v1/token`);
  });

  it('should return error from okta url', () => {
    fetch
      .mock('fake-get-url', failedResponse)
      .mock('https://johndeere.oktapreview.com/oauth2/ausazr82rqSWEnxwI0h7/v1/token', failedResponse);

    return expect(edlApiHelper.get('fake-get-url')).rejects.toThrow('error');
  });

  it('should get jwt from cache if available', async () => {
    const localCache = {
      get: jest.fn().mockResolvedValue('fake-token'),
      set: jest.fn()
    };
    jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue(localCache);

    const response = {
      status: 200,
      body: {'data': 'some data'}
    };
    const okta_response = {
      status: 200,
      body: [{access_token: 'some-token'}]
    };

    fetch
      .mock('fake-get-url', response)
      .mock(`${config.oktaApiBaseUrl}/oauth2/v1/token`, okta_response);
    //when
    await edlApiHelper.get('fake-get-url');
    //then
    expect(fetch).toHaveFetchedTimes(1);
    expect(localCache.get).toBeCalledTimes(1);
    expect(localCache.get).toBeCalledWith('edlHelperJWT');
  });

  it('should getComponents using baseurl', async () => {
      const okta_response = {
        status: 200,
        body: [{access_token: 'some-token'}]
      };
      const response = {
        status: 200,
        body: {'data': 'some data'}
      };

      fetch
        .mock(`${config.oneCloudUrl}fake-url6`, response)
        .mock(`${config.oneCloudOktaOAuthUrl}/v1/token`, okta_response);


    const result = await edlApiHelper.getApplications('fake-url6',['ADGroup1']);

    expect(result).toEqual({data: 'some data'});
    expect(fetch).toHaveFetchedTimes(2);
    expect(fetch).toHaveFetchedTimes(1, `${config.oneCloudOktaOAuthUrl}/v1/token`);
    expect(fetch).toHaveFetchedTimes(1, 'https://onecloudapis2-devl.deere.com/fake-url6');
  });

  it('should construct query ', async () => {
    const custodianOptions = ['ADGroup1','ADGroup2','ADGroup3']
    const result = await edlApiHelper.constructQuery(custodianOptions);
    return expect(result).toEqual('{q0:applications{name authorizations(roles:\"product_developer\",racfId:\"ADGroup1\"){subject} isDeleted applicationEnvironments{location} buisinessApplicationName configurationItems{assignmentGroup supportGroup shortDescription comments} teamPdl},q1:applications{name authorizations(roles:\"product_developer\",racfId:\"ADGroup2\"){subject} isDeleted applicationEnvironments{location} buisinessApplicationName configurationItems{assignmentGroup supportGroup shortDescription comments} teamPdl},q2:applications{name authorizations(roles:\"product_developer\",racfId:\"ADGroup3\"){subject} isDeleted applicationEnvironments{location} buisinessApplicationName configurationItems{assignmentGroup supportGroup shortDescription comments} teamPdl}}')
  });

  it('should return empty construct query if no custodian options found ', async () => {
    const custodianOptions = []
    const result = await edlApiHelper.constructQuery(custodianOptions);
    return expect(result).toEqual("{}")
  });


  it('should return error from getComponents url', () => {
    fetch
      .mock(`${config.oneCloudUrl}fake-url5`, failedResponse)
      .mock(`${config.oneCloudOktaOAuthUrl}/v1/token`, failedResponse);

    return expect(edlApiHelper.getApplications('fake-url5', ["ADGroup1"])).rejects.toThrow('error');
  });

  it('should return error from okta url for getComponents', () => {
    const okta_response = {
      status: 200,
      body: [{access_token: 'some-token'}]
    };

    fetch
      .mock(`${config.oneCloudUrl}fake-url4`, failedResponse)
      .mock(`${config.oneCloudOktaOAuthUrl}/v1/token`, okta_response);

    return expect(edlApiHelper.getApplications('fake-url4', ["ADGroup1"])).rejects.toThrow('error');
  });

  it('should get onecloud_jwt from cache if available', async () => {
    const localCache = {
      get: jest.fn().mockResolvedValue('fake-token'),
      set: jest.fn()
    };
    jest.spyOn(conf, 'getRedisCacheManager')
        .mockResolvedValue(localCache);

    const response = {
      status: 200,
      body: {'hello': 'world'}
    };

    const okta_response = {
      status: 200,
      body: [{access_token: 'some-token'}]
    };
    fetch
      .mock(`${config.oneCloudUrl}fake-url`, response)
      .mock(`${config.oneCloudOktaOAuthUrl}/v1/token`, okta_response);

    await edlApiHelper.getApplications('fake-url', ["ADGroup1"]);
    expect(fetch).toHaveFetchedTimes(1);
    expect(localCache.get).toBeCalledTimes(1);
    expect(localCache.get).toBeCalledWith('onecloud_jwt');
    expect(fetch).toHaveFetchedTimes(1, 'https://onecloudapis2-devl.deere.com/fake-url');
  });

  it('should return error from okta url for getApplication', () => {
    fetch
      .mock(`${config.oneCloudUrl}fake-url2`, failedResponse)
      .mock(`${config.oneCloudOktaOAuthUrl}/v1/token`, failedResponse);

    return expect(edlApiHelper.getApplications('fake-url2', [])).rejects.toThrow('error');
  });

  it('should return error from create application url', () => {
    fetch
      .mock(`${config.oneCloudUrl}fake-url1`, failedResponse)
      .mock(`${config.oneCloudOktaOAuthUrl}/v1/token`, failedResponse);

    return expect(edlApiHelper.createApplication('fake-url1', 'some-app')).rejects.toThrow('error');
  });

  it('should return error from okta url for create application', () => {
    fetch
      .mock(`${config.oneCloudUrl}fake-urls`, failedResponse)
      .mock(`${config.oneCloudOktaOAuthUrl}/v1/token`, failedResponse);

    return expect(edlApiHelper.createApplication('fake-urls', 'some-app')).rejects.toThrow('error');
  });

  it('should make a create application request', async () => {
    const response = {
      status: 200,
      body: {'data': 'some data'}
    };

    const okta_response = {
      status: 200,
      body: [{access_token: 'some-token'}]
    };
    fetch
      .mock(`${config.oneCloudUrl}fake-url/`, response)
      .mock(`${config.oneCloudOktaOAuthUrl}/v1/token`, okta_response);

    const body = {"name": "test-application", "assignment_group": "ASSIGNMENT_GROUP", "authorizations": [{"authorization_type": "api", "role": "product_developer", "subject": "ADGROUP"}], "business_application_name": "enterprise_data_lake_edl", "business_criticality": "low", "install_status": "Installed", "short_description": "Component Tag Test", "support_group": "SUPPORT_GROUP", "team_notification_pdl": "TEAM@NOTIFICATIONPDL.COM"};
    const result = await edlApiHelper.createApplication('fake-url/', body);
    expect(result).toEqual({data: 'some data'});
    expect(fetch).toHaveFetchedTimes(2);
    expect(fetch).toHaveFetchedTimes(1, `${config.oneCloudOktaOAuthUrl}/v1/token`);
    expect(fetch).toHaveFetchedTimes(1, 'https://onecloudapis2-devl.deere.com/fake-url/');
  });

  it('should make a edit application request', async () => {
    const response = {
      status: 200,
      body: {'data': 'some data'}
    };

    const okta_response = {
      status: 200,
      body: [{access_token: 'some-token'}]
    };
    fetch
      .mock(`${config.oneCloudUrl}application-registry/applications/test-application`, response)
      .mock(`${config.oneCloudOktaOAuthUrl}/v1/token`, okta_response);

    const body = {"name": "test-application", "assignment_group": "ASSIGNMENT_GROUP", "authorizations": [{"authorization_type": "api", "role": "product_developer", "subject": "ADGROUP"}], "business_application_name": "enterprise_data_lake_edl", "business_criticality": "low", "install_status": "Installed", "short_description": "Component Tag Test", "support_group": "SUPPORT_GROUP", "team_notification_pdl": "TEAM@NOTIFICATIONPDL.COM"};
    const result = await edlApiHelper.editApplication('test-application', body);
    expect(result).toEqual({data: 'some data'});
    expect(fetch).toHaveFetchedTimes(2);
    expect(fetch).toHaveFetchedTimes(1, `${config.oneCloudOktaOAuthUrl}/v1/token`);
    expect(fetch).toHaveFetchedTimes(1, 'https://onecloudapis2-devl.deere.com/application-registry/applications/test-application');
  });

  it('should return error from edit application url', () => {
    fetch
      .mock(`${config.oneCloudUrl}application-registry/applications/test-application`, failedResponse)
      .mock(`${config.oneCloudOktaOAuthUrl}/v1/token`, failedResponse);

    return expect(edlApiHelper.editApplication('test-application', 'some-data')).rejects.toThrow('error');
  });

  it('should return error from okta url for edit application', () => {
    const response = {
      status: 200,
      body: [{access_token: 'some-token'}]
    };

    fetch
      .mock(`${config.oneCloudUrl}application-registry/applications/test-app`, failedResponse)
      .mock(`${config.oneCloudOktaOAuthUrl}/v1/token`, response);

    return expect(edlApiHelper.editApplication('test-app', 'some-data')).rejects.toThrow('error');
  });

  it('should get onecloud_jwt from cache if available for createApplication', async() => {
    const response = {
      status: 200,
      body: {'result': 'some data'}
    };

    const localCache = {
      get: jest.fn().mockResolvedValue('some-token'),
      set: jest.fn()
    };
    jest.spyOn(conf, 'getRedisCacheManager').mockResolvedValue(localCache);

    const body = {"name": "test-application", "assignment_group": "ASSIGNMENT_GROUP", "authorizations": [{"authorization_type": "api", "role": "product_developer", "subject": "ADGROUP"}], "business_application_name": "enterprise_data_lake_edl", "business_criticality": "low", "install_status": "Installed", "short_description": "Component Tag Test", "support_group": "SUPPORT_GROUP", "team_notification_pdl": "TEAM@NOTIFICATIONPDL.COM"};
    fetch.mock(`${config.oneCloudUrl}fake-url/`, response);
    await edlApiHelper.createApplication('fake-url/', body);
    expect(fetch).toHaveFetchedTimes(1);
    expect(localCache.get).toBeCalledTimes(1);
    expect(localCache.get).toBeCalledWith('onecloud_jwt');
    expect(fetch).toHaveFetchedTimes(1, 'https://onecloudapis2-devl.deere.com/fake-url/');

  });

  it('should delete the application environments', async () => {
    const response = {
      status: 200,
      body: [{access_token: 'some-token'}]
    };
    fetch
      .mock(`${config.oneCloudUrl}fake-get-url`, response)
      .mock(`${config.oneCloudOktaOAuthUrl}/v1/token`, response);

    await edlApiHelper.deleteOneCloudApi('fake-get-url');

    expect(fetch).toHaveFetchedTimes(2);
    expect(fetch).toHaveFetchedTimes(1, 'https://onecloudapis2-devl.deere.com/fake-get-url');
    expect(fetch).toHaveFetchedTimes(1, `${config.oneCloudOktaOAuthUrl}/v1/token`);
  });


  it('should get the application', async () => {
    const response = {
      status: 200,
      body: [{access_token: 'some-token'}]
    };

    const successResponse = {
      status: 200,
      body: [{access_token: 'Fetched successfully'}]
    };

    fetch
      .mock(`${config.oneCloudUrl}fake-get-url`, successResponse)
      .mock(`${config.oneCloudOktaOAuthUrl}/v1/token`, response);

    await edlApiHelper.getOneCloudApi('fake-get-url');

    expect(fetch).toHaveFetchedTimes(2);
    expect(fetch).toHaveFetchedTimes(1, 'https://onecloudapis2-devl.deere.com/fake-get-url');
    expect(fetch).toHaveFetchedTimes(1, `${config.oneCloudOktaOAuthUrl}/v1/token`);
  });

  it('should throw error in deleting if response not ok', () => {
    const response = {
      status: 200,
      body: [{access_token: 'some-token'}]
    };
    fetch
      .mock(`${config.oneCloudUrl}fake-get-url`, failedResponse)
      .mock(`${config.oneCloudOktaOAuthUrl}/v1/token`, response);

    return expect(edlApiHelper.deleteOneCloudApi('fake-get-url')).rejects.toEqual(new Error('Error in deleting!'));
  });

  it('should return error from get application environments url', () => {
    const response = {
      status: 200,
      body: [{access_token: 'some-token'}]
    };

    fetch
      .mock(`${config.oneCloudUrl}fake-url`, failedResponse)
      .mock(`${config.oneCloudOktaOAuthUrl}/v1/token`, response);

    return expect(edlApiHelper.getOneCloudApi('fake-url')).rejects.toThrow('error');
  });

  it('should call get files api and return successful response', async () => {
    const oktaResponse = {
      status: 200,
      body: [{access_token: 'some-token'}]
    };

    const successResponse = {
      status: 200,
      body: [{access_token: 'Fetched successfully'}]
    };

    fetch
      .mock('http://edl-files.fake-get-url/v1/ingest-requests', successResponse)
      .mock(`${config.oktaOAuthUrl}/v1/token`, oktaResponse);

    await edlApiHelper.getFilesApi('http://edl-files.fake-get-url/v1/ingest-requests');

    expect(fetch).toHaveFetchedTimes(2);
    expect(fetch).toHaveFetchedTimes(1, `${config.oktaOAuthUrl}/v1/token`);
    expect(fetch).toHaveFetchedTimes(1, 'http://edl-files.fake-get-url/v1/ingest-requests');
  });

  it('should call get files api with x-deere-metadata and return successful response', async () => {

    const oktaResponse = {
      status: 200,
      body: [{access_token: 'some-token'}]
    };

    const successResponse = {
      status: 200,
      body: [{access_token: 'Fetched successfully'}]
    };

    fetch
    .mock(`${config.oktaOAuthUrl}/v1/token`, oktaResponse)
    .mock('http://edl-files.fake-get-url/v1/ingest-requests', successResponse);

    const metadata = {
      "dataType": "com.deere.enterprise.datalake.enhance.test_dataset",
      "representation": "com.deere.enterprise.datalake.enhance.test_schema@0.0.1"
    }

    await edlApiHelper.getFilesApi('http://edl-files.fake-get-url/v1/ingest-requests', metadata);

    expect(fetch).toHaveFetchedTimes(2);
    expect(fetch).toHaveFetchedTimes(1, 'http://edl-files.fake-get-url/v1/ingest-requests');
    expect(fetch).toHaveFetchedTimes(1, `${config.oktaOAuthUrl}/v1/token`);
  });

  it('should return error from getFilesApi if api throws error', () => {
    const metadata = {
      "dataType": "com.deere.enterprise.datalake.enhance.test_dataset",
      "representation": "com.deere.enterprise.datalake.enhance.test_schema@0.0.1"
    }

    const response = {
      status: 200,
      body: [{access_token: 'some-token'}]
    };

    fetch
      .mock('http://edl-files.fake-get-url/v1/ingest-requests', failedResponse)
      .mock(`${config.oktaOAuthUrl}/v1/token`, response);

    return expect(edlApiHelper.getFilesApi('http://edl-files.fake-get-url/v1/ingest-requests', metadata)).rejects.toThrow('error');
  });

});
