import Spacer from "./Spacer";
import { Card, Row, Col, Button, Spinner } from "react-bootstrap";
import Accordion from "./Accordion";
import { MdAdd, MdDeleteForever, MdEdit, MdInsertChart } from "react-icons/md";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ConfirmationModal from "./ConfirmationModal";
import MetricsModal from "./MetricsModal";
import {useAppContext} from "./AppState";

const styles = {
  header: { display: "block" },
  detail: { display: "block", paddingBottom: "5px" },
  registerApp: {
    marginTop: "2px",
    whitespace: "nowrap",
  },
};

const deleteModalBody = (label) => {
  return (
    <div>
      <div>Are you sure you want to delete {label} application?</div>
      <br />
    </div>
  );
};

const disableButton = (assignmentGroup, supportGroup, businessApplication) => {
  return assignmentGroup === "AE EDL Support" &&
      supportGroup === "AE EDL Support";
};

function getTitle(applications) {
  const [ firstApp = "" ] = applications;
  return `${firstApp} Metrics`;
}
const ApplicationCatalog = (props) => {
  const { DISPLAY_METRICS } = props;
  const { setListedApplications } = useAppContext();
  const [ myApps, setMyApps ] = useState([]);
  const [ isLoading, setLoading ] = useState(true);
  const [ modal, setModal ] = useState(null);
  const [ selectedApplications, setSelectedApplications ] = useState([]);

  let btnRef = useRef();

  const onClickDisableBtn = () => {
    if(btnRef.current){
      btnRef.current.setAttribute("disabled", "disabled");
    }
  }

  const handleServerResponse = async (appName, res) => {
    if (res.ok) {
      const filteredApps = myApps.filter(({ label }) => label !== appName);
      setMyApps(filteredApps);
      setListedApplications(filteredApps)
    } else {
      let errorResponse;
      try {
        errorResponse = await res.json();
      } catch (e) {
        errorResponse = res.statusText;
      }
      setModal({
        showAcceptOnly: true,
        onAccept: () => setModal(null),
        body: (
          <div>
            <div>{errorResponse.error}: {appName}</div>
          </div>
        ),
      });
    }
  };

  const acceptDelete = async (appName) => {
    setLoading(true);
    const applicationDeleteRes = await fetch(`/api/applications/${appName}`, {
      credentials: "same-origin",
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    setLoading(false);
    handleServerResponse(appName, applicationDeleteRes);
  };

  useEffect(() => {
    async function getApplications() {
      if (!isLoading) setLoading(true);
      try {
        const response = await fetch(`/api/applications`, {
          credentials: "same-origin",
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const applications = await response.json();
          setMyApps(applications);
          setListedApplications(applications)
          setLoading(false);
        } else {
          setMyApps([]);
          setListedApplications([])
          console.log('Error from Server: ',response);
        }
      } catch (error) {
        setMyApps([]);
        setListedApplications([])
        console.error(error)
      }
      setLoading(false);
    }
    getApplications();
  }, []);

  return (
    <>
      {!isLoading && (
        <div>
          <ConfirmationModal
            id="deletionConfirmation"
            show={!!modal}
            showAcceptOnly={(modal || {}).showAcceptOnly}
            body={(modal || {}).body}
            onCancel={() => setModal(null)}
            onAccept={() => {
              modal.onAccept();
            }}
          />
          <MetricsModal
            id="componentCostModal"
            title={getTitle(selectedApplications)}
            applications={selectedApplications}
          />
          <div>
            <Row>
              <Col md={{ span: 12 }}>
                <h2>My Applications</h2>
                <Spacer height="15px" />
              </Col>
              <Col>
                <span className="float-md-right" style={styles.registerApp}>
                  <Link href="/catalog/myapplications/register">
                    <Button size="sm" variant="outline-primary">
                      <MdAdd /> Add Application
                    </Button>
                  </Link>
                </span>
                <Spacer height="15px" />
              </Col>
            </Row>
            <Spacer height="8px" />
            <Row className="flex-xl-nowrap">
              <Col md={{ span: 24 }}>
                <Accordion
                  filterable
                  key="myapps-view"
                  items={myApps.map(app => {
                    const { label, id, assignmentGroup, supportGroup, shortDescription, subject } = app;
                    const businessApplication = app.businessApplication;
                    const billingSOPId = app.billingSOPId;
                    const chargeUnitDept = app.chargeUnitDepartment;
                    const teamPdl = app.teamPdl;
                    return {
                      id,
                      filterContent: app,
                      header: (
                        <>
                          <span style={styles.header} className="text-muted small">
                            <b>Name:</b> <i>{label}</i>
                          </span>
                        </>
                      ),
                      body: (
                        <>
                          <div className="text-muted float-right">
                            <span>
                              {DISPLAY_METRICS &&
                                <Button
                                  id={`${app.value}-metrics-button`}
                                  onClick={() => setSelectedApplications([ app.value ])}
                                  size='sm'
                                  variant="outline-success"
                                >
                                  <MdInsertChart /> Metrics
                                </Button>
                              }
                              &nbsp;
                              <Link href={`/catalog/myapplications/register?editApplication=true&applicationName=${label}`}>
                                <Button id={`edit-myapp-${label}`} disabled={!disableButton(assignmentGroup, supportGroup, businessApplication)} variant="outline-success" size="sm">
                                  <MdEdit /> Edit
                                </Button>
                              </Link>
                            </span>
                            &nbsp;
                            <span>
                              <Button
                                id={`delete-myapp-${label}`}
                                ref = {btnRef}
                                onClick={() =>
                                  setModal({
                                    onAccept: () => {
                                      setModal(null);
                                      acceptDelete(label);
                                      onClickDisableBtn();
                                    },
                                    body: deleteModalBody(label),
                                  })
                                }
                                disabled={!disableButton(assignmentGroup, supportGroup, businessApplication)}
                                variant="outline-success"
                                size="sm"
                              >
                                <MdDeleteForever /> Delete
                              </Button>
                            </span>
                          </div>
                          <span style={styles.detail} className="text-muted small">
                            <b>Description:</b> <i>{shortDescription}</i>
                          </span>
                          <span style={styles.detail} className="text-muted small">
                            <b>Business Application:</b> <i>{businessApplication}</i>
                          </span>
                          <span style={styles.detail} className="text-muted small">
                            <b>AD Group:</b> <i>{subject}</i>
                          </span>
                          <span style={styles.detail} className="text-muted small">
                            <b>Notification PDL:</b> <i>{teamPdl}</i>
                          </span>
                        </>
                      ),
                    };
                  })}
                />
                <div align="center" hidden={!!myApps.length}>
                  <Spacer height="20px" />
                  <Card.Text className="text-muted">
                    <i>No applications found</i>
                  </Card.Text>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      )}
      <div className="text-muted small" align="center" hidden={!isLoading}>
        <Spinner className="spinner-border uxf-spinner-border-lg" animation="border" role="status">
          <span className="sr-only">Loading...</span>
        </Spinner>
      </div>
    </>
  );
};

export default ApplicationCatalog;
