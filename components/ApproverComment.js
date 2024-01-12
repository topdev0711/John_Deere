import { MdPerson, MdComment } from "react-icons/md";
import React from "react";
import EmailableText from "./EmailableText";
import moment from "moment";

const formatDate = dateString => {
  const date = new Date(dateString);
  return moment(date).format('DD MMM YYYY HH:mm');
};

const styles = {
  userInfo: {
    marginLeft: '20px',
    marginBottom: '5px'
  },
  userComment: {
    marginLeft: '25px'
  },
  approvalIndicator: {
    marginLeft: '25px',
    marginTop: '-5px'
  },
  listItem: {
    display: 'table-row',
    verticalAlign: 'middle'
  },
  listItemWrapper: {
    marginTop: '10px',
    position: 'relative'
  },
  listBullet: {
    marginTop: '10px',
    content: '',
    width: '10px',
    height: '10px',
    background: 'white',
    border: '2px solid',
    borderRadius: '50%',
    position: 'absolute',
    color: '#ccc'
  },
  listLine: {
    marginTop: '20px',
    content: '',
    position: 'absolute',
    left: '4px',
    height: '100%',
    border: '1px solid',
    color: '#ccc'
  }
};

const ApproverComment = ({ updatedBy, updatedAt, comment = 'No comments', status, approver }) => {
  const indicator = status === 'REJECTED' ? 'danger' : 'success';
  const statusComment = ` ${status}: ${comment} `;
  return (
    <div style={styles.listItemWrapper}>
      <div style={styles.listLine}></div>
      <div style={styles.listBullet}></div>
      <div style={styles.listItem}>
        <span id='approver' className='small' style={styles.userComment} ><MdComment />{approver}</span>
        <div id='statusComment' className='small' style={styles.approvalIndicator}><span className={`uxf-statusDot uxf-statusDot-${indicator}`}></span><span className='small'><b><i>{statusComment}</i></b></span></div>
        <div id='updateInfo' style={styles.userInfo} className='small'>
          <MdPerson size="18" /><b><EmailableText>{updatedBy}</EmailableText></b>{formatDate(updatedAt)}
        </div>
      </div>
    </div>
  );
};

export default ApproverComment;
