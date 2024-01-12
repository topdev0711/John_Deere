import React from "react";
import {useAppContext} from "../AppState";
import GroupMultiselect from "./GroupMultiselect";
import {multiselectSelected} from "./dropdownValidation";

const CategoryDropdown = ({selected, setSelected}) => {
  const globalContext = useAppContext();
  const {categories} = globalContext.referenceData;
  const selectedItem = multiselectSelected(selected, categories);
  return <GroupMultiselect label='Category' options={categories} selectedItem={selectedItem} setSelectedItem={setSelected}/>
}

export default CategoryDropdown;
