import React from "react";
import {useAppContext} from "../AppState";
import GroupMultiselect from "./GroupMultiselect";
import utils from "../utils";
import {multiselectSelected} from "./dropdownValidation";

const GicpDropdown = ({selected, setSelected}) => {
  const globalContext = useAppContext();
  const {gicp} = globalContext.referenceData;
  const selectedItem = multiselectSelected(selected, gicp);
  return <GroupMultiselect label='GICP' isSorted={true} options={utils.createGicpOpts({getDeprecated : true})} selectedItem={selectedItem} setSelectedItem={setSelected}/>
}

export default GicpDropdown;
