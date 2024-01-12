import React, {useState} from 'react';
import hash from 'object-hash';
import {Button, Card, Col, Row} from "react-bootstrap";
import CommunityDropdown from "../../referenceDropdowns/CommunityDropdown";
import {convert1DTo2DArray} from "../../utils/generalUtils";
import RoleTypeDropdown from "../../referenceDropdowns/RoleTypeDropdown";
import GicpDropdown from "../../referenceDropdowns/GicpDropdown";
import SubCommunityDropdown from "../../referenceDropdowns/SubCommunityDropdown";
import CountriesRepresentedDropdown from "../../referenceDropdowns/CountriesRepresentedDropdown";
import PersonalInformationDropdown from "../../referenceDropdowns/PersonalInformationDropdown";
import DevelopmentDropdown from "../../referenceDropdowns/DevelopmentDropdown";
import AccessAllowedDropdown from "../../referenceDropdowns/AccessAllowedDropdown";
const filterNames = {
  role: 'roleType', 
  gicp: 'gicp', 
  communities: 'community', 
  subCommunities: 'subCommunity', 
  countriesRepresented: 'countriesRepresented', 
  personalInformation: 'personalInformation', 
  development: 'development', 
  accessAllowed: 'accessAllowed'};
const Column = ({component: Component, selected, setSelected}) => <Col key={selected} md={{span: 12}}><Component selected={selected} setSelected={setSelected}/></Col>;
const renderFilters = rows => rows.map((row, rowInd) => <Row key={`row-${rowInd}`}>{row}</Row>);
const SearchFilters = ({filters, setFilters, setShowFilters}) => {
  const [selectedRoleType, setSelectedRoleType] = useState(filters[filterNames.role]);
  const [selectedGicp, setSelectedGicp] = useState(filters[filterNames.gicp]);
  const [selectedCommunities, setSelectedCommunities] = useState(filters[filterNames.communities]);
  const [selectedSubCommunities, setSelectedSubCommunities] = useState(filters[filterNames.subCommunities]);
  const [selectedCountriesRepresented, setSelectedCountriesRepresented] = useState(filters[filterNames.countriesRepresented]);
  const [selectedPersonalInformation, setPersonalInformation] = useState(filters[filterNames.personalInformation]);
  const [selectedDevelopment, setSelectedDevelopment] = useState(filters[filterNames.development]);
  const [selectedAccessAllowed, setAccessAllowed] = useState(filters[filterNames.accessAllowed]);

  const roleTypeDropdown = <Column key='selectedRoleType' component={RoleTypeDropdown} selected={selectedRoleType} setSelected={setSelectedRoleType}/>
  const gicpDropdown = <Column key='selectedGicp' component={GicpDropdown} selected={selectedGicp} setSelected={setSelectedGicp} />;
  const communityDropdown = <Column key='selectedCommunities' component={CommunityDropdown} selected={selectedCommunities} setSelected={setSelectedCommunities}/>;
  const subCommunityDropdown = <Col key={selectedSubCommunities} md={{span: 12}}><SubCommunityDropdown selected={selectedSubCommunities} setSelected={setSelectedSubCommunities} selectedDependency={selectedCommunities}/></Col>;
  const countriesRepresentedDropdown = <Column key='selectedCountriesRepresented' component={CountriesRepresentedDropdown} selected={selectedCountriesRepresented} setSelected={setSelectedCountriesRepresented} />;
  const personalInformationDropdown = <Column key='selectedPersonalInformation' component={PersonalInformationDropdown} selected={selectedPersonalInformation} setSelected={setPersonalInformation} />;
  const developmentDropdown = <Column key='selectedDevelopment' component={DevelopmentDropdown} selected={selectedDevelopment} setSelected={setSelectedDevelopment} />;
  const accessAllowedDropDown = <Column key='selectedAccessAllowed' component={AccessAllowedDropdown} selected={selectedAccessAllowed} setSelected={setAccessAllowed} />;
  const permissionFilters = [
    roleTypeDropdown, 
    gicpDropdown, 
    communityDropdown, 
    subCommunityDropdown, 
    countriesRepresentedDropdown, 
    personalInformationDropdown, 
    developmentDropdown, 
    accessAllowedDropDown
  ];

  const rows = convert1DTo2DArray(permissionFilters,2);

  const clearFilters = () => {
    const hasChange = hash(filters) !== hash({});
    if(hasChange) setFilters({});
    setShowFilters(false);
  }

  const mergeObjects = arr => Object.keys(arr).map(key=>arr[key]).reduce((old,item)=>({...old,...item}), {});

  const getFilters = () => {
    const role = selectedRoleType ? { [filterNames.role]: selectedRoleType } : undefined;
    const gicps = selectedGicp ? { [filterNames.gicp]: selectedGicp } : undefined;
    const communities = selectedCommunities ? { [filterNames.communities]: selectedCommunities } : undefined;
    const subCommunities = selectedSubCommunities ? { [filterNames.subCommunities]: selectedSubCommunities } : undefined;
    const countriesRepresented = selectedCountriesRepresented ? { [filterNames.countriesRepresented]: selectedCountriesRepresented } : undefined;
    const personalInformation = selectedPersonalInformation ? { [filterNames.personalInformation]: selectedPersonalInformation } : undefined;
    const development = selectedDevelopment ? { [filterNames.development]: selectedDevelopment } : undefined;
    const accessAllowed = selectedAccessAllowed ? { [filterNames.accessAllowed]: selectedAccessAllowed } : undefined;

    const allFilters = [role, gicps, communities, subCommunities, countriesRepresented, personalInformation, development, accessAllowed];
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
          <div style={{float: 'right', marginRight: '14px'}}>
            <span><Button size="sm" variant="secondary" onClick={clearFilters}>Clear</Button></span>&nbsp;&nbsp;
            <span><Button size="sm" variant="primary" onClick={handleApply}>Apply</Button></span>
          </div>
        </Card.Body>
      </Card>
  );
};

export default SearchFilters;
