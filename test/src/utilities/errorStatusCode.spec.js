const errorStatusCode = require('../../../src/utilities/errorStatusCode');
const { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND, UNPROCESSABLE_ENTITY } = require('http-status-codes');

describe('edlApiHelper tests', () => {
    it('should return forbidden ', async () => {
        const errorMessage = {message: 'Permission denied'};
        const result = errorStatusCode.getStatusCode(errorMessage);
        expect(result).toEqual(FORBIDDEN);
    });

    it('should return bad request', async () => {
        const errorMessage = {message: 'child'};
        const result = errorStatusCode.getStatusCode(errorMessage);
        expect(result).toEqual(BAD_REQUEST);
    });

    it('should return bad request', async () => {
        const errorMessage = {message: 'Invalid query parameter'};
        const result = errorStatusCode.getStatusCode(errorMessage);
        expect(result).toEqual(BAD_REQUEST);
    });

    it('should be unprocessable error when field is missing from json', async () => {
        const errorMessage = {message: 'Update request missing'};
        const result = errorStatusCode.getStatusCode(errorMessage);
        expect(result).toEqual(UNPROCESSABLE_ENTITY);
    });

    it('should be unprocessable when bod field value is invalid', async () => {
        const errorMessage = {message: 'Invalid Reference update type'};
        const result = errorStatusCode.getStatusCode(errorMessage);
        expect(result).toEqual(UNPROCESSABLE_ENTITY);
    });

    it('should return not found when the resource does not exist', () => {
        const error = new Error('subCommunity does not exist');
        const actualStatusCode = errorStatusCode.getStatusCode(error);
        expect(actualStatusCode).toEqual(NOT_FOUND);
    });

    it('should return internal server error ', async () => {
        const errorMessage = {message: 'Some other random error'};
        const result = errorStatusCode.getStatusCode(errorMessage);
        expect(result).toEqual(INTERNAL_SERVER_ERROR);
    });
});
