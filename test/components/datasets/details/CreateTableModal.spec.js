import CreateTableModal from "../../../../components/datasets/details/CreateTableModal";
import { configure, shallow, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import React from "react";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import ValidatedInput from '../../../../components/ValidatedInput';
import { waitFor, act } from '@testing-library/react';

global.fetch = require('jest-fetch-mock');
configure({ adapter: new Adapter() });
const databaseName = 'databaseName';
const tableName = 'tableName';
const fileType = 'CSV';
const datasetEnvironmentName = 'datasetEnvironmentName';
const path = 'path/';
const delimiter = ',';
const tableInfo = { datasetEnvironmentName: 'datasetEnvironmentName', fileType: 'CSV', path: 'path/', delimiter: ',' }

describe("CreateTable Modal test suite", () => {
    it("should render without show", () => {
        const wrapper = shallow(<CreateTableModal />);
        const select = wrapper.find("databaseName").at(0)
        expect(wrapper).toBeDefined();
    });
    it('should create table when create table is clicked', async () => {

        const callback = jest.fn;
        const expectedParams = {
            "credentials": "same-origin",
            "method": "POST",
            "body": JSON.stringify({ databaseName, tableName, fileType, datatype: datasetEnvironmentName, path, delimiter }),
            "headers": { "Content-Type": "application/json" }
        };
        const wrapper = shallow(<CreateTableModal true onCancel={callback} tableInfo={tableInfo} />)
        const groups = wrapper.find(Form.Group)

        act(() => {
            groups.at(0).find(ValidatedInput).prop('onBlur')({ target: { value: 'databaseName' } })
        })
        act(() => {
            groups.at(1).find(ValidatedInput).prop('onBlur')({ target: { value: 'tableName' } })
        })

        const createTableButton = wrapper.find(Button).filterWhere(button => button.props().id === 'createTableButton');
        createTableButton.simulate('click');
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        wrapper.update();

        expect(fetch).toHaveBeenCalledWith(`/api/datasets/create-table`, expectedParams);
    })

    it('should handle error when the service returns 400', async () => {

        const callback = jest.fn;
        fetch.mockResolvedValue(Promise.resolve({
            status: 400,
            json: () => Promise.resolve({
                success: false,
                error: '"Error: Error: \\"{\\\\\\"errorMessage\\\\\\":\\\\\\"Failed to create Table, Unable to infer schema for CSV. It must be specified manually. Query \\\\\\"}\\"\\n    at handleError (/var/app/current/src/utilities/edlApiHelper.js:114:17)\\n    at sendRequest (/var/app/current/src/utilities/edlApiHelper.js:136:5)\\n    at runMicrotasks (<anonymous>)\\n    at processTicksAndRejections (internal/process/task_queues.js:95:5)\\n    at async Object.postWithContentType (/var/app/current/src/utilities/edlApiHelper.js:185:12)\\n    at async Object.createTable (/var/app/current/src/services/datasetService.js:921:17)"'
            })
        }));
        const wrapper = shallow(<CreateTableModal true onCancel={callback} tableInfo={tableInfo} />)
        const groups = wrapper.find(Form.Group)

        act(() => {
            groups.at(0).find(ValidatedInput).prop('onBlur')({ target: { value: 'databaseName' } })
        })
        act(() => {
            groups.at(1).find(ValidatedInput).prop('onBlur')({ target: { value: 'tableName' } })
        })

        const createTableButton = wrapper.find(Button).filterWhere(button => button.props().id === 'createTableButton');
        createTableButton.simulate('click');

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        wrapper.update();

        const items = wrapper.find('.text-danger');
        expect(items.length).toBe(1)

        expect(items.text()).toContain("Failed to create Table")

    })
});
