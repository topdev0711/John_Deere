import CatalogSearch from "../../components/CatalogSearch";
import React from "react";
import {useAppContext} from "../../components/AppState";
import utils from "../../components/utils";
import PermissionsCatalogSearch from "../../components/permissions/search/PermissionsCatalogSearch";
import PermissionsRedirect from "../../components/permissions/search/PermissionsRedirect";

const filters = ['phase', 'category', 'custodian', 'myDataset'];
const Permissions = props => {
  const globalContext = useAppContext();
  let toggleEnabled = utils.hasAdGroupToggleEnabled(globalContext.toggles['jdc.paginate_permissions'], globalContext.loggedInUser.groups) || false;
  return (
    <>
      { toggleEnabled ?
        <PermissionsRedirect /> :
        <CatalogSearch {...props} type="Permission" hideRegisterDataset hideRequestAccess hideDatasetDetails hiddenFilters={filters}/>
      }
    </>
  )
}

export default Permissions;
