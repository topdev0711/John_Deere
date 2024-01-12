import React  from 'react'
import { Grid, Input, Select } from 'react-spreadsheet-grid'
import { Form, Button, Modal, Col } from 'react-bootstrap';
import { MdDelete } from 'react-icons/md';
import utils from '../../utils';
import ValidatedInput from '../../ValidatedInput';

const { attributeOptions, getDataTypeOptions } = utils.schemaForm;
const dataTypeOptions = getDataTypeOptions(true);

class PrecisionScale extends React.Component {
  state = {
    precision: 10,
    scale: 0
  }

  componentDidMount() {
    this.setState({
      precision: this.props.precision || 10,
      scale: this.props.scale || 0
    })
  }

  render() {
    const {precision, scale} = this.state
    const {onChange} = this.props

    return (
      <>
        <Form.Group key="precision" as={Col} id="FormGridprecision">
          <Form.Label>Precision (total number of digits)</Form.Label>
          <Form.Control
            id='precision'
            onChange={(e) => {
              const input = Number(e.target.value);
              this.setState({ precision: input }, () => onChange(this.state))
            }}
            type="number"
            min="1"
            max="38"
            value={precision}
            placeholder="Enter precision..."
          />
        </Form.Group>
        <Form.Group key="scale" as={Col} id="FormGridscale">
          <Form.Label>Scale (number of digits to the right of the decimal)</Form.Label>
          <Form.Control
            id='scale'
            onChange={(e) => {
              const input = Number(e.target.value);
              this.setState({ scale: input }, () => onChange(this.state))
            }}
            type="number"
            min="0"
            max="38"
            value={scale}
            placeholder="Enter scale..."
          />
        </Form.Group>
      </>
    )
  }
}

