import React from 'react';
import Graph from 'react-graph-vis';

const options = {
  autoResize: true,
  layout: {
    hierarchical: {
      sortMethod: 'directed',
      nodeSpacing: 170
    }
  },
  nodes: {
    shape: "box",
    borderWidth: 1.5,
    margin: 8
  },
  groups: {
    1: {
      color: '#367c2b',
      font: {
        color: 'white'
      }
    },
    2: { color: '#fff494' },
    3: { color: '#54585a', font: { color: 'white' } }
  },
  edges: {
    color: "#aaa",
    width: 1.5,
    arrowStrikethrough: false
  },
  interaction: {
    dragNodes: true,
    dragView: true
  },
  physics: {
    enabled: false
  }
};

const LineageGraph = ({graph, height = '350px'}) => {
  return (
    <div style={{ height }}>
      <Graph
        key={graph.nodes}
        graph={graph}
        options={options}
      />
    </div>
  )
};

export default LineageGraph;
