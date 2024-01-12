import React from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Spacer from '../../Spacer';
import Select from '../../Select';
import uuid from 'uuid';
import Dropzone from './Dropzone';
import utils from '../../utils'
import Alert from "react-bootstrap/Alert";

import dynamic from 'next/dynamic'
import { MdAdd } from 'react-icons/md';
import ValidatedInput from '../../ValidatedInput';

const {
  attributeForName,
  schemaForm: { getDataTypeOptions }
} = utils;
const dataTypeOptions = getDataTypeOptions();
const SchemaFieldForm = dynamic(
  () => import('./SchemaFieldForm'),
  { ssr: false }
);

function isOfType(thing, type) {
  return (thing || '').includes(type);
}

function getValue(field, from, defaultValue) {
  return parseInt(from[field] || defaultValue);
}

function getType(field) {
  let type = typeof field.type === 'string' ? field.type : (field.type || {}).type;;
  let scale = 0;
  let precision = 10;
  let isNullable = false;
  if (Array.isArray(field.type)) {
    isNullable = field.type[0] === 'null';
    type = field.type.filter(t => t !== 'null').reverse()[0];
    if (isOfType(type.logicalType, 'timestamp')) {
      type = 'timestamp';
    }
    if (isOfType(type.logicalType, 'date')) {
      type = 'date';
    }
    if (isOfType(type.logicalType, 'decimal')) {
      scale = getValue('scale', type, scale);
      precision = getValue('precision', type, precision);
      type = 'decimal';
    }
  }
  if (isOfType(field.type.logicalType, 'timestamp')) {
    type = 'timestamp';
  }
  if (isOfType(field.type.logicalType, 'date')) {
    type = 'date';
  }
  if (isOfType(field.type.logicalType, 'decimal')) {
    type = 'decimal';
    scale = getValue('scale', field.type, scale);
    precision = getValue('precision', field.type, precision);
  }
  return {type, scale, precision, isNullable};
}

