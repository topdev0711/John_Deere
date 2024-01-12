import {useEffect, useState} from 'react';
import {Form, Button, Col, Row} from 'react-bootstrap';
import {MdAdd} from 'react-icons/md';
import OptionalSourceField from './OptionalSourceField';
import RequiredSourceField from './RequiredSourceField';
import SourceSelect from './SourceSelect';
import uuidv4 from 'uuid/v4';

export const KeyValueHeader = () => <Row style={{'padding-bottom': '10px'}}>
  <Col className='mb-0'>Key</Col>
  <Col className='mb-0'>Value</Col>
  <Col styles={{float: 'left'}} className='mb-0'>Delete</Col>
</Row>

const SourceForm = ({sources = [], setSources, sourceIndex}) => {
  const [source, setSource] = useState(sources[sourceIndex]);

  useEffect(() => {
    const sourcesUpdate = [...sources];
    sourcesUpdate[sourceIndex] = source;
    setSources(sourcesUpdate);
  }, [source]);

  const { type, namespace, comments, uiId, ...optionalFields} = source;
  const hasOptionalFields = !!Object.keys(optionalFields).length;

  const renderOptionalField = entry => <OptionalSourceField entry={entry} key={entry[1].id} source={source} setSource={setSource}/>;
  const renderAdditionalFields = Object.entries(optionalFields).map(renderOptionalField);

  const keyName = `key${Object.keys(source).length}`;
  const addField = () => setSource({...source, [keyName]: {id: uuidv4(), value: ''}});
  const addButton = <Button onClick={addField}><MdAdd size='16'/>Add Field</Button>

  return (
    <Form>
      <SourceSelect entry={['type', type]} source={source} setSource={setSource}/>
      <RequiredSourceField entry={['namespace', namespace]} source={source} setSource={setSource} sources={sources}/>
      <RequiredSourceField entry={['comments', comments]} source={source} setSource={setSource}/>
      <Row><Col style={{'padding-top': '20px', 'padding-bottom': '10px'}}><h4>Additional details</h4><hr/></Col></Row>
      {hasOptionalFields && <KeyValueHeader />}
      {renderAdditionalFields}
      <Row><Col>{addButton}</Col></Row>
    </Form>
  );
}

export default SourceForm;
