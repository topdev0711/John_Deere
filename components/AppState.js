import React, {useContext} from 'react';

const Context = React.createContext();

export default Context;
export const AppStateProvider = Context.Provider;
export const AppStateConsumer = Context.Consumer;
export const useAppContext = () => useContext(Context);
export const getLoggedInUser = () => {
  const context = useAppContext();
  return context.loggedInUser;
};

const hasAdGroupToggleEnabled = (toggle, groups=[]) => toggle?.enabled && (!toggle.adGroups || toggle.adGroups.some(adGroup => groups.includes(adGroup)));

export const isToggleEnabled = toggle => {
  const {toggles, loggedInUser} = useAppContext();
  return hasAdGroupToggleEnabled(toggles[toggle], loggedInUser.groups) || false;
}
