// Unpublished Work © 2022 Deere & Company.
import React from 'react';
import LineageDiagram from './LineageDiagram';
import {createSchema} from 'beautiful-react-diagrams';
import DiagramNode from './DiagramNode';

const createSourceNode = (data, index) => {
  const sourceType = {label: 'Type', value: data.source.type};
  const sourceServer = data?.source?.server ? {label: 'Server', value: data.source.server} : undefined;
  const sourceDatabase = data?.source?.database ? {label: 'Database', value: data.source.database} : undefined;
  const sourceAttributes = [sourceType, sourceServer, sourceDatabase].filter(v => v);

  return {
    id: data.source.namespace,
    content: <DiagramNode namespace={data.source.namespace} attributes={sourceAttributes}/>,
    outputs: [{id: "out-" + index}],
    coordinates: ['0%', '20%']
  }
}

const createDestinationNode = (data, index) => {
  const destinationAttributes = [{label: 'Type', value: data.destination.type}];
  return {
    id: data.destination.namespace,
    content: <DiagramNode namespace={data.destination.namespace} attributes={destinationAttributes}/>,
    inputs: [{id: "in-" + index}],
    coordinates: ['35%', '20%']
  }
}

const createNode = (data, index) => {
  const sourceNode = createSourceNode(data, index);
  const destinationNode = createDestinationNode(data, index);
  return [sourceNode, destinationNode];
}

const buildNode = (dataArr, schema) => {
  const records = dataArr.filter(data => data.destination.namespace === schema.value);
  const nodes = records.flatMap(createNode);
  const links = records.map((data, index) => ({input: 'out-' + index, output: 'in-' + index, readonly: true}));
  return nodes.length > 0 ? createSchema({nodes, links}) : undefined;
}

const NonDatasetLineage = ({lineageData, selectedSchema}) => {
  const lineageNode = buildNode(lineageData, selectedSchema);
  const hasLineageNode = lineageNode && selectedSchema;
  return hasLineageNode ? <LineageDiagram key={selectedSchema.value} schema={lineageNode}/> : <></>;
}

export default NonDatasetLineage;
