import {Spinner} from "react-bootstrap";
import React from "react";

export const MetricSpinner = () => <div className="text-center" style={{ marginTop: '50px' }}>
  <Spinner className="spinner-border uxf-spinner-border-lg" animation="border" role="status">
    <span className="sr-only">Loading...</span>
  </Spinner>
</div>
