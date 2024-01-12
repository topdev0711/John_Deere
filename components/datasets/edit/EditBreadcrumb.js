import {Breadcrumb, BreadcrumbItem} from "react-bootstrap";
import React from "react";
import {isAvailable} from '../../../src/services/statusService';
import {useAppContext} from "../../AppState";
import utils from "../../utils";

const styles = {
  breadcrumb: {
    marginLeft: '-17px',
    marginTop: '-17px'
  }
};

const EditBreadcrumb = ({dataset}) => {
  const {toggles, loggedInUser} = useAppContext();
  const toggleEnabled = utils.hasAdGroupToggleEnabled(toggles['jdc.url_paginate_datasets'], loggedInUser.groups) || false;

  const detailsURL = `/catalog/datasets/detail?id=${dataset.id}&version=${dataset.version}`;
  const route = toggleEnabled ? '/datasets?from=0&size=20' : '/catalog';
  return (
    <Breadcrumb style={styles.breadcrumb}>
      <BreadcrumbItem href={route}>Catalog</BreadcrumbItem>
      <BreadcrumbItem active={isAvailable(dataset)} href={detailsURL}>Dataset Details</BreadcrumbItem>
      <BreadcrumbItem active>Edit</BreadcrumbItem>
    </Breadcrumb>
  )
};

export default EditBreadcrumb;
