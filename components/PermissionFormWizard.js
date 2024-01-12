import React from 'react';
import {FormGroup} from 'react-bootstrap'
import Select from "./Select";
import Spacer from "./Spacer";

const Radio = ({id, checked, onClick, label}) => (
  <span className="custom-control custom-control-inline custom-radio">
    <input
      type="radio"
      id={id}
      className="custom-control-input"
      checked={checked}
      onChange={onClick}
    /><label
    className="custom-control-label" htmlFor={id}>{label}</label>
  </span>
);

export default class PermissionFormWizard extends React.Component {
  state = {
    selected: null,
    updateExisting: false
  };

  render() {
    
    const {options = [], onPermissionSelected = (_val) => {}, buttonSelected} = this.props;
    const {selected, updateExisting} = this.state;

    const setUpdateExisting = (value) => {
      buttonSelected(value)
      this.setState({updateExisting: value}, () => setSelected(null));
    };

    const setSelected = (value) => {
      this.setState({selected: value}, () => onPermissionSelected(this.state.selected));
    };

    const getOptionLabels = (item) => {
      const { isViewRequest } = this.props;
      const isSystem = item.isDisabled && isViewRequest && item.roleType === "system"
      const isPendingChanges = item.isDisabled && item.roleType !== "system"
      if (isSystem) return `${item.name} (system not allowed for views)`
      if (isPendingChanges) return `${item.name} (pending changes)`
      return item.name
    }

    return (
      <FormGroup>
        <fieldset>
          <Radio
            id="radio1"
            label="Create New..."
            checked={!updateExisting}
            onClick={() => setUpdateExisting(false) }
          />
          <Radio
            id="radio2"
            label="Update Existing..."
            checked={updateExisting}
            onClick={() => setUpdateExisting(true)}
          />
          {updateExisting &&
          <>
            <Spacer height="12px"/>
            <Select
              onChange={setSelected}
              value={selected}
              placeholder="Select permission to update..."
              noOptionsMessage={() => "You don't have access to any permissions"}
              options={options}
              getOptionLabel={ getOptionLabels }
            />
          </>
          }
        </fieldset>
      </FormGroup>
    );
  }
}
