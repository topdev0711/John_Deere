const documentDao = require('../../../src/data/documentDao');
const searchDao = require('../../../src/data/searchDao');
const documentService = require('../../../src/services/documentService');

jest.mock('../../../src/data/searchDao');
jest.mock('../../../src/data/documentDao');

describe('Document Service Tests', () => {
  it('should get a document from docDb', async () => {
    const sample = { id: 'some document' };
    documentDao.getDocument.mockResolvedValueOnce(sample);
    const response = await documentService.getDocument('collection');

    expect(response).toEqual(sample);
  });

  it('should get documents from docDb', async () => {
    const sample = [{ id: 'some document' }];
    documentDao.getRecords.mockResolvedValueOnce(sample);
    const response = await documentService.getRecords('collection');

    expect(response).toEqual(sample);
  });

  it('should delete collection from docDb', async () => {
    documentDao.deleteCollection.mockResolvedValueOnce(true);
    const response = await documentService.deleteCollection('collection');

    expect(documentDao.deleteCollection).toHaveBeenCalledWith('collection');
    expect(response).toEqual(true);
  });

  it('should require collection to delete collection from docDb', () => {
    return expect(documentService.deleteCollection()).rejects.toThrow('Collection is required.');
  });

  it('Should return true if list collections from docDb successful', async() => {
    //given
    documentDao.listCollections.mockResolvedValueOnce(true);
    //when
    const response = await documentService.listCollections();
    //then
    expect(documentDao.listCollections.mock.calls.length).toBe(1);
    expect(response).toEqual(true);
  });

  it('Should return false if list collections from docDb throws exception', async() => {
    //given
    documentDao.listCollections.mockResolvedValue(false);
    //when
    const response = await documentService.listCollections();
    //then
    expect(documentDao.listCollections.mock.calls.length).toBe(1);
    expect(response).toEqual(false);
  })
});