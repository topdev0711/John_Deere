import LoadHistory from '../../../../components/datasets/details/LoadHistory';
import { mount, shallow } from 'enzyme';
import React from 'react';
import { act, waitFor } from '@testing-library/react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import ingestMetrics from './LoadHistoryIngestData.json';

global.fetch = require('jest-fetch-mock');

const mockData = [{
    "requestId": "8475f2e2-3217-4cc9-9e78-ecd4beaac1d6",
    "status": "FAILED",
    "errorMessage":"Some schema mismatch error occured",
    "metaData": {
        "dataType": "com.deere.enterprise.datalake.raw.cps.telematics.measures",
        "contentType": "",
        "representation": "",
        "numberOfRecords": 0,
        "estimatedSize": 0,
        "startTime": "2020-02-12T08:24:48.839Z",
        "endTime": "2020-02-12T08:26:00.317Z"
    }
}]

describe('LoadHistory component test suite', () => {

    it('verify component renders', () => {
        const wrapper = shallow(<LoadHistory />)
        expect(wrapper).toBeDefined();
    });

    it('should render filter', async() => {
        const dataType = 'test_datatype';
        const representation = 'schema_name';
        fetch.mockImplementation(() => {
            return new Promise((resolve) =>
              resolve({
                ok : true,
                json: () => {
                  return ingestMetrics;
                },
              })
            );
        });
        const wrapper = mount(<LoadHistory datasetEnvironmentName={dataType} schemaEnvironmentName={representation}/>);
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        wrapper.update();
        const filter = wrapper.find('input');
        expect(filter).toHaveLength(1);
    });

    it('should render a loading spinner', () => {
        const dataType = 'test_datatype';
        const representation = 'schema_name';
        const wrapper = mount(<LoadHistory datasetEnvironmentName={dataType} schemaEnvironmentName={representation}/>);
        const spinner = wrapper.find(Spinner).at(0).text();
        expect(spinner).toEqual('Loading...');
    });

    it('should render Modal for errorMessage', async() => {
        const dataType = 'test_datatype';
        const representation = 'schema_name';
        fetch.mockImplementation(() => {
            return new Promise((resolve) =>
              resolve({
                ok : true,
                json: () => {
                  return mockData;
                },
              })
            );
        });
        const wrapper = mount(<LoadHistory datasetEnvironmentName={dataType} schemaEnvironmentName={representation}/>);
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        wrapper.update();
        const status = wrapper.find('button').at(0);
        await act(() => status.props().onClick());
        wrapper.update();
        const modal = wrapper.find(Modal);
        expect(modal.props().show).toEqual(true);
        const modalFooter = modal.find(Modal.Footer);
        const button = modalFooter.find(Button);
        expect(button.at(0).text()).toEqual("Close");
    });

    it('should fetch response from load-history api',() => {
        const dataType = 'test_datatype';
        const representation = 'schema_name';
        mount(<LoadHistory datasetEnvironmentName={dataType} schemaEnvironmentName={representation}/>)
        const metadata = {
            dataType,
            representation
        };
        fetch.mockResolvedValue({ ok: true })
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith('/api/load-history', {
            credentials: 'same-origin',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metadata)
        });
    });

    it('should set error in fetch status if get api fails to fetch data', async() => {
        const dataType = 'test_datatype';
        const representation = 'schema_name';
        const wrapper = mount(<LoadHistory datasetEnvironmentName={dataType} schemaEnvironmentName={representation}/>)
        const metadata = {
            dataType,
            representation
        };
        fetch.mockRejectedValue(new Error('Error'));
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        expect(fetch).toHaveBeenCalledWith('/api/load-history', {
            credentials: 'same-origin',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metadata)
        });
        wrapper.update();
        const fetchStatus = wrapper.find('div').filterWhere(c => c.props().className === 'markdown');
        expect(fetchStatus.text()).toEqual('Failed to fetch load history');
    });

    it('should render table headers if no ingest metrics fetched',() => {
        const dataType = 'test_datatype';
        const representation = 'schema_name';
        const wrapper = shallow(<LoadHistory datasetEnvironmentName={dataType} schemaEnvironmentName={representation}/>)
        expect(wrapper.find('tr')).toHaveLength(1);
        expect(wrapper.find('th')).toHaveLength(7);
    });

    it('should render table with ingest metrics', async() => {
        const dataType = 'test_datatype';
        const representation = 'schema_name';
        fetch.mockImplementation(() => {
            return new Promise((resolve) =>
              resolve({
                ok : true,
                json: () => {
                  return ingestMetrics;
                },
              })
            );
        });
        const wrapper = mount(<LoadHistory datasetEnvironmentName={dataType} schemaEnvironmentName={representation}/>);
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        wrapper.update();
        expect(wrapper.find('tr')).toHaveLength(5);
        expect(wrapper.find('td')).toHaveLength(28);
    });

});
