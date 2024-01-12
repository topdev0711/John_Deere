import UploadFileModal from "../../../components/datasets/UploadFileModal";
import { configure, shallow, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import { act } from "react-dom/test-utils";
import React from "react";
import { Modal, Button, OverlayTrigger } from "react-bootstrap";
import * as axios from "axios";
jest.mock("axios");

configure({ adapter: new Adapter() });

jest.mock("next/router");

const createFile = (name, size, type) => {
  const file = new File(['test'], name, { type });
  Reflect.defineProperty(file, 'size', {
    get() {
      return size;
    }
  });
  return file;
};

const files = [
  createFile('foo.png', 200, 'image/png')
];

describe("UploadFileModal test suite", () => {
  it("verify component renders correctly", () => {
    const wrapper = shallow(<UploadFileModal show={true} />);
    const modal = wrapper.find(Modal);
    const modalBody = modal.find(Modal.Body);
    const modalFooter = modal.find(Modal.Footer);
    const buttons = modalFooter.find(Button);
    expect(modal).toHaveLength(1);
    expect(modal.props().show).toEqual(true);
    expect(modalBody).toHaveLength(1);
    expect(modalFooter).toHaveLength(1);
    expect(buttons).toHaveLength(2);
    expect(buttons.at(0).text()).toEqual("Close");
    expect(buttons.at(1).text()).toEqual("Upload");
  });

  it("should handle UploadFileModal close", () => {
    const callback = jest.fn();
    const wrapper = shallow(<UploadFileModal show={true} handleClose={callback} />);
    const cancelButton = wrapper.find(Button).at(0);
    expect(cancelButton.text()).toContain("Close");
    act(() => {
      cancelButton.props().onClick();
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should not upload if file is not selected", () => {
    const wrapper = shallow(<UploadFileModal show={true} />);
    const uploadButton = wrapper.find(Button).at(1);
    act(() => {
      uploadButton.props().onClick();
    });
    expect(wrapper.find(Button).at(1).prop("disabled")).toBeFalsy();
  });

  it("should render dropzone", () => {
    const callback = jest.fn();
    const wrapper = shallow(<UploadFileModal show="true" handleClose={callback} />);
    const dropzone = wrapper.find(".upload-file");
    expect(dropzone).toHaveLength(1);
    const progressbar = wrapper.find(".upload-file-progressbar");
    expect(progressbar).toHaveLength(0);
  });

  it("should  render progressbar before submit success", () => {
    const callback = jest.fn();
    const wrapper = shallow(<UploadFileModal show="true" handleClose={callback} />);
    const progressbar = wrapper.find(".upload-file-progressbar");
    expect(progressbar).toHaveLength(0);
    const uploadMessage = wrapper.find(".upload-message");
    expect(uploadMessage).toHaveLength(1);
    expect(uploadMessage.text()).toEqual("");
  });

  it("should  render uploadMessage without any text before submit success", () => {
    const callback = jest.fn();
    const wrapper = shallow(<UploadFileModal show="true" handleClose={callback} />);
    const uploadMessage = wrapper.find(".upload-message");
    expect(uploadMessage).toHaveLength(1);
    expect(uploadMessage.text()).toEqual("");
  });

  it("should clear selected files on click of remove files", async () => {
    const callback = jest.fn();
    const wrapper = shallow(<UploadFileModal show="true" handleClose={callback} />);
    wrapper.find("input").simulate("change", {
      target: { files },
      preventDefault: () => {},
      persist: () => {},
    });
    await Promise.resolve();
    const deleteFileButton = wrapper.find(OverlayTrigger).find('button');
    expect(deleteFileButton.exists()).toBeTruthy()
    act(() => {
      deleteFileButton.props().onClick();
    });
    await Promise.resolve();
    expect(wrapper.find(OverlayTrigger).exists()).toBeFalsy()

  });

  it("should reject too large file", async () => {
    const rejectFile = [
      createFile('foo.png', 262144001, 'image/png')
    ];
    const callback = jest.fn();
    const wrapper = shallow(<UploadFileModal show="true" handleClose={callback} />);
    wrapper.find("input").simulate("change", {
      target: { files },
      preventDefault: () => {},
      persist: () => {},
    });
    await Promise.resolve();
    expect(wrapper.find('.upload-file').find('div').exists()).toBeTruthy()
  });

  it("should upload when file is selected", async () => {
    const message = 'success';
    const status = 201;
    const mockAxios = jest.spyOn(axios, 'post');
    mockAxios.mockResolvedValue({ response: { status, data: { message: message } } });

    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const callback3 = jest.fn();
    const wrapper = shallow(<UploadFileModal show="true" handleClose={callback1} actionStatus={callback2} uploadCompleted={callback3} />);
    wrapper.find("input").simulate("change", {
      target: { files },
      preventDefault: () => {},
      persist: () => {},
    });
    await Promise.resolve();
    const uploadButton = wrapper.find(Button).at(1);
    act(() => {
      uploadButton.props().onClick();
    });
    await Promise.resolve();
    expect(callback2).toHaveBeenCalledTimes(2);
    expect(callback3).toHaveBeenCalledTimes(1);
    expect(uploadButton.props('disabled')).toBeTruthy();
  });
  it("should upload attachment", async () => {
    axios.mockImplementation(() => Promise.resolve({ message: 'success' }))
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const callback3 = jest.fn();
    const wrapper = shallow(<UploadFileModal show="true" handleClose={callback1} actionStatus={callback2} uploadCompleted={callback3} isAttachment={true}/>);
    wrapper.find("input").simulate("change", {
      target: { files },
      preventDefault: () => {},
      persist: () => {},
    });
    await Promise.resolve();
    const uploadButton = wrapper.find(Button).at(1);
    act(() => {
      uploadButton.props().onClick();
    });
    await Promise.resolve();
    expect(callback2).toHaveBeenCalledTimes(2);
    expect(callback3).toHaveBeenCalledTimes(1);
    expect(uploadButton.props('disabled')).toBeTruthy();
  });

  it("should cancel upload", async () => {
    const message = 'success';
    const status = 201;
    const mockAxios = jest.spyOn(axios, 'post');
    mockAxios.mockResolvedValue({ response: { status, data: { message: message } } });
    const waitTime = 500; // wait for 500 milliseconds
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const callback3 = jest.fn();
    const wrapper = shallow(<UploadFileModal show="true" handleClose={callback1} actionStatus={callback2} uploadCompleted={callback3} />);
    wrapper.find("input").simulate("change", {
      target: { files },
      preventDefault: () => {},
      persist: () => {},
    });
    await new Promise(resolve => setTimeout(resolve, waitTime));
    const uploadButton = wrapper.find(Button).at(1);
    act(() => {
      uploadButton.props().onClick();
    });
    const cancelButton = wrapper.findWhere(node => node.key() === 'upload-cancel').find('button');
    act(() => {
      cancelButton.props().onClick();
    });
    await Promise.resolve();
    expect(uploadButton.prop('disabled')).toEqual(false)

  });

  it("should throw error if upload-file api throws error", async () => {
    const errorMessage = 'Internal Server Error';
    const status = 500;
    const mockAxios = jest.spyOn(axios, 'post');
    mockAxios.mockRejectedValueOnce({ response: { status, data: { message: errorMessage } } });

    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const callback3 = jest.fn();
    const wrapper = shallow(<UploadFileModal show="true" handleClose={callback1} actionStatus={callback2} uploadCompleted={callback3} />);
    wrapper.find("input").simulate("change", {
      target: { files },
      preventDefault: () => {},
      persist: () => {},
    });
    const uploadButton = wrapper.find(Button).at(1);
    act(() => {
      uploadButton.props().onClick();
    });
    await Promise.resolve();
    expect(callback3).toHaveBeenCalledTimes(0);
    expect(uploadButton.props('disabled')).toBeTruthy();
  });
});
