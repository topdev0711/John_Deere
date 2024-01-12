import React from "react";
import {useAppContext} from "../AppState";
import GroupMultiselect from "./GroupMultiselect";
import {multiselectSelected} from "./dropdownValidation";

const PhaseDropdown = ({selected, setSelected}) => {
  const globalContext = useAppContext();
  const {phases} = globalContext.referenceData;
  const selectedItem = multiselectSelected(selected, phases);
  return <GroupMultiselect label='Phase' isSorted={true} options={phases} selectedItem={selectedItem} setSelectedItem={setSelected}/>
}

export default PhaseDropdown;
