// Unpublished Work © 2022 Deere & Company.
import CopyableText from "../../CopyableText";
import Spacer from "../../Spacer";
import React from "react";
import utils from "../../utils";

const SingleValue = ({value}) => {
  return value.map(v =>
    <>
      <div key={v.name} className="text-muted small">
        <b>{v.name}: </b><i>{!!v.url ? <a href={v.url}>{v.value}</a> : <CopyableText>{v.value}</CopyableText>}</i>
      </div>
      <Spacer height="5px"/>
    </>
  )
}

const MultipleValues = ({val}) => {
  const createItem = (v, i) => <li key={v.name + i} className="text-muted small">
    <i>{!!v.url ? <a href={v.url}>{v.value}</a> : <CopyableText>{v.value}</CopyableText>}</i>
  </li>

  return (
    <>
      <div className="text-muted small"><b>{val[0].name}s: </b></div>
      <ul style={{listStyleType: 'none'}}>{val.map(createItem)}</ul>
    </>
  );
}

const EdlUsage = ({dataset}) => {
  const edlApproval = (dataset || {approvals: []}).approvals.find(approval => approval.approvedBy === 'EDL');
  const approvedDataset = ((edlApproval || {details: {}}).details || {dataset: {}}).dataset;
  const envApprovalDatasetValues = utils.groupValuesByName(approvedDataset);

  const renderValue = val => val.length === 1 ? <SingleValue key={val.name} value={val}/> : <MultipleValues val={val} />

  return (
    <div key='edl-usage' id="edl-usage">
      <div className="text-muted small">
        <b>Environment Name: </b><i><CopyableText>{dataset.environmentName}</CopyableText></i>
      </div>
      {!!envApprovalDatasetValues.values && Object.values(envApprovalDatasetValues.values).map(renderValue)}
    </div>)
};

export default EdlUsage;
