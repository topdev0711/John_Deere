import React from "react";
import { Spinner, Container, Row } from "@deere/ux.uxframe-react";
import PropTypes from "prop-types";

function ProgressIndicator(props) {

  const componentOverlayStyle = {
    height: '100%',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 999
  };

  const rowClassName = "justify-content-center" + (props.overlay ? " h-100 align-content-center" : "");

  return (
    <Container id="searchingLoader" fluid={true} data-testid="searchingLoader" style={componentOverlayStyle}>
      <Row className={rowClassName} >
        <Spinner accessibilityLabel="Loading" className="spinner-border uxf-spinner-border-lg" animation="border" role="status" />
      </Row>
    </Container>
  )
}

ProgressIndicator.propTypes = {
  overlay: PropTypes.bool
};

export default (ProgressIndicator);