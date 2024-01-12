// Unpublished Work © 2021-2022 Deere & Company.
import React, {useEffect, useState} from 'react';
import {getLineages} from "../../apis/datasets";
import {getLineage} from "../../apis/lineage";
import {MdCallSplit, MdVisibility, MdVisibilityOff} from "react-icons/md";
import {Button} from "react-bootstrap";
import LineageGraph from "./LineageGraph";
import NonDatasetLineage from "./NonDatasetLineage";
import DropdownSchema from "./DropdownSchema";

const metaStyle = {
  paddingRight: '15px',
  paddingBottom: '5px',
  display: 'block',
  color: '#777'
};

const createNodes = (stream, group) =>  stream.map(({ id, name, version }) => ({id: `${id}@${version}`, label: name, title: name, group}));

const buildGraph = async ({ id, name, sourceDatasets = [], sources = []}) => {
  const currentDatasetNode = {id: 'root', label: name, title: name, group: 1};
  const upstreamNodes = createNodes(sourceDatasets, 3);

  const downstreamLineage = await getLineages(id, 'downstream');
  const downstreamNodes = createNodes(downstreamLineage, 2);

  const sourcesNodes = sources.map(({namespace}) => ({ id: namespace, label: namespace, title: namespace, group: 3 }));
  const nodes = [currentDatasetNode, ...downstreamNodes, ...upstreamNodes, ...sourcesNodes];

  const downstreamEdges = downstreamLineage.map(ds => ({from: 'root', to: `${ds.id}@${ds.version}`, dashes: true}));
  const upstreamEdges = sourceDatasets.map(({id, version}) => ({from: `${id}@${version}`, to: 'root'}));
  const sourcesEdges = sources.map(({ namespace }) => ({from: namespace, to: 'root'}));
  const edges = [...downstreamEdges, ...upstreamEdges, ...sourcesEdges];

  return {nodes, edges};
};

const Lineage = ({dataset}) => {
  const [graph, setGraph] = useState({});
  const [showLineage, setShowLineage] = useState(false);
  const [lineageData, setLineageData] = useState([]);
  const [dropDownValues, setDropDownValues] = useState([]);
  const [selectedLineage, setSelectedLineage] = useState(null);

  useEffect(() => {
    const getGraph = async () => {
      if (!!dataset) {
        const graph = await buildGraph(dataset);
        setGraph(graph);
      }
    };
    getGraph();
  }, []);

  useEffect(() => {
    loadLineageData()
  }, [showLineage]);

  const renderLineageButton = () => {
    return <Button style={{marginTop: '-5px', marginLeft: '-7px'}} size='sm' variant='link' onClick={() => setShowLineage(!showLineage)}>
      {showLineage ? <><MdVisibilityOff/> Hide details</> : <><MdVisibility/> Show details</>}
    </Button>;
  };

  async function loadLineageData() {
    const data = await getLineage(dataset.environmentName);
    setLineageData(data);
    if (data?.constructor.name === 'Array') {
      const values = data.flatMap(({destination:{namespace}}) => ({label: namespace, value: namespace, id: namespace}));
      setDropDownValues(values);
    }
  }

  const renderGraph = () => {
    if (!selectedLineage) return <LineageGraph graph={graph}/>; // when
    return <NonDatasetLineage key={selectedLineage.value} lineageData={lineageData} selectedSchema={selectedLineage}/>;
  }

  const renderLineage = () => {
    return <>
      <DropdownSchema style={{width: '300px'}} schemas={dropDownValues} selectedSchema={selectedLineage} setSelectedSchema={setSelectedLineage}/>
      {renderGraph()}
    </>
  }

  return (
    <div id='lineage-div' key='lineage-div'>
      <span style={metaStyle}>
        <MdCallSplit size="18"/><b> Lineage:</b>&nbsp;{renderLineageButton()}
      </span>
      <hr/>
      {showLineage && renderLineage()}
    </div>
  );
};

export default Lineage;
