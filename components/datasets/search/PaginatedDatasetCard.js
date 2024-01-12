import {Card, Form} from "react-bootstrap";
import Spacer from "../../Spacer";
import {MdAddTask, MdCheck, MdLineStyle, MdLockOpen, MdStyle, MdOutlineVisibilityOff} from "react-icons/md";
import {FaEye} from "react-icons/fa";
import React from "react";
import utils from "../../utils";
import {VISIBILITY} from "../../../src/utilities/constants";
import {useAppContext} from "../../AppState";
import Link from "next/link";

const publicId = '10710b7a-7391-4860-a18d-1d7edc746fe7';
const summaryClass = 'd-md-inline catalog-dataSummaryDetail';

const renderPersonalInformation = () => <span className={summaryClass}><FaEye size="18"/> Personal Information</span>;
const truncateText = str => {
  const value = `${str}`;
  return value.length > 200 ? value.substring(0, 200) + '...' : str;
};

const renderSchemaCount = schemaCount => (
  <span className={"catalog-dataSummaryDetail " + (schemaCount && "d-md-inline")}>
    <MdLineStyle size="18"/> <strong>Schemas:</strong> <em>{schemaCount}</em>
  </span>
);

const DatasetCard = ({item, selectable, selectedItems = [], setSelectedDatasets, userPermissions = [], showRelevance}) => {
  const {classifications = [], id, status, name, description, phase, usability, matched_queries, schemaCount, isAccessibleFlag, visibility} = item;
  const globalContext = useAppContext();
  const publicToggleEnabled = utils.hasAdGroupToggleEnabled(globalContext?.toggles['datacatalogui.public_datasets'], globalContext?.loggedInUser?.groups) || false;
  const isVisibilityEnabled = globalContext?.toggles['jdc.custodian_visibility_flag']?.enabled || false
  const isPubicClassification = () => classifications.every(({gicp}) => publicId === gicp?.id);
  const isAccessible = publicToggleEnabled ? (isAccessibleFlag || isPubicClassification()) : isAccessibleFlag;
  const isAvailable = status === 'AVAILABLE';
  const isPubliclyAvailable = publicToggleEnabled ? (!isAvailable || isPubicClassification()) : !isAvailable;
  const personalInformation = classifications.filter(classification => !!classification.personalInformation);
  const distinctlyMatchedKeys = matched_queries?.join(", ");
  const isSelected = selectedItems.some(({id: i}) => i === id);
  const isDatasetSelected = dataset => selectedItems.some(({id}) =>  id === dataset.id);

  const toggleItemSelection = (dataset, event) => {
    event.preventDefault();
    if (!isAvailable) return;
    const newSelectedItems = isDatasetSelected(dataset) ? selectedItems.filter(({id: i}) => i !== dataset.id) : [...selectedItems, dataset];
    setSelectedDatasets(newSelectedItems);
  }

  const selectedClass = `list-group-item ${status} ${isSelected ? 'catalog-listItemSelected' : 'catalog-listItem'}`
  const handleSelectClick = selectable ? toggleItemSelection.bind(this, item) : () => {};
  const hasPermission = () => userPermissions.some(perm => perm.id === id);

  return (
    <Card className={selectedClass} id={id} key={id} onClick={handleSelectClick}>
      <div className="catalog-selectBox" hidden={!selectable}>
        <Form.Check disabled={isPubliclyAvailable} checked={isSelected} onChange={toggleItemSelection.bind(this, item)} id={`custom-checkbox-${id}`} custom label=""/>
      </div>
      <Card.Title className="catalog-leftText">
        <Link style={{padding: 0, textAlign: 'left'}} size="lg" variant="link" href={`/catalog/datasets/detail?id=${id}`}>{name}</Link>
      </Card.Title>
      <div style={{fontSize: '11pt'}} className="text-muted catalog-leftText">
        <em>{truncateText(description)}</em></div>
      <Spacer height="20px"/>
        <div className="small catalog-iconDetails">
            {isVisibilityEnabled && !!visibility && visibility !== VISIBILITY.FULL_VISIBILITY && <span id="visibilityIdentifier"
                                                                       className="catalog-iconSpecific"><MdOutlineVisibilityOff/> {utils.getVisibilityEnumLabels(visibility)}</span>}
            {isAccessible &&
                <span id="accessAllowed" className="catalog-iconSpecific"><MdLockOpen/> Access Allowed</span>}
            {hasPermission() && <span id="isMember" className="catalog-iconSpecific"><MdCheck/> Member</span>}
        </div>
      <div className="catalog-datasetSummary text-muted small">
        <span className={summaryClass}><MdStyle size="18"/> <strong>Phase:</strong> <em>{phase.name}</em></span>
        {!!schemaCount && renderSchemaCount(schemaCount)}
        <span className={summaryClass}><MdAddTask size="18"/> <strong>Usability:</strong> {usability || 0}</span>
        {!!personalInformation.length && renderPersonalInformation()}
      </div>
      <div hidden={!showRelevance}>
        <hr/>
        <Card.Footer className="text-muted small" style={{border: 0}}>
          <div><strong>Search Term Matches</strong></div>
          <div><em>{distinctlyMatchedKeys}</em></div>
        </Card.Footer>
      </div>
    </Card>
  );
};

export default DatasetCard;
