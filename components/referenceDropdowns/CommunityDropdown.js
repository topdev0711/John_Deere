import React from "react";
import {useAppContext} from "../AppState";
import GroupMultiselect from "./GroupMultiselect";
import {multiselectSelected} from "./dropdownValidation";

const CommunityDropdown = ({selected, setSelected}) => {
  const globalContext = useAppContext();
  const {communities} = globalContext.referenceData;
  const selectedItem = multiselectSelected(selected, communities);
  return <GroupMultiselect label='Community' isSorted options={communities} selectedItem={selectedItem} setSelectedItem={setSelected}/>
}

export default CommunityDropdown;
