import React from 'react';
import {Button} from 'react-bootstrap';
import {MdAdd} from 'react-icons/md';
import {useRouter} from 'next/router';

const CreatePermissionButton = ({}) => {
  const router = useRouter();
  const handleClick = () => router.push('/catalog/permissions/request');

  return (
    <Button size='sm' variant='outline-primary' onClick={handleClick}>
      <MdAdd/> Create Permission
    </Button>
  )
};

export default CreatePermissionButton;
