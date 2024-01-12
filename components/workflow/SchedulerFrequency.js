import {Card, Form, Col, OverlayTrigger, Tooltip} from 'react-bootstrap';
import Select from '../Select';
import React, { useState, useEffect } from 'react';
import ValidatedInput from '../ValidatedInput';
import Spacer from '../Spacer';
import {MdInfoOutline} from 'react-icons/md';

const SchedulerFrequency = ({schedulerDetails,existingSchedulerDetails={}, isInValid = () => {}}) => {

  const [scheduleFrequency, setScheduleFrequency] = useState("");
  const [startDay, setStartDay] = useState("");
  const MonthlyOption = {value: 'monthly', label: 'Monthly'};
  const WeeklyOption = {value: 'weekly', label: 'Weekly'};
  const DailyOption = {value: 'daily', label: 'Daily'};
  const schedulerFrequencyOptions = [DailyOption, WeeklyOption, MonthlyOption];
  const SundayOption = {value: 'SUN', label: 'Sunday'};
  const MondayOption = {value: 'MON', label: 'Monday'};
  const TuesdayOption = {value: 'TUE', label: 'Tuesday'};
  const WednesdayOption = {value: 'WED', label: 'Wednesday'};
  const ThursdayOption = {value: 'THU', label: 'Thursday'};
  const FridayOption = {value: 'FRI', label: 'Friday'};
  const SaturdayOption = {value: 'SAT', label: 'Saturday'};
  const DayOptions = [SundayOption, MondayOption, TuesdayOption, WednesdayOption, ThursdayOption, FridayOption, SaturdayOption];

  useEffect(() => {
    setScheduleFrequency(existingSchedulerDetails.frequency)
    setStartDay(existingSchedulerDetails.startDay)
},[])

  const setFrequency = (event) => {
    setScheduleFrequency(event.value);
    schedulerDetails(event, 'frequency');
  }

  const setStartingDay = (event) => {
    setStartDay(event.value);
    schedulerDetails(event, 'startday');
  }

  return (
    <>
      <Card>
        <Card.Body>
          <Form>
            <Form.Group id='freq'>
              <Form.Label>Scheduler Frequency</Form.Label>      
              <Select id='frequency' value={schedulerFrequencyOptions.filter(({value}) => value === scheduleFrequency)} isSorted='true' options={schedulerFrequencyOptions} onChange={(event) => setFrequency(event)}/>
            </Form.Group> 
            {scheduleFrequency === 'daily' &&
              <Form.Group>

                <Form.Row>
                  <Form.Group as={Col}>
                    <Form.Label>
                      Start Time{' '}
                      <OverlayTrigger
                        placement="right"
                        overlay={<Tooltip id={`tooltip-key`}> Time is in UTC.</Tooltip>}>
                            <span style={{marginRight: '3px'}}><MdInfoOutline/></span>
                      </OverlayTrigger>
                    </Form.Label>
                    <ValidatedInput
                      component={Form.Control}
                      key="time"
                      id="starttime"
                      type="time"
                      defaultValue={existingSchedulerDetails.startTime}
                      placeholder="start time"
                      onChange={(e) => schedulerDetails(e)}
                      invalidMessage="Must provide start time"
                      isInvalid={isInValid('startTime')}
                    ></ValidatedInput>
                  </Form.Group>
                  <Form.Group as={Col}>
                    <Form.Label>Start Date</Form.Label>
                    <ValidatedInput
                      component={Form.Control}
                      key='date'
                      id="startdate"
                      type="date"
                      defaultValue={existingSchedulerDetails.startDate}
                      placeholder="Start Date"
                      onChange={(e) => schedulerDetails(e)}
                      invalidMessage="Must provide start date"
                      isInvalid={isInValid('startDate')}
                    ></ValidatedInput>
                  </Form.Group>
                  <Form.Group as={Col}>
                    <Form.Label>In Every{' '}</Form.Label>
                    <ValidatedInput
                      component={Form.Control}
                      id="everyNHours"
                      type="Number"
                      min="1"
                      max="23"
                      step="1"
                      defaultValue={existingSchedulerDetails.everyNHours}
                      placeholder="Hours (optional)"
                      onChange={(e) => schedulerDetails(e, 'everyNHours')}
                      invalidMessage="Must be whole numbers from 1-23"
                      isInvalid={isInValid('everyNHours')}
                    ></ValidatedInput>
                  </Form.Group>
                </Form.Row>
                <Form.Row>
                  <Form.Group as={Col}>
                    <Form.Label>
                      End Date{' '}
                      <small>
                        <i style={{color: '#909090', fontSize: '90%'}}>Optional</i>
                      </small>
                    </Form.Label>
                    <Spacer height="10px"/>
                    <ValidatedInput
                      component={Form.Control}
                      key='date'
                      id="endDate"
                      type="date"
                      defaultValue={existingSchedulerDetails.endDate}
                      placeholder="End Date"
                      onChange={(e) => schedulerDetails(e)}
                      invalidMessage="Must provide end date"
                      isInvalid={isInValid('endDate')}
                    ></ValidatedInput>
                  </Form.Group>
                </Form.Row>
              </Form.Group>
            }
            {scheduleFrequency === 'weekly' &&
              <Form.Group>
                <Form.Row>
                  <Form.Label>Day of the week</Form.Label>
                </Form.Row>
                <ValidatedInput
                  component={Select}
                  id="startday"
                  defaultValue={DayOptions.filter(({value}) => value === existingSchedulerDetails.dayOfWeek)}
                  onChange={(event) => setStartingDay(event)}
                  options={DayOptions}
                  isInvalid={isInValid('dayOfWeek')}
                  invalidMessage="Must provide Day of Week"
                />
                <Form.Row>
                  <Form.Label>
                    Start Time{' '}
                    <OverlayTrigger
                      placement="right"
                      overlay={<Tooltip id={`tooltip-key`}> Time is in UTC.</Tooltip>}>
                  <span style={{marginRight: '3px'}}>
                    <MdInfoOutline/>
                  </span>
                    </OverlayTrigger>
                  </Form.Label>
                  <ValidatedInput
                    component={Form.Control}
                    id="starttime"
                    type="time"
                    defaultValue={existingSchedulerDetails.startTime}
                    placeholder="start time"
                    onChange={(e) => schedulerDetails(e)}
                    invalidMessage="Must provide start time"
                    isInvalid={isInValid('startTime')}
                  ></ValidatedInput>
                </Form.Row>
                <Form.Row>
                  <Form.Group as={Col}>
                    <Form.Label>
                      End Date{' '}
                      <small>
                        <i style={{color: '#909090', fontSize: '90%'}}>Optional</i>
                      </small>
                    </Form.Label>
                    <Spacer height="5px"/>
                    <Form.Group>
                      <ValidatedInput
                        component={Form.Control}
                        key="date"
                        id="endDate"
                        type="date"
                        defaultValue={existingSchedulerDetails.endDate}
                        placeholder="End Date(Optional)"
                        onChange={(e) => schedulerDetails(e)}
                        invalidMessage="Must provide end date"
                        isInvalid={isInValid('endDate')}
                      >
                      </ValidatedInput>
                    </Form.Group>
                  </Form.Group>
                </Form.Row>
              </Form.Group>}

            {scheduleFrequency === 'monthly' &&
              <Form.Group>
                <Form.Row>
                  <Form.Group as={Col}>
                    <Form.Label>
                      Start Time{' '}
                      <OverlayTrigger
                        placement="right"
                        overlay={<Tooltip id={`tooltip-key`}> Time is in UTC.</Tooltip>}>
                        <span style={{marginRight: '3px'}}><MdInfoOutline/></span>
                      </OverlayTrigger>
                    </Form.Label>
                    <ValidatedInput
                      component={Form.Control}
                      id="starttime"
                      type="time"
                      defaultValue={existingSchedulerDetails.startTime}
                      placeholder="start time"
                      onChange={(e) => schedulerDetails(e)}
                      invalidMessage="Must provide start time"
                      isInvalid={isInValid('startTime')}
                    ></ValidatedInput>
                  </Form.Group>
                  <Form.Group as={Col}>
                    <Form.Label>Start Date</Form.Label>
                    <ValidatedInput
                      component={Form.Control}
                      id="startdate"
                      type="date"
                      defaultValue={existingSchedulerDetails.startDate}
                      placeholder="start Date"
                      onChange={(e) => schedulerDetails(e)}
                      invalidMessage="Must provide start date"
                      isInvalid={isInValid('startDate')}
                    ></ValidatedInput>
                  </Form.Group>
                </Form.Row>
                <Form.Row>
                  <Form.Group as={Col}>
                    <Form.Label>
                      End Date{' '}
                      <small><i style={{color: '#909090', fontSize: '90%'}}>Optional</i></small>
                    </Form.Label>
                    <Spacer height="10px"/>
                    <Form.Group>
                      <ValidatedInput
                        component={Form.Control}
                        key="date"
                        id="endDate"
                        type="date"
                        defaultValue={existingSchedulerDetails.endDate}
                        placeholder="End Date(Optional)"
                        onChange={(e) => schedulerDetails(e)}
                        invalidMessage="Must provide end date"
                        isInvalid={isInValid('endDate')}
                      >
                      </ValidatedInput>
                    </Form.Group>
                  </Form.Group>
                </Form.Row>
              </Form.Group>}
          </Form>
        </Card.Body>
      </Card>
    </>
  );
};

export default SchedulerFrequency; 











