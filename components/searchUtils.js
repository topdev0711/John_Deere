const getEntries = queryJson => Object.entries(queryJson) || [];
const isDefined = ([_, value]) => !!value;
const getElementQueryParams = ([key, value]) => key === 'visibility' ? `${key}=${encodeURIComponent(value?.id || value)}`: `${key}=${encodeURIComponent(value?.name || value)}`;
const getArrayQueryParams = ([key, values]) => values.map(value =>`${key}=${encodeURIComponent(value?.name || value)}`).join('&');
const concatenateFilters = ([key, value]) => Array.isArray(value) ? getArrayQueryParams([key, value]) : getElementQueryParams([key, value])
const replaceSpaces = str => str.split(' ').join('%20');
const createQueryParams = (queryJson) => getEntries(queryJson).filter(isDefined).map(concatenateFilters).map(replaceSpaces).join('&');

const createUrl = ({baseUrl, queryJson}) => {
  const newQueryParams = queryJson ? createQueryParams(queryJson): '';
  const queryParams = newQueryParams ? `?${newQueryParams}` : '';
  return `${baseUrl}${queryParams}`;
};

const defaultSize = 20;

module.exports = { createQueryParams, createUrl, defaultSize };
