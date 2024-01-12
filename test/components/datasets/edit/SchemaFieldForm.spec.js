import SchemaFieldForm from '../../../../components/datasets/edit/SchemaFieldForm'
import { Grid } from 'react-spreadsheet-grid'
import {shallow, mount } from 'enzyme';
import { Form, Button } from 'react-bootstrap';
import { act } from 'react-dom/test-utils'
import ValidatedInput from '../../../../components/ValidatedInput';

const fields = [{
  id: 'id1',
  name: 'field1',
  description: 'desc1',
  attribute: { id: "4", name: "None" },
  datatype: { id: "1", name: "int" },
  nullable: false
}]

describe('SchemaFieldForm test suite', () => {
  it('renders successfully', () => {
    const wrapper = shallow(
      <SchemaFieldForm
        errors={[]}
        onFieldChange={() => {}}
        canEdit={true}
        rows={fields}
        removeField={() => { }}
      />
    )
    expect(wrapper).toBeDefined()
  })

  it('renders with fields', () => {
    const wrapper = shallow(
      <SchemaFieldForm
        errors={[]}
        onFieldChange={() => { }}
        canEdit={true}
        rows={fields}
        removeField={() => { }}
      />
    )
    const grid = wrapper.find(Grid)
    expect(grid).toHaveLength(1)
    expect(grid.at(0).props().rows).toHaveLength(1)
    const columns = grid.at(0).props().columns
    expect(columns).toHaveLength(6)
    const getRowKeyFn = grid.at(0).props().getRowKey
    expect(getRowKeyFn({id: 'foo'})).toEqual('foo')
  })

  it('renders with fields disabled when canEdit false', () => {
    const wrapper = shallow(
      <SchemaFieldForm
        errors={[]}
        onFieldChange={() => { }}
        canEdit={false}
        rows={fields}
        removeField={() => { }}
      />
    )
    const grid = wrapper.find(Grid).at(0)
    const disabledCellChecker = grid.props().disabledCellChecker

    expect(disabledCellChecker({})).toEqual(true)
  })

  it('renders with fields disabled if locked', () => {
    const wrapper = shallow(
      <SchemaFieldForm
        errors={[]}
        onFieldChange={() => { }}
        canEdit={true}
        rows={fields}
        removeField={() => { }}
        locked={true}
      />
    )
    const grid = wrapper.find(Grid).at(0)
    const disabledCellChecker = grid.props().disabledCellChecker

    expect(disabledCellChecker({})).toEqual(true)
  })

  it('renders with delete column disabled when only one row', () => {
    const wrapper = shallow(
      <SchemaFieldForm
        errors={[]}
        onFieldChange={() => { }}
        canEdit={true}
        rows={fields}
        removeField={() => { }}
      />
    )
    const grid = wrapper.find(Grid).at(0)
    const disabledCellChecker = grid.props().disabledCellChecker

    expect(disabledCellChecker({}, 'delete')).toEqual(true)
  })

  it('renders with datatype column disabled when attribute is extract timestamp or delete indicator', () => {
    const wrapper = shallow(
      <SchemaFieldForm
        errors={[]}
        onFieldChange={() => { }}
        canEdit={true}
        rows={fields}
        removeField={() => { }}
      />
    )
    const grid = wrapper.find(Grid).at(0)
    const disabledCellChecker = grid.props().disabledCellChecker

    expect(disabledCellChecker({attribute: 'delete indicator'}, 'datatype')).toEqual(true)
  })

  it('renders with description and documentation enabled even when canEdit false', () => {
    const wrapper = shallow(
      <SchemaFieldForm
        errors={[]}
        onFieldChange={() => { }}
        canEdit={false}
        rows={fields}
        removeField={() => { }}
      />
    )
    const grid = wrapper.find(Grid).at(0)
    const disabledCellChecker = grid.props().disabledCellChecker

    expect(disabledCellChecker({}, 'description')).toEqual(false)
  })


  it('handle name value change', () => {
    const callback = jest.fn()
    const wrapper = shallow(
      <SchemaFieldForm
        errors={[]}
        onFieldChange={callback}
        canEdit={true}
        rows={fields}
        removeField={() => { }}
      />
    )

    const grid = wrapper.find(Grid).at(0)
    const columns = grid.props().columns

    const input = columns[0].value(fields[0], { focus: true })

    input.props.onChange('foo')

    expect(callback.mock.calls[0][0].name).toEqual('foo')
  })

  it('handle description value change', () => {
    const callback = jest.fn()
    const wrapper = shallow(
      <SchemaFieldForm
        errors={[]}
        onFieldChange={callback}
        canEdit={true}
        rows={fields}
        removeField={() => { }}
      />
    )

    const grid = wrapper.find(Grid).at(0)
    const columns = grid.props().columns

    const input = columns[1].value(fields[0], { focus: true })

    input.props.onChange('foo')

    expect(callback.mock.calls[0][0].description).toEqual('foo')
  })

  it('handle datatype value change', () => {
    const callback = jest.fn()
    const wrapper = shallow(
      <SchemaFieldForm
        errors={[]}
        onFieldChange={callback}
        canEdit={true}
        rows={fields}
        removeField={() => { }}
      />
    )

    const grid = wrapper.find(Grid).at(0)
    const columns = grid.props().columns

    const input = columns[2].value(fields[0], { focus: true })

    act(() => {
      input.props.onChange('string')
    })
    wrapper.update()

    expect(callback.mock.calls[0][0].datatype).toEqual('string')
  })

  it('should offer partial datatype list', () => {
    const callback = jest.fn()
    const wrapper = shallow(
      <SchemaFieldForm
        errors={[]}
        onFieldChange={callback}
        canEdit={true}
        rows={fields}
        removeField={() => { }}
      />
    );

    const grid = wrapper.find(Grid).at(0);
    const columns = grid.props().columns;
    const input = columns[2].value(fields[0], { focus: true });
    const types = input.props.items.map(item => item.id);

    expect(types).toContain('string');
    expect(types).not.toContain('array');
  })

  it('handle attribute value change to extract time', () => {
    const callback = jest.fn()
    const expectedDatatypes = [
      { id: "int", name: "int"},
      { id: "long", name: "long" },
      { id: "timestamp", name: "timestamp" },
      { id: "date", name: "date"},
    ]
    const wrapper = shallow(
      <SchemaFieldForm
        errors={[]}
        onFieldChange={callback}
        canEdit={true}
        rows={fields}
        removeField={() => { }}
      />
    )

    const grid = wrapper.find(Grid).at(0)
    const columns = grid.props().columns
    const attribute = columns[3].value(fields[0], { focus: true })
    const datatype = columns[2].value(fields[0], { focus: true })

    act(() => {
      attribute.props.onChange('extract time')
      datatype.props.onChange('long')
    })
    wrapper.update()

    expect(callback.mock.calls[0][0].attribute).toEqual('extract time')
    expect(grid.props().columns[2].value(fields[0], { focus: true }).props.items).toEqual(expectedDatatypes)
    expect(callback.mock.calls[0][0].datatype).toEqual('long')
  })

  it('handle attribute value change to delete indicator', () => {
    const callback = jest.fn()
    const wrapper = shallow(
      <SchemaFieldForm
        errors={[]}
        onFieldChange={callback}
        canEdit={true}
        rows={fields}
        removeField={() => { }}
      />
    )

    const grid = wrapper.find(Grid).at(0)
    const columns = grid.props().columns

    const input = columns[3].value(fields[0], { focus: true })

    act(() => {
      input.props.onChange('delete indicator')
    })
    wrapper.update()
    expect(callback.mock.calls[0][0].attribute).toEqual('delete indicator')
    expect(callback.mock.calls[0][0].datatype.name).toEqual('int')
  })

  it('handle nullability value change', () => {
    const callback = jest.fn()
    const wrapper = shallow(
      <SchemaFieldForm
        errors={[]}
        onFieldChange={callback}
        canEdit={true}
        rows={fields}
        removeField={() => { }}
      />
    )

    const grid = wrapper.find(Grid).at(0)
    const columns = grid.props().columns

    const input = columns[4].value(fields[0], { focus: true })

    input.props.onChange('1')

    expect(callback.mock.calls[0][0].nullable).toEqual(true)
  })

  it('handle row deletion', () => {
    const callback = jest.fn()
    const wrapper = shallow(
      <SchemaFieldForm
        errors={[]}
        onFieldChange={() => { }}
        canEdit={true}
        rows={fields}
        removeField={callback}
      />
    )

    const grid = wrapper.find(Grid).at(0)
    const columns = grid.props().columns

    const button = columns[5].value(fields[0])

    button.props.onClick()

    expect(callback.mock.calls[0][0]).toEqual(fields[0].id)
  })

  it('displays normal if no errors for name and description', () => {
    const wrapper = mount(
      <SchemaFieldForm
        errors={[]}
        onFieldChange={() => { }}
        canEdit={true}
        rows={fields}
      />
    )

    const grid = wrapper.find(Grid).at(0)
    const validatedInputs = grid.find(ValidatedInput)
    expect(validatedInputs).toHaveLength(2)
    expect(validatedInputs.at(0).props().isInvalid).toEqual(false)
    expect(validatedInputs.at(1).props().isInvalid).toEqual(false)
  })

  it('displays errors for invalid values for name and description', () => {
    const wrapper = mount(
      <SchemaFieldForm
        errors={[
          { context: { key: 'name' }, path: [0] },
          { context: { key: 'description' }, path: [0] }
        ]}
        onFieldChange={() => { }}
        canEdit={true}
        rows={fields}
      />
    )

    const grid = wrapper.find(Grid).at(0)
    const validatedInputs = grid.find(ValidatedInput)
    expect(validatedInputs).toHaveLength(2)
    expect(validatedInputs.at(0).props().isInvalid).toEqual(true)
    expect(validatedInputs.at(1).props().isInvalid).toEqual(true)
  })

  it('should display precision and scale values if non-negative is selected', () => {
    const callback = jest.fn();
    const wrapper = shallow(
      <SchemaFieldForm
        errors={[]}
        canEdit={true}
        rows={fields.map(f => ({...f, scale: 1, precision: 2}))}
        onFieldChange={callback}
      />
    );
    const grid = wrapper.find(Grid).at(0)
    const row = grid.props().rows[0]
    const datatypes = wrapper.instance().getDatatypes(row.id)
    expect(datatypes).toEqual(expect.arrayContaining([{id:"decimal", name: 'decimal (2, 1)'}]))
  })

  it('should allow the user to edit precision and scale values once set when decimal is chosen', () => {
    const callback = jest.fn();
    const wrapper = mount(
      <SchemaFieldForm
        errors={[]}
        canEdit={true}
        rows={fields}
        onFieldChange={callback}
      />
    );
    let grid = wrapper.find(Grid).filterWhere(g => g.props().id == 'fieldGrid');
    const datatypeColumn = grid.props().columns.filter(c => c.id === 'datatype');
    const input = datatypeColumn[0].value(fields[0], { focus: true });

    act(() => {
      input.props.onChange('decimal');
    })
    wrapper.update()

    let precision = wrapper.find(Form.Control).filterWhere(c => c.props().id == 'precision');
    let scale = wrapper.find(Form.Control).filterWhere(c => c.props().id == 'scale');

    act(() => {
      precision.props().onChange({target: {value: 1}})
      scale.props().onChange({target: {value: 1}})
    })
    wrapper.update()

    let button = wrapper.find(Button).filterWhere(b => b.props().id == 'fieldFormSubmit')
    act(() => {
      button.props().onClick()
    })
    wrapper.update()

    act(() => {
      input.props.onChange('decimal');
    })
    wrapper.update()

    precision = wrapper.find(Form.Control).filterWhere(c => c.props().id == 'precision');
    scale = wrapper.find(Form.Control).filterWhere(c => c.props().id == 'scale');
    button = wrapper.find(Button).filterWhere(b => b.props().id == 'fieldFormSubmit')

    act(() => {
      precision.props().onChange({target: {value: 2}})
      scale.props().onChange({target: {value: 2}})
    })
    wrapper.update()

    act(() => {
      button.props().onClick()
    })
    wrapper.update()

    expect(callback.mock.calls[1][0].scale).toEqual(2)
    expect(callback.mock.calls[1][0].precision).toEqual(2)
    expect(callback.mock.calls[1][0].datatype).toEqual('decimal')
  })

  it('should set appropriate min and max on precision and scale', () => {
    const callback = jest.fn();
    const wrapper = mount(
      <SchemaFieldForm
        errors={[]}
        canEdit={true}
        rows={fields}
        onFieldChange={callback}
      />
    );
    let grid = wrapper.find(Grid).filterWhere(g => g.props().id == 'fieldGrid');
    const datatypeColumn = grid.props().columns.filter(c => c.id === 'datatype');
    const input = datatypeColumn[0].value(fields[0], { focus: true });

    act(() => {
      input.props.onChange('decimal');
    })
    wrapper.update()

    const precision = wrapper.find(Form.Control).filterWhere(c => c.props().id == 'precision');
    const scale = wrapper.find(Form.Control).filterWhere(c => c.props().id == 'scale');

    expect(precision.props().min).toEqual("1")
    expect(precision.props().max).toEqual("38")
    expect(scale.props().min).toEqual("0")
    expect(scale.props().max).toEqual("38")
  })

  it('should default scale and precision to 0 and 10 if nothing is selected', () => {
    const callback = jest.fn();
    const wrapper = mount(
      <SchemaFieldForm
        errors={[]}
        canEdit={true}
        rows={fields}
        onFieldChange={callback}
      />
    );
    let grid = wrapper.find(Grid).filterWhere(g => g.props().id == 'fieldGrid');
    const datatypeColumn = grid.props().columns.filter(c => c.id === 'datatype');
    const input = datatypeColumn[0].value(fields[0], { focus: true });

    act(() => {
      input.props.onChange('decimal');
    })
    wrapper.update()

    const button = wrapper.find(Button).filterWhere(b => b.props().id == 'fieldFormSubmit')

    act(() => {
      button.props().onClick()
    })

    expect(callback.mock.calls[0][0].scale).toEqual(0)
    expect(callback.mock.calls[0][0].precision).toEqual(10)
    expect(callback.mock.calls[0][0].datatype).toEqual('decimal')
  })

  it('should not allow scale to be larger to than precision', () => {
    const callback = jest.fn();
    const wrapper = mount(
      <SchemaFieldForm
        errors={[]}
        canEdit={true}
        rows={fields}
        onFieldChange={callback}
      />
    );
    let grid = wrapper.find(Grid).filterWhere(g => g.props().id == 'fieldGrid');
    const datatypeColumn = grid.props().columns.filter(c => c.id === 'datatype');
    const input = datatypeColumn[0].value(fields[0], { focus: true });

    act(() => {
      input.props.onChange('decimal');
    })
    wrapper.update()
    const precision = wrapper.find(Form.Control).filterWhere(c => c.props().id == 'precision');
    const scale = wrapper.find(Form.Control).filterWhere(c => c.props().id == 'scale');

    act(() => {
      precision.props().onChange({target: {value: 2}})
      scale.props().onChange({target: {value: 5}})
    })
    wrapper.update()

    const button = wrapper.find(Button).filterWhere(b => b.props().id == 'fieldFormSubmit')

    act(() => {
      button.props().onClick()
    })
    wrapper.update()

    expect(callback.mock.calls[0][0].scale).toEqual(2)
    expect(callback.mock.calls[0][0].precision).toEqual(2)
    expect(callback.mock.calls[0][0].datatype).toEqual('decimal')
  })
})
