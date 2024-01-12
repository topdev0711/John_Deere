import {Col, Form, Row} from 'react-bootstrap';
import {useState} from "react";

const RequiredSourceField = ({entry, source, setSource, sources}) => {
  const [key, valueWithId] = entry;
  const [inputValue, setInputValue] = useState(valueWithId.value);
  const [validKey, setValidKey] = useState(true);
  const isNamespace = key === 'namespace';

  const onChange = ({target: {value: newValue}}) => {
    const otherSources = isNamespace && sources.filter(({namespace}) => source.namespace.value !== namespace.value);
    const isDuplicate = isNamespace && otherSources.some(({namespace}) => newValue === namespace.value);

    if(isNamespace) setValidKey(!isDuplicate);

    if (isDuplicate) {
      setInputValue(source.namespace.value);
      return;
    }

    setInputValue(newValue);
    const {[key]: anything, ...remainingFields} = source;
    const keyIndex = Object.keys(source).indexOf(key);
    const keyValues = Object.entries(remainingFields);
    keyValues.splice(keyIndex, 0, [key, {id: valueWithId.id , value: newValue}]);
    setSource(Object.fromEntries(keyValues));
  };

  return <Row key={valueWithId.id}>
    <Col style={{'padding-bottom': '10px'}} className='mb-0'>
      <Form.Label>{key.charAt(0).toUpperCase() + key.slice(1)}</Form.Label>
      <Form.Control id='value-field' type='text' value={inputValue} onChange={onChange}/>
      {!validKey && <Form.Text id='duplicate-namespace' style={{color: 'red'}}>cannot have duplicate namespace</Form.Text>}
    </Col>
  </Row>
}

export default RequiredSourceField;
