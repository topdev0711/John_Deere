import CommentHistory from "./CommentHistory";
import React from "react";
import {MdHistory} from "react-icons/md";
import Accordion from "./Accordion";

const accordionMargins = {
 marginTop: '20px',
 marginBottom: '20px',
 marginLeft: '5px',
 marginRight: '5px'
};

const CommentHistorySingle = ({ id, version, commentHistory, approvals }) => {
 const commentId = `${id}-${version}-comment-history`;
 const accordionItem = { id: commentId, header: <><MdHistory/> History</>,
  body: 
  <div id='comments' style={accordionMargins}>
    <CommentHistory id={id} version={version} commentHistory={commentHistory} approvals={approvals} />
 </div> };
 return <div id='commentHistory'><Accordion activeKey={commentId} items={[accordionItem]}/></div>;
};

export default CommentHistorySingle;