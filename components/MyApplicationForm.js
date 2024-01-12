import {Button, Card, Col, Form, OverlayTrigger, Spinner, Tooltip} from "react-bootstrap";
import React, {useEffect, useState} from "react";
import ValidatedInput from "./ValidatedInput";
import Select from "./Select";
import Spacer from "./Spacer";
import applicationModel from "../src/model/applicationModel";
import Toast from "react-bootstrap/Toast";
import {MdHelpOutline, MdInfoOutline} from "react-icons/md";
import ConfirmationModal from "./ConfirmationModal";
import RequiredAsterisk from "./utils/RequiredAsterisk";

import {useAppContext} from "./AppState";

const MyApplicationForm = (props) => {
  const globalContext = useAppContext();
  const { listedApplications, unitDepartment } = useAppContext();
  const isBusinessAppEnabled = globalContext?.toggles['jdc.business_application_enabled']?.enabled || false
  const [id,setId] = useState("");
  const [subject, setSubject] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [teamPdl, setTeamPdl] = useState("");
  const [comments, setComments] = useState("");
  const [applicationErrors, setApplicationErrors] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [groups, setGroups] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [modalBody, setModalBody] = useState(null);
  const [isLoading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState(false);
  const [businessApps, setBusinessApps] = useState([]);
  const [businessApp, setBusinessApp] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const [department, setDepartment] = useState("");
  const [unit, setUnit] = useState("");
  const enterpriseDataLakeEdl = 'enterprise_data_lake_edl';

  const setInitialState = (application) => {
    const { editApplication = false} = props.router.query;
    if (JSON.parse(editApplication) && !!application) {
      setId(application.id);
      setSubject(application.subject);
      setShortDescription(application.shortDescription);
      setTeamPdl(application.teamPdl);
      setComments(application.comments);
      setUnit(application.unit || unitDepartment?.unit)
      setDepartment(application.department|| unitDepartment?.department)
    } else {
      setUnit(unitDepartment?.unit)
      setDepartment(unitDepartment?.department)
    }
  }

  const getBusinessAppId = (displayName) => {
    let result =  businessApps.find(item => item.displayName === displayName);
    return result?.name
  }
  const setUserGroups = (user) => {
    setGroups(
      user.groups.filter(
        (g) => g.startsWith("AWS") || g.startsWith("EDG")
      )
    );
  };

  const invalidMsg = (keyName) => {
    const {message: invalidMessage = "Application name cannot contain any space" } =
    applicationErrors.find(({ context: { key } }) => key === keyName) || {};
    return invalidMessage
  }

  const isInValid = (keyName) => {
    return applicationErrors.some(
      ({ context: { key } }) => key === keyName
    )
  }

  const validateForm = async () => {
    const body = constructBody();
    const { details: errors = [] } = applicationModel.validate(body) || {};
    if (errors.length && isEdit === false) {
        errors.push({
          context: { value: "", key: "id", label: "id" },
          name: id,
          message: "Invalid application name, spaces and special characters are not allowed, as per deere component standard, you can only use '-' in between names, for example abc-test. Please try again with a valid application name with characters limit of 200",
        });
    }

    if(isBusinessAppEnabled) {
      if (businessApps.length > 0 && (!!!businessApp || getBusinessAppId(businessApp) === enterpriseDataLakeEdl)){
        errors.push({
          context: { value: "", key: "businessApplicationsId", label: "businessApplicationsId" },
          name: id,
          message: `Please select a business application other than ${enterpriseDataLakeEdl}. If you don't see the business application you want to use to create the application, please create the required business application first.`,
        });
      }

      if (!!!businessApp && (typeof unit === undefined || unit === '')) {
        errors.push({
          context: { value: "", key: "unit", label: "unit" },
          name: id,
          message: `Please enter a valid unit`,
        });
      }

      if (!!!businessApp && (typeof department === undefined || department === '')) {
        errors.push({
          context: { value: "", key: "department", label: "department" },
          name: id,
          message: `Please enter a valid department`,
        });
      }
    }

    setApplicationErrors(errors);
    if (!errors.length && isEdit === false) {
      const app = await getApplications(id);
      if (app) {
        errors.push({
          context: { value: "", key: "id", label: "id" },
          name: id,
          message: "This application name already exists",
        });
        setApplicationErrors(errors);
      }
    }
    return errors;
  };

  const constructBody = () => {
    let body = {
      name: id,
      businessApplication: isBusinessAppEnabled && !!businessApp ? getBusinessAppId(businessApp) : enterpriseDataLakeEdl,
      teamPdl: teamPdl,
      subject: subject,
      assignmentGroup: 'AE EDL Support',
      supportGroup: 'AE EDL Support',
      businessCriticality: 'low',
      installStatus: 'Installed',
      shortDescription: shortDescription,
      comments: comments
    }
    if (isBusinessAppEnabled) {
      body.unit = unit;
      body.department = department;
    }

    return body
  };

  const constructReqBody = () => {
    const authorization = [
      {
        authorization_type: "api",
        role: "product_developer",
        subject: "AWS-GIT-DWIS-DEV",
      },
    ];
    return {
      name: id,
      assignment_group: 'AE EDL Support',
      authorizations:
        subject === "AWS-GIT-DWIS-DEV"
          ? authorization
          : [
              ...authorization,
              {
                authorization_type: "api",
                role: "product_developer",
                subject: subject,
              },
            ],
      business_application_name: isBusinessAppEnabled && !!businessApp ? getBusinessAppId(businessApp) : enterpriseDataLakeEdl,
      business_criticality: 'low',
      install_status: 'Installed',
      short_description: shortDescription,
      support_group: 'AE EDL Support',
      team_notification_pdl: teamPdl,
      comments: comments,
      unit: unit,
      department: department
    };
  };

  const handleSubmit = async () => {
    setShowToast(false);
    const { onSuccess} = props
    const { editApplication=false, applicationName } = props.router.query
    const endpoint = JSON.parse(editApplication) === true ? `/api/applications/${applicationName}` : `/api/applications`;
    const validationErrors = await validateForm();
    if (!validationErrors.length) {
      setLoading(true);
      const requestBody = constructReqBody();
      try {
        const applicationResponse = await fetch(endpoint, {
          credentials: "same-origin",
          method: "POST",
          headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
        const response = await applicationResponse.json();
        if (applicationResponse.ok) {
          setLoading(false);
          onSuccess(response.name)
        } else {
          console.error(applicationResponse);
          setLoading(false);
          setValidationError(false);
          setShowToast(true);
          setErrorMessage(response?.error);
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      setValidationError(true);
      setShowToast(true);
    }
  };

  const getApplications = async (applicationName) => {
    try {
    let applications = [];
    let application;
    const response = await fetch(`/api/applications`, {
        credentials: 'same-origin',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        applications = await response.json();
        application = applications.find(app => app.id === applicationName)
      } else {
        applications = [];
      }
      setInitialState(application);
      return application
    } catch (error) {
      setModalBody({
        showAcceptOnly: true,
        onAccept: () => setModalBody(null),
        body: (
          <div>
            <div>Failed due to {error.message}</div>
          </div>
        ),
      });
    }
  };

  const loadUser = async () => {
    const req = await fetch("/api/session/user", {
      credentials: "same-origin",
    });
    const user = await req.json();
    setUserGroups(user);
  };

  const loadAllBusinessApplications = async () => {
    const req = await fetch("/api/businessApplications", {
      credentials: "same-origin",
    });
    return await req.json()
  };

  const setBusinessApplicationsForUser = (applicationName, businessApplications) => {
    let storedApplications = localStorage.getItem('listedApplications') || "[]";
    let applications;
    if (storedApplications) {
      applications = JSON.parse(storedApplications);
    }
    let application = applications?.find(app => app.id === applicationName) || {}
    setInitialState(application);
    setBusinessApps(businessApplications);
    let ba = Array.isArray(businessApplications) ? businessApplications.find(item => item.name === application?.businessApplication) : {};
    setBusinessApp(ba?.displayName);
  };

  useEffect(() => {
    if (listedApplications?.length > 0) {
      localStorage.setItem('listedApplications', JSON.stringify(listedApplications));
    }
  }, [listedApplications]);

  useEffect(() => {
    const {applicationName, editApplication = false} = props.router.query;
    setIsEdit(JSON.parse(editApplication));
    loadAllBusinessApplications().then((businessApplications) => {
      setBusinessApplicationsForUser(applicationName, businessApplications)
    });
    if (props.loggedInUser) {
      setUserGroups(props.loggedInUser);
    } else {
      loadUser();
    }
  }, []);


  const groupOptions = groups.map((g) => ({ value: g, label: g }));
  const businessAppOptions = Array.isArray(businessApps) ? businessApps.map((g) => ({ value: g.displayName, label: g.displayName })) : [];
  const handleClick = () => {
    setShowTooltip(!showTooltip);
  };

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);
  const handleDocumentClick = (event) => {
    const overlayTriggerElement = event.target.closest('#overlay-div-id');
    if (!overlayTriggerElement) {
      setShowTooltip(false);
    }
  };

  return (
    <>
      <ConfirmationModal
        id="confirmation"
        show={!!modalBody && !isEdit}
        showAcceptOnly={true}
        acceptButtonText="OK"
        body={(modalBody || {}).body}
        onAccept={() => setModalBody(null)}
      />
      <div className="float-right" style={{ marginTop: "-55px" }}>
        <Button
          size="sm"
          variant="outline-primary"
          href="https://mycloudhelp.deere.com/AWS/Application-Services/How-To/#create"
          target="_blank"
        >
          <MdHelpOutline size="15" />
          &nbsp; Help
        </Button>
      </div>
      <Spacer height="10px" />
      {!isLoading && (<Card>
        <Card.Body>
          <Card.Text as="div">
            <Form id="MyApplicationForm">
              <Form.Group>
                <Form.Label>
                  Application Service
                  <RequiredAsterisk/>
                </Form.Label>
                <ValidatedInput
                  component={Form.Control}
                  id="id"
                  type="text"
                  placeholder="Unique name for the application"
                  defaultValue={id}
                  onBlur={(e) => setId(e.target.value)}
                  invalidMessage={invalidMsg("id")}
                  isInvalid={isInValid("id")}
                  disabled={isEdit}
                />
              </Form.Group>
              {isBusinessAppEnabled &&
                  (<Form.Group>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                      <Form.Label style={{display: 'flex', alignItems: 'center'}}>Business Applications
                        <div id='overlay-div-id' style={{marginLeft: '3px'}}>
                          <OverlayTrigger
                              trigger="click"
                              placement="right"
                              show={showTooltip}
                              onClick={handleClick}
                              overlay={<Tooltip id={`tooltip-key`} style={{maxWidth: '100%'}}>
                                <div>
                                  If you don't see the business application you want to use to create/update the
                                  application,<br/>
                                  please create one by following the instructions mentioned in this URL:<br/>
                                  <a target='_blank'
                                     href='https://deere.sharepoint.com/sites/portfolio/SitePages/Request-a-New-Business-Application.aspx'
                                     onClick={(e) => e.stopPropagation()}>Link</a>
                                </div>
                              </Tooltip>}>
                            <span style={{marginRight: '3px'}} onClick={handleClick}><MdInfoOutline/></span>
                          </OverlayTrigger>
                        </div>
                      </Form.Label>
                    </div>
                    <ValidatedInput
                        component={Select}
                        id="businessApplicationsId"
                        onChange={(item) => setBusinessApp(item.value)}
                        value={businessApp ? {value: businessApp, label: businessApp} : null}
                        noOptionsMessage={() =>
                            "You don't have access to any business applications"
                        }
                        placeholder="Business application that will be associated with this application"
                        options={businessAppOptions}
                        isInvalid={isInValid("businessApplicationsId")}
                        invalidMessage={`Please select a business application other than "Enterprise Data Lake EDL". If you don't see the business application you want to use to create the application, please create the required business application first. Click on \u2139 to get more details.`}
                    />
                  </Form.Group>)
              }
              {isBusinessAppEnabled &&
                  (<Form.Row>
                    <Col>
                      <Form.Group>
                        <Form.Label>
                          Unit
                          <RequiredAsterisk/>
                        </Form.Label>
                        <ValidatedInput
                            component={Form.Control}
                            id="unit"
                            placeholder="Unit"
                            type="text"
                            defaultValue={unit}
                            onBlur={(e) => setUnit(e.target.value)}
                            invalidMessage="Must provide a valid unit "
                            isInvalid={isInValid("unit")}
                        />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group>
                        <Form.Label>
                          Department
                          <RequiredAsterisk/>
                        </Form.Label>
                        <ValidatedInput
                            component={Form.Control}
                            id="department"
                            placeholder="Department"
                            type="text"
                            defaultValue={department}
                            onBlur={(e) => setDepartment(e.target.value)}
                            invalidMessage="Must provide department"
                            isInvalid={isInValid("department")}
                        />
                      </Form.Group>
                    </Col>
                  </Form.Row>)
              }
              <Form.Group>
                <Form.Label>
                  Notification PDL
                  <RequiredAsterisk/>
                </Form.Label>
                <ValidatedInput
                  component={Form.Control}
                  id="teamPdl"
                  type="text"
                  placeholder="Team PDL to receive communications e.g notifications, budget alert etc."
                  defaultValue={teamPdl}
                  invalidMessage="Must provide a valid email address"
                  onBlur={(e) => setTeamPdl(e.target.value)}
                  isInvalid={isInValid("teamPdl")}
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>
                  AD Group
                  <RequiredAsterisk/>
                </Form.Label>
                <ValidatedInput
                  component={Select}
                  id="ADGroup"
                  onChange={(item) => setSubject(item.value)}
                  value={subject ? { value: subject, label: subject } : null}
                  noOptionsMessage={() =>
                    "You aren't a member of any AWS or EDG groups."
                  }
                  placeholder="AD group who will manage this data"
                  options={groupOptions}
                  isInvalid={isInValid("subject")}
                  invalidMessage="Select or enter a custodian with less than 200 characters"
                  isDisabled={isEdit}
                />
              </Form.Group>
              <Spacer />
              <h4>ServiceNow Attributes</h4>
              <hr />
              <Form.Row>
                <Col>
                  <Form.Group key="comments">
                    <Form.Label>Comments</Form.Label>
                    <ValidatedInput
                      component={Form.Control}
                      id="comments"
                      as="textarea"
                      key={comments}
                      style={{ fontFamily: "initial" }}
                      placeholder="(Optional) Comments"
                      defaultValue={!comments ? "" : comments}
                      onBlur={(e) => setComments(e.target.value)}
                      invalidMessage="Must provide Comments "
                      isInvalid={isInValid("comments")}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group key="shortDescription">
                    <Form.Label>
                      Short Description
                      <RequiredAsterisk/>
                    </Form.Label>
                    <ValidatedInput
                      component={Form.Control}
                      id="shortDescription"
                      as="textarea"
                      key={shortDescription}
                      style={{ fontFamily: "initial" }}
                      placeholder="A brief Description about your application."
                      defaultValue={shortDescription}
                      onBlur={(e) => setShortDescription(e.target.value)}
                      invalidMessage="Must provide a brief Description about your application"
                      isInvalid={isInValid("shortDescription")}
                    />
                  </Form.Group>
                </Col>
              </Form.Row>
              <Spacer />
              <span className="float-right">
                <Button
                  onClick={() => props.onCancel()}
                  size="sm"
                  variant="secondary"
                  id="cancelApplication"
                >
                  Cancel
                </Button>
                &nbsp;&nbsp;
                <Button
                  onClick={handleSubmit}
                  size="sm"
                  variant="primary"
                >
                  Submit
                </Button>
              </span>
            </Form>
            <Spacer />
          </Card.Text>
        </Card.Body>
      </Card>)}
      <Toast
        hidden={!showToast}
        show={showToast}
        onClose={() => setShowToast(false)}
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
          borderColor: "#c21020",
        }}
      >
        {validationError ?
        <React.Fragment>
          <Toast.Header>
          <strong className="mr-auto">Invalid for submission</strong>
          </Toast.Header>
          <Toast.Body>
          Please review the errors and make any necessary corrections.
          </Toast.Body>
        </React.Fragment> :
        <React.Fragment>
          <Toast.Header>
            <strong className="mr-auto">Application Creation Failed</strong>
          </Toast.Header>
          <Toast.Body>
            {errorMessage}
          </Toast.Body>
      </React.Fragment>}

      </Toast>
      <div className="text-muted small" align="center" hidden={!isLoading}>
        <Spinner className="spinner-border uxf-spinner-border-md" animation="border" role="status">
          <span className="sr-only">Loading...</span>
        </Spinner>
      </div>
    </>
  );
};
export default MyApplicationForm;
