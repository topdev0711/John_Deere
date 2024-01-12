import {Button, Col, Form, FormControl, Row} from "react-bootstrap";
import {MdDelete} from "react-icons/md";
import {useState} from "react";

const bottomPad = {'padding-bottom': '10px'};
const removeStyle = {background: 'white', borderColor: 'black'};
const OptionalSourceField = ({entry, source, setSource}) => {
  const [key, valueWithId] = entry;
  const [inputKey, setInputKey] = useState(key);
  const [validKey, setValidKey] = useState(true);

  const removeField = () => {
    const {[key]: anything, ...remainingFields} = source;
    setSource(remainingFields);
  }

  const changeField = (e, createField) => {
    const {[key]: anything, ...remainingFields} = source;
    const keyIndex = Object.keys(source).indexOf(key);
    const keyValues = Object.entries(remainingFields);
    keyValues.splice(keyIndex, 0, createField(e));
    setSource(Object.fromEntries(keyValues));
  }

  const onKeyChange = ({target: {value: newValue}}) => {
    const keyAlreadyExists = Object.keys(source).includes(newValue);
    setValidKey(!keyAlreadyExists);

    if (keyAlreadyExists) {
      setInputKey(key);
      return;
    }

    setInputKey(newValue);
    const updateKeyField = e => [newValue, valueWithId];
    changeField(newValue, updateKeyField);
  }

  const onValueChange = e => {
    const updateKeyField = e => [key, {id: valueWithId.id, value: e.target.value}];
    changeField(e, updateKeyField);
  };

  return <Row style={bottomPad} >
    <Col className="mb-0">
      <FormControl id='key-field' type="text" value={inputKey} onChange={onKeyChange}/>
      {!validKey && <Form.Text style={{color: 'red'}}>cannot have duplicate key name</Form.Text>}
    </Col>
    <Col className="mb-0">
      <FormControl id='value-field' type="text" defaultValue={valueWithId.value} onChange={onValueChange}/>
    </Col>
    <Col className="mb-0"><Button style={removeStyle} onClick={removeField}><MdDelete size="16"/></Button></Col>
  </Row>
}

export default OptionalSourceField;
