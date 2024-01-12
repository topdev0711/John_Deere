import Accordion from '../../Accordion';
import {MdAdd, MdDelete} from 'react-icons/md';
import React, {useState} from 'react';
import {Button, Col, Form} from 'react-bootstrap';
import SourceForm from './SourceForm';
import SourceUtils from '../../utils/SourceUtils';

const styles = {
  add: {
    float: 'right',
    marginTop: '-4px',
    whiteSpace: 'nowrap'
  }
};

const SourcesEdit = ({sources=[], setSources, datasetErrors=[], showSourceError, setModal}) => {
  const [activeKey, setActiveKey] = useState(undefined);
  const sourceUtils = new SourceUtils(sources, setSources);

  if(!sourceUtils.hasAllIds()) {
    sourceUtils.setSourcesWithIds();
    return <div id='sources-edit-loading'>Loading...</div>
  }

  const renderAddButton = () => {
    const addSourcesOnClick = () => setActiveKey(sourceUtils.addSource());
    const variant = showSourceError ? 'outline-danger' : 'outline-primary';
    return <Button id='addSource' style={styles.add} onClick={addSourcesOnClick} size='sm' variant={variant}><MdAdd/> Add Source</Button>
  }

  const renderSource = (source, index) => {
      return {
        id: source?.uiId?.id,
        filterContent: source,
        actions: [{
          text: 'Remove',
          icon: <MdDelete size='18' />,
          handler: setModal.bind(this, { action: 'remove', onAccept: () => sourceUtils.removeSource(source) })
        }],
        header: (
          <>
            <span style={{ display: 'block' }} className='text-muted small'><b>type:</b> <i>{source.type?.value || 'None'}</i></span>
            <span style={{ display: 'block' }} className='text-muted small'><b>namespace:</b> <i>{source.namespace?.value || 'None'}</i></span>
          </>
        ),
        invalid: datasetErrors.some(err => (err.path || []).filter(x => x[0] === 'sources').some(x => x === index)),
        body: <SourceForm initialSource={source} sources={sources} setSources={setSources} sourceIndex={index}/>
      }
  }

  const renderSources = () => {
    const items = sources.map(renderSource);
    return (<Accordion key='sources-edit-accordion' activeKey={activeKey} items={items} />)
  }

  return <>
    <Form.Row>
      <Form.Group as={Col} className='mb-0'><h4>Source Details</h4></Form.Group>
      <Form.Group as={Col} className='mb-0'>{renderAddButton()}</Form.Group>
    </Form.Row>
    {showSourceError && <Form.Text className='text-danger .d-block'>Must add at least one source.</Form.Text>}
    <hr/>
    {!!sources.length && renderSources()}
  </>
}

export default SourcesEdit;
