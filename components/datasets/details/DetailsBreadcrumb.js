// Unpublished Work © 2022 Deere & Company.
import {Breadcrumb, BreadcrumbItem} from "react-bootstrap";
import React from "react";
import {useRouter} from 'next/router'
import {useAppContext} from "../../AppState";
import utils from "../../utils";

const DetailsBreadcrumb = () => {
  const {toggles, loggedInUser} = useAppContext();
  const toggleEnabled = utils.hasAdGroupToggleEnabled(toggles['jdc.url_paginate_datasets'], loggedInUser.groups) || false;
  const route = toggleEnabled ? '/datasets?from=0&size=20' : '/catalog';
  const router = useRouter();
  const root = router.ref ? {name: 'Approvals', route: '/approvals'} : {name: 'Catalog', route};

  return (
    <Breadcrumb style={{marginLeft: '-17px', marginTop: '-17px'}}>
      <BreadcrumbItem href={root.route}>{root.name}</BreadcrumbItem>
      <BreadcrumbItem active={true}>details</BreadcrumbItem>
    </Breadcrumb>
  )
}

export default DetailsBreadcrumb;
