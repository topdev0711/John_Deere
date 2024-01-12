// Unpublished Work © 2021-2022 Deere & Company.
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import Distinctness from '../../../components/DataQuality/Distinctness';
import { Card } from "@deere/ux.uxframe-react";
import 'jest-canvas-mock';

jest.mock('../../../apis/metrics');

configure({ adapter: new Adapter() });

const testData =
{
    tableName: "edl.data_science_handbook_diamonds",
    distinctness: {
        fields: [{
            total: 2,
            name: "qualityRating",
            distribution: [{
                name: "good",
                count: 40
            }, {
                name: "bad",
                count: 10
            }]
        }, {
            total: 10,
            name: "diamondColor",
            distribution: [{
                name: "pink",
                count: 7
            },
            {
                name: "white",
                count: 3
            },
            {
                name: "blue",
                count: 6
            },
            {
                name: "purple",
                count: 4
            },
            {
                name: "green",
                count: 5
            },
            {
                name: "yellow",
                count: 5
            },
            {
                name: "black",
                count: 2
            },
            {
                name: "transparent",
                count: 1
            },
            {
                name: "red",
                count: 15
            },
            {
                name: "teal",
                count: 2
            }]
        },
        {
            total: 12,
            name: "price",
            distribution: [{
                name: "1000",
                count: 4
            },
            {
                name: "2000",
                count: 3
            },
            {
                name: "3000",
                count: 3
            },
            {
                name: "4000",
                count: 4
            },
            {
                name: "5000",
                count: 1
            },
            {
                name: "6000",
                count: 5
            },
            {
                name: "7000",
                count: 5
            },
            {
                name: "8000",
                count: 5
            },
            {
                name: "9000",
                count: 5
            },
            {
                name: "10000",
                count: 5
            },
            {
                name: "11000",
                count: 5
            },
            {
                name: "12000",
                count: 5
            }]
        }]
    },
    updateTime: "2022-03-04T17:38:21.486Z"
}

describe('distinctness test suite', () => {
    it('No metrics data exists for chosen table', async () => {
        const wrapper = mount(<Distinctness qualityData={{}} />);
        const messageDiv = wrapper.find('div').findWhere(d => d.prop('id') === 'noMetrics');
        expect(messageDiv.text()).toEqual('No metrics to display');
    });

    it('Display Table when Clicking Distinctness and not Pie Chart', async () => {
        const wrapper = mount(<Distinctness qualityData={testData} />);

        const pieChartCard = wrapper.find(Card);
        expect(pieChartCard).toEqual({});
        const columnNames = wrapper.findWhere(d => d.is('td') && (d.prop('id') === 'qualityRating' || d.prop('id') === 'diamondColor' ||
            d.prop('id') === 'price'));
        expect(columnNames).toHaveLength(3);
        const distinctnessCounts = wrapper.findWhere(d => d.is('td') && (d.prop('id') === 'qualityRatingCount' || d.prop('id') === 'diamondColorCount' ||
            d.prop('id') === 'priceCount'));
        expect(distinctnessCounts).toHaveLength(3);
    });

    it('When Clicking Row with less than 10 Distinct Values, Display Pie Chart without Other', async () => {
        const wrapper = mount(<Distinctness hasAccess={true} qualityData={testData} />);
        const tableRow = wrapper.find('tr').findWhere(d => d.prop('id') === 'qualityRatingRow');
        tableRow.simulate('click');
        wrapper.update();

        const pieChart = wrapper.find('ChartsGraphs');
        expect(pieChart.prop('data').labels).toEqual(['good', 'bad']);
        expect(pieChart.prop('data').datasets[0].data).toEqual([40, 10]);
    });

    it('When Clicking Row with 10 Distinct Values, Display Pie Chart without Other', async () => {
        const wrapper = mount(<Distinctness hasAccess={true} qualityData={testData} />);
        const tableRow = wrapper.find('tr').findWhere(d => d.prop('id') === 'diamondColorRow');
        tableRow.simulate('click');
        wrapper.update();

        const pieChart = wrapper.find('ChartsGraphs');
        expect(pieChart.prop('data').labels).toEqual(['red', 'pink', 'blue', 'green', 'yellow', 'purple', 'white', 'black', 'teal', 'transparent']);
        expect(pieChart.prop('data').datasets[0].data).toEqual([15, 7, 6, 5, 5, 4, 3, 2, 2, 1]);
    });

    it('When Clicking Row with more than 10 Distinct Values, Display Pie Chart with Other', async () => {
        const wrapper = mount(<Distinctness hasAccess={true} qualityData={testData} />);
        const tableRow = wrapper.find('tr').findWhere(d => d.prop('id') === 'priceRow');
        tableRow.simulate('click');
        wrapper.update();

        const pieChart = wrapper.find('ChartsGraphs');
        expect(pieChart.prop('data').labels).toEqual(['6000', '7000', '8000', '9000', '10000', '11000', '12000', '1000', '4000', '2000', 'Other']);
        expect(pieChart.prop('data').datasets[0].data).toEqual([5, 5, 5, 5, 5, 5, 5, 4, 4, 3, 4]);
    });

    it('should display access error if hasAccess is false', async () => {
        const wrapper = mount(<Distinctness hasAccess={false} qualityData={testData} />);
        const tableRow = wrapper.find('tr').findWhere(d => d.prop('id') === 'priceRow');

        tableRow.simulate('click');
        wrapper.update();
        expect(wrapper.text()).toContain('A dataset permission is required to view distinct values.')
    });
});
