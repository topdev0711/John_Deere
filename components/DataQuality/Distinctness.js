// Unpublished Work © 2021-2022 Deere & Company.
import React, {useState} from 'react';
import Router from 'next/router';
import {Table, ChartsGraphs, Card, Container} from "@deere/ux.uxframe-react";
import {NoMetricsData} from "./NoMetricsData";

const tableStyle = { border: "1px solid gray", textAlign: 'center' };

const Distinctness = ({ hasAccess = false, qualityData}) => {
  const [pieChart, setPieChart] = useState(null);
  
  if(!qualityData) return <NoMetricsData />;
  if(!Object.keys(qualityData).length) return <NoMetricsData />;


  const { router } = Router;
  const datasetId = router?.query?.id ? router.query.id : '';

  const renderFieldMetrics = field => {
    return (
      <tr
        key={field.name}
        id={`${field.name}Row`}
        onClick={() => {
          setPieChart(field)
        }}>
        <td id={field.name} style={tableStyle}>
          {field.name}
        </td>

        <td id={`${field.name}Count`} style={tableStyle}>
          {field.total}
        </td>
      </tr>)
  };

  function getLabels(field) {
    let listResult = [];
    const distribution = field.distribution;
    distribution.sort((dist1, dist2) => dist2.count - dist1.count)
      .slice(0, 10)
      .map(element => {listResult.push(element.name);});

    if (distribution.length > 10) {
      listResult.push("Other");
    }
    return listResult;
  }

  function getValues(field) {
    const distribution = field.distribution;
    let listResult = [];

    distribution.sort((dist1, dist2) => dist2.count - dist1.count)
      .slice(0, 10)
      .map(element => { listResult.push(element.count)});

    if (distribution.length > 10) {
      let otherCount = 0;
      distribution.sort((dist1, dist2) => dist2.count - dist1.count)
        .slice(10)
        .map(element => {otherCount += element.count});
      listResult.push(otherCount);
    }

    return listResult;
  }

  return <Container>
    <div id='metricDataExists' className="float-left" style={{topwidth: "500px"}}>
      <i>Select item to display top results</i>
      <Table id="distinctnessTable" striped hover>
        <thead>
          <tr>
            <th scope="col" style={tableStyle}>Column Name</th>
            <th scope="col" style={tableStyle}>Number of Distinct Values</th>
          </tr>
        </thead>
        <tbody>
          {qualityData.distinctness.fields.filter(field => field.name).map(renderFieldMetrics)}
        </tbody>
      </Table>
    </div>

    <div style={{ paddingTop: "2%", paddingLeft: "40%" }}>
      {!!pieChart && !!pieChart.distribution.length && hasAccess &&
        <Card style={{ border: "1px solid gray" }}>
          <Card.Body>
            <ChartsGraphs type="pie" id="pieChart" data={{
              labels: getLabels(pieChart),
              datasets: [
                {
                  data: getValues(pieChart)
                },
              ],
            }}
              height={250}
              options={{
                title: {
                  display: true,
                  text: "Top Values",
                  fontSize: "18"
                }
              }} />
          </Card.Body>
        </Card>
      }
      { !!pieChart && !pieChart.distribution.length && hasAccess &&
        <div><h4><i>No distribution calculation for this field</i></h4></div>
      }
      { !!pieChart && !hasAccess &&
      <>
        <div><h4><i>A dataset permission is required to view distinct values.</i></h4>
        <h4><i>Please <a href={`/catalog/permissions/request?sources=${datasetId}`}>Request Access</a> if you would like to view this dataset.</i></h4></div>
      </>
      }
    </div>
  </Container>
};

export default Distinctness;
