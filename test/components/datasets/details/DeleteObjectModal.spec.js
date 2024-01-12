import { configure, shallow } from "enzyme";
import DeleteObjectModal from "../../../../components/datasets/details/DeleteObjectModal";
import { waitFor, act } from "@testing-library/react";
import { Modal, Button } from "react-bootstrap";
global.fetch = require('jest-fetch-mock');

describe("DeleteObjectModal tests", () => {
  beforeEach(() => {
    fetch.mockResponse(JSON.stringify({ message: 'success' }));
  });

  afterEach(() => {
    fetch.resetMocks();
  });
  it("verify component renders correctly", () => {
    const wrapper = shallow(<DeleteObjectModal show={true} />);
    const modal = wrapper.find(Modal);
    const modalBody = modal.find(Modal.Body);
    const modalFooter = modal.find(Modal.Footer);
    const buttons = modalFooter.find(Button);
    expect(modal).toHaveLength(1);
    expect(modal.props().show).toEqual(true);
    expect(modalBody).toHaveLength(1);
    expect(modalFooter).toHaveLength(1);
    expect(buttons).toHaveLength(2);
    expect(modalBody.text()).toEqual('Are you sure you want to delete "".');
    expect(buttons.at(0).text()).toEqual("No");
    expect(buttons.at(1).text()).toEqual("Yes");
  });

  it("should display Message with filename before delete", () => {
    const wrapper = shallow(<DeleteObjectModal show={true} s3Object={"testFile"} />);
    expect(wrapper.find("div").text()).toContain('Are you sure you want to delete "testFile".');
  });
  it("should handle deleteObjectModal close", () => {
    const callback = jest.fn();
    const wrapper = shallow(<DeleteObjectModal show={true} s3Object={"testFile"} handleClose={callback} />);
    const cancelButton = wrapper.find(Button).at(0);
    expect(cancelButton.text()).toContain("No");
    act(() => {
      cancelButton.props().onClick();
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should handle deleteObjectModal submit", async () => {
    const expectedParams = {
        "credentials": "same-origin",
        "headers": {"Content-Type": "application/json"}, "method": "POST",
        "body": JSON.stringify({
            "Bucket": "/testBucket",
            "Key": "testFile",
            "datasetAccount":"testAccount",
            "environmentName":"com.raw.testDataset",
          })
      };
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const callback3 = jest.fn();
    const wrapper = shallow(
      <DeleteObjectModal
        show={true}
        s3Object={"testFile"}
        handleClose={callback1}
        actionStatus={callback2}
        deleteCompleted={callback3}
        datasetBucket={"/testBucket"}
        environmentName={"com.raw.testDataset"}
        datasetAccount={"testAccount"}
      />
    );

    const deleteButton = wrapper.find(Button).at(1);
    expect(deleteButton.text()).toContain("Yes");
    act(() => {
      deleteButton.props().onClick();
    });
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith(`/api/datasets/delete-file`, expectedParams);
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(2);
  });

  it("should not update deleteCompleted if delete-file api throws error", async () => {
    fetch.mockResponse(JSON.stringify({error: 'some error'}), {status: '400'});
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const deleteCompletedCallback = jest.fn();
    const wrapper = shallow(
      <DeleteObjectModal
        show={true}
        s3Object={"testFile"}
        handleClose={callback1}
        actionStatus={callback2}
        deleteCompleted={deleteCompletedCallback}
        datasetBucket={"/testBucket"}
        environmentName={"com.raw.testDataset"}
        datasetAccount={"testAccount"}
      />
    );

    const deleteButton = wrapper.find(Button).at(1);
    expect(deleteButton.text()).toContain("Yes");
    act(() => {
      deleteButton.props().onClick();
    });
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(deleteCompletedCallback).toHaveBeenCalledTimes(0);
  });
});
