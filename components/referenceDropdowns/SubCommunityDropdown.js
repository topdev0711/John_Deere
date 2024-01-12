import React from "react";
import {useAppContext} from "../AppState";
import GroupMultiselect from "./GroupMultiselect";
import {multiselectSelected} from "./dropdownValidation";

const getSubcommunities = c => c.subCommunities;
const merge = (a, b) => a.concat(b);
const getName = record => record.name;

const SubCommunityDropdown = ({selected, setSelected, selectedDependency = []}) => {
  const globalContext = useAppContext();
  const {communities} = globalContext.referenceData;
  const allSubcommunities = communities.map(getSubcommunities).reduce(merge, []);
  const selectedCommunities = multiselectSelected(selectedDependency, communities);

  const createUniqueItems = subcommunityObjects => {
    const names = subcommunityObjects.map(getName);
    const uniqueNames = [...(new Set(names))];
    return uniqueNames.map(name => ({id: name, name}));
  }

  const createSelectedItem = () => {
    const subcommunityObjects =  multiselectSelected(selected || [], allSubcommunities);
    return createUniqueItems(subcommunityObjects);
  }

  const isSelectedCommunity = community => selectedCommunities.some(selectedComm => selectedComm.id === community.id);
  const hasCommunities = () => selectedDependency && selectedCommunities.length;
  const findSubcommunities = () => communities.filter(isSelectedCommunity).map(getSubcommunities).reduce(merge, []);
  const subCommunityOptions = () => {
    const subcommunityObjects = hasCommunities() ? findSubcommunities() : allSubcommunities;
    return createUniqueItems(subcommunityObjects);
  }

  return <GroupMultiselect label='Sub-Community' options={subCommunityOptions()} selectedItem={createSelectedItem()} setSelectedItem={setSelected}/>
}

export default SubCommunityDropdown;
