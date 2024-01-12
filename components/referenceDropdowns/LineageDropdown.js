import React from "react";
import GroupMultiselect from "./GroupMultiselect";
import {multiselectSelected} from "./dropdownValidation";

const LineageDropdown = ({selected, setSelected, label, values}) => {
  const options = (values || []).flatMap(value => ({id: value, name: value}));
  const selectedItem = multiselectSelected(selected, options);
  return <GroupMultiselect label={label} isSorted options={options} selectedItem={selectedItem} setSelectedItem={setSelected}/>
}

export default LineageDropdown;
