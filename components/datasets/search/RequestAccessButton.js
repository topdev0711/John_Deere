import {Button, ButtonGroup, OverlayTrigger, Popover} from "react-bootstrap";
import Router from "next/router";
import Spacer from "../../Spacer";
import {MdClear, MdLockOpen} from "react-icons/md";
import React from "react";
import {buildQueryString} from "./CatalogUtility";

const RequestAccessButton = ({selectedDatasets, setSelectedDatasets}) => {
  const handleClick = () => Router.push(`/catalog/permissions/request${buildQueryString(selectedDatasets)}`);
  const RequestAccessButton = <Button onClick={handleClick} size="sm" variant="outline-primary"><MdLockOpen/> Request Access</Button>

  const renderSelectedPermission = () => {
    return ({id, name}) =>
      <li key={id}>
        <span style={{fontSize: 14}}>{name}</span>
        <Spacer height="5px"/>
      </li>;
  }

  const renderSelectedPermissions = () => (selectedDatasets || []).map(renderSelectedPermission);
  const clearSelectedItems = () => setSelectedDatasets([]);

  const requestDetails = <Popover className="catalog-popover" id="popover-positioned-bottom">
    <em className="text-muted">Request access to the following selected datasets.<br/>You can make adjustments on the next step.</em>
    <Spacer height="10px"/>
    <div>
      <Button id="clearSelectedItems" size="sm" variant="secondary" onClick={clearSelectedItems}><MdClear/> Clear Selections</Button>
    </div>
    <hr/>
    {renderSelectedPermissions()}
  </Popover>

  const countButton = <Button size="sm" variant="outline-primary">{selectedDatasets?.length}</Button>
  const countButtonWithOverlay = <OverlayTrigger trigger='click' placement="bottom" overlay={requestDetails}>{countButton}</OverlayTrigger>
  const RenderCount = selectedDatasets?.length ? countButtonWithOverlay : countButton;

  return (
    <ButtonGroup style={{marginRight: '10px'}}>
      {RequestAccessButton}
      {!!selectedDatasets?.length && RenderCount}
    </ButtonGroup>
  )
};

export default RequestAccessButton;
