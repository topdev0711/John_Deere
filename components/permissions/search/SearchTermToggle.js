import {MdSortByAlpha, MdTrendingDown} from "react-icons/md";
import {Row, Col, Button} from "react-bootstrap";
import React from "react";
import {useRouter} from "next/router";

const renderRelevanceToggle = (showRelevance, setShowRelevance) => {
  const handleClick = () => setShowRelevance(!showRelevance);
  const relevanceButton = <Button onClick={handleClick} variant="link" size="sm" style={{ marginLeft: '-5px', marginTop: '-5px', textDecoration: 'none' }}>?</Button>;
  return <><MdTrendingDown /> sorted by relevance {relevanceButton}</>
};

const alphaToggle = () => <><MdSortByAlpha/> sorted by type then alphabetically</>

const SearchTermToggle = ({showRelevance, setShowRelevance}) => {
  const {query: {searchTerm}} = useRouter();

  return (
    <Row>
      <Col md={{span: 24}}>
        <div className="float-right text-muted small" style={{marginTop: '-14px', fontStyle: 'italic'}}>
          {!!searchTerm ? renderRelevanceToggle(showRelevance, setShowRelevance) : alphaToggle()}
        </div>
      </Col>
    </Row>
  );

}

export default SearchTermToggle;
