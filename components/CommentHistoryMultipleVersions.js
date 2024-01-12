import CommentHistory from "./CommentHistory";
import { MdHistory } from "react-icons/md";
import Accordion from "./Accordion";
import React, { useState } from "react";
import { Button } from 'react-bootstrap';

const styles = {
  accordionMargins: {
    marginTop: '0px',
    marginBottom: '20px',
    marginLeft: '5px',
    marginRight: '5px'
  },
  loadButton: {
    marginTop: '30px',
  }
};

const commentId = 'details-comment-history';

const getCommentHistory = ({ id, version, commentHistory, approvals }) => {
  return (
    <div key={`${id}-${version}`} style={styles.accordionMargins}>
      <h5>Version {version}</h5>
      <hr />
      <CommentHistory id={id} key={`comment-history-${id}-${version}-${commentHistory?.length}`} version={version} commentHistory={commentHistory} approvals={approvals} />
      <br />
    </div>
  );
};

const createButton = (onClick, text) => <Button id="history-button" style={styles.loadButton} size="sm" variant="outline-primary" onClick={onClick}>{text}</Button>;
const createLoadButton = (records, details, commentHistories, showAll, setShowAll, loadAllVersions) => {
  const hasHistoryToLoad = details?.loaded == false && records[0].version > 1;
  const isHistoryLoaded = !showAll && details?.loaded;

  if (hasHistoryToLoad) return createButton(() => loadAllVersions(), 'Show More');
  if (isHistoryLoaded) return createButton(() => setShowAll(true), 'Show All Versions');
};

const sortByVersion = (a, b) => b.version - a.version;

const CommentHistoryMultipleVersions = ({ records, details = {}, loadAllVersions = () => { } }) => {
  const [showAll, setShowAll] = useState(false);
  const commentHistories = records.sort(sortByVersion).map(getCommentHistory);
  const commentHistorySummary = commentHistories.slice(0, 2);
  const renderedCommentHistory = !showAll && details?.loaded ? commentHistorySummary : commentHistories;
  const loadButton = createLoadButton(records, details, commentHistories, showAll, setShowAll, loadAllVersions);
  const accordionItem = {
    id: commentId,
    header: <><MdHistory /> History</>,
    body:
        <div id='comments' style={styles.accordionMargins}>
          {renderedCommentHistory}
          {loadButton}
        </div>
  };

  return <div id='commentHistory'><Accordion activeKey={details?.expanded == false ? null : commentId} items={[accordionItem]} /></div>;
};

export default CommentHistoryMultipleVersions;
