import Router from 'next/router';
import {Button} from "react-bootstrap";
import {MdLockOpen} from "react-icons/md";
import React from "react";

const RegisterDatasetButton = ({}) => {
  const handleClick = () => Router.push('/datasets/register');
  return (
    <Button onClick={handleClick} size="sm" variant="outline-primary">
      <MdLockOpen/> Register Dataset
    </Button>
  );
};

export default RegisterDatasetButton;
