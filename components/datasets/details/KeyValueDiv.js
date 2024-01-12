import React from "react";

const KeyValueDiv = ({json}) => {
  const renderItem = ([key, value]) => <div style={{ paddingBottom: '5px' }}><b>{key}: </b><i>{value}</i></div>;
  const items = Object.entries(json).map(renderItem);
  return <div className="text-muted small">{items}</div>;
};

export default KeyValueDiv;
