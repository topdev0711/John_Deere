import { shallow, mount } from 'enzyme';
import SchemaForm from '../../../../components/datasets/edit/SchemaForm';
import Dropzone from '../../../../components/datasets/edit/Dropzone'
import Button from 'react-bootstrap/Button';
import React from 'react'
import { act } from 'react-dom/test-utils'
import utils from '../../../../components/utils'
import Select from '../../../../components/Select'
import Form from 'react-bootstrap/Form';
import ValidatedInput from '../../../../components/ValidatedInput';
import { waitFor } from '@testing-library/react';

const testSchemas = [
    {
        name: "schema1",
        fields: [
            {
                attribute: {
                    id: 1,
                    name: "Attribute1"
                },
                datatype: {
                    id: 1,
                    name: "long"
                },
                description: "Desc",
                id: 1,
                nullable: false,
                name: "field1",
            },
            {
                attribute: {
                    id: 2,
                    name: "Attribute2"
                },
                datatype: {
                    id: 2,
                    name: "string"
                },
                description: "some description",
                id: 2,
                nullable: false,
                name: "field2"
            }
        ],
        updatedAt: "2019-06-10T16:45:31.446Z",
        createdAt: "2019-06-10T16:45:31.446Z",
        id: "alert.mk_alert_defn_localized_dm@3.0.0",
        documentation: "None",
        description: "None",
        createdBy: "js91162",
        version: "3.0.0",
        updatedBy: "js91162",
        updateFrequency: "Weekly",
    }
]

const editingSchemas = [
    {
        name: "schema1",
        fields: [
            {
                attribute: "Attribute1",
                datatype: "long",
                description: "None",
                id: 1,
                nullable: false,
                name: "field2"
            }
        ],
        updatedAt: "2019-06-10T16:45:31.446Z",
        createdAt: "2019-06-10T16:45:31.446Z",
        id: "alert.mk_alert_defn_localized_dm@3.0.0",
        documentation: "None",
        description: "None",
        createdBy: "js91162",
        version: "3.0.0",
        updatedBy: "js91162",
        updateFrequency: "Weekly",
    },
    {
        status: { id: 1, name: "status_Partition"},
        name: "schema1",
        fields: [
            {
                attribute: "Attribute1_edit_Schema1",
                datatype: "long",
                description: "None",
                id: 1,
                nullable: false,
                name: "field_editingSchema2",
            }
        ],
        updatedAt: "2019-06-10T16:45:31.446Z",
        createdAt: "2019-06-10T16:45:31.446Z",
        id: "alert.mk_alert_defn_localized_dm@4.0.0",
        documentation: "docu",
        description: "desc",
        createdBy: "js91162",
        version: "4.0.0",
        updatedBy: "js91162",
        updateFrequency: "Weekly",
        isNew: true,
        partitionedBy: [
            "partition_test"
        ]
    }
]

const context = {
    schemas:
        [{
            status: { id: 4, name: "active" },
            name: "schema1",
            fields: [
                {
                    attribute: "Attribute1_edit_Schema1",
                    datatype: "long",
                    description: "None",
                    id: 1,
                    nullable: false,
                    name: "field_editingSchema2",
                }
            ],
            updatedAt: "2019-06-10T16:45:31.446Z",
            createdAt: "2019-06-10T16:45:31.446Z",
            id: "alert.mk_alert_defn_localized_dm@5.0.0",
            documentation: "docu",
            description: "desc",
            createdBy: "js91162",
            version: "5.0.0",
            updatedBy: "js91162",
            updateFrequency: "Weekly",
            isNew: false,
            partitionedBy: [
                "partition_test"
            ]
        }],
    currentSchema: {
        status: { id: 4, name: "active" },
        name: "schema1",
        fields: [
            {
                attribute: "Attribute1_edit_Schema1",
                datatype: "long",
                description: "None",
                id: 1,
                nullable: false,
                name: "field_editingSchema2",
            }
        ],
        updatedAt: "2019-06-10T16:45:31.446Z",
        createdAt: "2019-06-10T16:45:31.446Z",
        id: "alert.mk_alert_defn_localized_dm@5.0.0",
        documentation: "docu",
        description: "desc",
        createdBy: "js91162",
        version: "5.0.0",
        updatedBy: "js91162",
        updateFrequency: "Weekly",
        isNew: false,
        partitionedBy: [
            "partition_test"
        ]
    },
    phase: 'enhance'
}

const testFile = "int,long,double,string,date\n1,1234567890,3.14,Test String,"+Date()

