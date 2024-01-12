// Unpublished Work © 2022 Deere & Company.
import {Nav, NavItem, NavLink, Spinner} from "react-bootstrap";
import React from "react";
import {FaAsterisk} from "react-icons/fa";

const getCount = (arrays) => {
  const cleanedArrays = arrays.filter(array => !!array);
  const hasElements = cleanedArrays.some(array => array.length);
  if(!hasElements) return '';
  const count = cleanedArrays.reduce((acc, current) => acc + current.length, 0);
  return `(${count})`;
}

const getSchemaCount = (arrays) => {
  const cleanedArrays = arrays.filter(array => !!array);
  const hasElements = cleanedArrays.some(array => array.length);
  if(!hasElements) return '';
  const nameSet = new Set();
  cleanedArrays.forEach(element => {
    if(element.length > 0) {
      element.forEach(innerEle => nameSet.add(innerEle.name));
    }
  });
  const count = nameSet.size;
  return `(${count})`;
}

const getChangeBody = (name, arrays) => `${name} ${getCount(arrays)}`;
const createSpinner = () => <Spinner className="spinner-border uxf-spinner-border-sm" animation="border" role="status" />
const ChangeIndicator = () => <>&nbsp;<FaAsterisk style={{fontSize: '10px', marginTop: '-4px', color: '#e69d00'}}/></>;

const DetailsTabsNav = ({dataset, didClassificationsChange, didSchemasChange, resources, retrievedViewPermissions, retrievedSchemas, allSchemas, showDiff}) => {
  const {classifications, discoveredSchemas, discoveredTables = [], sources=[], views = []} = dataset;
  const schemaCount = retrievedSchemas ? getSchemaCount([allSchemas, discoveredSchemas]) : createSpinner();
  const schemaChangeIndicator = showDiff && didSchemasChange && <ChangeIndicator/>;
  const renderViews = () => retrievedViewPermissions ? getChangeBody('Views' , [views]) : createSpinner();
  const classificationText = getChangeBody('Classifications', [classifications]);
  const classificationChangeIndicator = showDiff && didClassificationsChange && <ChangeIndicator/>

  const navs = {
    files: () => 'Files',
    schemas: () => <>Schemas {schemaCount}{schemaChangeIndicator}</>,
    views: renderViews,
    discoveredTables: () => `Tables (${discoveredTables.length})`,
    edlUsage: () => 'EDL Usage',
    sources: () => `Sources (${sources.length})`,
    classifications: () => <>{classificationText}{classificationChangeIndicator}</>
  };

  const hasResource = ([key]) => resources.includes(key);
  const renderNav = ([key, value]) => <NavItem key={key} className="d-none d-lg-block"><NavLink id={`${key}-nav`} eventKey={key}>{value()}</NavLink></NavItem>;
  const renderNavs = Object.entries(navs).filter(hasResource).map(renderNav);
  return <Nav key='details-nav' size="sm" variant="tabs" className="uxf-nav-tabs-medium">{renderNavs}</Nav>;
};

export default DetailsTabsNav;
