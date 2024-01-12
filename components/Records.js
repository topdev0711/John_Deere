import React, {useState} from "react";
import {Card} from "react-bootstrap";
import Paginator from "./Paginator";
import Spacer from "./Spacer";

const moveToTopOfPage = () => window.scrollTo(0,0);
const NoRecords = ({recordType}) =>
  <div align="center" id='no-records'>
    <Spacer height="20px" />
    <Card.Text className="text-muted"><i>No {recordType}s found</i></Card.Text>
  </div>

const RecordList = ({records}) => records.map(card => <div>{card}<Spacer height="10px" /></div>)

const Records = ({records, recordType}) => {
  moveToTopOfPage();
  if (!records.length) return <NoRecords recordType={recordType}/>

  const [ page, setPage ] = useState(1);
  const maxResults = 10;
  const maxPages = Math.ceil(records.length / maxResults) || 1;
  const isPaginated = maxPages > 1;
  const currentPage = maxPages >= page ? page : 1;
  const displayRecords = records.slice((page - 1) * maxResults, ((page || 1) * maxResults));

  return (
    <div key={`${recordType}-Records`}>
      <RecordList records={displayRecords}/>
      <Spacer height="36px" />
      { isPaginated && <Paginator currentPage={currentPage} totalPages={maxPages} onChange={page => setPage(page)}/> }
    </div>
  );
}

export default Records;
