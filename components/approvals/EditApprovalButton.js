// Unpublished Work © 2022 Deere & Company.
import utils from '../utils';
import Router from 'next/router';
import {MdEdit} from 'react-icons/md';
import {Button} from 'react-bootstrap';

const EditApprovalButton = ({item, isUpdating}) => {
  const handleClick = () => {
    const {id, version} = item;
    const type = item.type.toLowerCase();
    const editUrl = type === 'dataset' ? `/datasets/${id}/edit` : `/catalog/${type}s/detail?id=${id}&version=${version}&edit=true`;
    Router.push(editUrl);
  }

  const disabled = utils.hideEditButton(item, null) || isUpdating;
  return <Button disabled={disabled} variant="outline-dark" size="sm" onClick={handleClick}><MdEdit/></Button>;
}

export default EditApprovalButton;
