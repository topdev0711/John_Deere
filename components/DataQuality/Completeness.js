// Unpublished Work © 2022 Deere & Company.
import React, { useState } from 'react';
import { Table, ProgressBar } from 'react-bootstrap';
import CompletenessToggleGroup from "./CompletenessToggleGroup";
import { NoMetricsData } from "./NoMetricsData";

const calculateDecimal = percentage => {
  let percentageString = percentage.toString();
  const significantDigits = 1;
  const decimalIndex = percentageString.indexOf('.');

  percentageString = percentageString.substring(0, decimalIndex + significantDigits + 1);
  return parseFloat(percentageString);
}

const calculatePercentage = (field, total) => {
  const count = field.count;
  const percentage = ((count / total) * 100);
  const hasDecimal = percentage !== Math.trunc(percentage)
  return hasDecimal ? calculateDecimal(percentage) : percentage;
}

const Completeness = ({ qualityData }) => {
  const [completenessSelection, setCompletenessSelection] = useState('percentage');

  if(!Object.keys(qualityData).length) return <NoMetricsData />;

  const { completeness: {fields, total} } = qualityData;
  const completenessFields = fields.filter(field => field.name);
  const isPercentage = () => completenessSelection === "percentage";
  const renderField = field => {
    const percentage = calculatePercentage(field, total);
    const displayedValue = isPercentage() ? `${calculatePercentage(field, total)}%` : field.count;
    return (
      <tr key={field.name}>
        <td id={field.name}>{field.name}</td>
        <td id={`${field.name}Bar`}><ProgressBar id={field.name} now={percentage} label={displayedValue}/></td>
      </tr>
    )
  };

  return <div id='metricDataExists'>
    <Table striped style={{width: '60%'}}>
      <tbody>{completenessFields.map(renderField)}</tbody>
      <tfoot>
      <tr>
        <td></td>
        <td align="right">
          <CompletenessToggleGroup completenessSelection={completenessSelection} setCompletenessSelection={setCompletenessSelection}/>
        </td>
      </tr>
      </tfoot>
    </Table>

    <div className="text-left" id='numRows'>
      <p><i><b>Total Number of Rows:</b></i> {qualityData.completeness.total}</p>
    </div>
  </div>
};

export default Completeness;
