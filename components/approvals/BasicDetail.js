import { MdChat, MdPerson } from "react-icons/md";
import moment from "moment";
import EmailableText from "../EmailableText";

const formatDate = dateString => {
  const date = new Date(dateString);
  return moment(date).format('DD MMM YYYY HH:mm');
};

const BasicDetail = ({ requestComments, updatedBy, updatedAt }) => {
  return (
    <div>
      <div style={{ paddingBottom: '8px' }} className='small' id='updateInfo'><span><MdPerson size="18" /> <b><EmailableText>{updatedBy}</EmailableText></b> - <i>Last Updated {formatDate(updatedAt)}</i></span></div>
      {requestComments &&
        <ul style={{ listStyleType: 'none' }}>
          <li>
            <div className='small' id='requestComments'><blockquote><MdChat /> - <i>{requestComments}</i></blockquote></div>
          </li>
        </ul>
      }
    </div>
  );
};

export default BasicDetail;
