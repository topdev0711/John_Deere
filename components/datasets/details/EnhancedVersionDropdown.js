import React, { useState } from "react";
import {MdBuild, MdKeyboardArrowDown} from "react-icons/md";
import { FaRegClock} from 'react-icons/fa';
import EnhancedLoadHistoryModal from "./EnhancedLoadHistoryModal";
import {Dropdown} from "@deere/ux.uxframe-react";
import {Button} from "react-bootstrap";
import styles from "../../../styles/components/datasets/EnhancedVersionDropdown.module.css";

const diffColors = { added: 'LightGreen', removed: '#FFCCCB', modified: '#ffffe0', unchanged: 'white' };

const EnhancedVersionDropdown = ({selectedConsolidatedSchema, selectedSchema, schemas, setSelectedConsolidatedSchema, schemaEnvironmentName, dataType}) => {
  const [show, setShow] = useState(false);
  let titleContent = <></>
  if(selectedConsolidatedSchema) {
    titleContent =
      <div className="schemaVersionDropdown dianaClass" id={styles.test} style={{ boxShadow: 'none', width: '150px', backgroundColor: '#ffffff' }}>
        <span style={{ float: 'left' }}>{selectedConsolidatedSchema.selectedVersion}</span>
        {selectedConsolidatedSchema.testingStatus[selectedConsolidatedSchema.selectedVersion] &&
          <span>
            <span style={{ float: 'left', paddingLeft: '5px' }}> <MdBuild/> Testing </span>
          </span>}
        <span style={{ float: 'right' }}> <MdKeyboardArrowDown/> </span>
    </div>
  }

  const itemContent = version =>
    <div style={{ width: '140px' }}>
      <span>{version}</span>
      {selectedConsolidatedSchema.testingStatus[version] &&
        <span style={{ paddingLeft: '5px' }}> <MdBuild/> Testing</span>}
    </div>

  const handleSelect = selectedItem => setSelectedConsolidatedSchema({...selectedConsolidatedSchema, selectedVersion: selectedItem});

  const getBackgroundColor = version => {
    const schema = schemas.find(detailedSchema => selectedConsolidatedSchema.name === detailedSchema.name && detailedSchema.version === version);
    if(!schema?.diffStatus) return 'white';
    return diffColors[schema.diffStatus];
  }

  const createItem = version => {
    const backgroundColor = getBackgroundColor(version);
    return <Dropdown.Item key={`${version}`} className={ styles.schemaVersionItem } onSelect={handleSelect} eventKey={version} style={{paddingLeft: '15px', backgroundColor}}>{itemContent(version)}</Dropdown.Item>
  }
  let schemaEnvironmentNameFinal = ''
  if(selectedConsolidatedSchema) schemaEnvironmentNameFinal =`${schemaEnvironmentName}@${selectedConsolidatedSchema.selectedVersion}`

  return (
    <>
      {selectedConsolidatedSchema && (
        <>
          <EnhancedLoadHistoryModal show={show} onCancel={() => setShow(false)} schemaName={selectedConsolidatedSchema.name} schemaEnvironmentName={schemaEnvironmentNameFinal} datasetEnvironmentName={dataType}/>
          <div style={{paddingBottom: '0px', marginBottom: '0px', display: 'inline-block', paddingRight: '10px'}}>
            <Dropdown id="test" style={{ boxShadow:'none', display: 'inline-block', paddingRight: '10px', backgroundColor: '#ffffff'}}>
              <Dropdown.Toggle id="test" className={styles.schemaVersionToggle} style={{ boxShadow:"none", borderColor: '#333333', backgroundColor: getBackgroundColor(selectedSchema.version)}}>
                {titleContent}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {selectedConsolidatedSchema.versions.map(createItem)}
              </Dropdown.Menu>
            </Dropdown>

            <Button style={{ paddingLeft: '5px', backgroundColor: 'white', borderColor: 'white'}} onClick={() => setShow(true)}><span><FaRegClock color="grey"/> </span><span>Load History</span></Button>
          </div>
        </>
      )}
    </>
  )
};

export default EnhancedVersionDropdown;
