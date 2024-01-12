import React from "react";
import Spacer from "../../Spacer";
import {Row, Col, Card} from "react-bootstrap";
import Paginator from "../../Paginator";
import SmallSpinner from "../../SmallSpinner";
import {useRouter} from "next/router";
import {useGetPermissionsSwr} from "../../../apis/permissions";
import {createUrl, defaultSize} from "../../searchUtils";
import PermissionCard from "./PermissionCard";

const NoRecords = () => {
  return (
    <div align="center" id='no-records'>
      <Spacer height="20px" />
      <Card.Text className="text-muted"><em>No Permissions found</em></Card.Text>
    </div>
  )
}

const Records = ({records, showRelevance}) => records.map( (record, index) => <div key={`record-${index}`}><PermissionCard rawRecord={record} showRelevance={showRelevance}/> <Spacer height="10px" /></div>);

const PaginatedRecords = ({showRelevance}) => {
  const {push, query, basePath} = useRouter();
  const {size: pageSize = defaultSize, from = 0} = query;
  const {error: permissionsError, data: records} = useGetPermissionsSwr({...query, type: 'search'});
  const {error: countError, data: recordCount} = useGetPermissionsSwr({...query, count:'true', type: 'search'});

  if(permissionsError) return <div id='permissions-error'>Failed to get permissions: ${permissionsError}</div>
  if(countError) return <div id={'permissions-count-error'}>Failed to get permissions count</div>;
  if(!records || !recordCount) return <SmallSpinner />;
  if(!records.length) return <NoRecords />

  const currentPage = Math.ceil(Number(from)/Number(pageSize)) + 1 || 1;
  const pages = Math.ceil(Number(recordCount.groups)/Number(pageSize));
  const isPaginated = pages > 1;

  const handleChange = page => {
    const from = (page - 1) * pageSize;
    const queryJson = {...query, from, size: pageSize};
    const url = createUrl({ baseUrl: basePath, queryJson});
    push(url);
  }

  return (
    <div key={currentPage}>
      <Records key={`records=${currentPage}`}records={records} showRelevance={showRelevance} />
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