describe('SchemaForm component test suite', () =>{
    it('verify component renders', () => {
        const wrapper = shallow(<SchemaForm errors={[]} isFieldEnabled={() => true }/>)
        expect(wrapper).toBeDefined
    })

    it('verify component renders errors', () => {
        const wrapper = shallow(
            <SchemaForm
                errors={[
                    { context: { key: 'name' } },
                    { context: { key: 'description' } },
                    { context: { key: 'version' } },
                    { context: { key: 'documentation' } },
                    { message: 'partition' },
                    { message: 'updateFrequency' },

                ]}
                currentSchema={{id: 'foo', fields: []}}
                isFieldEnabled={() => true }
            />
        )
        const validatedInputs = wrapper.find(ValidatedInput)
        expect(validatedInputs).toHaveLength(6)
        expect(validatedInputs.at(0).props().isInvalid).toEqual(true)
        expect(validatedInputs.at(1).props().isInvalid).toEqual(true)
        expect(validatedInputs.at(2).props().isInvalid).toEqual(true)
        expect(validatedInputs.at(3).props().isInvalid).toEqual(true)
        expect(validatedInputs.at(4).props().isInvalid).toEqual(true)
        expect(validatedInputs.at(5).props().isInvalid).toEqual(true)
    })

    it('verify component renders without errors', () => {
        const wrapper = shallow(
            <SchemaForm
                errors={[]}
                currentSchema={{id: 'foo', fields: []}}
                isFieldEnabled={() => true }
            />
        )
        const validatedInputs = wrapper.find(ValidatedInput)
        expect(validatedInputs).toHaveLength(6)
        expect(validatedInputs.at(0).props().isInvalid).toEqual(false)
        expect(validatedInputs.at(1).props().isInvalid).toEqual(false)
        expect(validatedInputs.at(2).props().isInvalid).toEqual(false)
        expect(validatedInputs.at(3).props().isInvalid).toEqual(false)
        expect(validatedInputs.at(4).props().isInvalid).toEqual(false)
        expect(validatedInputs.at(5).props().isInvalid).toEqual(false)
    })

    it('Verify that remove field button disabled prop works', () => {
        const callback = jest.fn()
        const wrapper = mount(<SchemaForm errors={[]} isFieldEnabled={() => false }  currentSchema={testSchemas[0]} onSchemaChange={callback} onTableNameChange={callback} />)
        const fieldForm = wrapper.find('ForwardRef(LoadableComponent)')
        expect(fieldForm).toHaveLength(1)
        expect(fieldForm.at(0).props().canEdit).toEqual(false)
    })

    it('Verify that locked prop is passed to field form', () => {
        const callback = jest.fn()
        const wrapper = mount(<SchemaForm errors={[]} isFieldEnabled={() => false }  currentSchema={{...testSchemas[0], linkedFrom: {}}} onSchemaChange={callback} onSchemaChange={callback} onTableNameChange={jest.fn()} />)
        const fieldForm = wrapper.find('ForwardRef(LoadableComponent)')
        expect(fieldForm).toHaveLength(1)
        expect(fieldForm.at(0).props().locked).toEqual(true)
    })

    it('handle field changes', () => {
        const callback = jest.fn()
        const wrapper = mount(<SchemaForm errors={[]} isFieldEnabled={() => true }  currentSchema={testSchemas[0]} onSchemaChange={callback} onSchemaChange={callback} onTableNameChange={jest.fn()} />)
        const fieldForm = wrapper.find('ForwardRef(LoadableComponent)')
        const initialExpected = testSchemas[0].fields[1]
        act(() => {
            fieldForm.props().onFieldChange({...initialExpected, description: 'new desc'})
        })
        expect(callback.mock.calls[1][0].fields[0].description).toEqual('Desc')
        expect(callback.mock.calls[1][0].fields[1].description).toEqual('new desc')
    })

    it('handle add field', () => {
        const callback = jest.fn()
        const wrapper = mount(<SchemaForm errors={[]} isFieldEnabled={() => true }  currentSchema={testSchemas[0]} onSchemaChange={callback} onSchemaChange={callback} onTableNameChange={jest.fn()} />)
        const addButton = wrapper.find(Button).filterWhere(item => item.props().testlocator === 'addFieldButton')
        act(() => {
            addButton.props().onClick()
        })
        expect(callback.mock.calls[1][0].fields[2].description).toEqual('')
    })

    it('Verify that remove field button works', () => {
        const callback =  jest.fn()
        const wrapper = mount(<SchemaForm errors={[]} isFieldEnabled={() => true }  currentSchema={testSchemas[0]} onSchemaChange={callback} onSchemaChange={callback} onTableNameChange={jest.fn()} />)
        const fieldForm = wrapper.find('ForwardRef(LoadableComponent)')
        expect(fieldForm).toHaveLength(1)
        const rows = fieldForm.find('.SpreadsheetGrid__row')
        expect(rows).toHaveLength(2)
        const deleteButton = rows.find(Button).at(0)
        act(() => {
            deleteButton.props().onClick()
        })
        expect(callback.mock.calls[1][0].fields).toHaveLength(1)
    })

    it('Verify dropping a file gets parsed', () => {
        window.FileReader = jest.fn(() => {
            const reader = {
                readAsBinaryString: () => {reader.onload()},
                result: testFile
            }
            return reader
        })

        const parseSpy = jest.spyOn(utils, 'parseCsvData')
        const csvInput = {int: 1, long: 1234567890, double: 3.14, string:'Test String', Date: Date()}
        parseSpy.mockImplementation((data, opts, callback) => callback(null, [csvInput])) //
        const schemaChangeSpy = jest.fn()

        const wrapper = mount(<SchemaForm errors={[]} isFieldEnabled={() => true }  schemas={testSchemas} currentSchema={testSchemas[0]} onSchemaChange={schemaChangeSpy} onTableNameChange={jest.fn()} />)
        const dz = wrapper.find(Dropzone)
        expect(dz).toHaveLength(1)

        act(() => {
            dz.prop("onDropAccepted")([])
        })

        expect(parseSpy).toHaveBeenCalledTimes(1)
        expect(parseSpy).toHaveBeenCalledWith(testFile, {"cast": true, "cast_date": true, "columns": true, "delimiter": ",", "to": 1}, expect.anything())
        expect(schemaChangeSpy).toHaveBeenCalledTimes(2)
        expect(schemaChangeSpy.mock.calls[1][0].fields).toHaveLength(5 + testSchemas[0].fields.length)
        expect(schemaChangeSpy.mock.calls[1][0].fields[0].name).toEqual('field1')
        expect(schemaChangeSpy.mock.calls[1][0].fields[1].name).toEqual('field2')
        expect(schemaChangeSpy.mock.calls[1][0].fields[2].datatype.name).toEqual('int')
        expect(schemaChangeSpy.mock.calls[1][0].fields[3].datatype.name).toEqual('long')
        expect(schemaChangeSpy.mock.calls[1][0].fields[4].datatype.name).toEqual('double')
        expect(schemaChangeSpy.mock.calls[1][0].fields[5].datatype.name).toEqual('string')
        expect(schemaChangeSpy.mock.calls[1][0].fields[6].datatype.name).toEqual('string')
    })

    it('Verify dropping avdl file gets parsed', () => {
        window.FileReader = jest.fn(() => {
            const reader = {
                readAsBinaryString: () => {reader.onload()},
                result: `@namespace("foo.bar.baz") protocol FooBar { @partition(["Name"]) @status("test") @id(["ID"]) record { /** this is id */ int ID; union {null, string} Name; @logicalType("date") long col3; @logicalType("timestamp-millis") long col4; union { null, @logicalType("decimal") @scale("10") @precision("2") bytes } col5; @logicalType("decimal") @scale("10") @precision("2") bytes col6; } }`
            }
            return reader
        })

        const parseSpy = jest.spyOn(utils, 'parseCsvData')
        parseSpy.mockImplementation((data, opts, callback) => {throw Error("ahh!")})
        const schemaChangeSpy = jest.fn()

        const wrapper = mount(<SchemaForm errors={[]} isFieldEnabled={() => true }  currentSchema={{id: 'foobar', fields: []}} onSchemaChange={schemaChangeSpy} onTableNameChange={jest.fn()} />)
        const dz = wrapper.find(Dropzone)
        expect(dz).toHaveLength(1)

        act(() => {
            dz.prop("onDropAccepted")([])
        })

        expect(schemaChangeSpy).toHaveBeenCalledTimes(2)
        expect(schemaChangeSpy.mock.calls[1][0].fields).toHaveLength(6)
        expect(schemaChangeSpy.mock.calls[1][0].fields[0].name).toEqual("ID")
        expect(schemaChangeSpy.mock.calls[1][0].fields[0].datatype.name).toEqual('int')
        expect(schemaChangeSpy.mock.calls[1][0].fields[0].attribute.name).toEqual('id')
        expect(schemaChangeSpy.mock.calls[1][0].fields[0].description).toEqual('this is id')
        expect(schemaChangeSpy.mock.calls[1][0].fields[1].name).toEqual("Name")
        expect(schemaChangeSpy.mock.calls[1][0].fields[1].datatype.name).toEqual('string')
        expect(schemaChangeSpy.mock.calls[1][0].fields[1].nullable).toEqual(true)
        expect(schemaChangeSpy.mock.calls[1][0].fields[2].name).toEqual("col3")
        expect(schemaChangeSpy.mock.calls[1][0].fields[2].datatype.name).toEqual('date')
        expect(schemaChangeSpy.mock.calls[1][0].fields[3].name).toEqual("col4")
        expect(schemaChangeSpy.mock.calls[1][0].fields[3].datatype.name).toEqual('timestamp')
        expect(schemaChangeSpy.mock.calls[1][0].fields[4].name).toEqual("col5")
        expect(schemaChangeSpy.mock.calls[1][0].fields[4].datatype.name).toEqual('decimal')
        expect(schemaChangeSpy.mock.calls[1][0].fields[4].scale).toEqual(10)
        expect(schemaChangeSpy.mock.calls[1][0].fields[4].precision).toEqual(2)
        expect(schemaChangeSpy.mock.calls[1][0].fields[4].nullable).toEqual(true)
        expect(schemaChangeSpy.mock.calls[1][0].fields[5].name).toEqual("col6")
        expect(schemaChangeSpy.mock.calls[1][0].fields[5].datatype.name).toEqual('decimal')
        expect(schemaChangeSpy.mock.calls[1][0].fields[5].scale).toEqual(10)
        expect(schemaChangeSpy.mock.calls[1][0].fields[5].precision).toEqual(2)
        expect(schemaChangeSpy.mock.calls[1][0].partitionedBy[0]).toEqual('Name')
        expect(schemaChangeSpy.mock.calls[1][0].testing).toEqual(true)
    })

    it('Verify testing setting correctly', async () => {
        const callback = jest.fn()
        const expectedSchema = {
          ...editingSchemas[1],
          testing: true
        }
        const wrapper = mount(<SchemaForm errors={[]} isFieldEnabled={() => true }  schemas={editingSchemas} currentSchema={editingSchemas[1]} onSchemaChange={callback} onTableNameChange={jest.fn()} />)
        const check = wrapper.find(Form.Check)
        expect(check).toHaveLength(1)
        expect(check.at(0).props().checked).toEqual(false)
        act(() => {
            check.at(0).prop('onChange')({target: {checked: true}})
        })
        wrapper.update();
        await waitFor(() => expect(callback).toHaveBeenCalledTimes(2))
        expect(callback).toHaveBeenCalledWith(expectedSchema, expect.anything(), undefined);
    })

    it('Verify partitions working correctly', async () => {
        const callback = jest.fn()
        const expectedSchema = {
            ...editingSchemas[1],
            partitionedBy: [
                "new_partition"
            ]
        }
        const wrapper = mount(<SchemaForm errors={[]} isFieldEnabled={() => true} schemas={editingSchemas} currentSchema={editingSchemas[1]} onSchemaChange={callback} onTableNameChange={jest.fn()} />)
        const select = wrapper.find(Select)
        expect(select.at(1).props().options).toEqual([{ id: editingSchemas[1].fields[0].name, name: editingSchemas[1].fields[0].name }])
        expect(select.at(1).props().value).toEqual([{ "id": "partition_test", "name": "partition_test" }])
        act(() => {
            select.at(1).prop('onChange')([{ name: "new_partition" }])
        })
        wrapper.update();
        await waitFor(() => expect(callback).toHaveBeenCalledTimes(2))
        expect(callback).toHaveBeenCalledWith(expectedSchema, false, undefined)
    })

    it('Verify schemaForm inputs work', () => {
        const callback =  jest.fn()
        const useStateSpy = jest.fn()
        jest.spyOn(React, 'useState').mockImplementation(init => [init, useStateSpy])
        const wrapper = shallow(<SchemaForm errors={[]} isFieldEnabled={() => true }  {...context} onSchemaChange={callback} onTableNameChange={jest.fn()} />)
        const groups = wrapper.find(Form.Group)
        expect(groups).toHaveLength(9)

        const name = groups.at(0).find(ValidatedInput)
        expect(name).toHaveLength(1)
        expect(name.props().defaultValue).toEqual(context.schemas[0].name)
        act(() => {
            groups.at(0).find(ValidatedInput).prop('onBlur')({target: {value: 'testName'}})
        })

        const description = groups.at(4).find(ValidatedInput)
        expect(description).toHaveLength(1)
        act(() => {
            wrapper.find(ValidatedInput).at(4).prop('onBlur')({ target: { value: 'testDesc' } })
        })

        const documentation = groups.at(5).find(ValidatedInput)
        expect(documentation).toHaveLength(1)
        act(() => {
            wrapper.find(ValidatedInput).at(5).prop('onBlur')({ target: { value: 'testDoc' } })
        })

        expect(useStateSpy.mock.calls[0][0].name).toEqual('testName')
        expect(useStateSpy.mock.calls[1][0].description).toEqual('testDesc')
        expect(useStateSpy.mock.calls[2][0].documentation).toEqual('testDoc')
    })

})
