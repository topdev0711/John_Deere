// Unpublished Work © 2022 Deere & Company.
import {marked} from "marked";
import React, {useState} from "react";
import {Button, Card} from "react-bootstrap";
import {FaEye} from "react-icons/fa";
import {GrCompliance} from "react-icons/gr";
import {MdAvTimer, MdFilter, MdHistory, MdKeyboardArrowDown, MdKeyboardArrowUp, MdLayers, MdPeople, MdPerson, MdRadioButtonChecked, MdStyle} from 'react-icons/md';
import Attachments from '../Attachments';
import CopyableText from '../../CopyableText';
import DiffUtils from '../../DiffUtils';
import Lineage from '../../lineage/Lineage';
import Spacer from '../../Spacer';
import UsabilityDetails from './UsabilityDetails';
import UserModal from '../../UserModal';
import styles from '../../../styles/components/datasets/GeneralDetails.module.css';

const Documentation = ({showDiff, documentation, diff}) => {
  if(showDiff) return <div id='documentation-diff'>{diff.displayValue('documentation')}</div>
  if(!!documentation && documentation !== 'None') return <div className="markdown" dangerouslySetInnerHTML={{__html: marked(documentation)}}/>
  return <div><i className="text-muted">No additional documentation available.</i></div>
}

const Owner = ({owner, diff}) => {
  const mailTo = `mailto:${owner.mail}`;
  const name = diff.displayValue('owner.name');

  return <span className={styles.span}><MdPerson size="18"/>
    <strong> Owner: </strong><a href={mailTo}><em>{name}</em></a>
  </span>
}

const renderDetail = ({icon, name, value}) => <span key={`${name}-${value}`} className={styles.span}>{icon({size:"18"})}<strong> {name}: </strong><em>{value}</em></span>

const ExpandDetailsButton = ({showFullDetails, setShowFullDetails}) => {
  const handleClick = () => setShowFullDetails(!showFullDetails);
  return <Button size="sm" block variant="outline-light" className={styles.button} onClick={handleClick}>
    {!showFullDetails ? <>Show more <MdKeyboardArrowDown/></> : <>Show less <MdKeyboardArrowUp/></>}
  </Button>
}

const GeneralDetails = ({dataset = {}, hasAccess, latestAvailableVersion = {}, showDiff }) => {
  const [showFullDetails, setShowFullDetails] = useState(false);
  const { application = 'None', classifications = [], custodian, dataRecovery = false, description = '', documentation = '', owner, status = '', id, version} = dataset;
  const shouldTruncate = `${documentation}${description}`.length > 250;
  const showSummary = () => shouldTruncate && !showFullDetails;
  const bodyClassName = showSummary() ? 'detail-summary' : '';
  const diff = new DiffUtils(dataset, latestAvailableVersion, showDiff);
  const createCustodianElement = () => showDiff ? diff.displayValue('custodian') : <UserModal linkName={custodian} groupName={custodian} useItalics={true}/>
  const personalInformation = classifications.filter(classification => !!classification.personalInformation);
  const dataRecoveryVal = showDiff ? diff.diffValues(dataRecovery, !!latestAvailableVersion?.dataRecovery) : `${dataRecovery}`;

  const details = [
    {icon: MdPeople, name: 'Custodian', value: createCustodianElement(showDiff, diff, dataset)},
    {icon: MdStyle, name: 'Phase', value: diff.displayValue('phase.name')},
    {icon: MdLayers, name: 'Category', value: diff.displayValue('category.name')},
    {icon: MdAvTimer, name: 'Status', value: status},
    {icon: MdRadioButtonChecked, name: 'ID', value: <CopyableText>{id}</CopyableText>},
    {icon: MdFilter, name: 'Version', value: version},
    {icon: GrCompliance, name: 'Application', value: application},
    {icon: FaEye, name: 'Personal Information', value: (!!personalInformation.length).toString()},
    {icon: MdHistory, name: 'Data Recovery Enabled', value: dataRecoveryVal}
  ]

  return (
    <Card>
      <Card.Body className={bodyClassName}>
        <h3>{diff.displayValue('name')}</h3>
        <div className="text-muted"><em>{diff.displayValue('description')}</em></div>
        <UsabilityDetails dataset={dataset} />
        <hr/>
        <Documentation documentation={documentation} showDiff={showDiff} diff={diff}/>
        <hr/>
        <Spacer height="14px"/>
        <div className="text-muted small">
          {owner && <Owner owner={owner} diff={diff}/>}
          {details.map(renderDetail)}
          <span className={styles.span}><Attachments dataset={dataset} hasAccess={hasAccess} showDiff={showDiff}/></span>
          <Lineage dataset={dataset}/>
        </div>
      </Card.Body>
      <Card.Footer hidden={!shouldTruncate} className="bg-transparent" style={{borderTop: 0}}>
        <ExpandDetailsButton showFullDetails={showFullDetails} setShowFullDetails={setShowFullDetails}/>
      </Card.Footer>
    </Card>
  )
}

export default GeneralDetails;
