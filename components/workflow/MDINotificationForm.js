import { Button, Card, Form, Col, Collapse } from "react-bootstrap";
import React, { useState, useEffect } from "react";
import ValidatedInput from "../ValidatedInput";
import { MDINotificationsConst, GlobalConst } from "./constants";
import { Checkbox } from "@deere/ux.uxframe-react";
import { MdAddCircleOutline, MdRemoveCircleOutline } from "react-icons/md";
import "./styles/mdiNotification.module.css";
import Spacer from "../Spacer";
import { getLoggedInUser } from "../AppState";

const MDINotificationForm = ({
  representation,
  dbType,
  setNotificationBody,
  mdiNotificationError,
  taskName,
}) => {
  const [protocolEndpointArn, setProtocolEndpointArn] = useState();
  const [protocolValue, setProtocolValue] = useState("sqs");
  const [mdiNotificationSettings, setMDINotificationSettings] = useState(false);
  const [statusList, setStatusList] = useState([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);

  const protocolList = MDINotificationsConst?.MDI_NOTIFICATION_PROTOCOLS;
  const notificationStatus =
    dbType?.value === GlobalConst?.DB_TYPE_SHAREPOINT
      ? MDINotificationsConst?.SP_NOTIFICATION_STATUS_LIST
      : MDINotificationsConst?.NOTIFICATION_STATUS_LIST;

  const clearAllCheckboxChoices = Object.fromEntries(
    notificationStatus.map((key) => [key, false])
  );
  const selectAllCheckboxChoices = Object.fromEntries(
    notificationStatus.map((key) => [key, true])
  );
  const [checked, setChecked] = useState(clearAllCheckboxChoices);

  const loggedInUser = getLoggedInUser();

  const capitalizeFirstLetter = (input) => {
    return input?.charAt(0).toUpperCase() + input?.slice(1).toLowerCase();
  };

  const statusOptions = notificationStatus.map((status) => ({
    label: capitalizeFirstLetter(status),
    value: status,
  }));

  const collapsibleHeading = () => {
    return (
      <>
        <Spacer height="25px" />
        <Form.Row>
          <div style={{ justifyContent: "center" }}>
            <div className="mb-0" style={{ display: "inline-block" }}>
              <Button
                id="mdiNotification"
                style={{ margin: 0, padding: "0 0 7px 0" }}
                onClick={() =>
                  setMDINotificationSettings(!mdiNotificationSettings)
                }
                aria-controls="mdi-collapse-control"
                aria-expanded={mdiNotificationSettings}
                variant="link"
              >
                {mdiNotificationSettings ? (
                  <MdRemoveCircleOutline />
                ) : (
                  <MdAddCircleOutline />
                )}
              </Button>
            </div>
            <div className="mb-0" style={{ display: "inline-block" }}>
              <h4 style={{ margin: 0, paddingLeft: "5px" }}>
                {MDINotificationsConst?.MDI_NOTIFICATION_HEADER}&nbsp;&nbsp;
                <small>
                  <i style={{ color: "#909090", fontSize: "70%" }}>Optional</i>
                </small>
              </h4>
            </div>
          </div>
        </Form.Row>
      </>
    );
  };

  const handleAllCheckboxChange = (event) => {
    setSelectAllChecked(!selectAllChecked);
    if (event.target.checked) {
      setStatusList(notificationStatus);
      setChecked(selectAllCheckboxChoices);
    } else {
      setStatusList([]);
      setChecked(clearAllCheckboxChoices);
    }
  };

  const handleCheckboxChange = (event) => {
    let checkedUpdated = { ...checked };
    checkedUpdated[event.target.value] = !checkedUpdated[event.target.value];
    setChecked(checkedUpdated);

    if (statusList.includes(event.target.value)) {
      const updatedStatusList = statusList.filter(
        (item) => item !== event.target.value
      );
      setStatusList(updatedStatusList);
      setSelectAllChecked(false);
    } else {
      setStatusList([...statusList, event.target.value]);
    }
  };

  useEffect(() => {
    if (statusList?.length === notificationStatus?.length) {
      setSelectAllChecked(true);
    } else {
      setSelectAllChecked(false);
    }
  }, [statusList]);

  useEffect(() => {
    setNotificationBody({
      endpoint: protocolEndpointArn,
      protocol: protocolValue,
      event: MDINotificationsConst?.NOTIFICATION_EVENT_TOPIC,
      owner: loggedInUser?.username,
      representation: [
        representation?.value?.length > 0 ? representation?.value : taskName,
      ],
      status: statusList,
    });
  }, [protocolEndpointArn, protocolValue, statusList]);

  return (
    <>
      {collapsibleHeading()}
      <hr />
      <Collapse in={mdiNotificationSettings}>
        <Card>
          <Card.Body className="bg-light">
            <Form.Row>
              <Form.Group as={Col} className="mb-0">
                <Form.Label className="uxf-label p-3">
                  {MDINotificationsConst?.MDI_NOTIFICATION_SETTINGS}
                </Form.Label>
              </Form.Group>
              <Form.Group as={Col} className="mb-0">
                <Button
                  href={MDINotificationsConst?.CONFLUENCE_HELP_LINK}
                  className="float-right"
                  variant="link"
                  target="_blank"
                >
                  Prerequisites
                </Button>
              </Form.Group>
            </Form.Row>
            <Form.Row>
              <Form.Group as={Col} className="mb-0 p-3">
                <Form.Label>
                  {MDINotificationsConst?.AWS_PROTOCOL_LABEL}
                </Form.Label>
                <Form.Control
                  as="select"
                  className="custom-select"
                  onChange={(event) => {
                    setProtocolValue(event.target.value.toLowerCase());
                  }}
                >
                  {protocolList.map((option, idx) => (
                    <option
                      key={`protocol-option-${idx}`}
                      id={`protocol-option-${idx}`}
                    >
                      {option}
                    </option>
                  ))}
                </Form.Control>
                <br />
                <br />
                <Form.Label>
                  {MDINotificationsConst?.PROTOCOL_ENDPOINT_ARN_LABEL}
                </Form.Label>
                <ValidatedInput
                  component={Form.Control}
                  id="endpointArn"
                  type="text"
                  placeholder="Protocol Endpoint Arn"
                  defaultValue={protocolEndpointArn}
                  onChange={(event) => {
                    setProtocolEndpointArn(event.target.value);
                  }}
                  invalidMessage={
                    MDINotificationsConst?.PROTOCOL_ENDPOINT_ARN_INVALID_MESSAGE
                  }
                  isInvalid={mdiNotificationError}
                />
              </Form.Group>
              <Form.Group as={Col} className="mb-0 p-3">
                <Form.Row>
                  <Form.Group>
                    <Form.Label>
                      {MDINotificationsConst?.NOTIFICATION_STATUS_HEADER}
                    </Form.Label>
                    <Checkbox
                      label="Select All"
                      value="ALL"
                      key={`custom-checkbox-all`}
                      id={`custom-checkbox-all`}
                      checked={selectAllChecked}
                      onChange={(event) => {
                        handleAllCheckboxChange(event);
                      }}
                    />
                    {statusOptions.map((option, idx) => (
                      <Checkbox
                        label={option.label}
                        value={option.value}
                        key={`custom-checkbox-${idx}`}
                        id={`custom-checkbox-${idx}`}
                        checked={checked[option.value]}
                        onChange={(event) => {
                          handleCheckboxChange(event);
                        }}
                        style={{ marginLeft: 1.25 + "em" }}
                      />
                    ))}
                  </Form.Group>
                </Form.Row>
              </Form.Group>
            </Form.Row>
          </Card.Body>
        </Card>
      </Collapse>
    </>
  );
};

export default MDINotificationForm;
