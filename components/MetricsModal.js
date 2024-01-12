import React, { useState, useEffect } from 'react';
import { Button, Modal, Nav, Spinner, Tab } from "react-bootstrap";
import Chart from './charts/Chart';

const roundToHundredth = (value) => {
  return Math.round(100 * value)/100;
};

function sortByDate(a, b) {
  return new Date(a.date).getTime() - new Date(b.date).getTime();
}

function getDate(year, month) {
  return new Date(year, month - 1);
}

function buildQuery(applications) {
  if (!applications.length) return [];
  return applications.reduce((acc, app, i) => (i === 0 ? `${acc+app}`: `${acc},${app}`), '?applications=');
}

async function loadMetrics(applications) {
  const query = buildQuery(applications);
  return fetch(`/api/metrics${query}`, {
    credentials: 'same-origin',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

const MetricsModal = ({ title, applications }) => {
  const [ interactiveData, setInteractiveData ] = useState([]);
  const [ automatedData, setAutomatedData ] = useState([]);
  const [ interactiveCostData, setInteractiveCostData ] = useState([]);
  const [ automatedCostData, setAutomatedCostData ] = useState([]);
  const [ costData, setCostData ] = useState([]);
  const [ metrics, setMetrics ] = useState([]);
  const [ bodyRect, setRect ] = useState({});
  const [ show, setShow ] = useState(false);
  const [ loading, setLoading ] = useState(true);
  const [ error, setError ] = useState('');

  const bodyId = title + '-chart-modal';
  const displayError = show && error && !loading;
  const displayChart = show && !error && !loading;

  function close() {
    setShow(false);
  }

  /* istanbul ignore next */
  function cleanState() {
    if (!show) {
      setLoading(true);
      if (error) setError("");
      if (metrics) setMetrics([]);
    }
  }

  useEffect(() => {
    const body = document.getElementById(bodyId);
    let rect = { height: 0, width: 0 };
    try {
      if (body) {
        rect = body.getBoundingClientRect();
        setRect(rect);
      }
    } catch (e) {
      console.error(e);
    }
  }, [ show ]);

  useEffect(() => {
    async function getMetrics() {
      try {
        const response = await loadMetrics(applications);
        if (response.ok) {
          const results = await response.json();
          if (results.length) {
            setMetrics(results);
          } else {
            setError("This application does not have any Databricks usage recorded.");
          }
        } else {
          const errorObject = await response.json();
          setError(errorObject.error);
        }
      } catch (error) {
        console.error(error);
        setError(error.message);
      }
    }
    if (applications.length) getMetrics(applications);
    setShow(!!applications.length);
  }, [ applications ]);
  
  useEffect(() => {
    const automatedDbus = metrics.map(({ year, month, automatedDbus}) => (
      { 
        name: "Automated",
        date: getDate(year, month), 
        value: roundToHundredth(Number(automatedDbus))
      }
    ));
    const interactiveDbus = metrics.map(({ year, month, interactiveDbus}) => (
      { 
        name: "Interactive",
        date: getDate(year, month), 
        value: roundToHundredth(Number(interactiveDbus))
      }
    ));
    const automatedCost = metrics.map(({ year, month, automatedCost }) => (
      { 
        name: "Automated",
        date: getDate(year, month), 
        value:  roundToHundredth(Number(automatedCost))
      }
    ));
    const interactiveCost = metrics.map(({ year, month, interactiveCost }) => (
      { 
        name: "Interactive",
        date: getDate(year, month), 
        value:  roundToHundredth(Number(interactiveCost))
      }
    ));
    const cost = metrics.map(({ year, month, interactiveCost, automatedCost }) => (
      { 
        date: getDate(year, month), 
        value:  roundToHundredth(Number(interactiveCost) + Number(automatedCost))
      }
    ));

    setAutomatedData(automatedDbus.sort(sortByDate));
    setInteractiveData(interactiveDbus.sort(sortByDate));
    setInteractiveCostData(interactiveCost.sort(sortByDate));
    setAutomatedCostData(automatedCost.sort(sortByDate));
    setCostData([ cost.sort(sortByDate) ]);
    setLoading(false);
  }, [ metrics ]);

  return (
    <>
      <Modal 
        id={title + "-modal"}
        show={show}
        size={"xl"}
        className={"modal-xl-90ht"}
        onTransitionEnd={() => cleanState()}
      >
        <Modal.Header>
          <Modal.Title id={title + "-modal-header"}>
            {title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body 
          id={bodyId}
        >
          {loading && 
          <div className="text-center" id={title + "-modal-spinner"}>
            <Spinner className="spinner-border uxf-spinner-border-lg" animation="border" role="status">
              <span className="sr-only">Loading...</span>
            </Spinner>
          </div>
          }
          {displayError &&
            <div id={`${title}-modal-error`} className='modal-error'><b>{error}</b></div>
          }
          {displayChart &&
            <Tab.Container
              transition={false} 
              id="cost-modal-tabs" 
              defaultActiveKey="cost"
            >
              <Nav
                size="sm" 
                variant="tabs" 
                className="uxf-nav-tabs-medium"
              >
                <Nav.Item key={"cost"}>
                  <Nav.Link eventKey={"cost"}>Databricks Cost</Nav.Link>
                </Nav.Item>
                <Nav.Item key={"stacked-cost"}>
                  <Nav.Link eventKey={"stacked-cost"}>Cost Breakdown</Nav.Link>
                </Nav.Item>
                <Nav.Item key={"interactive"}>
                  <Nav.Link eventKey={"interactive"}>DBU Usage</Nav.Link>
                </Nav.Item>
              </Nav>
              <Tab.Content>
                <Tab.Pane
                  eventKey={"cost"} 
                  key={"cost"}
                >
                  <Chart 
                    id={title + "-cost-line-graph"}
                    type='line'
                    parentSize={bodyRect}
                    parentData={costData}
                    isPrefix={true}
                    label={"Cost"}
                    units={"$"}
                    yAxis={"Cost in Dollars"}
                    xAxis={"Date"}
                  />
                </Tab.Pane>
                <Tab.Pane
                  eventKey={"stacked-cost"} 
                  key={"stacked-cost"}
                >
                  <Chart 
                    id={title + "-cost-breakdown-stacked-area-graph"}
                    type="stacked-area"
                    parentSize={bodyRect}
                    parentData={[ interactiveCostData, automatedCostData ]}
                    isPrefix={true}
                    label={"Cost"}
                    units={"$"}
                    yAxis={"Cost in Dollars"}
                    xAxis={"Date"}
                  />
                </Tab.Pane>
                <Tab.Pane
                  eventKey={"interactive"} 
                  key={"interactive"}
                >
                  <Chart 
                    id={title + "-dbus-line-graph"}
                    type='line'
                    parentSize={bodyRect}
                    parentData={[ interactiveData, automatedData ]}
                    isPrefix={false}
                    units={" DBUs"}
                    yAxis={"DBUs"}
                    xAxis={"Date"}
                  />
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          }
        </Modal.Body>
        <Modal.Footer>
          <Button
            id={`${title}-modal-close`} 
            onClick={() => close()} 
            variant="primary"
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default MetricsModal;