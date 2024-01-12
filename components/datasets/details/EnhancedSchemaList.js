import {Col, Row} from "react-bootstrap";
import React, {useState} from 'react'
import {ListGroup, ListGroupItem} from 'react-bootstrap';
import styles from '../../../styles/components/datasets/EnhancedSchemaList.module.css'
import EnhancedSearchBar from "./EnhancedSearchBar";
import {FaSortUp, FaSortDown} from 'react-icons/fa';

const defaultGetItemCss = ({name}, selectedConsolidatedSchema) => {
  const isActive = name === selectedConsolidatedSchema.name;
  return isActive ? { backgroundColor: '#ebf2eb' } : {};
}

const EnhancedSchemaList = ({consolidatedSchemas = [], selectedConsolidatedSchema, setSelectedConsolidatedSchema, getItemCss = defaultGetItemCss}) => {
  const [displayedSchemas, setDisplayedSchemas] = useState(consolidatedSchemas);
  const [sortingOrder, setSortingOrder] = useState('asc');
  const [searchCriteria, setSearchCriteria] = useState('');

  const renderSchema = ({name, versions, hasDiff}) => {
    const handleClick = () => {
      const clickedSchema = consolidatedSchemas.find(schema => name === schema.name);
      setSelectedConsolidatedSchema(clickedSchema);
    };

    const itemCss = getItemCss({name, versions, hasDiff}, selectedConsolidatedSchema);
    const isActive = name === selectedConsolidatedSchema.name;
    const active = isActive ? 'active' : undefined;
    const displayVersions = versions.length === 1 ? versions[0] : `${versions[0]} - ${versions[versions.length - 1]}`;
    return (
      <ListGroupItem style={itemCss} id={"EnhancedSchemaListItem"} key={`${name}-versions-len-${versions}`} onClick={handleClick} eventKey={name} {...active}>
        <div>
          <div className={styles.schemaListName}>{name}</div>
          <div className={styles.schemaListVersion}>Versions: {displayVersions}</div>
        </div>
      </ListGroupItem>
    )
  }

  const handleSortClick = () => {
    const currSortingOrder = sortingOrder;
    let newSortingOrder = '';
    currSortingOrder === 'asc' ? newSortingOrder = 'dsc' : newSortingOrder = 'asc';
    setSortingOrder(newSortingOrder);
    sortItems(displayedSchemas, newSortingOrder);
  }

  const handleSearchInputChange = (displayedSchemas, searchCriteria) => {
    setSearchCriteria(searchCriteria);
    handleSearchInputChangeI(displayedSchemas, sortingOrder)
  }

  const handleSearchInputChangeI = (displayedSchemas, sortingOrder) => {
    const selectSchemaName = (selectedConsolidatedSchema?.name) ? selectedConsolidatedSchema?.name : '';
    sortItems(displayedSchemas, sortingOrder);
    if (displayedSchemas.filter(schema => {
      return schema.name === selectSchemaName
    }).length === 0) {
      setSelectedConsolidatedSchema(displayedSchemas[0]);
    }
  }

  function sortItems(displayedSchemas, inSortingOrder) {
    const newSchemas = displayedSchemas;
    newSchemas.sort((a, b) => {
      const fa = a.name?.toLowerCase() || ''
      const fb = b.name?.toLowerCase() || '';
      if (fa < fb) return -1;
      if (fa > fb) return 1;
      return 0;
    });

    if (inSortingOrder === 'dsc') newSchemas.reverse();

    setDisplayedSchemas(newSchemas);
  }

  return (
    <div id={"EnhancedSchemaList"}>
      <Row style={{backgroundColor: '#f8f8f8'}} className={styles.schemaSearchBarRow}>
        <Col className={styles.schemaText}>Schema Name</Col>
        <Col className={styles.schemaSortButton} onClick={handleSortClick}>
          {(sortingOrder === 'asc') && <FaSortUp color={'#367c2b'}/>}
          {(sortingOrder === 'dsc') && <FaSortDown color={'#367c2b'}/>}
        </Col>
        <Col className={styles.schemaSearchBar}>
          <EnhancedSearchBar parDivProps={{display: "inline-block", width: '100%'}} placeholder="Search Schema Name"
                             style={{borderColor: '#ccc'}} size="sm" items={consolidatedSchemas}
                             onChange={handleSearchInputChange}/>
        </Col>
      </Row>
      <Row>
        <Col md={{span: 24}} className={styles.schemaListCol}>
          {displayedSchemas.length > 0 && (
            <ListGroup className={styles.listGroup}>{displayedSchemas.map(renderSchema)}</ListGroup>)}
          {displayedSchemas.length === 0 && (<div style={{paddingTop: '10px'}}>No Results Found</div>)}
        </Col>
      </Row>
    </div>
  )
};

export default EnhancedSchemaList;
