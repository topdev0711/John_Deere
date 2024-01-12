import React, { useEffect, useState } from 'react';
import { Button, CardGroup, Col, OverlayTrigger, Popover, Spinner, Dropdown} from 'react-bootstrap';
import GaugeMetric from './GaugeMetric';
import { getTimelinessInfo } from '../../apis/schemas';
import utils from '../utils';

const datePresets = [{ label: '30 Days', dateValue: '30' }, { label: '60 Days', dateValue: '60' },
{ label: '90 Days', dateValue: '90' }, { label: '6 Months', dateValue: '182' },
{ label: '1 Year', dateValue: '365' }, { label: '3 Years', dateValue: '1095' }];

const Timeliness = ({schemaEnvironmentName = "", updateFrequency = "", datasetEnvironmentName = "", ...props}) => {

    const [isLoading, setLoading] = useState(false);

    const [dateFilter, setDateFilter] = useState({
        metric: 'timeliness',
        intervalOption: datePresets[2].dateValue,
        from: utils.getPriorDate(datePresets[2].dateValue),
        to: utils.getPriorDate('0')
    });

    const [metricData, setMetricData] = useState({});

    const [interval, setInterval] = useState(`${dateFilter.from} - ${dateFilter.to}`);

    const hasData = () => Object.keys(metricData).length === 0 || updateFrequency === '' || !metricData.timeliness_percent

    const handleCustomRange = e => {
        setInterval(e.target.value);
    };

    const handleSelect = selection => {
        setDateFilter({ ...dateFilter, intervalOption: selection, from: utils.getPriorDate(parseInt(selection)), to: utils.getPriorDate('0') });
    };

    const popoverDateFilter = (
        <Popover id="popover-date-filter" title="Date Filter">
            {datePresets.map(preset => {
                return <Dropdown.Item eventKey={preset.dateValue} className={preset.dateValue === dateFilter.intervalOption ? 'active' : ''}
                    onClick={handleSelect.bind(this, preset.dateValue)}>{preset.label}</Dropdown.Item>
            })}
        </Popover>
    );

    const handleDateFilter = async () => {
        setLoading(true);
        try {
            let fromDate = new Date(dateFilter.from), toDate = new Date(dateFilter.to);
            if (!fromDate.getTime() || !toDate.getTime() || fromDate > toDate || !interval.includes(' - ')) {
                throw 'From date occurs after to date given';
            }

            const res = await getTimelinessInfo(schemaEnvironmentName, new Date(dateFilter.from).toISOString().substring(0, 10),
                new Date(dateFilter.to).toISOString().substring(0, 10), updateFrequency, datasetEnvironmentName);
            if (res.ok) {
                const { schema, dataset, timeliness_percent } = await res.json();
                setMetricData({
                    "schema": schema,
                    "dataset": dataset,
                    "timeliness_percent": timeliness_percent
                });
            }
            else {
                setMetricData({});
            }
        }
        catch (e) {
            console.log('Error:', e);
        }

        setLoading(false);
    }

    useEffect(() => {
        setInterval(`${dateFilter.from} - ${dateFilter.to}`);
    }, [dateFilter]);

    useEffect(() => {
        try {
            if (interval.includes(' - ')) {
                let [from, to] = interval.split(' - ');
                if (`${dateFilter.from} - ${dateFilter.to}` !== interval) {
                    setDateFilter({ ...dateFilter, from: from, to: to });
                }
            } else {
                throw 'Interval provided is in an incorrect format';
            }
        } catch (e) {
            console.log('Error:', e);
        }
    }, [interval]);

    useEffect(() => {
        handleDateFilter();
    }, []);

    return (
        <>
            <Col className='text-right'>
                <OverlayTrigger
                    trigger="click"
                    rootClose
                    placement="bottom"
                    overlay={popoverDateFilter}
                >
                    <input type='text' id='dateIntervalFilter' value={interval} onChange={handleCustomRange}
                        className='text-center align-middle' />
                </OverlayTrigger>
                &nbsp;&nbsp;
                <Button variant='success' size="sm"
                    onClick={handleDateFilter.bind(this)}>Filter</Button>
            </Col>

            {
                isLoading ?
                    <div className="text-center" style={{ marginTop: '50px' }}>
                        <Spinner className="spinner-border uxf-spinner-border-lg" animation="border" role="status">
                            <span className="sr-only">Loading...</span>
                        </Spinner>
                    </div>
                :
                hasData() ?
                    <div className="text-center" id="noMetrics">
                        <h4>No metrics to display</h4>
                    </div> :
                    dateFilter.metric == 'timeliness' && updateFrequency &&
                    <CardGroup>
                        <GaugeMetric status={updateFrequency} value={metricData.timeliness_percent} />
                    </CardGroup>
            }
        </>
    )
}

export default Timeliness;
