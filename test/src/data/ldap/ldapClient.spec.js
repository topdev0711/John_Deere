const fs = require('fs');
const path = require('path');
const ldap = require('ldapjs');
const ldapClient = require('../../../../src/data/ldap/ldapClient');
const { EventEmitter } = require('events');

const anyName= 'Any Name';
const anyMail = 'anyName@JohnDeere.com';
const anyUsername = 'any123';
const filter = `(&(samaccountname=any-group)(objectclass=group))`;
const ownerAttributes = ['mail', 'sAMAccountName'];

const retryParams =  {
  retries: 1,
  factor: 1,
  minTimeout: 100,
  maxTimeout: 100,
  randomize: true,
};

const config = {
  url: 'ldaps://query.JDNET.DEERE.COM',
  reconnect: true,
  tlsOptions: {
    host: 'query.JDNET.DEERE.COM',
    port: '636',
    checkServerIdentity: (host, cert) => {
      if (cert && !cert.subject && /(IP|DNS|URL)/.test(cert.subjectaltname))
        cert.subject = queryString.parse("")
      return tls.checkServerIdentity(host, cert);
    },
    ca: [fs.readFileSync(path.resolve(__dirname, "../../../../src/data/ldap/corporateroot.cer"))]
  }
};

let ldapSpy, mockBindFn, mockSearchFn;

describe('LdapClient Test Suite', () => {
  beforeEach(() => {
    ldapClient.setRetryParams(retryParams);
    mockBindFn = jest.fn((_username, _password, callbackFn) => callbackFn());
    mockSearchFn = jest.fn((_ldapClient, _dnString, _filterOptions, searchCallbackFn) => searchCallbackFn());
    ldapSpy = jest.spyOn(ldap, 'createClient').mockReturnValue({
      ...config,
      bind: mockBindFn,
      search: mockSearchFn,
      unbind: jest.fn(),
      destroy: jest.fn()
    });
  })

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should throw an error when it fails to bind', async () => {
    mockBindFn.mockImplementation((_username, _password, callbackFn) => callbackFn(new Error('failed to bind')));
    mockSearchFn.mockImplementation((_dnString, _filterOptions, searchCallbackFn) => searchCallbackFn(false, emitter));
    try {
      await ldapClient.search(filter, ownerAttributes);
    } catch (error) {
      expect(error.message).toEqual('failed to bind');
    }
  });

  it('Should successfully get a response', async () => {
    const expected = {
      dn: `CN=${anyName},OU=Corporate-90,OU=Standard,OU=JDUsers,DC=jdnet,DC=deere,DC=com`,
      controls: [],
      sAMAccountName: anyUsername,
      mail: anyMail
    }

    const entry = {
      object: expected,
    };

    const emitter = new EventEmitter();
    mockBindFn.mockImplementation((_username, _password, callbackFn) => callbackFn());
    mockSearchFn.mockImplementation((_dnString, _filterOptions, searchCallbackFn) => searchCallbackFn(false, emitter));

    setTimeout(() => {
      emitter.emit('searchEntry', entry);
      emitter.emit('end', 'ok');
    }, 200);

    const users = await ldapClient.search(filter, ownerAttributes);
    expect(ldapSpy).toHaveBeenCalledTimes(1);
    expect(mockBindFn).toHaveBeenCalledTimes(1);
    expect(users).toContainEqual(expected);
  });

  it('Should return an error when failed to search', async () => {
    mockBindFn.mockImplementation((_username, _password, callbackFn) => callbackFn());
    mockSearchFn.mockImplementation((_dnString, _filterOptions, searchCallbackFn) => searchCallbackFn(new Error('search failed')));

    try {
      await ldapClient.search(filter, ownerAttributes);
    } catch (error) {
      expect(error.message).toEqual('search failed');
    }
  });

  it('Should return an error upon a bad search request', async () => {
    const emitter = new EventEmitter();
    mockBindFn.mockImplementation((_username, _password, callbackFn) => callbackFn());
    mockSearchFn.mockImplementation((_dnString, _filterOptions, searchCallbackFn) => searchCallbackFn(false, emitter));

    setTimeout(() => {
      emitter.emit('error', new Error('search failed on error'));
    }, 40);

    ldapClient.setRetryParams({retries: 0});
    try {
      await ldapClient.search(filter, ownerAttributes);
    } catch (error) {
      expect(error.message).toEqual('search failed on error');
    }
  });
});
