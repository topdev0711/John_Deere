import React from "react";
import {Col, Form} from "react-bootstrap";
import Select from "../Select";

const GroupSelect = ({key, label, isSorted = false, options, selectedItem, setSelectedItem}) => {
  const handleOnChange = (field) => setSelectedItem(field);
  return (
    <Form.Group as={Col} controlId={`formGrid${key}Filter`}>
      <Form.Label>{label}</Form.Label>
      <Select id={key} instanceId={`${key}Selector`} options={options} isClearable value={selectedItem} isSorted={isSorted} onChange={handleOnChange}/>
    </Form.Group>
  );
}

export default GroupSelect;
