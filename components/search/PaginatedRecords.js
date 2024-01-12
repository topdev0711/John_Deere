import React from "react";
import Spacer from "../Spacer";
import {Row, Col, Card} from "react-bootstrap";
import Paginator from "../Paginator";
import SmallSpinner from "../SmallSpinner";
import {useRouter} from "next/router";
import {createUrl, defaultSize} from "../searchUtils";

const NoRecords = ({type}) => {
  return (
    <div align="center" id='no-records'>
      <Spacer height="20px" />
      <Card.Text className="text-muted"><em>No {type} found</em></Card.Text>
    </div>
  )
}

const PaginatedRecords = ({type, createRecord, useRecords, useCounts}) => {
  const {push, query, basePath} = useRouter();
  const {size: pageSize = defaultSize, from = 0} = query;
  const {error: recordsError, data: records} = useRecords(query);
  const {error: countError, data: recordCount} = useCounts(query);

  if(recordsError) return <div id={`${type}-error`}>Failed to get {type}: ${recordsError}</div>
  if(countError) return <div id={`${type}-count-error`}>Failed to get {type} count</div>;
  if(!records || (!recordCount && recordCount !== 0)) return <SmallSpinner />;
  if(!records.length) return <NoRecords type={type}/>

  const currentPage = Math.ceil(Number(from)/Number(pageSize)) + 1 || 1;
  const pages = Math.ceil(Number(recordCount)/Number(pageSize));
  const isPaginated = pages > 1;

  const handleChange = page => {
    const from = (page - 1) * pageSize;
    const queryJson = {...query, from, size: pageSize};
    const url = createUrl({ baseUrl: basePath, queryJson});
    push(url);
  }

  return (
    <div key={currentPage}>
      {records.map(createRecord)}
      <Row className="justify-content-center">
        <Col xs={{ span: 'auto' }}>
          <Spacer height="36px" />
          {isPaginated && <Paginator currentPage={currentPage} totalPages={pages} onChange={handleChange}/>}
        </Col>
      </Row>
    </div>
  );
};

export default PaginatedRecords;
