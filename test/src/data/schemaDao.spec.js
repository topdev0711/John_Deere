const schemaDao = require('../../../src/data/schemaDao');
const dynamo = require('../../../src/data/dynamo');
const s3 = require('../../../src/data/s3');

jest.mock('../../../src/data/s3');
jest.mock('../../../src/data/dynamo');

describe('schema tests', () => {
    const schemaName = 'schema-name';
    const expectedS3Get = { hello: 'world' };

    beforeEach(() => {
        s3.get.mockResolvedValue(expectedS3Get);
        s3.save.mockResolvedValue();
    });

    it('should get a schema',  async () => {
        const schema = await schemaDao.getSchema(schemaName);
        expect(schema).toEqual(expectedS3Get);
    });

    it('should throw error when unable to get schema', () => {
        const expectedError = 'boom';
        s3.get.mockRejectedValue(new Error(expectedError));
        return expect(schemaDao.getSchema(schemaName)).rejects.toThrow(expectedError);
    });

    it('should get schemas', async () => {
        const expectedValue = [expectedS3Get, expectedS3Get];
        const schema = await schemaDao.getSchemas([1,2]);
        expect(schema).toEqual(expectedValue);
    });

    it('should save schema', async () => {
        const schema = { id: '1', name: schemaName };

        await schemaDao.saveSchema(schema);
        return expect(s3.save).toHaveBeenCalledWith(schema);
    });

    describe('discovered schema tests', () => {
      const schema = {id: 'schema'};
      const metadata = {id: 'metadata'};
      let create, parallelScan, scansPromise, query, destroy;

      beforeEach(() => {
          create = jest.fn();

          destroy = jest.fn();

          query = jest.fn(() => ({
            loadAll: jest.fn(() => ({
              exec: jest.fn(() => ({ promise: scansPromise }))
            }))
          }))
          scansPromise = jest.fn().mockResolvedValue([
            {
              Items: [
                {
                  get: () => metadata
                }
              ]
            }
          ]);
          parallelScan = jest.fn(() => ({
            exec : jest.fn(() => ({
              promise: scansPromise
            }))
          }));
          dynamo.define.mockReturnValue({
            create,
            parallelScan,
            query,
            destroy
          });
      });

      it('should delete discovered schema', async () => {
        destroy.mockImplementation((hash, range, cb) => cb());
        await schemaDao.deleteDiscoveredSchema('datasetId', 'schemaId');
        expect(destroy.mock.calls[0][0]).toEqual('datasetId');
        expect(destroy.mock.calls[0][1]).toEqual('schemaId');
      });

      it('should fail to delete discovered schema', () => {
        destroy.mockImplementation((hash, range, cb) => cb('error'));
        const result = schemaDao.deleteDiscoveredSchema('datasetId', 'schemaId');
        return expect(result).rejects.toEqual(new Error('failed to delete discovered schema'));
      });

      it('should save discovered schema  to S3 and metadata to Dynamo table', async () => {
        await schemaDao.saveDiscoveredSchemas([metadata], [schema]);

        expect(s3.save).toHaveBeenCalledWith(schema);
        expect(create).toHaveBeenCalledWith([metadata]);
      });

      it('should throw error if S3 rejects save',  () => {
        s3.save.mockRejectedValue(new Error('Some Error'));

        return expect(schemaDao.saveDiscoveredSchemas([metadata], [schema])).rejects.toThrow('Some Error');
      });

      it('should throw error if Dynamo rejects save', () => {
        dynamo.define.mockReturnValueOnce({
          create: jest.fn(() => Promise.reject('Some Error'))
        });

        return expect(schemaDao.saveDiscoveredSchemas([metadata], [schema])).rejects.toEqual('Some Error');

      });

      it('should return all discovered schema metadata from Dynamo table', async () => {
         expect(await schemaDao.getDiscoveredSchemas()).toEqual([metadata]);
      });

      it('should throw error if dynamo rejects getDiscovered call', () => {
        scansPromise = jest.fn().mockRejectedValue('Boom');
        return expect(schemaDao.getDiscoveredSchemas()).rejects.toEqual(new Error('failed to get discovered schemas'));
      });

      it('should return all discovered schemas for a dataset', async () => {
        expect(await schemaDao.getDiscoveredSchemasForDataset('dataset')).toEqual([metadata]);
      });

      it('should throw error if dynamo rejects getDiscoveredByDataset call', () => {
        scansPromise = jest.fn().mockRejectedValue('Boom');
        const expectedError = new Error('failed to get discovered schemas for dataset');
        return expect(schemaDao.getDiscoveredSchemasForDataset('dataset')).rejects.toEqual(expectedError);
      });
    });
});
