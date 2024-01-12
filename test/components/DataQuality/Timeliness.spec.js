import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import Timeliness from '../../../components/DataQuality/Timeliness';
import { waitFor } from "@testing-library/react";;
import { getTimelinessInfo } from '../../../apis/schemas';
import utils from '../../../components/utils';

jest.mock('../../../apis/schemas');

configure({ adapter: new Adapter() });

const emptyResponse = {}

const validResponse = {
  schema: 'schema',
  dataset: 'dataset',
  timeliness_percent: 40
}

const schemaEnvironmentName = 'schemaName@1';
const datasetEnvironmentName = 'datasetName';
const updateFrequency = 'Daily';

describe('timeliness test suite', () => {
  it('timeliness should return No metrics to display if there is no data ', () => {
    getTimelinessInfo.mockResolvedValue(emptyResponse);
    const wrapper = shallow(<Timeliness schemaEnvironmentName={schemaEnvironmentName}
      updateFrequency={updateFrequency}
      datasetEnvironmentName={datasetEnvironmentName} />);
    const messegeDiv = wrapper.find('div').findWhere(d => d.prop('id') === 'noMetrics');
    expect(messegeDiv.text()).toEqual('No metrics to display');
  });

  it('timeliness should render results if data found', async () => {
    getTimelinessInfo.mockResolvedValue(validResponse);
    const wrapper = mount(<Timeliness schemaEnvironmentName={schemaEnvironmentName}
      updateFrequency={updateFrequency}
      datasetEnvironmentName={datasetEnvironmentName} />);
    await waitFor(() => expect(getTimelinessInfo).toHaveBeenCalledTimes(1));
    wrapper.update();
  });

  it('verify gauge exists', async () => {
    getTimelinessInfo.mockResolvedValue(validResponse);
    const wrapper = mount(<Timeliness schemaEnvironmentName={schemaEnvironmentName}
      updateFrequency={updateFrequency}
      datasetEnvironmentName={datasetEnvironmentName} />);
    await waitFor(() => expect(getTimelinessInfo).toHaveBeenCalledTimes(1));
    wrapper.update();

    const metricWrapper = wrapper.findWhere(d => d.id = 'metric-wrapper');
    expect(metricWrapper).toBeDefined();

    const meterGauge = wrapper.findWhere(d => d.id = 'meter-gauge');
    expect(meterGauge).toBeDefined();

    const meterPointer = wrapper.findWhere(d => d.id = 'meter-pointer');
    expect(meterPointer).toBeDefined();
  });

  it('verify last updated date', async () => {
    getTimelinessInfo.mockResolvedValue(validResponse);
    const wrapper = mount(<Timeliness schemaEnvironmentName={schemaEnvironmentName}
      updateFrequency={updateFrequency}
      datasetEnvironmentName={datasetEnvironmentName} />);
    await waitFor(() => expect(getTimelinessInfo).toHaveBeenCalledTimes(1));
    wrapper.update();

    const currentDate = utils.getPriorDate(0);
    const piorDate = utils.getPriorDate(90);

    const filterInput = wrapper.find('input').findWhere(d => d.prop('id') === 'dateIntervalFilter');
    expect(filterInput.instance().value).toEqual(piorDate + ' - ' + currentDate);
  });

  it('Handle date filter invalid inputs', async () => {
    getTimelinessInfo.mockResolvedValue(validResponse);
    const wrapper = mount(<Timeliness datasetEnvironmentName={datasetEnvironmentName} schemaEnvironmentName={schemaEnvironmentName} updateFrequency={updateFrequency} />);
    await waitFor(() => expect(getTimelinessInfo).toHaveBeenCalledTimes(1));

    const filterInput = wrapper.find('input').findWhere(d => d.prop('id') === 'dateIntervalFilter');
    const filterBtn = wrapper.find('[variant="success"]');

    filterInput.simulate('change', { target: { value: '1/1/2020 - 1/1/2018' } })
    filterBtn.simulate('click');
    expect(getTimelinessInfo).toHaveBeenCalledTimes(1);

    filterInput.simulate('change', { target: { value: '1/1/2020 1/1/2018' } })
    filterBtn.simulate('click');
    expect(getTimelinessInfo).toHaveBeenCalledTimes(1);

    filterInput.simulate('change', { target: { value: '1/1/2017 1/1/2018' } })
    filterBtn.simulate('click');
    expect(getTimelinessInfo).toHaveBeenCalledTimes(1);

    filterInput.simulate('change', { target: { value: '/1/2017 - 1/1/2018' } })
    filterBtn.simulate('click');
    expect(getTimelinessInfo).toHaveBeenCalledTimes(1);

    filterInput.simulate('change', { target: { value: '1/1/2017 - 1/1/2018' } })
    filterBtn.simulate('click');
    expect(getTimelinessInfo).toHaveBeenCalledTimes(2);
  });

  it('verify data load when edl_current table is returned from first getTimelinessInfo', async () => {
    getTimelinessInfo.mockResolvedValue(validResponse);
    const wrapper = mount(<Timeliness schemaEnvironmentName={schemaEnvironmentName}
      updateFrequency={updateFrequency}
      datasetEnvironmentName={datasetEnvironmentName} />);
    await waitFor(() => expect(getTimelinessInfo).toHaveBeenCalledTimes(1));
  });

  it('verify data load when tableName does not start with edl_current', async () => {
    getTimelinessInfo.mockReturnValueOnce(validResponse);
    const wrapper = mount(<Timeliness schemaEnvironmentName={schemaEnvironmentName}
      updateFrequency={updateFrequency}
      datasetEnvironmentName={datasetEnvironmentName} />);
    await waitFor(() => expect(getTimelinessInfo).toHaveBeenCalledTimes(1));
  });
});
