import React from "react";
import GroupSelect from "./GroupSelect";

const PersonalInformationDropdown = ({selected, setSelected}) => {
  if(typeof(selected) === 'string') setSelected({id: selected, name: selected})
  const options = [{ id: true, name: 'true' }, { id: false, name: 'false' }];
  return <GroupSelect label='Personal Information' options={options} selectedItem={selected} setSelectedItem={setSelected}/>
}

export default PersonalInformationDropdown;