function SchemaForm(props) {
  const {
    currentSchema,
    onSchemaChange: onChange,
    onTableNameChange: onTableChange,
    handleMdPreview,
    isFieldEnabled,
    errors,
    tableNameError,
    handleClick,
    tableName: currentTableName,
    phase
  } = props;
  const [schema, setSchema] = React.useState(currentSchema);
  const [modal, setModal] = React.useState();
  const [tableName, setTableName] = React.useState(currentTableName);

  React.useEffect(() => onSchemaChange(schema, tableName), [schema]);
  React.useEffect(() => onTableNameChange(schema, tableName), [tableName]);

  const onSchemaChange = (updatedSchema, tableName) => onChange(updatedSchema, false, tableName);
  const onTableNameChange = (updatedSchema, tableName) => onTableChange(updatedSchema, tableName);

  const onFieldChange = (field) => {
    const { fields } = schema;
    const updated = fields.map(f => {
      if (f.id === field.id) {
        return field;
      }
      return f;
    });
    setSchema({ ...schema, fields: updated });
  }

  const addField = () => {
    const newField = {
      id: uuid.v4(),
      name: '',
      nullable: false,
      description: '',
      attribute: { id: 'None', name: 'None' },
      datatype: { id: 'int', name: 'int' },
    }

    const fields = [...schema.fields, newField];

    setSchema({ ...schema, fields: fields });
  }

  const removeField = (id) => {
    const { fields } = schema;
    const newFields = fields.filter(f => f.id != id);
    setSchema({ ...schema, fields: newFields });
  }

  const findDataTypeByName = (name) => {
    return dataTypeOptions.find(dt => dt.name === name);
  }

  const fieldTypeForColumn = (column, row) => {
    try {
      const value = row[column]
      if (typeof value === 'number' && `${value}`.includes('.')) {
        return findDataTypeByName('double')
      } else if (typeof value === 'number' && `${value}`.length > 9) {
        return findDataTypeByName('long')
      } else if (typeof value === 'number' && `${value}`.length <= 9) {
        return findDataTypeByName('int')
      } else if (typeof value === 'object' && typeof value.getMonth === 'function') {
        return findDataTypeByName('timestamp')
      }
    } catch (e) {
      console.log(e)
    }
    return { id: "string", name: 'string' }
  }

  const handleAsAvdl = (binaryStr) => {
    const avsc = require('avsc');
    const detail = avsc.readProtocol(binaryStr);
    const inner = ((detail.types || [])[0] || {fields: []});
    const partitions = inner.partition || [];
    const id = inner.id || [];
    const testing = inner.status === 'test';
    const fields = inner.fields.map(field => {
      const isId = !!(field.type || {}).id;
      const isExtract = !!(field.type || {}).extract_time;
      const isDeleteInd = !!(field.type || {}).delete_indicator;
      let attr = attributeForName('None');
      if (isId || id.includes(field.name)) {
        attr = attributeForName('id');
      } else if (isExtract) {
        attr = attributeForName('extract time')
      } else if (isDeleteInd) {
        attr = attributeForName('delete indicator')
      }

      const {type,scale,precision,isNullable} = getType(field);

      const typeObj = findDataTypeByName(type);
      return {
        id: uuid.v4(),
        name: field.name || '',
        datatype: typeObj,
        description: field.doc || '',
        attribute: attr,
        nullable: attr.name === 'None' && isNullable,
        scale: type === 'decimal' ? scale : undefined,
        precision: type === 'decimal' ? precision : undefined
      }
    });
    setSchema({
      ...schema,
      name: !schema.name ? (detail.protocol || '') : schema.name,
      description: !schema.description ? (inner.doc || '') : schema.description,
      fields: schema.fields.filter(f => f.name !== '').concat(fields),
      partitionedBy: partitions,
      updateFrequency: schema.updateFrequency,
      testing
    })
  }

  const handleAsCsv = (binaryStr) => {
    utils.parseCsvData(binaryStr, {
      delimiter: ',',
      cast: true,
      cast_date: true,
      columns: true,
      to: 1
    }, (err, output) => {
      if (err) {
        throw new Error('Reading of the sample csv file failed.');
      } else {
        if (output && output.length) {
          const row = output[0]
          const cols = Object.keys(row).filter(k => k && k.length)
          const fields = cols.map(c => ({
            id: uuid.v4(),
            datatype: fieldTypeForColumn(c, row),
            attribute: attributeForName('None'),
            name: c
          }))
          setSchema({
            ...schema,
            fields: schema.fields.filter(f => f.name !== '').concat(fields)
          })
        } else {
          throw new Error('It seems the example csv file does not contain a header row.');
        }
      }
    })
  }

  const handleAcceptedFileDrop = ([file]) => {
    try {
      const reader = new FileReader()

      reader.onabort = () => setModal({ body: 'Reading of the sample file was aborted.' });
      reader.onerror = () => setModal({ body: 'Reading of the sample file failed.' });
      reader.onload = () => {
        const binaryStr = reader.result
        const fileExtension = file ? file.path.split(".")[1] : null;
        try {
          if (fileExtension === 'avdl') throw new Error('file has AVDL extension')
          handleAsCsv(binaryStr);
        } catch (_err) {
          try {
            handleAsAvdl(binaryStr);
          } catch (_err2) {
            console.log(_err2);
            setModal({ body: 'Reading of the sample file failed. Your browser may not be supported for this feature.' })
          }
        }
      }

      reader.readAsBinaryString(file)
    } catch (_err) {
      setModal({ body: 'Reading of the sample file failed. Your browser may not be supported for this feature.' })
    }
  }

  return (
    schema != null &&
    <>
      <Modal size="lg" show={!!modal} onHide={() => setModal(null)}>
        <Modal.Header>Invalid Sample Data</Modal.Header>
        <Modal.Body>{(modal || {}).body}</Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setModal(null)}>OK</Button></Modal.Footer>
      </Modal>
      {schema.linkedFrom &&
      <Alert variant="warning">
          <div className="text-muted small mb-0">
            A linked schema can only be edited within the original dataset. Please go to <Button variant="link" style={{padding: 0, marginTop: "-5px"}} onClick = {() => handleClick(`/catalog/datasets/detail?id=${schema.linkedFrom.id}`)}>
              {schema.linkedFrom.name}
            </Button> to modify.
          </div>
      </Alert>
      }
      {!schema.linkedFrom && !isFieldEnabled(true) &&
      <Alert variant="warning">
          <div className="text-muted small mb-0">
            Limited changes are allowed since this schema has already been processed by EDL. To make additional changes, duplicate to create a new version.
            {!!schema.linkedDatasets && schema.linkedDatasets.length > 0 &&
              <>
                <br/>
                Removal is not allowed on schemas that are linked in other datasets.
              </>
            }
          </div>
      </Alert>
      }
      <Form.Row>
        <Form.Group as={Col} controlId="formGridName" key='name'>
          <Form.Label>Name</Form.Label>
          <ValidatedInput
            component={Form.Control}
            onBlur={(e) => setSchema({ ...schema, name: e.target.value })}
            defaultValue={schema.name}
            type="text"
            disabled={!isFieldEnabled(true)}
            placeholder="Unique name for the new schema"
            isInvalid={!!errors.some(({ context: { key }, path = [] }) => key === 'name' && !path.includes('fields'))}
            invalidMessage="Must provide a name unique to this dataset. 200 characters max."
          />
        </Form.Group>
        <Form.Group as={Col} controlId="formGridVersion" key='version'>
          <Form.Label >Version</Form.Label>
          <ValidatedInput
            component={Form.Control}
            onBlur={(e) => setSchema({ ...schema, version: e.target.value })}
            disabled={!isFieldEnabled(true)}
            defaultValue={schema.version}
            type="text"
            placeholder="Version for the new schema"
            isInvalid={!!errors.some(({ context: { key } }) => key === 'version')}
            invalidMessage="Must provide a semantic version (ie. 1.0.0)"
          />
        </Form.Group>
      </Form.Row>
      <Form.Row>
        <Form.Group as={Col} controlId="formGridUpdateFrequency" key='updateFrequency'>
          <Form.Label>Update Frequency <i className="text-muted small"></i></Form.Label>
          <ValidatedInput
            component={Select}
            id="updateFrequency"
            onChange={(selections) => setSchema({ ...schema, updateFrequency: (selections.name) })}
            options={[{ 'id': 'Streaming', 'name': 'Streaming' }, { 'id': 'Hourly', 'name': 'Hourly' },
            { 'id': 'Daily', 'name': 'Daily' }, { 'id': 'Weekly', 'name': 'Weekly' },
            { 'id': 'Monthly', 'name': 'Monthly' }, { 'id': 'Annually', 'name': 'Annually' },
            { 'id': 'Never', 'name': 'Never' }, { 'id': 'Others', 'name': 'Others' }]}
            isSorted={true}
            value={schema.updateFrequency ? { value: schema.updateFrequency, label: schema.updateFrequency } : null}
            noOptionsMessage={() => 'No Options available'}
            placeholder="Select the frequency at which the schema will be updated"
            isInvalid={!!errors.some(({ message }) => (message || '').includes('updateFrequency'))}
            invalidMessage="Update Frequency cannot be empty"
          />
        </Form.Group>
      </Form.Row>

      {(phase || '').toLowerCase() === 'enhance' && <Form.Group controlId="formGridTableName" key='tableName'>
        <Form.Label>Table Name {!!currentTableName && <small style={{ color: '#aaa' }}>(changing a table name will affect all schema versions and may break existing consumers)</small>}</Form.Label>
        <ValidatedInput
          component={Form.Control}
          onBlur={(e) => setTableName(e.target.value)}
          defaultValue={currentTableName}
          type="text"
          key={currentTableName}
          placeholder="(Optional) The name of the table associated with this schema (version will be added onto the end)"
          isInvalid={!!tableNameError}
          invalidMessage="The table name must be less than 100 alphanumeric characters or underscores"
        />
      </Form.Group>}

      <Form.Group controlId="formGridDescription" key='description'>
        <Form.Label>Description</Form.Label>
        <ValidatedInput
          component={Form.Control}
          onBlur={(e) => setSchema({ ...schema, description: e.target.value })}
          defaultValue={schema.description}
          type="text"
          placeholder="Description of the schema"
          disabled={!isFieldEnabled()}
          isInvalid={!!errors.some(({ context: { key } }) => key === 'description')}
          invalidMessage="Must provide a description less than 200 characters"
        />
      </Form.Group>

      <Form.Group controlId="formGridDocs" key='documentation'>
        <Form.Label>Documentation (<a href="components/datasets/edit/SchemaForm#" onClick={(e) => handleMdPreview(e, schema.documentation)}>preview</a>)</Form.Label>
        <ValidatedInput
          key={schema.documentation}
          component={Form.Control}
          onBlur={(e) => setSchema({ ...schema, documentation: e.target.value })}
          defaultValue={schema.documentation}
          as="textarea"
          style={{ fontFamily: 'initial' }}
          placeholder="(Optional) Additional documentation (markdown supported)"
          disabled={!isFieldEnabled()}
          isInvalid={!!errors.some(({ context: { key } }) => key === 'documentation')}
          invalidMessage="Documentation cannot exceed 3500 characters"
        />
      </Form.Group>

      <Form.Row>
        <Form.Group as={Col} id={`formGridtesting`}>
          <Form.Check
            checked={!!schema.testing}
            onChange={({ target: { checked } }) => setSchema({ ...schema, testing: checked })}
            type="checkbox"
            label="For Testing"
            id={`for-testing-checkbox-${schema.id}`}
            disabled={!isFieldEnabled()}
            custom
          />
        </Form.Group>
      </Form.Row>

      <Spacer />
      <Form.Row>
        <Form.Group as={Col} key='keyLabel' className="mb-0">
          <h4>Fields</h4>
        </Form.Group>
      </Form.Row>
      <>
      <hr />
      <div hidden={!schema.isNew || !!schema.linkedFrom}>
        <Dropzone
          onDropAccepted={handleAcceptedFileDrop}
          onDropRejected={() => { setModal({ body: 'You may only select a single file at a time and it must be CSV or AVDL format.' }) }}
        />
        <br/>
      </div>
        <SchemaFieldForm
          key={schema.fields.length}
          onFieldChange={onFieldChange}
          canEdit={isFieldEnabled(true)}
          rows={schema.fields}
          removeField={removeField}
          locked={!isFieldEnabled()}
          errors={errors.filter(err => (err.path || []).includes('fields') || !!err.fields)}
        />
        <br/>
        <div className="float-right">
          <Button testlocator="addFieldButton" disabled={!isFieldEnabled(true)} onClick={addField} size="sm" variant="outline-primary"><MdAdd /> Add Field</Button>
        </div>
        <Spacer />
      <hr />
      <Form.Row>
        <Form.Group as={Col} controlId="formGridPartition" key='partition'>
            <Form.Label>Partitions <i className="text-muted small">(Selection order will be partition order)</i></Form.Label>
          <ValidatedInput
            component={Select}
            onChange={(selections) => setSchema({ ...schema, partitionedBy: (selections || []).map(item => item.name)})}
            options={schema.fields.filter(f => !f.nullable && !!f.name).map(f => {
              return {id:f.name, name:f.name}
            })}
            value={(schema.partitionedBy || []).map(p => ({id: p, name: p}))}
            placeholder="(Optional) Select..."
            isMulti={true}
            isDisabled={!isFieldEnabled(true)}
            noOptionsMessage={() => 'No non-nullable fields available'}
            isInvalid={!!errors.some(({ message }) => (message || '').includes('partition'))}
            invalidMessage="Partitions cannot contain nullable fields nor contain all ID fields"
          />
          </Form.Group>
      </Form.Row>
      </>
    </>
  );
}
/* istanbul ignore next */
export default SchemaForm;
