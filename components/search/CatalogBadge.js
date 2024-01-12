import {Badge} from "react-bootstrap";
import {MdClear} from "react-icons/md";
import React from "react";

const CatalogBadge = ({label, onClick, isHidden}) => {
  return (
    <span hidden={isHidden}>
      <Badge className="catalog-badge" variant="secondary" pill onClick={onClick}>
        <span><MdClear/>&nbsp;&nbsp;{label}</span>
      </Badge>
    </span>
  );
}

export default CatalogBadge;
