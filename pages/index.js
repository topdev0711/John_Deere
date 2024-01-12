import React from 'react';
import CardColumns from 'react-bootstrap/CardColumns';
import Card from 'react-bootstrap/Card';

export default class IndexPage extends React.Component {
  render() {
    return (
      <>
        <h3>Enterprise Data Governance</h3>
        <br />
        <CardColumns>
          <Card>
            <Card.Header>Data Governance</Card.Header>
            <Card.Body style={{height: '150px'}}>
              <Card.Text>
                <span style={{display: 'block'}}><a href="#">Data Assets</a></span>
                <span style={{display: 'block'}}><a href="#">Data Policies</a></span>
              </Card.Text>
            </Card.Body>
          </Card>
          <Card>
            <Card.Header>Privacy</Card.Header>
            <Card.Body style={{ height: '150px' }}>
              <span style={{display: 'block'}}><a href="http://jdo.deere.com/en-us/corp/compliance/Pages/Home.aspx">Center for Business Conduct</a></span>
              <span style={{display: 'block'}}><a href="https://app.onetrust.com/">OneTrust</a></span>
            </Card.Body>
          </Card>
          <Card>
            <Card.Header>Data Lake Management</Card.Header>
            <Card.Body style={{ height: '150px' }}>
              <div><a href="https://confluence.deere.com/display/EDAP/EDL+Getting+Started?src=contextnavpagetreemode">EDL Getting Started</a></div>
              <div><a href="https://confluence.deere.com/display/EDAP/Databricks">EDL + Databricks</a></div>
              <div><a href="https://confluence.deere.com/display/EDAP/Self-Service+Guide">EDL Self-Service</a></div>
            </Card.Body>
          </Card>
        </CardColumns>
      </>
    );
  }
};
