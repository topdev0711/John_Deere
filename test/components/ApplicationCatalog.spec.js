import { waitFor } from '@testing-library/react';
import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { Button, Modal } from 'react-bootstrap';
import ApplicationCatalog from '../../components/ApplicationCatalog';
import MetricsModal from '../../components/MetricsModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { act } from 'react-dom/test-utils';
import {useAppContext} from '../../components/AppState';

global.fetch = require('jest-fetch-mock');
jest.mock('../../components/AppState');

configure({ adapter: new Adapter() });

const applications = [
    {
    value: "some1 application",
    label: "some1-application",
		businessApplication: "enterprise_data_lake_edl",
		billingSOPId: "",
		chargeUnitDepartment: "",
		id: "some-id",
		teamPdl: "some-email@johndeere.com",
		assignmentGroup: "AE EDL Support",
		supportGroup: "AE EDL Support",
		shortDescription: "some text",
		subject: "SOME-AD-GROUP"
  }
];

describe('ApplicationCatalog Test Suite', () => {
  window.URL.createObjectURL = jest.fn();

  beforeEach(() => {
    useAppContext.mockReturnValue({
      listedApplications: [],
      setListedApplications: jest.fn()
    });
    fetch.mockResponseOnce(JSON.stringify(applications));
  })

  afterEach(() => {
    fetch.resetMocks();
  })


  it('should render', () => {
    const wrapper = shallow(<ApplicationCatalog />);

    expect(wrapper).toBeDefined();
  });

  it('should display metrics', async () => {
    const expectedTitle = `${applications[0].value} Metrics`;
    const expectedApplications = [ applications[0].value ];
    const wrapper = mount(<ApplicationCatalog DISPLAY_METRICS={true}/>);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    wrapper.update();
    const button = wrapper.find(Button).filterWhere(object => object.props().id === `${applications[0].value}-metrics-button`);
    button.simulate('click');
    const modal = wrapper.find(MetricsModal);

    expect(modal.props().title).toEqual(expectedTitle);
    expect(modal.props().applications).toEqual(expectedApplications);
  });

  it('should display edit application button', async () => {
    const wrapper = mount(<ApplicationCatalog DISPLAY_METRICS={true}/>);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    wrapper.update();
    const button = wrapper.find(Button).filterWhere(object => object.props().id === `edit-myapp-${applications[0].label}`);
    expect(button.props().disabled).toEqual(false);
  });

  it('should display delete application button', async () => {
    const wrapper = mount(<ApplicationCatalog DISPLAY_METRICS={true}/>);
    const expectedBody = "<div class=\"modal-body\"><div><div>Are you sure you want to delete some1-application application?</div><br></div></div>";
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    wrapper.update();
    const button = wrapper.find(Button).filterWhere(object => object.props().id === `delete-myapp-${applications[0].label}`);
    expect(button.props().disabled).toEqual(false);
    button.simulate('click');
    const confirmationModal = wrapper.find(ConfirmationModal).filterWhere(modal => modal.props().id === 'deletionConfirmation').find(Modal);
    expect(confirmationModal.props().show).toEqual(true);
    const modalBody = confirmationModal.find(Modal.Body);
    expect(modalBody.html()).toEqual(expectedBody);
  });

  it('should call onecloud delete api successfully', async () => {
    const wrapper = mount(<ApplicationCatalog DISPLAY_METRICS={true}/>);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    wrapper.update();
    const button = wrapper.find(Button).filterWhere(object => object.props().id === `delete-myapp-${applications[0].label}`);
    button.simulate('click');
    const confirmationModal = wrapper.find(ConfirmationModal).filterWhere(modal => modal.props().id === 'deletionConfirmation').find(Modal);
    const deleteButton = confirmationModal.find(Modal.Footer).find(Button);
    const expectedParams = {
      "credentials": "same-origin",
      "headers": {
          "Content-Type": "application/json"
      },
      "method": "DELETE"
     };

    fetch.mockResponse({ status: '200' });
    await act(async () => deleteButton.at(1).props().onClick());
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith(`/api/applications/some1-application`, expectedParams);
  });

  it('should show exception message when failed to delete application', async () => {
    const wrapper = mount(<ApplicationCatalog DISPLAY_METRICS={true}/>);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    wrapper.update();
    const button = wrapper.find(Button).filterWhere(object => object.props().id === `delete-myapp-${applications[0].label}`);
    button.simulate('click');
    const confirmationModal = wrapper.find(ConfirmationModal).filterWhere(modal => modal.props().id === 'deletionConfirmation').find(Modal);

    const deleteButton = confirmationModal.find(Modal.Footer).find(Button);
    fetch.mockResponse(JSON.stringify({ message: 'some error' }), { status: '400' });
    await act(async () => deleteButton.at(1).props().onClick());
    wrapper.update();
    const modalBody = confirmationModal.find(Modal.Body).text();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

});
