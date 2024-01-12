import React from "react";
import {useAppContext} from "../AppState";
import GroupMultiselect from "./GroupMultiselect";
import {multiselectSelected} from "./dropdownValidation";

const CountriesRepresentedDropdown = ({selected, setSelected}) => {
  const globalContext = useAppContext();
  const {countries} = globalContext.referenceData;
  const selectedItem = multiselectSelected(selected, countries);
  return <GroupMultiselect label='Country Represented' options={countries} selectedItem={selectedItem} setSelectedItem={setSelected}/>
}

export default CountriesRepresentedDropdown;
