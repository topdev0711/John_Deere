import React, {useState} from "react";
import {Col, Row} from "react-bootstrap";
import hash from 'object-hash';
import Spacer from "../../Spacer";
import CreatePermissionButton from "./CreatePermissionButton";
import PaginatedRecords from "./PaginatedRecords";
import Search from "./Search";
import SearchTermToggle from "../../search/SearchTermToggle";
import {useRouter} from "next/router";

const buttonStyle = {marginTop: '2px', whitespace: 'nowrap'};

const PermissionsCatalogSearch = ({hidden}) => {
  const {query} = useRouter();

  const [showRelevance, setShowRelevance] = useState(false);

  return (
    <div hidden={hidden} id={'permissions-catalog-search-root'}>
      <Row>
        <Col md={{span: 12}}>
          <h2>Permissions Catalog</h2>
          <Spacer height='15px'/>
        </Col>
        <Col><span className="float-md-right" style={buttonStyle}><CreatePermissionButton /></span></Col>
      </Row>
      <Spacer height='8px'/>
      <Search key={hash(query)}/>
      <SearchTermToggle showRelevance={showRelevance} setShowRelevance={setShowRelevance}/>
      <PaginatedRecords showRelevance={showRelevance}/>
    </div>
  );
};

export default PermissionsCatalogSearch;
