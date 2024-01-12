import utils from '../../components/utils';
import uuid from 'uuid';
global.fetch = require('jest-fetch-mock');

const datasets = [{
  id: 'foo',
  name: 'Foo',
  version: 1,
  status: 'AVAILABLE',
  schemas: [{ id: 'schema1'}]
}, {
  id: 'foo',
  name: 'Foo',
  version: 2,
  status: 'AVAILABLE',
  schemas: [{ id: 'schema1'}]
}, {
  id: 'foo',
  name: 'Foo',
  version: 3,
  status: 'PENDING',
  schemas: [{ id: 'schema1'}]
}]

const username = 'cl98561'

const object = {
  createdBy: 'someUser',
  status: 'AVAILABLE',
  approvals: [{ status: 'APPROVED' }, { status: 'REJECTED' }, { status: 'PENDING' }]
}

const createItem = () => {
  return {
    name: 'Comic Books',
    environmentName: 'com.deere.foo.bar.comics',
    sourceDatasets: [{ name: 'foo bar' }],
    approvals: [{ ignoredKey: 'Comic Books', details: [{ name: 'Mount', values: ['/mnt/foo/bar'] }] }],
    description: 'comic books are great',
    custodian: 'EDL_TEAM',
    documentation: 'Some great docs!',
    phase: 'Enhance'
  }
}

