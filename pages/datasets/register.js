// Unpublished Work © 2022 Deere & Company.
import {Breadcrumb, BreadcrumbItem} from "react-bootstrap";
import React from 'react';
import Router from 'next/router';
import Spacer from '../../components/Spacer';
import DatasetForm from '../../components/datasets/edit/DatasetForm';
import EnhancedDatasetForm from '../../components/datasets/edit/EnhancedDatasetForm';
import Link from "next/link";
import utils from "../../components/utils";
import {useAppContext} from '../../components/AppState';
const uuid = require('uuid');


const styles = {
  breadcrumb: {
    marginLeft: '-17px',
    marginTop: '-17px'
  }
};

const DEFAULT_DATASET = {
  _isMounted: false,
  id: uuid.v4(),
  name: '',
  version: null,
  description: '',
  documentation: '',
  userId: '',
  owner: {},
  custodian: '',
  sourceDatasets: [],
  application: '',
  category: '',
  phase: '',
  technology: { id: "1f8ee69b-62ad-42a3-9598-02947ea25670", name: 'AWS' },
  physicalLocation: { id: "6c2760b1-fabf-45fb-adc6-9d717e38b598", name: 'us-east-1' },
  classifications: [],
  schemas: [],
  linkedSchemas: [],
  tables: [],
  paths: [],
  mdPreview: '',
  showDocsModal: false,
  modal: null,
  isLoading: false,
  showSchemaSelector: false,
  previousVersion: null,
  showClassificationsModal: false,
  modalDataset: {},
  datasetErrors: [],
  schemaErrors: [],
  showToast: false,
  requestComments: '',
  deleteModal: null,
  deletedSchemas: [],
  canSave: true,
  dataRecovery: false,
  selectData: [],
  stagingUuid: '',
  deletedAttachments: [],
  newAttachments: [],
  showApplicationModal: false,
  classificationPrediction: '',
  datasetSummaries: [],
  usabilityDetails: { usability: 0, dimensions: [] }
}

const Register = () => {
  const handleCancel = () => {Router.push('/catalog')};
  const globalContext = useAppContext();
  const publicDatasetToggle = utils.hasAdGroupToggleEnabled(globalContext?.toggles['datacatalogui.public_datasets'], globalContext?.loggedInUser?.groups) || false;
  return (
    <div id="register-dataset">
      <Breadcrumb style={styles.breadcrumb}>
        <BreadcrumbItem><Link href="/catalog">Catalog</Link></BreadcrumbItem>
        <BreadcrumbItem active>Register</BreadcrumbItem>
      </Breadcrumb>
      {publicDatasetToggle ? 
        <EnhancedDatasetForm isEditing={false} onCancel={handleCancel} title="Register Dataset"/>
        : <DatasetForm isEditing={false} onCancel={handleCancel} title="Register Dataset"/>
      }
      <Spacer/>
    </div>
  );
}

export default Register;
