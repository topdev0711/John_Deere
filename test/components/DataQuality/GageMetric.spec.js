import { configure, mount } from 'enzyme';
import React from 'react';
import GaugeMetric from '../../../components/DataQuality/GaugeMetric';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

describe('display gauge metric for data quality', () => {
    const status = 'Daily', percent = 50.0;

    it('expect gauge metric to display percent in component', () => {
        const gaugeMetric = <GaugeMetric status={status} value={percent} />;
        const metricWrapper = mount(gaugeMetric);

        const expectedTag = [<b>Expected Update: </b>, <em>{status}</em>];
        expect(metricWrapper.contains(expectedTag)).toEqual(true);
    });
});
