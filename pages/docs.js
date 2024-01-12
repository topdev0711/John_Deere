import React from 'react';

export default class DocsPage extends React.Component {
  render() {
    return (
      <div>
        <h4>Confluence Documentation</h4>
        <ul className="uxf-ul">
          <li>
            <a href="https://confluence.deere.com/display/EDAP/EDL+Data+Catalog">EDL Data Catalog Documentation</a>
          </li>   
          <li>
            <a href="https://confluence.deere.com/display/EDG/Data+Governance">Enterprise Data Governance - Strategy</a>
          </li>   
          <li>
            <a href="https://confluence.deere.com/pages/viewpage.action?spaceKey=EDAP&title=EDL+Getting+Started">Enterprise Data Lake - Getting Started</a>
          </li>
          <li>
            <a href="https://confluence.deere.com/display/EDAP/Databricks">Databricks</a>
          </li>
          <li>
            <a href="https://confluence.deere.com/display/EDAP/Self-Service+Guide">EDL Self Service</a>
          </li>
        </ul>
        <h4>Databricks</h4>
        <ul className="uxf-ul">
          <li>
            <a href="https://deere.cloud.databricks.com/">General</a>
          </li>
          <li> 
            <a href="https://deere-internal.cloud.databricks.com/">Internal</a>
          </li>
        </ul>
        <h4>General</h4>
        <ul className="uxf-ul">
          <li>
            <a href="https://edl-self-service.vpn-prod.us.e03.c01.johndeerecloud.com/">EDL Self Service</a>
          </li>
          <li>
            How to Report an Issue
            <ul className="uxf-ul">
              <li> Submit an incident using our <a href="https://johndeere.service-now.com/ep?id=sc_cat_item&sys_id=fa64d0eb1332a34cb43fbcaf3244b0b5">support request form.</a></li>
              <li> If your issue has a high impact on a business critical process then you should engage IPN operations at +1-309-765-3333. Please request that they assign a high priority incident to the "AE EDL Support" group.</li>
            </ul>
          </li>
          <li>
            <a href="https://confluence.deere.com/x/3_osDQ">Our Support SLA</a>
          </li>
        </ul>
      </div>
    );
  }
};
