import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import Select from 'react-select';
import { act } from 'react-dom/test-utils';
import SchedulerFrequency from "../../../components/workflow/SchedulerFrequency";
import ValidatedInput from '../../../components/ValidatedInput';

configure({ adapter: new Adapter() });
const schedulerDetails = jest.fn();
const isInValid = jest.fn();

describe('scheduler frequency Tests', () => {
    it('should render 4 fields if daily is selected as frequency', async () => {
        const wrapper = mount(<SchedulerFrequency schedulerDetails={schedulerDetails}/>);
        const selectFreq = wrapper.find(Select).filterWhere(select => select.props().id === `frequency`);
        act(() => {selectFreq.prop('onChange')({ value: 'daily', label: 'Daily' })});
        wrapper.update();
        const startTimeInput = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'starttime');
        const startDateInput = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'startdate');
        const everyNHoursInput = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'everyNHours');
        const endDateInput = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'endDate');
        expect(startTimeInput).toHaveLength(1);
        expect(startDateInput).toHaveLength(1);
        expect(everyNHoursInput).toHaveLength(1);
        expect(endDateInput).toHaveLength(1);
    });
    it('should show 3 fields for weekly', async () => {
        const wrapper = mount(<SchedulerFrequency schedulerDetails={schedulerDetails} />);
        const selectFreq = wrapper.find(Select).filterWhere(select => select.props().id === `frequency`);
        act(() => {selectFreq.prop('onChange')({ value: 'weekly', label: 'Weekly' })});
        wrapper.update();
        const startDayInput = wrapper.find(Select).filterWhere(c => c.props().id === 'startday');
        const startTimeInput = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'starttime');
        const endDateInput = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'endDate');
        expect(startDayInput).toHaveLength(1);
        expect(startTimeInput).toHaveLength(1);
        expect(endDateInput).toHaveLength(1);
    });

    it('should show 3 fields for monthly', async () => {
        const wrapper = mount(<SchedulerFrequency schedulerDetails={schedulerDetails} />);
        const selectFreq = wrapper.find(Select).filterWhere(select => select.props().id === `frequency`);
        act(() => {selectFreq.prop('onChange')({ value: 'monthly', label: 'Monthly' })});
        wrapper.update();
        const startDateInput = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'startdate');
        const startTimeInput = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'starttime');
        const endDateInput = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'endDate');
        expect(startDateInput).toHaveLength(1);
        expect(startTimeInput).toHaveLength(1);
        expect(endDateInput).toHaveLength(1);
    });
})