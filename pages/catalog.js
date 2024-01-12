import React from 'react';
import PaginatedDatasetCatalog from '../components/datasets/search/PaginatedDatasetCatalog';
import utils from "../components/utils";
import CatalogRedirect from "../components/datasets/search/CatalogRedirect";
import {useAppContext} from "../components/AppState";

const DatasetCatalogSearch = props => {
  const {toggles, loggedInUser} = useAppContext();
  const toggleEnabled = utils.hasAdGroupToggleEnabled(toggles['jdc.url_paginate_datasets'], loggedInUser.groups) || false;
  return (
    <>
      { toggleEnabled ?
        <CatalogRedirect /> :
        <PaginatedDatasetCatalog{...props} type="Dataset" selectable hidePermissionDetails loadAccessibleDatasets hiddenFilters={["roleType"]}/>
      }
    </>
  )
};

export default DatasetCatalogSearch;
