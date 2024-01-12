import React from "react";
import GroupSelect from "./GroupSelect";
import { useAppContext } from "../AppState";
import utils from "../utils";
import {VISIBILITY} from "../../src/utilities/constants"

const VisibilityDropdown = ({ selected, setSelected }) => {
  const { toggles } = useAppContext();
  const visibilityToggleEnabled = toggles['jdc.custodian_visibility_flag']?.enabled || false
  if (typeof (selected) === 'string') setSelected({ id: selected, name: utils?.getVisibilityEnumLabels(selected) })
  const options = [
    { id: VISIBILITY.NO_VISIBILITY, name: utils?.getVisibilityEnumLabels(VISIBILITY.NO_VISIBILITY) }, 
    { id: VISIBILITY.FULL_VISIBILITY, name: utils?.getVisibilityEnumLabels(VISIBILITY.FULL_VISIBILITY)}
  ];
  return(
  <>
    {
      visibilityToggleEnabled &&
        <GroupSelect label='Visibility' options={options} selectedItem={selected} setSelectedItem={setSelected} /> 
    }
  </>)
}

export default VisibilityDropdown;

