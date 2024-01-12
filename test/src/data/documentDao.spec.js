const documentDao = require('../../../src/data/documentDao');
const mongoClient = require('../../../src/data/mongoClient');

jest.mock('../../../src/data/mongoClient');

let mockBulkWrite = jest.fn();
let mockFindOne = jest.fn();
let mockInsert = jest.fn();
let mockUpdate = jest.fn();
let mockDrop = jest.fn();
let mockAggregate = jest.fn();

let mockFind = jest.fn(() => (
  {
    toArray: jest.fn()
  }
))
let mockCollection = jest.fn(() => (
  {
    bulkWrite: mockBulkWrite,
    drop: mockDrop,
    findOne: mockFindOne,
    find: mockFind,
    insert: mockInsert,
    updateOne: mockUpdate,
    update: mockUpdate,
    updateMany: mockUpdate
  }
));
let mockDb = jest.fn(() => (
  {
    collection: mockCollection
  }
));
let mockClose = jest.fn();
let mockIsConnected = jest.fn(() => true);


function mongoClientMock() {
  return {
    db: mockDb,
    close: mockClose,
    isConnected: mockIsConnected
  }
}

describe('documentDao tests', () => {
  beforeEach(() => {
    mongoClient.getClient.mockReturnValue(mongoClientMock());
    mockBulkWrite = jest.fn();
    mockFindOne = jest.fn();
    mockInsert = jest.fn();
    mockUpdate = jest.fn();
    mockDrop = jest.fn();
    mockAggregate = jest.fn();
    mockFind = jest.fn(() => (
      {
        toArray: jest.fn()
      }
    ))
    mockCollection = jest.fn(() => (
      {
        aggregate: mockAggregate,
        bulkWrite: mockBulkWrite,
        drop: mockDrop,
        findOne: mockFindOne,
        find: mockFind,
        insert: mockInsert,
        update: mockUpdate,
        updateOne: mockUpdate,
        updateMany: mockUpdate
      }
    ));
    mockDb = jest.fn(() => (
      {
        collection: mockCollection
      }
    ));
    mockClose = jest.fn();
    mockIsConnected = jest.fn(() => true);
  })

  it('should write records to DocDb', async () => {
    const esDatasets = [
      { id: 'Some ds' }
    ];
    const dsInsertStatements = createInsertStatements(esDatasets);

    await documentDao.putRecords('datasets', esDatasets);

    expect(mockCollection).toHaveBeenCalledWith('datasets');
    expect(mockBulkWrite).toHaveBeenCalledWith(dsInsertStatements, { writeConcern: { j: true } });
  });

  it('should handle a failed insert', () => {
    const error = "Boom";
    mockBulkWrite.mockRejectedValueOnce(error);

    return expect(documentDao.putRecords('test', [])).rejects.toThrow('failed to write to DocDb');
  });

  it('should write a record to DocDb', async () => {
    const dataset = { _id: 'Some ds-1', id: 'Some ds', version: 2 };
    const dsInsertStatement = {
      ...dataset,
      _id: `${dataset.id}-${dataset.version}`
    };

    await documentDao.putRecord('datasets', dataset);

    expect(mockCollection).toHaveBeenCalledWith('datasets');
    expect(mockUpdate).toHaveBeenCalledWith({ _id: `${dataset.id}-${dataset.version}` }, dsInsertStatement, {
      upsert: true,
      writeConcern: { j: true }
    });
  });

  it('should handle a failed insert', () => {
    const error = "Boom";
    mockUpdate.mockRejectedValueOnce(error);

    return expect(documentDao.putRecord('test', [])).rejects.toThrow('failed to put record in collection');
  });

  it('should get a record from a collection', async () => {
    const example = { id: 'some ds' };
    mockFindOne.mockResolvedValueOnce(example);

    const result = await documentDao.getDocument('datasets');

    expect(mockCollection).toHaveBeenCalledWith('datasets');
    expect(result).toEqual(example);
  });

  it('should handle failed call for one record', () => {
    const error = "Boom";
    mockFindOne.mockRejectedValueOnce(error);

    return expect(documentDao.getDocument('some collection')).rejects.toThrow('could not get record from collection');
  });

  it('should get records from a collection', async () => {
    const example = [{ id: 'some ds' }];
    mockFind.mockImplementationOnce(() => {
      return {
        toArray: () => example
      }
    });

    const result = await documentDao.getRecords('datasets');

    expect(mockCollection).toHaveBeenCalledWith('datasets');
    expect(result).toEqual(example);
  });

  it('should handle failed call for records', () => {
    const error = "Boom";
    mockFind.mockRejectedValueOnce(error);

    return expect(documentDao.getRecords('some collection')).rejects.toThrow('could not get records from collection');
  });

  it('should get a record from a collection by id and version', async () => {
    const example = { id: 'some ds', version: 3 };
    const id = example.id;
    const version = example.version;
    mockFindOne.mockResolvedValueOnce(example);

    const result = await documentDao.searchByIdAndVersion('datasets', id, version);

    expect(mockCollection).toHaveBeenCalledWith('datasets');
    expect(mockFindOne).toHaveBeenCalledWith({ _id: id + '-' + version });
    expect(result).toEqual(example);
  });

  it('should handle failed call find records', () => {
    mockFindOne.mockRejectedValueOnce(new Error('some error'));

    return expect(documentDao.searchByIdAndVersion('datasets', 'id', 1)).rejects.toThrow('failed to find id and version in collection');
  });

  it('should handle failed call find record', () => {
    const error = "Boom";
    mockFindOne.mockRejectedValueOnce(error);

    return expect(documentDao.searchByIdAndVersion('datasets', 'id', 1)).rejects.toThrow('failed to find id and version in collection');
  });
  it('should get versions of record', async () => {
    const id = 'some ds';
    const example = [
      { id, status: 'PENDING', version: 3 },
      { id, status: 'AVAILABLE', version: 1 },
      { id, status: 'AVAILABLE', version: 2 }
    ];

    const expectedQuery = { id };
    mockFind.mockImplementationOnce(() => (
      {
        toArray: jest.fn(() => example)
      }
    ));
    mockFind.mockResolvedValueOnce(example);
    const result = await documentDao.getVersions('datasets', id);

    expect(mockCollection).toHaveBeenCalledWith('datasets');
    expect(mockFind).toHaveBeenCalledWith(expectedQuery);
    expect(result).toEqual(example);
  });

  it('should handle failed get versions call', async () => {
    const id = 'some ds';
    const error = 'Boom';

    mockFind.mockRejectedValueOnce(error);

    await expect(documentDao.getVersions('datasets', id)).rejects.toThrow('failed to find id in collection');
  });

  it('should update records in collection', async () => {
    mockUpdate.mockResolvedValueOnce('success');
    const id = 'Some id';
    const field = 'some field';
    const updatedObj = { key: true };
    const expectedQuery = {
      id
    };
    const expectedUpdate = {
      $set: {
        [field]: updatedObj
      }
    };
    const result = await documentDao.updatePropertyForId('datasets', id, field, updatedObj);

    expect(mockCollection).toHaveBeenCalledWith('datasets');
    expect(mockUpdate).toHaveBeenCalledWith(expectedQuery, expectedUpdate);
    expect(result).toEqual('success');
  });

  it('should update specific record in collection', async () => {
    mockUpdate.mockResolvedValueOnce('success');
    const id = 'Some id';
    const version = 1;
    const field = 'some field';
    const updatedObj = { key: true };
    const expectedQuery = {
      id,
      version
    };
    const expectedUpdate = {
      $set: {
        [field]: updatedObj
      }
    };
    const result = await documentDao.updatePropertyForId('datasets', id, field, updatedObj, version);

    expect(mockCollection).toHaveBeenCalledWith('datasets');
    expect(mockUpdate).toHaveBeenCalledWith(expectedQuery, expectedUpdate);
    expect(result).toEqual('success');
  });

  it('should handle failed call update by prop', () => {
    const id = 'Some id';
    const field = 'some field';
    const updatedObj = { key: true };
    const error = "Boom";
    mockUpdate.mockRejectedValueOnce(error);

    return expect(documentDao.updatePropertyForId('datasets', id, field, updatedObj)).rejects.toThrow('failed to update property for id');
  });

  it('should drop a collection', async () => {
    const collection = 'some name';
    mockDrop.mockResolvedValueOnce('success');

    const result = await documentDao.deleteCollection(collection);

    expect(mockCollection).toHaveBeenCalledWith(collection);
    expect(mockDrop).toHaveBeenCalledTimes(1);
    expect(result).toEqual('success');
  });

  it('should handle failed drop', () => {
    const collection = 'some name';
    const error = "Boom";
    mockDrop.mockRejectedValueOnce(error);

    return expect(documentDao.deleteCollection(collection)).rejects.toThrow('failed to delete collection');
  });

  describe('get latest records', () => {
    const example = [
      { id: 'some ds', status: 'PENDING', version: 3 },
      { id: 'some ds', status: 'AVAILABLE', version: 1 },
      { id: 'some ds', status: 'AVAILABLE', version: 2 },
      { id: 'some other ds', status: 'AVAILABLE', version: 3 }
    ];
    const idsAndVersions = [
      { _id: { id: 'some id' }, version: 1 }
    ];
    beforeEach(() => {
      mockFind.mockImplementation(() => (
        {
          toArray: jest.fn(() => example)
        }
      ));
      mockAggregate.mockImplementation(() => (
        {
          toArray: jest.fn(() => idsAndVersions)
        }
      ));
    })
    it('should get latest records by status', async () => {
      const statuses = ['AVAILABLE', 'PENDING'];
      const expectedQuery = {
        _id: {
          $in: ['some id-1']
        }
      };
      const expectedAggregate = [
        {
          $sort: { version: -1, status: 1 }
        },
        { $match: { status: { $in: statuses } } },
        {
          $group: {
            _id: { id: "$id", status: "$status" },
            version: { $max: "$version" }
          }
        }
      ];
      const params = {
        statuses
      }
      const result = await documentDao.getLatestRecords('datasets', params);

      expect(mockCollection).toHaveBeenCalledWith('datasets');
      expect(mockAggregate).toHaveBeenCalledWith(expectedAggregate);
      expect(mockFind).toHaveBeenCalledWith(expectedQuery);
      expect(result).toEqual(example);
    });
    it('should get latest records by name', async () => {
      const name = 'some name';
      const expectedQuery = {
        _id: {
          $in: ['some id-1']
        }
      };
      const expectedAggregate = [
        {
          $sort: { version: -1, status: 1 }
        },
        {
          $match: {
            name: /.*some name.*/i,
            status: { $eq: 'AVAILABLE' }
          }
        },
        {
          $group: {
            _id: { id: "$id", status: "$status" },
            version: { $max: "$version" }
          }
        }
      ];
      const params = {
        name
      }
      const result = await documentDao.getLatestRecords('datasets', params);

      expect(mockCollection).toHaveBeenCalledWith('datasets');
      expect(mockAggregate).toHaveBeenCalledWith(expectedAggregate);
      expect(mockFind).toHaveBeenCalledWith(expectedQuery);
      expect(result).toEqual(example);
    });

    it('should get latest records including community name', async () => {
      const community = 'some name';
      const expectedQuery = {
        _id: {
          $in: ['some id-1']
        }
      };
      const expectedAggregate = [
        {
          $sort: { version: -1, status: 1 }
        },
        {
          $match: {
            'classifications.community.name': community,
            status: { $in: ['AVAILABLE', 'REJECTED'] }
          }
        },
        {
          $group: {
            _id: { id: "$id", status: "$status" },
            version: { $max: "$version" }
          }
        }
      ];
      const params = {
        statuses: ['AVAILABLE', 'REJECTED'],
        community
      }
      const result = await documentDao.getLatestRecords('datasets', params);

      expect(mockCollection).toHaveBeenCalledWith('datasets');
      expect(mockAggregate).toHaveBeenCalledWith(expectedAggregate);
      expect(mockFind).toHaveBeenCalledWith(expectedQuery);
      expect(result).toEqual(example);
    });
    it('should get latest records with multiple params', async () => {
      const statuses = ['AVAILABLE', 'PENDING'];
      const name = 'some name';
      const expectedQuery = {
        _id: {
          $in: ['some id-1']
        }
      };
      const expectedAggregate = [
        {
          $sort: { version: -1, status: 1 }
        },
        {
          $match: {
            name: /.*some name.*/i,
            status: { $in: statuses }
          }
        },
        {
          $group: {
            _id: { id: "$id", status: "$status" },
            version: { $max: "$version" }
          }
        }
      ];
      const params = {
        name,
        statuses
      };
      const result = await documentDao.getLatestRecords('datasets', params);

      expect(mockCollection).toHaveBeenCalledWith('datasets');
      expect(mockAggregate).toHaveBeenCalledWith(expectedAggregate);
      expect(mockFind).toHaveBeenCalledWith(expectedQuery);
      expect(result).toEqual(example);
    });

    it('should get latest record by id', async () => {
      const record = example[0];
      mockFindOne.mockImplementationOnce(() => record);
      const expectedQuery = {
        _id: 'some id-1'
      };
      const expectedAggregate = [
        {
          $sort: { version: -1, status: 1 }
        },
        {
          $match: {
            id: record.id,
            status: { $eq: 'AVAILABLE' }
          }
        },
        {
          $group: {
            _id: { id: "$id" },
            version: { $max: "$version" }
          }
        }
      ];
      const result = await documentDao.getLatestRecord('datasets', record.id);

      expect(mockCollection).toHaveBeenCalledWith('datasets');
      expect(mockAggregate).toHaveBeenCalledWith(expectedAggregate);
      expect(mockFindOne).toHaveBeenCalledWith(expectedQuery);
      expect(result).toEqual(record);
    });

    it('should handle no results when retrieving latest records', async () => {
      const statuses = ['AVAILABLE', 'PENDING'];
      mockAggregate.mockImplementation(() => (
        {
          toArray: jest.fn(() => [])
        }
      ));

      const result = await documentDao.getLatestRecords('datasets', 'id', statuses);

      expect(result).toEqual([]);
    });


    it('should handle no result when retrieving latest record', async () => {
      const statuses = ['AVAILABLE', 'PENDING'];
      mockAggregate.mockImplementation(() => (
        {
          toArray: jest.fn(() => [])
        }
      ));

      const result = await documentDao.getLatestRecord('datasets', 'id', statuses);

      expect(result).toEqual(undefined);
    });

    it('should handle too many results', () => {
      const statuses = ['AVAILABLE', 'PENDING'];
      mockAggregate.mockImplementation(() => (
        {
          toArray: jest.fn(() => [{}, {}])
        }
      ));

      return expect(documentDao.getLatestRecord('datasets', 'id', statuses)).rejects.toThrow('failed to get latest record from collection');
    });

    it('should handle error when getting latest records by status', () => {
      const statuses = ['AVAILABLE', 'PENDING'];
      const error = "Boom";
      mockAggregate.mockRejectedValueOnce(error);

      return expect(documentDao.getLatestRecords('datasets', statuses)).rejects.toThrow('failed to get latest records');
    });

    it('should throw error when views not present in the input', async () => {
      return expect(Promise.reject(new Error('No views provided in the input to search permissions'))).rejects.toThrow('No views provided in the input to search permissions');
    });
  });

  describe('updating reference data', () => {
    const collection = 'datasets';
    it('should fail when id is undefined', () => {
      const updateRequest = { name: 'anyReference', update: 'community' };
      const actualResponse = documentDao.updateReferenceData(collection, updateRequest);
      return expect(actualResponse).rejects.toThrow('Update request missing id');
    });

    it('should fail when name is undefined', () => {
      const updateRequest = { id: 'anyData', update: 'community' };
      const actualResponse = documentDao.updateReferenceData(collection, updateRequest);
      return expect(actualResponse).rejects.toThrow('Update request missing name');
    });

    it('should fail when update is undefined', () => {
      const updateRequest = { id: 'anyData', name: 'anyReference' };
      const actualResponse = documentDao.updateReferenceData(collection, updateRequest);
      return expect(actualResponse).rejects.toThrow('Update request missing update');
    });

    it('should give invalid message when updating invalid reference data', () => {
      const updateRequest = { id: 'anyData', name: 'anyReference', update: 'anyType' };
      const actualResponse = documentDao.updateReferenceData(collection, updateRequest);
      return expect(actualResponse).rejects.toThrow('Invalid Reference update type: anyType');
    });

    it('should successfully update reference data', async () => {
      const updateRequest = { id: 'anyData', name: 'anyReference', update: 'community' };
      await documentDao.updateReferenceData(collection, updateRequest);
      expect()
    });
  })
});


function createInsertStatements(records) {
  return records.map(record => {
    return {
      updateOne: {
        filter: {
          _id: record.id + '-' + record.version
        },
        update: {
          $set: {
            ...record,
            _id: record.id + '-' + record.version
          }
        },
        upsert: true
      }
    }
  });
}

