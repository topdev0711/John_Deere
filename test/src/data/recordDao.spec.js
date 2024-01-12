const { createFunction } = require('./dynamoTestUtils');
const dynamo = require('../../../src/data/dynamo');
const recordDao = require('../../../src/data/recordDao')

jest.mock('../../../src/data/dynamo');

describe('recordDao tests', () => {
    let model;
    const getModel = (result) => ({
        create: jest.fn(),
        update: jest.fn(),
        tableName: () => 'table',
        get: () => result,
        parallelScan: createFunction(['where', 'in', 'exec', 'promise'], result),
        query: createFunction(['loadAll', 'exec', 'promise'], result)
    });

    beforeEach(() => model = getModel());

    it('should get by group', async () => {
        const roleWhere = jest.fn();
        const roleValue = jest.fn();
        const groupWhere = jest.fn();
        const groupValue = jest.fn();
        const roleWhere2 = jest.fn();
        const roleValue2 = jest.fn();
        const clientWhere = jest.fn();
        const clientValue = jest.fn();
        const modelWithArgs = {
            parallelScan: () => {
                return {
                    where: () => {
                        return {
                            in: () => {
                                return {
                                    where: roleWhere.mockReturnValue({
                                        equals: roleValue.mockReturnValue({
                                            where: groupWhere.mockReturnValue({
                                                in: groupValue.mockReturnValue({
                                                    where: roleWhere2.mockReturnValue({
                                                        equals: roleValue2.mockReturnValue({
                                                            where: clientWhere.mockReturnValue({
                                                                in: clientValue.mockReturnValue({
                                                                    exec: () => {
                                                                        return {
                                                                            promise: () => Promise.resolve([{Items: [{get: () => ({any: 'Foo'})}]}])
                                                                        }
                                                                    }
                                                                })
                                                            })
                                                        })
                                                    })
                                                })
                                            })
                                        })
                                    })
                                }
                            }
                        }
                    }
                }
            }
        };
        const result = await recordDao.getRecords(modelWithArgs, ['AVAILABLE'], ['FOO'], ['BAR']);
        expect(result).toEqual([{any: 'Foo'}]);
        expect(roleWhere.mock.calls[0][0]).toEqual('roleType');
        expect(roleValue.mock.calls[0][0]).toEqual('human');
        expect(groupWhere.mock.calls[0][0]).toEqual('group');
        expect(groupValue.mock.calls[0][0]).toEqual(['FOO']);
        expect(roleWhere2.mock.calls[0][0]).toEqual('roleType');
        expect(roleValue2.mock.calls[0][0]).toEqual('system');
        expect(clientWhere.mock.calls[0][0]).toEqual('clientId');
        expect(clientValue.mock.calls[0][0]).toEqual(['BAR']);
    });

    it('should save a record', async () => {
        const anyRecord = { name: 'Foo' };
        await recordDao.saveRecord(anyRecord, model);
        expect(model.create).toBeCalledWith(anyRecord);
    });

    it('should lock a record', async () => {
        await recordDao.lockRecord('record123', 1, 'user123', model);
        expect(model.update).toBeCalledWith({
            id: 'record123',
            version: 1,
            lockedBy: 'user123'
        });
    });

    it('should unlock a record', async () => {
        await recordDao.unlockRecord('record123', 1, model);
        expect(model.update).toBeCalledWith({
            id: 'record123',
            version: 1,
            lockedBy: null
        });
    });

    it('should return all records', async () => {
        const dynamoResult = [{
            Items: [{
                get:() => ({id: 'foo', version: 1, status: 'AVAILABLE'})
            }, {
                get:() => ({id: 'foo', version: 2, status: 'PENDING'})
            }]
        }];
        const model = getModel(dynamoResult);
        const actualResult = await recordDao.getRecords(model);

        const expectedResult = [{id: 'foo', version: 1, status: 'AVAILABLE'}, {id: 'foo', version: 2, status: 'PENDING'}];
        expect(actualResult).toEqual(expectedResult);
    });

    it('should return only latest version for each status', async () => {
        const dynamoResult = [{
            Items: [{
                get: () => ({ id: 'foo', version: 2, status: 'AVAILABLE' })
            }, {
                get: () => ({ id: 'foo', version: 1, status: 'AVAILABLE' })
            }, {
                get: () => ({ id: 'foo', version: 3, status: 'DELETED' })
            }, {
                get: () => ({ id: 'foo', version: 4, status: 'DELETED' })
            }]
        }];
        const model = getModel(dynamoResult);
        dynamo.define.mockReturnValue(model);

        const actualDatasets = await recordDao.getRecords(model);

        const expectedDatasets = [
            { id: 'foo', version: 2, status: 'AVAILABLE'},
            { id: 'foo', version: 4, status: 'DELETED'}
        ];
        expect(actualDatasets).toStrictEqual(expectedDatasets);
    });

    it('should return all records when flag is set to true', async () => {
      const dynamoResult = [{
          Items: [{
              get: () => ({ id: 'foo', version: 2, status: 'AVAILABLE' })
          }, {
              get: () => ({ id: 'foo', version: 1, status: 'AVAILABLE' })
          }, {
              get: () => ({ id: 'foo', version: 3, status: 'DELETED' })
          }, {
              get: () => ({ id: 'foo', version: 4, status: 'DELETED' })
          }]
      }];
      const model = getModel(dynamoResult);
      dynamo.define.mockReturnValue(model);

      const actualDatasets = await recordDao.getRecords(model, null, null, null, true);

      const expectedDatasets = [
          { id: 'foo', version: 2, status: 'AVAILABLE'},
          { id: 'foo', version: 1, status: 'AVAILABLE' },
          { id: 'foo', version: 3, status: 'DELETED' },
          { id: 'foo', version: 4, status: 'DELETED'}
      ];
      expect(actualDatasets).toStrictEqual(expectedDatasets);
  });

    it('should return a record', async () => {
        const expectedResponse = { name: 'foo' };
        const model = getModel(Promise.resolve({ get: () => expectedResponse }));
        const actualResult = await recordDao.getRecord('id', 1, model);
        expect(actualResult).toEqual(expectedResponse);
    });

    it('should return all versions of a record id', async () => {
        const dynamoResponse = [{
            Items: [{
                get: () => ({ id: 'foo', version: 1 })
            }, {
                get: () => ({ id: 'foo', version: 2 })
            }]
        }];
        const model = getModel(Promise.resolve(dynamoResponse));
        dynamo.define.mockReturnValue(model);

        const actualDatasets = await recordDao.getVersions('foo', model);

        const expectedDatasets = [{ id: 'foo', version: 1 }, { id: 'foo', version: 2 }];
        expect(actualDatasets).toStrictEqual(expectedDatasets);
    });

    it('should throw an error when it fails to get a record from the dataStore', () => {
        const model = getModel(Promise.reject(new Error('someError')));
        dynamo.define.mockReturnValue(model);
        const actualDatasets = recordDao.getRecord('foo', 'anyVersion', model);
        return expect(actualDatasets).rejects.toThrow(new Error('Failed to retrieve record foo:anyVersion'));
    });

    it('should throw an error when requested record does not exist', () => {
        const dynamoResponse = null;
        const model = getModel(Promise.resolve(dynamoResponse));
        dynamo.define.mockReturnValue(model);
        const actualDatasets = recordDao.getRecord('foo', 'anyVersion', model);
        return expect(actualDatasets).rejects.toThrow(new Error('Could not find record foo:anyVersion'));
    });

    it('should throw error when it fails to get records from the dataStore', () => {
        const model = getModel(Promise.reject(new Error('someError')));
        dynamo.define.mockReturnValue(model);
        const actualDatasets = recordDao.getVersions('foo', model);
        return expect(actualDatasets).rejects.toThrow(new Error('Failed to retrieve records for id'));
    });

    it('should not throw an error when requested record does not exist (new record happy path)', () => {
        const dynamoResponse = [];
        const model = getModel(Promise.resolve(dynamoResponse));
        dynamo.define.mockReturnValue(model);
        const actualDatasets = recordDao.getVersions('foo', model);
        return expect(actualDatasets).resolves.toEqual([]);
    });
});
