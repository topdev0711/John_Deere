// Unpublished Work © 2021-2022 Deere & Company.
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import Completeness from '../../../components/DataQuality/Completeness';
import CompletenessToggleGroup from "../../../components/DataQuality/CompletenessToggleGroup";
import NoMetricsData from '../../../components/DataQuality/NoMetricsData';
import { act } from 'react-dom/test-utils';

jest.mock('../../../apis/metrics');

configure({ adapter: new Adapter() });

const testData =
{
  updateTime: "2022-02-16T18:42:39.297Z",
  completeness: {
    fields: [
      {
        name: "id",
        count: 100000
      },
      {
        name: "cats",
        count: 80000
      },
      {
        name: "dogs",
        count: 19000
      },
      {
        name: "giraffes",
        count: 52000
      },
      {
        name: "lions",
        count: 45000
      },
      {
        name: "tigers",
        count: 10000
      }
    ],
    total: 100000
  },
  tableName: "testTable"
}

const testDataRounding =
{
  updateTime: "2022-02-16T18:42:39.297Z",
  completeness: {
    fields: [
      {
        name: "id",
        count: 24
      },
      {
        name: "cats",
        count: 12
      },
      {
        name: "dogs",
        count: 3
      },
      {
        name: "giraffes",
        count: 5
      },
      {
        name: "lions",
        count: 7
      }
    ],
    total: 24
  },
  tableName: "testTable"
};

describe('completeness test suite', () => {
  it('completeness should return No metrics to display if there is no data ', () => {
    const wrapper = mount(<Completeness qualityData={{}}/>);
    expect(wrapper.contains(<NoMetricsData />)).toEqual(true);
  });

  it('verify field names exist', async () => {
    const wrapper = mount(<Completeness qualityData={testData}/>);
    const tableNames = wrapper.findWhere(d => d.is('td') && (d.prop('id') === 'id' || d.prop('id') === 'cats' || d.prop('id') === 'dogs'
      || d.prop('id') === 'giraffes' || d.prop('id') === 'lions' || d.prop('id') === 'tigers'));
    expect(tableNames).toHaveLength(6);
  });

  it('verify bars exist', async () => {
    const wrapper = mount(<Completeness qualityData={testData}/>);
    const tableNames = wrapper.findWhere(d => d.is('td') && (d.prop('id') === 'idBar' || d.prop('id') === 'catsBar'
    || d.prop('id') === 'dogsBar' || d.prop('id') === 'giraffesBar' || d.prop('id') === 'lionsBar' || d.prop('id') === 'tigersBar'));
    expect(tableNames).toHaveLength(6);
  });

  it('verify total number of rows', async () => {
    const wrapper = mount(<Completeness qualityData={testData}/>);

    const numRowsDiv = wrapper.find('div').findWhere(d => d.prop('id') === 'metricDataExists').findWhere(d => d.prop('id') === 'numRows');
    expect(numRowsDiv.text()).toEqual('Total Number of Rows: 100000');
  });

  it('verify percentage toggle button by default', async () => {
    const wrapper = mount(<Completeness qualityData={testData}/>);
    const barValues = wrapper.findWhere(d => d.is('div') && d.prop('className') === 'progress-bar');
    expect(barValues.at(0).text()).toEqual('100%');
    expect(barValues.at(1).text()).toEqual('80%');
    expect(barValues.at(2).text()).toEqual('19%');
    expect(barValues.at(3).text()).toEqual('52%');
    expect(barValues.at(4).text()).toEqual('45%');
    expect(barValues.at(5).text()).toEqual('10%');
  });

  it('verify bars when row count button is selected', async () => {
    const wrapper = mount(<Completeness qualityData={testData} />);
    const toggleGroup = wrapper.find(CompletenessToggleGroup).first();

    await act(() => { toggleGroup.props().setCompletenessSelection('count') });

    const barValues = wrapper.findWhere(d => d.is('div') && d.prop('className') === 'progress-bar');
    expect(barValues.at(0).text()).toEqual('100000');
    expect(barValues.at(1).text()).toEqual('80000');
    expect(barValues.at(2).text()).toEqual('19000');
    expect(barValues.at(3).text()).toEqual('52000');
    expect(barValues.at(4).text()).toEqual('45000');
    expect(barValues.at(5).text()).toEqual('10000');
  });

  it('verify rounding occurs if there is a lot of decimal places', async () => {
    const wrapper = mount(<Completeness qualityData={testDataRounding}/>);
    const barValues = wrapper.findWhere(d => d.is('div') && d.prop('className') === 'progress-bar');
    console.info('barValues: ', barValues.first().text());
    expect(barValues.at(0).text()).toEqual('100%');
    expect(barValues.at(1).text()).toEqual('50%');
    expect(barValues.at(2).text()).toEqual('12.5%');
    expect(barValues.at(3).text()).toEqual('20.8%');
    expect(barValues.at(4).text()).toEqual('29.1%');
  });
});
