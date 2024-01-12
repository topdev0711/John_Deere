import {Col} from "react-bootstrap";
import React, {useState} from "react";
import AccessAllowedDropdown from "../components/referenceDropdowns/AccessAllowedDropdown";
import CategoryDropdown from "../components/referenceDropdowns/CategoryDropdown";
import CountriesRepresentedDropdown from "../components/referenceDropdowns/CountriesRepresentedDropdown";
import CustodianDropdown from "../components/referenceDropdowns/CustodianDropdown";
import DevelopmentDropdown from "../components/referenceDropdowns/DevelopmentDropdown";
import GicpDropdown from "../components/referenceDropdowns/GicpDropdown";
import PersonalInformationDropdown from "../components/referenceDropdowns/PersonalInformationDropdown";
import PhaseDropdown from "../components/referenceDropdowns/PhaseDropdown";
import SubCommunityDropdown from "../components/referenceDropdowns/SubCommunityDropdown";
import CommunityDropdown from "../components/referenceDropdowns/CommunityDropdown";
import CreatedByDropdown from "../components/referenceDropdowns/CreatedByDropdown";
import VisibilityDropdown from "../components/referenceDropdowns/VisibilityDropdown";

const components = {
  phase: PhaseDropdown,
  gicp: GicpDropdown,
  category: CategoryDropdown,
  community: CommunityDropdown,
  subCommunity: SubCommunityDropdown,
  countriesRepresented: CountriesRepresentedDropdown,
  personalInformation: PersonalInformationDropdown,
  development: DevelopmentDropdown,
  access: AccessAllowedDropdown,
  custodian: CustodianDropdown,
  createdBy: CreatedByDropdown,
  visibility: VisibilityDropdown
};

const Column = ({component: Component, selected, setSelected}) => <Col key={selected} md={{span: 12}}><Component selected={selected} setSelected={setSelected}/></Col>;

const useSearchFilter = (filters, name, selectedDependency) => {
  const [selectedFilter, setSelectedFilter] = useState(filters[name]);
  const component = components[name];

  const dropdown = name !== 'subCommunity' ? <Column key={`selected-${name}`} component={component} selected={selectedFilter} setSelected={setSelectedFilter} />
  : <Col key={selectedFilter} md={{span: 12}}><SubCommunityDropdown selected={selectedFilter} setSelected={setSelectedFilter} selectedDependency={selectedDependency}/></Col>;

  const getFilter = () => selectedFilter ? { [name]: selectedFilter } : undefined;
  return [dropdown, getFilter, selectedFilter];
};

export default useSearchFilter;
