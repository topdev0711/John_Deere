import React from "react";
import {useAppContext} from "../AppState";
import GroupMultiselect from "./GroupMultiselect";
import {multiselectSelected} from "./dropdownValidation";

const CustodianDropdown = ({selected, setSelected}) => {
  const globalContext = useAppContext();
  const {loggedInUser} = globalContext;
  const custodians = loggedInUser.groups.map(group => ({id: group, name: group}));
  const selectedItem = multiselectSelected(selected, custodians);
  return <GroupMultiselect label='Custodian' isSorted options={custodians} selectedItem={selectedItem} setSelectedItem={setSelected}/>
}

export default CustodianDropdown;
