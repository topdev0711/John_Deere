// Unpublished Work © 2022 Deere & Company.
import React, { useState } from 'react';
import { Form } from "react-bootstrap";
import Select from './../Select';

const DEFAULT_SELECTION = 'User Defined Lineage';
const DEFAULT_SCHEMA = { id: DEFAULT_SELECTION, label: DEFAULT_SELECTION, value: DEFAULT_SELECTION };

const DropdownSchema = ({ schemas = [DEFAULT_SCHEMA], setSelectedSchema }) => {
  const handleSchemaListChange = (schemaSelect) => {
    const schema = schemaSelect.value === DEFAULT_SCHEMA.value ? null : schemaSelect;
    setSelection(schema);
    setSelectedSchema(schema);
  }

  const schemasList = [...schemas, DEFAULT_SCHEMA];
  const [selection, setSelection] = useState(schemasList.filter(schema => schema.value === DEFAULT_SCHEMA.value));

  return (
    <div className="lineage-dropdown">
      <Form.Group controlId="formGridCat">
        <Form.Label>Resource</Form.Label>
        <Select
          placeholder="Select Resource"
          instanceId="resource"
          onChange={value => { handleSchemaListChange(value) }}
          options={schemasList}
          value={selection}
        />
      </Form.Group>
    </div>
  );
}

export default DropdownSchema;
