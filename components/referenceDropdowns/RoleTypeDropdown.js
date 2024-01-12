import React from "react";
import GroupSelect from "./GroupSelect";

const RoleTypeDropdown = ({selected, setSelected}) => {
  if(typeof(selected) === 'string') setSelected({id: selected, name: selected})
  const roleTypes = [{ id: 'human', name: 'human' }, { id: 'system', name: 'system' }];
  return <GroupSelect label='Role Type' options={roleTypes} selectedItem={selected} setSelectedItem={setSelected}/>
}

export default RoleTypeDropdown;
