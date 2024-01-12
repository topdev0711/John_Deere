import React from "react";
import {Col, Form} from "react-bootstrap";
import {useAppContext} from "../AppState";
import CreatableSelect from "react-select/creatable";

const styles = {
  option: (base, { isFocused, isDisabled, isSelected }) => {
    let backgroundColor = 'white'
    if (isFocused && !isDisabled) {
      backgroundColor = 'rgba(50,127,36,.25)'
    } else if (isSelected && !isDisabled) {
      backgroundColor = '#367C2B'
    }
    return {...base, backgroundColor}
  },
  placeholder: (base) => ({...base, fontFamily: 'initial'}),
  control: (baseStyles, {isFocused}) => ({
    ...baseStyles,
    boxShadow: isFocused ? '0 0 0 .1875rem rgba(50,127,36,.25)' : 0,
    borderRadius: '2px',
    borderColor: '#666',
    '&:hover': {borderColor: '#666'}
  }),
}

const CreatedByDropdown = ({selected, setSelected}) => {
  const globalContext = useAppContext();
  const {loggedInUser} = globalContext;
  const options = [{ id: loggedInUser.username, name: loggedInUser.username }];
  const getOptionLabel = option => !!option.label ? option.label : option.name;
  const getOptionValue = option => option.id;
  const handleChange = fields => {
    const cleanedFields = fields?.map(field => (field?.name ? field : {id: field.label, name: field.label}));
    setSelected(cleanedFields);
  }

  return (
    <Form.Group as={Col} controlId={`formGrid-created-by-Filter`}>
      <Form.Label>Created By</Form.Label>
      <CreatableSelect isMulti options={options} styles={styles} value={selected} getOptionLabel={getOptionLabel} getOptionValue={getOptionValue} onChange={handleChange}/>
    </Form.Group>
  );
}

export default CreatedByDropdown;
