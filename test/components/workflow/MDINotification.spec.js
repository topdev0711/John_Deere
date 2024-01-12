import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import MDINotificationForm from "../../../components/workflow/MDINotificationForm";
import { getLoggedInUser } from "../../../components/AppState";
import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import { GlobalConst } from "../../../components/workflow/constants";

const notificationsProps = {
  representation: "representation",
  dbType: "DB",
  setNotificationBody: jest.fn(),
  mdiNotificationError: true,
  taskName: "dummyTask",
};
jest.mock("../../../components/AppState");
configure({ adapter: new Adapter() });
global.fetch = require("jest-fetch-mock");
const anyUser = "loggedInUser";

describe("MDINotificationForm", () => {
  beforeEach(() => {
    fetch.resetMocks();
    getLoggedInUser.mockReturnValue({ username: anyUser });
  });

  it("should check all checkboxes if select all is checked", () => {
    render(<MDINotificationForm {...notificationsProps} />);
    const notificationStatus = screen.getAllByRole("checkbox");
    notificationStatus[0].click();
    expect(notificationStatus[0]).toBeChecked;
    expect(notificationStatus[1]).toBeChecked;
    expect(notificationStatus[2]).toBeChecked;
    expect(notificationStatus[3]).toBeChecked;
    expect(notificationStatus[4]).toBeChecked;
  });

  it("should uncheck select all checkbox if any other checkbox is unchecked", () => {
    render(<MDINotificationForm {...notificationsProps} />);
    const notificationStatus = screen.getAllByRole("checkbox");
    notificationStatus[0].click();
    expect(notificationStatus[0]).toBeChecked;
    notificationStatus[1].click();
    expect(notificationStatus[1].checked).toBe(false);
    expect(notificationStatus[0].checked).toBe(false);
  });

  it("should show only completed and failed status for sharepoint", () => {
    const sharepointProps = {
      representation: "representation",
      dbType: { value: GlobalConst?.DB_TYPE_SHAREPOINT },
      setNotificationBody: jest.fn(),
      mdiNotificationError: true,
      taskName: "dummyTask",
    };
    render(<MDINotificationForm {...sharepointProps} />);
    const notificationStatus = screen.getAllByRole("checkbox");
    expect(notificationStatus.length).toEqual(3);
    expect(notificationStatus[0].value).toEqual("ALL");
    expect(notificationStatus[1].value).toEqual("COMPLETE");
    expect(notificationStatus[2].value).toEqual("FAILED");
  });

  it("notification body should have correct body as per loggedin user and user input", async() => {
    render(<MDINotificationForm {...notificationsProps} />);
    const protocolARN = screen.getByRole("textbox", { placeholder: 'Protocol Endpoint Arn' });
    await userEvent.type(protocolARN, "protocol arn");
    const notificationStatus = screen.getAllByRole("checkbox");
    notificationStatus[2].click();
    expect(notificationStatus[2].value).toEqual("COMPLETE");
    expect(notificationStatus[2].checked).toBe(true);

    const expectedBody = {
      endpoint: "protocol arn",
      event: "subscription_notification_topic",
      owner: "loggedInUser",
      protocol: "sqs",
      representation: ["dummyTask"],
      status: ["COMPLETE"],
    };
    expect(notificationsProps.setNotificationBody).toBeCalledWith(expectedBody);
  });

  it("should render MDI Notification Form with all elements", () => {
    render(<MDINotificationForm {...notificationsProps} />);
    const sqsOption = screen.getByRole("option", { name: "SQS" });
    const prerequisites = screen.getByRole("link", {name: "Prerequisites"})
    expect(prerequisites).toBeInTheDocument();
    expect(sqsOption).toBeInTheDocument();
    const protocolARN = screen.getByPlaceholderText("Protocol Endpoint Arn");
    expect(protocolARN).toBeInTheDocument();
    const notificationStatus = screen.getAllByRole("checkbox");
    expect(notificationStatus[0].value).toEqual("ALL");
    expect(notificationStatus[1].value).toEqual("PENDING");
    expect(notificationStatus[2].value).toEqual("COMPLETE");
    expect(notificationStatus[3].value).toEqual("COMPLETE_WITH_ERRORS");
    expect(notificationStatus[4].value).toEqual("FAILED");
  });
});