describe('util tests', () => {

  afterEach(() => {
    fetch.resetMocks();
  })

  afterEach(() => {
    fetch.resetMocks();
  })

  it('verify origin dataset found', () => {
    const result = utils.findOriginatingDatasetForSchema('schema1', datasets)
    expect(result).toEqual(datasets[1])
  })

  it('should format date', () => {
    expect(utils.formatDate('2019-06-10T16:45:31.446Z')).toEqual('10 Jun 2019')
  });

  it('should format timeframe', () => {
    const obj = {
      startDate: '2019-06-10T16:45:31.446Z',
      endDate: '2019-06-11T16:45:31.446Z'
    }
    expect(utils.formatTimeframe(obj)).toEqual('10 Jun 2019  to  11 Jun 2019')
  });

  it('should format timeframe with no end date', () => {
    const obj = {
      startDate: '2019-06-10T16:45:31.446Z',
      endDate: null
    }
    expect(utils.formatTimeframe(obj)).toEqual('10 Jun 2019')
  });

  it('should find latest versions available which are not deleted', () => {
    const items = [
      { id: 'id1', status: 'AVAILABLE', version: 1 },
      { id: 'id1', status: 'DELETED', version: 2 },
      { id: 'id2', status: 'AVAILABLE', version: 3 },
      { id: 'id2', status: 'REJECTED', version: 4 },
    ]
    expect(utils.findLatestNonDeleted(items)).toEqual([
      { id: 'id1', status: 'AVAILABLE', version: 1 },
      { id: 'id2', status: 'REJECTED', version: 4 }
    ])
  });

  it('should format fields to include id', () => {
    const uuidReturn = 'uuid';
    const uuidSpy = jest.spyOn(uuid, 'v4').mockReturnValue(uuidReturn);
    expect(utils.formatSchemas([{ fields: [{ name: 'foo' }] }])).toEqual([{ fields: [{ name: 'foo', id: 'uuid' }] }]);
    uuidSpy.mockRestore();
  })

  it('should handle undefined schemas arr when formatting', () => {
    expect(utils.formatSchemas(undefined)).toEqual([]);
  })

  it('should group environment approval details by names', () => {
    const input = {
      name: "CPS PEGA",
      values: [
        { name: "Mount Location", value: "Some mount" },
        { name: "Mount Location", value: "data type mount" },
        { name: "Mount Location", value: "Some other mount" },
        { name: "Documentation", value: "any documentation" }
      ]
    }
    const expectedOutput = {
      name: "CPS PEGA",
      values: {
        'Mount Location': [
          { name: "Mount Location", value: "Some mount" },
          { name: "Mount Location", value: "data type mount" },
          { name: "Mount Location", value: "Some other mount" },
        ],
        'Documentation': [
          { name: "Documentation", value: "any documentation" }
        ]
      }
    }

    expect(utils.groupValuesByName(input)).toEqual(expectedOutput)
  })

  it('should return empty objects for grouping environment approval details by names when no values are included', () => {
    const input = {
      name: "CPS PEGA"
    }
    const expectedOutput = {}

    expect(utils.groupValuesByName(input)).toEqual(expectedOutput)
  });

  describe('linkedDatasets tests', () => {
    it('should linkedDatasets when schema is linked in another dataset', () => {
      const datasets = [{id: 'some ds'},{linkedSchemas: ['someLinkedSchema--1']}];
      const schema = {id: 'someLinkedSchema--1'};
      expect(utils.linkedDatasets(datasets, schema).length>0).toEqual(true);
    });
    it('should not linkedDatasets when schema is linkedFrom', () => {
      const datasets = [{linkedSchemas: ['someLinkedSchema--1']}];
      const schema = {id: 'someSchema'};
      expect(utils.linkedDatasets(datasets, schema).length>0).toEqual(false);
    });
    it('should handle linkedSchemas as object', () => {
      const datasets = [{linkedSchemas: [{id:'someLinkedSchema--1'}]}];
      const schema = {id: 'someLinkedSchema--1'};
      expect(utils.linkedDatasets(datasets, schema).length>0).toEqual(true);
    });
  });

  it('should call the unlock function and return a non locked record', () => {
    const input = {...createItem(), version: 1, id: 'id', lockedBy: 'some user'};
    const { lockedBy, ...expected } = input;
    expect(utils.removeAndUnlockRecord(input)).toEqual(expected);
  });

  it('should not call the unlock function and return the same record if the record is undefined', () => {
    expect(utils.removeAndUnlockRecord( undefined)).toEqual(undefined);
  });

  it('should call the unlock function and return a non locked record', () => {
    const input = {...createItem(), version: 1, id: 'id', lockedBy: 'some user'};
    const { lockedBy, ...expected } = input;
    expect(utils.removeAndUnlockRecord(input)).toEqual(expected);
  });

  it('should not call the unlock function and return the same record if the record is undefined', () => {
    expect(utils.removeAndUnlockRecord( undefined)).toEqual(undefined);
  });

  describe('hide edit button tests', () => {
    it('should not hide when object has key loggedInUserIsCreator, no username, and is pending', () => {
      expect(utils.hideEditButton({...object, status: 'PENDING', loggedInUserIsCreator: true, approvals: []}, null)).toEqual(false)
    });

    it('should hide when object has key loggedInUserIsCreator that is false, no username, and is pending', () => {
      expect(utils.hideEditButton({...object, status: 'PENDING', loggedInUserIsCreator: false, approvals: []}, null)).toEqual(true)
    });

    it('should not allow editing when there is an approved approval and object is not rejected', () => {
      expect(utils.hideEditButton({...object, status: 'PENDING', approvals: [{status: 'APPROVED'}, {status: 'PENDING'}]})).toEqual(true)
    });

    it('should allow editing when item is rejected, is created by user, and there is an approved approval', () => {
      expect(utils.hideEditButton({...object, status: 'REJECTED', createdBy: username}, username)).toEqual(false)
    });
    it('should not hide editing when object status is available', () => {
      expect(utils.hideEditButton(object, username)).toEqual(false);
    });

    it('should hide editing when object status is approved', () => {
      const approvedObj = { ...object, status: 'APPROVED' };
      expect(utils.hideEditButton(approvedObj, username)).toEqual(true);
    });

    it('should not hide editing when object status is rejected and user created the object', () => {
      const rejectedObj = { ...object, status: 'REJECTED', createdBy: username, approvals: [{ status: 'REJECTED' }] };
      expect(utils.hideEditButton(rejectedObj, username)).toEqual(false);
    });

    it('should hide editing when object status is rejected and user did not creat the object', () => {
      const rejectedObj = { ...object, status: 'REJECTED' };
      expect(utils.hideEditButton(rejectedObj, username)).toEqual(true);
    });

    it('should hide editing when an approval is approved', () => {
      const approvedObj = { ...object, status: 'PENDING', createdBy: username };
      expect(utils.hideEditButton(approvedObj, username)).toEqual(true);
    });

    it('should not hide editing when object is created by user and status is pending or rejected', () => {
      const pendingObj = { ...object, createdBy: username, status: 'PENDING', approvals: [] };
      const rejectedObj = { ...object, createdBy: username, status: 'REJECTED', approvals: [] };

      expect(utils.hideEditButton(pendingObj, username)).toEqual(false);
      expect(utils.hideEditButton(rejectedObj, username)).toEqual(false);
    });

    it('should hide editing when object is created by user and status is Approved', () => {
      const approvedgObj = { ...object, createdBy: username, status: 'APPROVED', approvals: [] };
      expect(utils.hideEditButton(approvedgObj, username)).toEqual(true);
    });

    it('should hide editing when object is not created by user and status is pending or rejected', () => {
      const pendingObj = { ...object, status: 'PENDING', approvals: [] };
      const rejectedObj = { ...object, status: 'REJECTED', approvals: [] };

      expect(utils.hideEditButton(pendingObj, username)).toEqual(true);
      expect(utils.hideEditButton(rejectedObj, username)).toEqual(true);
    });

    it('should hide editing if there is an empty object', () => {
      const obj = {};
      expect(utils.hideEditButton(obj, username)).toEqual(true);
    });

    it('should hide editing if there is nothing passed', () => {
      expect(utils.hideEditButton()).toEqual(true);
    });

    it('should hide editting if a pending version of the object exists and it is not the object being accessed', () => {
      const currentObj = { ...object, status: 'AVAILABLE', approvals: [] };
      expect(utils.hideEditButton(currentObj, username, true)).toEqual(true);
    });
    it('should not hide editting if a pending version of the object exists and it is the object being accessed by the creator', () => {
      const currentObj = { ...object, status: 'PENDING', approvals: [], loggedInUserIsCreator: true };
      expect(utils.hideEditButton(currentObj, username, true)).toEqual(false);
    });
    it('should hide editting if a latestAvailableVersion is lockedBy a different user', () => {
      const currentObj = { ...object, status: 'AVAILABLE', approvals: [], lockedBy: 'user123' };
      expect(utils.hideEditButton(currentObj, username)).toEqual(true);
    });
    it('should not hide editting if a latestAvailableVersion is lockedBy same user Legacy', () => {
      const currentObj = { ...object, status: 'AVAILABLE', approvals: [], lockedBy: 'cl98561' };
      expect(utils.hideEditButton(currentObj, username)).toEqual(false);
    });
    it('should not hide editting if a latestAvailableVersion is lockedBy same user', () => {
      const currentObj = { ...object, status: 'AVAILABLE', approvals: [], lockedBy: {username: 'cl98561' }};
      expect(utils.hideEditButton(currentObj, username)).toEqual(false);
    });
    it('should hide edit button if pending publish path approval', () => {
      const approvals = [{
        status: 'PENDING',
        publishedPath: '/'
      }];
      const currentObj = { ...object, status: 'PENDING', approvals };
      expect(utils.hideEditButton(currentObj, username)).toEqual(true);
    });
    it('should hide edit button if pending unpublish path approval', () => {
      const approvals = [{
        status: 'PENDING',
        unpublishedPath: '/'
      }];
      const currentObj = { ...object, status: 'PENDING', approvals };
      expect(utils.hideEditButton(currentObj, username)).toEqual(true);
    });
    it('should NOT hide edit button if approved path approval', () => {
      const approvals = [{
        status: 'APPROVED',
        unpublishedPath: '/'
      }];
      const currentObj = { ...object, status: 'AVAILABLE', approvals };
      expect(utils.hideEditButton(currentObj, username)).toEqual(false);
    });
  });

  describe('determine relevance tests', () => {
    it('should determine relevance for single search criteria without quotes', () => {
      const items = [
        { name: 'Item Bar Foo Baz', description: 'Desc1', children: [{ name: 'Child1', description: 'ChildDesc1' }] },
        { name: 'Item Foo Bar Baz', description: 'Desc2', children: [{ name: 'Child2', description: 'ChildDesc2' }] }
      ]

      const criteria = '"Item Foo Bar Baz"'

      const result = utils.determineRelevance(items, criteria)

      expect(result[0].relevance.score).toEqual(0)
      expect(result[1].relevance.score).toEqual(22)
    })

    it('should have zero relevance when no search criteria', () => {
      const items = [
        { name: 'Item Foo Bar Baz', description: 'Desc1', children: [{ name: 'Child1', description: 'ChildDesc1' }] },
        { name: 'Item Foo Baz Bar', description: 'Desc2', children: [{ name: 'Child2', description: 'ChildDesc2' }] }
      ]

      const criteria = ' '

      const result = utils.determineRelevance(items, criteria)

      expect(result[0].relevance.score).toEqual(0)
      expect(result[1].relevance.score).toEqual(0)
    })

    it('should add relevance based on defined weights', () => {
      const items = [
        createItem(),
        { ...createItem(), name: 'Comic Books DC' }
      ]

      const criteria = '"Comic Books"'

      const result = utils.determineRelevance(items, criteria)

      expect(result[0].relevance.score).toEqual(31)
      expect(result[1].relevance.score).toEqual(21)
    })

    it('should add relevance based on undefined weights', () => {
      const items = [
        createItem(),
        { ...createItem(), name: 'Books Comic' }
      ]

      const criteria = '"Comic Books" foo bar'

      const result = utils.determineRelevance(items, criteria)

      expect(result[0].relevance.score).toEqual(85)
      expect(result[1].relevance.score).toEqual(63)
    })

    it('should handle multiple occurrences of same term', () => {
      const items = [
        createItem(),
        createItem()
      ]

      const criteria = 'Comic Comic'

      const result = utils.determineRelevance(items, criteria)

      expect(result[0].relevance.score).toEqual(25)
      expect(result[1].relevance.score).toEqual(25)
    })
  })

  describe('isEqualObject tests', () => {
    it('should return true if two object have same values and keys', () => {
      const a = {id: '1', fields: [{name: 'a field'}], obj: {key: 'value'}};
      const b = {id: '1', fields: [{name: 'a field'}], obj: {key: 'value'}};
      expect(utils.isEqualObject(a,b)).toEqual(true);
    });

    it('should not return true if two object have same ID even with different values', () => {
      const a = {id: '1', fields: [{name: 'a field'}], obj: {key: 'value'}};
      const b = {id: '1', fields: [{name: 'a new field'}], obj: {key: 'diff'}, newKey: '1'};
      expect(utils.isEqualObject(a,b)).toEqual(false);
    });

    it('should return false if two object do not have same values and keys', () => {
      const a = {id: '1', fields: [{name: 'a field'}], obj: {key: 'value'}};
      const b = {id: '2', fields: [{name: 'a  diff field'}], obj: {key: 'value'}};
      expect(utils.isEqualObject(a,b)).toEqual(false);
    });

    it('should only compare keys that are not passed in to omit', () => {
      const a = {id: '1', fields: [{name: 'a field'}], obj: {key: 'value'}};
      const b = {id: '1', fields: [{name: 'a diff field'}], obj: {key: 'value'}};
      expect(utils.isEqualObject(a,b, ['fields'])).toEqual(true);
    });
  });

  describe('expiration and effective tests', () => {
    const now = new Date();
    const earlyThisMorning = new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0,0);
    const oneYearFromNow = new Date(now.getFullYear()+1, 1, 1,1,0,0,0);
    const twoYearsFromNow = new Date(now.getFullYear()+2, 1, 1,1,0,0,0);

    const permissions = [
      {id: '1', version: 1, startDate: '2019-02-10T19:21:09.838Z', endDate: '2019-02-10T19:21:09.838Z'},
      {id: '2', version: 1, startDate: oneYearFromNow.toISOString(), endDate: twoYearsFromNow.toISOString()},
      {id: '3', version: 1, startDate: '2019-02-10T19:21:09.838Z', endDate: now.toISOString()},
      {id: '4', version: 1, startDate: earlyThisMorning.toISOString(), endDate: undefined},
      {id: '5', version: 1, startDate: '2019-05-13T19:21:08.838Z', endDate: undefined},
    ];

    it('should return true if perm is expired', () => {
      expect(utils.isPermExpired(permissions[0])).toEqual(true);
    });

    it('should return false if perm is not expired', () => {
      expect(utils.isPermExpired(permissions[1])).toEqual(false);
      expect(utils.isPermExpired(permissions[3])).toEqual(false);
    });

    it('should return true if perm is effective', () => {
      expect(utils.isPermEffective(permissions[3])).toEqual(true);
      expect(utils.isPermEffective(permissions[4])).toEqual(true);
    });

    it('should return false if perm is not effective', () => {
      expect(utils.isPermEffective(permissions[1])).toEqual(false);
      expect(utils.isPermEffective(permissions[2])).toEqual(false);
    });
  });

  describe('local storage tests', () => {
    const previousObject = {
      id: 'id',
      name: 'test',
      description: 'somthing',
      classifications: [
        {id: 1},
        {id: 2},
        {id: 3, tags: []},
      ],
      status: 'AVAILABLE',
      schemas: []
    };

    const newObject = {
      id: 'id',
      name: 'test new',
      description: 'new',
      classifications: [
        {id: 1},
        {
          id: 3,
          tags: [{id: 'tag'}, { id: 'tag2'}, { id: 'tag3'}],
          countries: [
            { id: 1, name: 'us' },
            { id: 2, name: 'uk' },
          ]
        },
      ],
      status: 'AVAILABLE',
      schemas: [{id: 1}]

    };

    const expectedObject = {
      added: {
        classifications: {
          '1':
              {
                tags: [ { id: 'tag'}, { id: 'tag2'}, { id: 'tag3'} ],
                countries: [
                  { id: 1, name: 'us' },
                  { id: 2, name: 'uk' },
                ],
              }
        },
        schemas: { '0': newObject.schemas[0] }
      },
      deleted: {
        classifications: {
          '2': null
        },
      },
      updated: {
        name: newObject.name,
        description: newObject.description,
        classifications: { '1': { id: 3 }}
      }
    };

    beforeEach(() => {
      const localStorageMock = {
        getItem: jest.fn(() => { return JSON.stringify(expectedObject) }),
        setItem: jest.fn(),
        clear: jest.fn()
      };
      global.localStorage = localStorageMock;
    })
    it('should only save new changes', () => {
      utils.setLocalStorage(true, previousObject, newObject);

      expect(localStorage.setItem).toHaveBeenCalledWith(newObject.id, JSON.stringify(expectedObject));
    });

    it('should get updated record based on local storage changes', () => {
      global.localStorage.getItem.mockReturnValue(JSON.stringify(expectedObject));
      const updated = utils.getLocalStorageItem('id', previousObject);

      expect(localStorage.getItem).toHaveBeenCalledWith('id');
      expect(updated).toEqual(newObject);
    });

    it('should recursively add changes', () => {
      const stored = {
        added: {
          clientId: null,
          sources: [],
          empty: {},
          classifications: {
            0: {
              countriesRepresented: {
                0: {name: "ALL", id: "c29bf721-aeb7-4ac9-ab79-110fb9beb8cb", label: "ALL"},
                1: {name: "AS", id: "4e26bf07-3dea-4354-83e1-efcdf7c88043", label: "American Samoa"}
              }
            }
          }
        },
        deleted: {
          classifications: {
            0: {
              tags: {
                0: null
              }
            }
          }
        },
        updated: {
          classifications: {
            0: {
              list: {
                0: 'test'
              }
            }
          }
        }
      };
      const expected = {
        clientId: null,
        sources: [],
        empty: {},
        classifications: [
          {
            id: 1,
            countriesRepresented: [
              {name: "ALL", id: "c29bf721-aeb7-4ac9-ab79-110fb9beb8cb", label: "ALL"},
              {name: "AS", id: "4e26bf07-3dea-4354-83e1-efcdf7c88043", label: "American Samoa"}
            ],
            tags: [],
            list: ['test']
          }
        ]
      };
      const previous = {
        classifications: [
          {
            id: 1,
            tags: ['something']
          }
        ]
      };
      global.localStorage.getItem.mockReturnValue(JSON.stringify(stored));

      const updated = utils.getLocalStorageItem('id', previous);

      expect(localStorage.getItem).toHaveBeenCalledWith('id');
      expect(updated).toEqual(expected);
    });
  });

  it('should create gicp options based on recommended and deprecated values', () => {
    //given
    const gicp = [{"name":"Personal & Confidential","id":"cbd24f83-5a0a-4230-b1d0-7525047663ad","enabled":false},{"name":"Unclassified","id":"159d753e-c245-43eb-ba2b-7d29cb436c3d","enabled":false}, {"name":"Highly Confidential","id":"7ef24262-e13e-43a6-b0e9-dcfc0638a46f","enabled":true},{"name":"Confidential","id":"5f48ffda-9c01-4416-89e9-326d0a7bcd3c","enabled":true},{"name":"Company Use","id":"e43046c8-2472-43c5-9b63-e0b23ec09399","enabled":true},{"name":"Public","id":"10710b7a-7391-4860-a18d-1d7edc746fe7","enabled":true}];
    const expectedGicpOp =  [{"groupLabel":"Recommended","options":[{"id":"7ef24262-e13e-43a6-b0e9-dcfc0638a46f","name":"Highly Confidential"},{"id":"5f48ffda-9c01-4416-89e9-326d0a7bcd3c","name":"Confidential"},{"id":"e43046c8-2472-43c5-9b63-e0b23ec09399","name":"Company Use"},{"id":"10710b7a-7391-4860-a18d-1d7edc746fe7","name":"Public"}]},{"groupLabel":"Deprecated","options":[{"id":"cbd24f83-5a0a-4230-b1d0-7525047663ad","name":"Personal & Confidential"},{"id":"159d753e-c245-43eb-ba2b-7d29cb436c3d","name":"Unclassified"}]}]
    //when
    const gicpOptions = utils.createGicpOpts({getDeprecated : true});
    //then
    expect(gicpOptions).toEqual(expectedGicpOp);
  });

  it('Should get approvals by type', async () => {
    //given
    const mockApprovals = [];
    const user = {
      username: 'blah'
    };
    fetch.mockImplementation(() => {
      return new Promise((resolve) =>
          resolve({
            ok : true,
            json: () => {
              return mockApprovals;
            }
          })
      );
    });
    //when
    const datasetApprovals = await utils.getApprovalsByType('datasets', user);
    //then
    expect(mockApprovals).toEqual(datasetApprovals);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/datasets/approvals', {
      credentials: 'same-origin',
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      user
    });
  });

  it('Should return empty array if get approvals by type fails', async() => {
    //given
    const user = {
      username: 'blah'
    };
    fetch.mockImplementation(() => {
      return new Promise((resolve, reject) =>
          reject({
            ok : false,
            json: () => {
              return 'blow';
            }
          })
      );
    });
    //when
    const permissionApprovals = await utils.getApprovalsByType('permissions', user);
    //then
    expect([]).toEqual(permissionApprovals);
  });

  it('Should return expected date from days given', () => {
    let currentDate = new Date();
    let days = '3';
    let expectedDate = new Date(currentDate);
    expect(currentDate).toEqual(expectedDate);
    expectedDate.setDate(currentDate.getDate() - days);

    const date = utils.getPriorDate(days);
    expect(date).toEqual(expectedDate.toLocaleDateString('en-US'));
    expect(utils.getPriorDate()).toEqual(new Date().toLocaleDateString('en-US'));
  });
});