export default class SchemaFieldForm extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      modal: null
    }
  }

  onFieldChange(rowId, field, value) {
    const { onFieldChange: callback, rows } = this.props;
    const isAttribute = field === 'attribute';
    const isDatatype = field === 'datatype';
    let newDatatype;

    if (isAttribute) {
      const option = attributeOptions.find(a => a.id === value)
      value = option.name
      newDatatype = option.datatype
    }
    if (isDatatype) {
      value = dataTypeOptions.find(a => a.id === value).name;
    }

    const row = rows.find(({id}) => id === rowId);
    if(value == 'decimal') {
      this.setScaleAndPrecision(value, field, row);
    } else {
      row[field] = value;
      row.datatype = newDatatype || row.datatype;
      row.nullable = isAttribute && value.id !== 'None' ? false : row.nullable;

      callback(row)
    }
  }

  initColumns(errors) {
    const hasError = (field, {index, name = ''}) => errors.some(({ context: { key }, path, fields = [] }) => {
      if (field === 'name' && !!fields.length) {
        return fields.includes(name);
      }
      return (key === field && (path || []).includes(index));
    })
    return [
      {
        title: 'Name',
        value: (row, { focus }) => {
          return (
            <ValidatedInput
              component={Input}
              value={row.name}
              focus={focus}
              onChange={this.onFieldChange.bind(this, row.id, 'name')}
              isInvalid={hasError('name', row)}
              invalidMessage={'Must provide name unique within this schema (letters, numbers, and underscores only)'}
              invalidPopover={true}
            />
          );
        },
        getCellClassName: (row) => {
          return hasError('name', row) ? 'is-invalid' : ''
        },
        id: 'name'
      },
      {
        title: 'Description',
        value: (row, { focus }) => {
          return (
            <ValidatedInput
              component={Input}
              value={row.description}
              focus={focus}
              onChange={this.onFieldChange.bind(this, row.id, 'description')}
              isInvalid={hasError('description', row)}
              invalidMessage={'Description must be 200 characters or less'}
              invalidPopover={true}
            />
          );
        },
        getCellClassName: (row) => {
          return hasError('description', row) ? 'is-invalid' : ''
        },
        id: 'description'
      },
      {
        title: 'Data Type',
        value: (row, { focus }) => {
          return (
            <Select
              instanceId={'dataType'+row.id}
              selectedId={row.datatype.name || row.datatype}
              isOpen={focus}
              items={this.getDatatypes(row.id)}
              onChange={this.onFieldChange.bind(this, row.id, 'datatype')}
            />
          );
        },
        id: 'datatype'
      },
      {
        title: 'Attribute',
        value: (row, { focus }) => {
          return (
            <Select
              instanceId={'attribute'+row.id}
              selectedId={row.attribute.name || row.attribute}
              isOpen={focus}
              items={attributeOptions}
              onChange={this.onFieldChange.bind(this, row.id, 'attribute')}
            />
          );
        },
        id: 'attribute'
      },
      {
        title: 'Allow Missing',
        value: (row, { focus }) => {
          return (
            <Select
              instanceId={'nullable'+row.id}
              selectedId={!!row.nullable ? '1' : '0'}
              isOpen={focus}
              items={[{id: '1', name: 'Yes'}, {id: '0', name: 'No'}]}
              onChange={(value) => this.onFieldChange(row.id, 'nullable', value === '1')}
            />
          );
        },
        id: 'nullable'
      },
      {
        title: 'Delete',
        value: (row) => {
          return (
            <Button onClick={() => this.props.removeField(row.id)} size="sm" variant="outline-dark"><MdDelete/></Button>
          );
        },
        id: 'delete'
      }
    ];
  }

  setScaleAndPrecision(value, field, row) {
    this.setState({ modal:
      {
        header: 'Please enter a precision and scale value greater than zero.',
        body: <PrecisionScale scale={row.scale} precision={row.precision} onChange={(values) => {
          row = {...row, ...values}
        }} />,
        footer: <Button id='fieldFormSubmit' variant="secondary" onClick={() => {
          if(row.scale == undefined) row = {...row, scale: 0};
          if(row.precision == undefined) row = {...row, precision: 10};
          if(row.scale > row.precision) row = {...row, scale: row.precision}
          this.submit(row, field, value);
        }}>Accept</Button>
      }
    })
  }

  getDatatypes(rowId){
    const { rows } = this.props;

    let datatypes = dataTypeOptions;
    const row = rows.find(({id}) => id === rowId)

    if (row.attribute === 'extract time') {
      return datatypes.filter(type => ['int', 'long', 'timestamp', 'date'].includes(type.name))
    }

    if(row.scale != undefined && row.precision != undefined) {
      datatypes = datatypes.map(d => {
        const newName = 'decimal (' + row.precision + ', ' + row.scale + ')'
        if(d.id == 'decimal'){
          d = {...d, name: newName}
        }
        return d
      })
    }
    return datatypes
  }

  submit(row, field, value) {
    const { onFieldChange: callback } = this.props;
    row[field] = value
    this.setState({modal: null})
    callback(row)
  }

  render() {
    const { rows, canEdit, locked, errors } = this.props;
    const { modal } = this.state;

    return (
      <div>
        <Modal show={!!modal} onHide={() => this.setState({modal: null})}>
          <Modal.Header>{(modal || {}).header}</Modal.Header>
          <Modal.Body>{(modal || {}).body}</Modal.Body>
          <Modal.Footer>{(modal || {}).footer}</Modal.Footer>
        </Modal>
        <Grid
          id='fieldGrid'
          columns={this.initColumns(errors)}
          rows={(rows || []).map((r, i) => ({...r, index: i}))}
          getRowKey={row => row.id}
          isColumnsResizable
          focusOnSingleClick={true}
          headerHeight={50}
          locked={locked}
          columnWidthValues={{'description': 30, 'name': 18}}
          disabledCellChecker={(row, columnId) => {
            const attr = (row.attribute || {}).name || row.attribute
            return  !!locked ||
                    (!canEdit && !['description'].includes(columnId))||
                    (columnId === 'delete' && rows.length === 1) ||
                    (columnId === 'datatype' && ["delete indicator"].includes(attr)) ||
                    (columnId === 'nullable' && attr !== 'None')
          }}
          isScrollable={false}
          blurCurrentFocus={true}
        />
      </div>
    )
  }
}
