import utils from '../../utils';

export const buildQueryString = (selectedItems = []) => {
  const query = selectedItems.map(s => `sources=${s.id}`).join('&');
  return query && query.length ? `?${query}&ref=datasets` : '?ref=datasets';
}

export const sortItems = (datasets = []) => {
  const copyDatasets = [...datasets];
  copyDatasets.sort((a, b) => b.relevance.score - a.relevance.score);
  return copyDatasets;
}

export const sortDatasets = (datasets = [], searchCriteria = []) => {
  return sortItems(utils.determineRelevance(datasets, searchCriteria)).filter(ds => searchCriteria.length === 0 || ds.relevance.score);
}

export const createFilterQuery = (searchText = '', searchFilter = {}, isPublicToggleEnabled = false, publicId ='') => {
  const queryParams = [`isPublicToggleEnabled=${isPublicToggleEnabled}`, `publicId=${publicId}`];
  if (searchText) queryParams.push(`text=${searchText.replace(' ', '+')}`);
  Object.keys(searchFilter).filter(key => searchFilter[key] && searchFilter[key].length)
    .forEach(key => {
      searchFilter[key].forEach(filter => {
        queryParams.push(`${key}=${encodeURIComponent(filter.name)}`);
        (key == 'myDataset') ? queryParams.push(`createdBy=${filter.createdBy}`) : '';
      })
    });
  return queryParams.length ? '?'.concat(queryParams.join('&')) : '';
}

export const createPaginatedQuery = (searchText = '', searchFilter = {}, page, numberOfRecords, isPublicToggleEnabled = false, publicId ='') => {
  const queryParams = [`from=${(page-1) * numberOfRecords }`, `size=${numberOfRecords}`, `isPublicToggleEnabled=${isPublicToggleEnabled}`, `publicId=${publicId}`];

  if (searchText) queryParams.push(`searchTerm=${searchText.replace(' ', '+')}`);

  Object.keys(searchFilter).filter(key => searchFilter[key] && searchFilter[key].length)
    .forEach(key => {
      searchFilter[key].forEach(filter => {
        queryParams.push(`${key}=${encodeURIComponent(filter.name)}`);
        (key === 'myDataset') ? queryParams.push(`createdBy=${filter.createdBy}`) : '';
      })
    });
  return '?' + queryParams.join('&');
}
