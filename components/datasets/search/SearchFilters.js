import React, {useEffect, useState} from 'react';
import hash from 'object-hash';
import {Button, Card, Col, Row} from "react-bootstrap";
import {convert1DTo2DArray} from "../../utils/generalUtils";
import {getSourceDBFilters} from "../../../apis/lineage";
import LineageDropdown from "../../referenceDropdowns/LineageDropdown";
import useSearchFilter from "../../../hooks/useSearchFilter";

const filterNames = {server: 'servers', database: 'databases', tableName: 'tableNames'};

const renderFilters = rows => rows.map((row, rowInd) => <Row key={`row-${rowInd}`}>{row}</Row>);

const SearchFilters = ({filters, setFilters, setShowFilters}) => {
  const [phaseDropdown, getPhaseFilter] = useSearchFilter(filters, 'phase');
  const [gicpDropdown, getGicpFilter] = useSearchFilter(filters, 'gicp');
  const [categoryDropdown, getCategoryFilter] = useSearchFilter(filters, 'category');
  const [communityDropdown, getCommunityFilter, selectedCommunities] = useSearchFilter(filters, 'community');
  const [subCommunityDropdown, getSubCommunityFilter] = useSearchFilter(filters, 'subCommunity', selectedCommunities);
  const [countriesRepresentedDropdown, getCountriesFilter] = useSearchFilter(filters, 'countriesRepresented');
  const [personalInformationDropdown, getPersonalInformationFilter] = useSearchFilter(filters, 'personalInformation');
  const [developmentDropdown, getDevelopmentFilter] = useSearchFilter(filters, 'development');
  const [accessAllowedDropdown, getAccessAllowedFilter] = useSearchFilter(filters, 'access');
  const [custodianDropdown, getCustodiansFilter] = useSearchFilter(filters, 'custodian');
  const [createdByDropdown, getCreatedByFilter] = useSearchFilter(filters, 'createdBy');
  const [visibilityDropdown, getVisibilityFilter] = useSearchFilter(filters, 'visibility');

  const [databases, setDatabases] = useState(filters[filterNames.database]);
  const [selectedDatabases, setSelectedDatabases] = useState(filters[filterNames.database]);
  const [servers, setServers] = useState(filters[filterNames.server]);
  const [selectedServers, setSelectedServers] = useState(filters[filterNames.server]);
  const [tableNames, setTableNames] = useState(filters[filterNames.tableName]);
  const [selectedTableNames, setSelectedTableNames] = useState(filters[filterNames.tableName]);

  const getLineageData = async () => {
    const {databases, servers, tableNames} = await getSourceDBFilters();
    setDatabases(databases);
    setServers(servers);
    setTableNames(tableNames)
  }
  useEffect(() => {getLineageData()}, []);

  const datasetFilters = [
    phaseDropdown, 
    gicpDropdown, 
    categoryDropdown, 
    communityDropdown, 
    subCommunityDropdown, 
    countriesRepresentedDropdown, 
    personalInformationDropdown, 
    developmentDropdown, 
    accessAllowedDropdown, 
    custodianDropdown, 
    createdByDropdown, 
    visibilityDropdown];
  const rows = convert1DTo2DArray(datasetFilters,2);

  const serverDropdown = <Col key={servers?.length} md={{span: 12}}><LineageDropdown selected={selectedServers} setSelected={setSelectedServers} label='Servers' values={servers}/></Col>;
  const databaseDropdown = <Col key={databases?.length} md={{span: 12}}><LineageDropdown selected={selectedDatabases} setSelected={setSelectedDatabases} label='Databases' values={databases}/></Col>;
  const tableDropdown = <Col key={tableNames?.length} md={{span: 12}}><LineageDropdown selected={selectedTableNames} setSelected={setSelectedTableNames} label='Table Names' values={tableNames}/></Col>;
  const lineageFilters = [serverDropdown, databaseDropdown, tableDropdown];
  const lineageRows = convert1DTo2DArray(lineageFilters,2);

  const clearFilters = () => {
    const hasChange = hash(filters) !== hash({});
    if(hasChange) setFilters({});
    setShowFilters(false);
  }

  const mergeObjects = arr => Object.keys(arr).map(key => arr[key]).reduce((old,item)=>({...old,...item}), {});

  const getFilters = () => {
    const servers = selectedServers ? { [filterNames.server]: selectedServers } : undefined;
    const databases = selectedDatabases ? { [filterNames.database]: selectedDatabases } : undefined;
    const tableNames = selectedTableNames ? { [filterNames.tableName]: selectedTableNames } : undefined;
    const allFilters = [getPhaseFilter(), getGicpFilter(), getCategoryFilter(), getCommunityFilter(), getSubCommunityFilter(),
      getCountriesFilter(), getPersonalInformationFilter(), getDevelopmentFilter(), getAccessAllowedFilter(), getCustodiansFilter(),
      getCreatedByFilter(), getVisibilityFilter(), servers, databases, tableNames];
    const newFilters = allFilters.filter(filter => filter);

    return mergeObjects(newFilters);
  };

  const handleApply = () => {
    const newFilters = getFilters();
    const hasChange = hash(filters) !== hash(newFilters);
    if(hasChange) setFilters(newFilters);
    setShowFilters(false);
  };

  return (
    <Card>
      <Card.Body style={{backgroundColor: '#f7f7f7'}}>
        {renderFilters(rows)}
        <hr/>
        <h5>Database Source</h5>
        {renderFilters(lineageRows)}
        <div style={{float: 'right', marginRight: '14px'}}>
          <span><Button size="sm" variant="secondary" onClick={clearFilters}>Clear</Button></span>&nbsp;&nbsp;
          <span><Button size="sm" variant="primary" onClick={handleApply}>Apply</Button></span>
        </div>
      </Card.Body>
    </Card>
  );
};

export default SearchFilters;
