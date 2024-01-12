import {createQueryParams, createUrl} from "../../components/searchUtils";

describe('permission searchUtils tests', () => {
  it('creates query parameter for a single value', () => {
    const queryJson = {anyKey: {name: 'anyValue'}};
    const actualQueryParameter = createQueryParams(queryJson);
    expect(actualQueryParameter).toEqual('anyKey=anyValue');
  });

  it('creates query parameter converting spaces', () => {
    const queryJson = {anyKey: {name: 'any value'}};
    const actualQueryParameter = createQueryParams(queryJson);
    expect(actualQueryParameter).toEqual('anyKey=any%20value');
  });

  it('creates query parameter without undefined values', () => {
    const queryJson = {anyKey: {name: 'anyValue'}, anotherKey: undefined};
    const actualQueryParameter = createQueryParams(queryJson);
    expect(actualQueryParameter).toEqual('anyKey=anyValue');
  });

  it('creates query parameter for an array of values', () => {
    const queryJson = {anyKey: [{name: 'anyValue'}, {name: 'anotherValue'}]};
    const actualQueryParameter = createQueryParams(queryJson);
    expect(actualQueryParameter).toEqual('anyKey=anyValue&anyKey=anotherValue');
  });

  it('creates query parameter for an array of values with no space', () => {
    const queryJson = {anyKey: [{name: 'any value'}, {name: 'another value'}]};
    const actualQueryParameter = createQueryParams(queryJson);
    expect(actualQueryParameter).toEqual('anyKey=any%20value&anyKey=another%20value');
  });

  it('creates query parameters for both value and array of values', () => {
    const queryJson = {anyKey: {name: 'anyValue'}, anotherKey:[{name: 'anotherValue'}, {name: 'differentValue'}]};
    const actualQueryParameter = createQueryParams(queryJson);
    expect(actualQueryParameter).toEqual('anyKey=anyValue&anotherKey=anotherValue&anotherKey=differentValue');
  });

  it('creates the url with no query parameters', () => {
    const actualQueryParameter = createUrl({baseUrl: '/any/url'});
    expect(actualQueryParameter).toEqual('/any/url');
  });

  it('creates the url with empty query parameters', () => {
    const queryJson = {};
    const actualQueryParameter = createUrl({baseUrl: '/any/url', queryJson});
    expect(actualQueryParameter).toEqual('/any/url');
  });

  it('creates the url with query parameters', () => {
    const queryJson = {anyKey: {name: 'anyValue'}, anotherKey: undefined};
    const actualQueryParameter = createUrl({baseUrl: '/any/url', queryJson});
    expect(actualQueryParameter).toEqual('/any/url?anyKey=anyValue');
  });
});
