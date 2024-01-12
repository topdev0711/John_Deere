import React from "react";
import {Col, Form} from "react-bootstrap";
import Select from "../Select";

const GroupMultiselect = ({label, isSorted = false, options, selectedItem, setSelectedItem, isLoading=false}) => {
  const handleOnChange = (field) => setSelectedItem(field);
  return (
    <Form.Group as={Col} controlId={`formGrid${label}Filter`}>
      <Form.Label>{label}</Form.Label>
      <Select id={label} instanceId={`${label}Selector`} options={options} value={selectedItem} isSorted={isSorted} onChange={handleOnChange} isMulti isLoading={isLoading}/>
    </Form.Group>
  );
}

export default GroupMultiselect;
