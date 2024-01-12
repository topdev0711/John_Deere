import React, { useState, useCallback } from 'react';
import {Col, FormLabel, Row} from 'react-bootstrap';
import CreatableSelect from 'react-select/creatable';

const defaultFields = ['aws postgres rds', 'dataset', 'db2', 'IBM_zos',  'Sharepoint','aws mssql','aws mysql'];
const createOption = field => ({value: field, label: field});
const createDefaultOptions = value => {
  const fields = defaultFields.includes(value) ? defaultFields : [value, ...defaultFields];
  return fields.map(createOption);
}

const  SourceSelect = ({entry, source, setSource}) => {
  const [key, valueWithId] = entry;
  const [selectedValue, setSelectedValue] = useState(createOption(valueWithId.value));
  const [options, setOptions] = useState(createDefaultOptions(valueWithId.value));

  const updateSource = value => {
    const { [key]: anything, ...remainingFields } = source;
    const keyIndex = Object.keys(source).indexOf(key);
    const keyValues = Object.entries(remainingFields);
    keyValues.splice(keyIndex,0, [key, {id: valueWithId.id, value}]);
    setSource(Object.fromEntries(keyValues));
  }

  const handleChange = useCallback((inputValue) => {
    setSelectedValue(inputValue);
    updateSource(inputValue.value);
  }, []);

  const handleCreate = useCallback(
    inputValue => {
      const newValue = { value: inputValue.toLowerCase(), label: inputValue };
      setOptions([...options, newValue]);
      setSelectedValue(newValue);
      updateSource(inputValue);
    },
    [options]
  );
  return (
    <Row key={key}>
      <Col style={{'padding-bottom': '10px'}} className='mb-0'>
      <FormLabel>{key.charAt(0).toUpperCase() + key.slice(1)}</FormLabel>
      <CreatableSelect id='source-selector' value={selectedValue} options={options} onChange={handleChange} onCreateOption={handleCreate}/>
    </Col>
    </Row>
  );
}

export default SourceSelect;
