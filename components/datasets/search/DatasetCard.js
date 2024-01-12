import {Button, Card, Form} from "react-bootstrap";
import Spacer from "../../Spacer";
import {MdAddTask, MdCheck, MdLineStyle, MdLockOpen, MdStyle} from "react-icons/md";
import {FaEye} from "react-icons/fa";
import React, {useEffect, useState} from "react";
import {useAppContext} from "../../AppState";
import utils from "../../utils";
import Link from "next/link";

const truncateText = str => {
  const value = `${str}`;
  return value.length > 200 ? value.substring(0, 200) + '...' : str;
};

const publicId = '10710b7a-7391-4860-a18d-1d7edc746fe7';

const DatasetCard = ({item, state, props, updateSelectedItems, showRelevance}) => {
  const {classifications = [], schemas = [], linkedSchemas = [], relevance, id, status, name, description, phase, usability, isAccessibleFlag} = item;
  const {selectable} = props;
  const {selectedItems = [], userPermissions = []} = state;

  const globalContext = useAppContext();
  const publicToggleEnabled = utils.hasAdGroupToggleEnabled(globalContext?.toggles['datacatalogui.public_datasets'], globalContext?.loggedInUser?.groups);
  const isPublic = () => classifications.every(({gicp}) => publicId === gicp?.id);

  const isAccessibleDataset = () => isAccessibleFlag;
  const isDatasetAccessible = () => publicToggleEnabled ? (isAccessibleDataset() || isPublic()) : isAccessibleDataset();

  const [isAccessible, setIsAccessible] = useState(isDatasetAccessible());

  useEffect(() => {setIsAccessible(isDatasetAccessible())}, [state]);

  const isAvailable = () => status === 'AVAILABLE';
  const isCheckboxDisabled = publicToggleEnabled ? (!isAvailable() || isPublic()) : !isAvailable();

  const personalInformation = classifications.filter(classification => !!classification.personalInformation);
  const schemaCount = schemas.length + linkedSchemas.length;
  const distinctlyMatchedKeys = [...new Set(Object.values(relevance.matches).reduce((a, b) => a.concat(b), []).map(m => m.key))];
  const isItemSelected = (id) => !!selectedItems.find(({id: i}) => i === id);
  const isDatasetSelected = dataset => selectedItems.find(({id}) => id === dataset.id);

  const toggleItemSelection = (dataset, event) => {
    event.preventDefault();
    if (dataset.status === 'AVAILABLE') {
      isDatasetSelected(dataset) ? updateSelectedItems(dataset, true) : updateSelectedItems(dataset);
    }
  }

  return (
    <>
      <Card
        className={`list-group-item ${status} ${isItemSelected(id) ? 'catalog-listItemSelected' : 'catalog-listItem'}`}
        id={id}
        key={id}
        onClick={selectable ? toggleItemSelection.bind(this, item) : () => {
        }}
      >
        <div className="catalog-selectBox" hidden={!selectable}>
          <Form.Check
            disabled={isCheckboxDisabled}
            checked={isItemSelected(id)}
            onChange={toggleItemSelection.bind(this, item)}
            id={`custom-checkbox-${id}`}
            custom
            label=""
          />
        </div>
        <Card.Title className="catalog-leftText">
          <Link style={{padding: 0, textAlign: 'left'}} size="lg" variant="link" href={`/catalog/datasets/detail?id=${id}`}>{name}</Link>
        </Card.Title>
        <div style={{fontSize: '11pt'}} className="text-muted catalog-leftText">
          <i>{truncateText(description)}</i></div>
        <Spacer height="20px"/>
        <div className="small catalog-iconDetails">
          {isAccessible && <span id="accessAllowed" className="catalog-iconSpecific"><MdLockOpen/> Access Allowed</span>}
          {userPermissions.some(perm => perm.id === id) && <span id="isMember" className="catalog-iconSpecific"><MdCheck/> Member</span>}
        </div>
        <div className="catalog-datasetSummary text-muted small">
          <span className="d-md-inline catalog-dataSummaryDetail"><MdStyle size="18"/> <b>Phase:</b> <i>{phase.name}</i></span>
          {!!schemaCount &&
            <span className={"catalog-dataSummaryDetail " + (schemaCount && "d-md-inline")}>
              <MdLineStyle size="18"/> <b>Schemas:</b> <i>{schemaCount}</i>
            </span>
          }
            <span className="d-md-inline catalog-dataSummaryDetail"><MdAddTask size="18"/> <b>Usability:</b> {usability || 0}</span>
          {!!personalInformation.length && <span className="d-md-inline catalog-dataSummaryDetail"><FaEye size="18"/> Personal Information</span>}
        </div>
        <div hidden={!relevance.score || !showRelevance}>
          <hr/>
          <Card.Footer className="text-muted small" style={{border: 0}}>
            <div><b>Search Term Matches</b></div>
            <div><i>{distinctlyMatchedKeys.join(', ')}</i></div>
          </Card.Footer>
        </div>
      </Card>
      <Spacer height="10px"/>
    </>
  );
};

export default DatasetCard;
