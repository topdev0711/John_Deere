import {Spinner} from "react-bootstrap";
import React from "react";

const SmallSpinner = () => <div className="text-center">
  <Spinner className="spinner-border uxf-spinner-border-lg" animation="border" role="status">
    <span className="sr-only">Loading...</span>
  </Spinner>
</div>

export default SmallSpinner;

