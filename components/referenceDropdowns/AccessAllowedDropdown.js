import React from "react";
import GroupSelect from "./GroupSelect";

const AccessAllowedDropdown = ({selected, setSelected}) => {
  if(typeof(selected) === 'string') setSelected({id: selected, name: selected})
  const options = [{ id: true, name: 'true' }, { id: false, name: 'false' }];
  return <GroupSelect label='Access Allowed' options={options} selectedItem={selected} setSelectedItem={setSelected}/>
}

export default AccessAllowedDropdown;