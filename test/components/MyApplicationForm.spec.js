import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import MyApplicationForm from '../../components/MyApplicationForm';
import React from "react";
import applicationModel from "../../src/model/applicationModel";
import ValidatedInput from '../../components/ValidatedInput';
import { Button, Toast } from 'react-bootstrap';
import { act, waitFor } from '@testing-library/react';
import BusinessApplications from '../BusinessApplicationResponse.json'
import {useAppContext} from '../../components/AppState';

global.fetch = require('jest-fetch-mock');
jest.mock("../../src/model/applicationModel");
jest.mock("next/router");
jest.mock('../../components/AppState');
configure({ adapter: new Adapter() });

describe('MyApplicationForm component test suite', () => {

    it('verify component renders', () => {
        useAppContext.mockReturnValue({
            listedApplications: [],
            setListedApplications: jest.fn(),
            toggles: {
                'jdc.business_application_enabled': {
                    enabled: true,
                },
            }
        });
        const groups = ['AWS-SOMEGROUP', 'EDG-SOMEGROUP', 'SOMEGROUP', 'G90-SOMEGROUP']
        shallow(<MyApplicationForm router={{query: {}}} loggedInUser={{groups: groups}}/>)
    })

    it("should set applicationError if application already exists", async () => {
        const setApplicationError = jest.fn();
        useAppContext.mockReturnValue({toggles: {
                'jdc.business_application_enabled': {
                    enabled: true,
                },
            }});
        const useStateSpy = jest.spyOn(React, "useState");
        useStateSpy.mockImplementation((init) => [init, setApplicationError]);

        applicationModel.validate.mockImplementation();
        const onSuccess = jest.fn();
        const groups = ["AWS-SOMEGROUP", "EDG-SOMEGROUP", "SOMEGROUP", "G90-SOMEGROUP"];
        const wrapper = shallow(<MyApplicationForm router={{ query: { } }} loggedInUser={{ groups: groups }} onSuccess={onSuccess} />);
        fetch.mockImplementation(() => {
            return new Promise((resolve) =>
                resolve({
                    ok : true,
                    json: () => {
                        return [{ id: "some-myapp" }];
                    },
                })
            );
        });
        const nameControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'id');
        nameControl.simulate('blur',{
            target: {
                value: 'some-myapp',
            }
        })
        const button = wrapper.find(Button).at(2);
        await act(async () => button.props().onClick());
        wrapper.update()
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith("/api/applications", {
            credentials: "same-origin",
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        const nameControl1 = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'id');
        expect(nameControl1.props().invalidMessage).toEqual("This application name already exists");
    });

    it('should POST application when submitting and retrieve full business applications', async () => {
        applicationModel.validate.mockImplementation(() => Promise.resolve({details: []}))
        const onSuccess = jest.fn();
        fetch.mockImplementation(() => {
            return new Promise((resolve) =>
                resolve({
                    ok: true,
                    json: () => {
                        return {some: "some-data"};
                    },
                })
            );
        })

        fetch.mockImplementation(() => {
            return new Promise((resolve) =>
                resolve({
                    ok: true,
                    json: () => {
                        return BusinessApplications;
                    },
                })
            );
        })

        const groups = ['AWS-SOMEGROUP', 'EDG-SOMEGROUP', 'SOMEGROUP', 'G90-SOMEGROUP']
        const wrapper = mount(<MyApplicationForm router={{query: {}}} loggedInUser={{groups: groups}}
                                                 onSuccess={onSuccess}/>)
        const button = wrapper.find(Button).at(2);
        button.simulate('click');
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
        expect(onSuccess.mock.calls).toBeNull
        expect(fetch).toHaveBeenCalledWith('/api/applications', {
            credentials: 'same-origin',
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: expect.anything()
        });
        expect(wrapper.props().onSuccess).toHaveBeenCalledTimes(1);
    });


    it('should POST application when submitting and retrieve empty business applications', async () => {
        applicationModel.validate.mockImplementation(() => Promise.resolve({details: []}))
        const onSuccess = jest.fn();
        fetch.mockImplementation(() => {
            return new Promise((resolve) =>
                resolve({
                    ok: true,
                    json: () => {
                        return {some: "some-data"};
                    },
                })
            );
        })

        fetch.mockImplementation(() => {
            return new Promise((resolve) =>
                resolve({
                    ok: true,
                    json: () => {
                        return [];
                    },
                })
            );
        })

        const wrapper = mount(<MyApplicationForm router={{query: {}}} loggedInUser={{groups: ['AWS-SOMEGROUP', 'EDG-SOMEGROUP', 'SOMEGROUP', 'G90-SOMEGROUP']}}
                                                 onSuccess={onSuccess}/>)
        const button = wrapper.find(Button).at(2);
        button.simulate('click');
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        expect(onSuccess.mock.calls).toBeNull
        expect(fetch).toHaveBeenCalledWith('/api/applications', {
            credentials: 'same-origin',
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: expect.anything()
        });
        expect(wrapper.props().onSuccess).toHaveBeenCalledTimes(1);
    });

    it('should initialize with default values for CREATE', () => {
        const expectedDefaults = {
            id: '',
            assignmentGroup: 'AE EDL Support',
            supportGroup: 'AE EDL Support',
            subject: '',
            businessApplication: 'enterprise_data_lake_edl',
            businessCriticality: 'low',
            installStatus: 'Installed',
            shortDescription: '',
            teamPdl: '',
            comments: '',
            showToast: false,
            groups: ["AWS-SOMEGROUP","EDG-SOMEGROUP"]
        }
        const groups = ['AWS-SOMEGROUP', 'EDG-SOMEGROUP','SOMEGROUP', 'G90-SOMEGROUP']
        const wrapper = mount(<MyApplicationForm router={{ query: {} }} loggedInUser={{groups: groups}}/>)

        const name = wrapper.find(ValidatedInput).filterWhere(s => s.props().id === 'id')
        const subject = wrapper.find(ValidatedInput).filterWhere(s => s.props().id === 'ADGroup')
        const shortDescription = wrapper.find(ValidatedInput).filterWhere(s => s.props().id === 'shortDescription')
        const teamPdl = wrapper.find(ValidatedInput).filterWhere(s => s.props().id === 'teamPdl')
        const comments = wrapper.find(ValidatedInput).filterWhere(s => s.props().id === 'comments')
        const showToast = wrapper.find(Toast).at(0)
        expect(name.prop('defaultValue')).toEqual(expectedDefaults.id);
        expect(expectedDefaults.assignmentGroup).toEqual(expectedDefaults.assignmentGroup);
        expect(expectedDefaults.supportGroup).toEqual(expectedDefaults.supportGroup);
        expect(subject.prop('value')).toEqual(null);
        expect(expectedDefaults.businessApplication).toEqual(expectedDefaults.businessApplication);
        expect(expectedDefaults.businessCriticality).toEqual(expectedDefaults.businessCriticality);
        expect(expectedDefaults.installStatus).toEqual(expectedDefaults.installStatus);
        expect(shortDescription.prop('defaultValue')).toEqual(expectedDefaults.shortDescription);
        expect(teamPdl.prop('defaultValue')).toEqual(expectedDefaults.teamPdl);
        expect(comments.prop('defaultValue')).toEqual(expectedDefaults.comments);
        expect(showToast.prop('show')).toEqual(expectedDefaults.showToast);
        expect(subject.prop('options')).toEqual([{value:"AWS-SOMEGROUP",label:"AWS-SOMEGROUP"},{value:"EDG-SOMEGROUP",label:"EDG-SOMEGROUP"}]);
    })

    it('should get application for EDIT', () => {
        const groups = ['AWS-SOMEGROUP', 'EDG-SOMEGROUP','SOMEGROUP', 'G90-SOMEGROUP']
        mount(<MyApplicationForm router={{ query: {applicationName: 'some-myapp' , edit: 'true'} }} loggedInUser={{groups: groups}}/>)
        fetch.mockResolvedValue({ ok: true })
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith('/api/businessApplications', {
            credentials: 'same-origin',
        });

    });

    it('should not throw error if fails to fetch application tag', () => {
        const groups = ['AWS-SOMEGROUP', 'EDG-SOMEGROUP','SOMEGROUP', 'G90-SOMEGROUP']
        fetch.mockRejectedValue(new Error("API is down"))
        mount(<MyApplicationForm router={{ query: {applicationName: 'some-myapp' , edit: 'true'} }} loggedInUser={{groups: groups}}/>)
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith('/api/businessApplications', {
            credentials: 'same-origin',
        });
    });

    it('should filter out groups that are not AWS or EDG', () => {
        const groups = ['AWS-SOMEGROUP', 'EDG-SOMEGROUP','SOMEGROUP', 'G90-SOMEGROUP']
        const expectedGroups = [{label: 'AWS-SOMEGROUP', value: 'AWS-SOMEGROUP'}, {label: 'EDG-SOMEGROUP', value: 'EDG-SOMEGROUP'}]
        const wrapper = mount(<MyApplicationForm router={{ query: {} }} loggedInUser={{groups: groups}} />)
        const groupsSelect = wrapper.find(ValidatedInput).filterWhere(s => s.props().id === 'ADGroup')
        expect(groupsSelect.props().options).toEqual(expectedGroups)
    })

    it('verify inputs are invalid', () => {
        useAppContext.mockReturnValue({toggles: {
                'jdc.business_application_enabled': {
                    enabled: true,
                },
            }});
        const wrapper = mount(<MyApplicationForm router={{ query: {}}} loggedInUser={{ groups: []}} />)
        applicationModel.validate.mockReturnValue({
            details: [
                {context: {key: 'id'}, path: []},
                {context: {key: 'BusinessApplications'}, path: []},
                {context: {key: 'teamPdl'}, path: []},
                {context: {key: 'subject'}, path: []},
                {context: {key: 'shortDescription'}, path: []},
            ]
        })
        const button = wrapper.find(Button).at(2);
        button.simulate('click');
        const validatedInputs = wrapper.find(ValidatedInput)
        expect(validatedInputs).toHaveLength(8)
        expect(validatedInputs.at(0).props().isInvalid).toEqual(true)
        expect(validatedInputs.at(1).props().isInvalid).toEqual(false)
        expect(validatedInputs.at(2).props().isInvalid).toEqual(false)
        expect(validatedInputs.at(3).props().isInvalid).toEqual(false)
        expect(validatedInputs.at(4).props().isInvalid).toEqual(true)
        expect(validatedInputs.at(5).props().isInvalid).toEqual(true)
        expect(validatedInputs.at(6).props().isInvalid).toEqual(false)
        expect(validatedInputs.at(7).props().isInvalid).toEqual(true)
      })

      it('verify inputs are valid', () => {
        const wrapper = shallow(<MyApplicationForm router={{ query: {}}} loggedInUser={{ groups: []}} />)
        const validatedInputs = wrapper.find(ValidatedInput)

        const name = validatedInputs.at(0)
        name.simulate('blur',{
          target: {
            value: 'some-app',
          }
        })
        expect(name.props().isInvalid).toEqual(false)

        const teamPdl = validatedInputs.at(1)
        teamPdl.simulate('blur',{
          target: {
            value: 'name@email.com',
          }
        })
        expect(teamPdl.props().isInvalid).toEqual(false)

        const groups = validatedInputs.at(2)
        groups.simulate('change',{
          item: {
            value: 'AWS-GROUP',
          }
        })
        expect(groups.props().isInvalid).toEqual(false)

        const comments = validatedInputs.at(3)
        comments.simulate('blur',{
          target: {
            value: '',
          }
        })
        expect(comments.props().isInvalid).toEqual(false)

        const shortDescription = validatedInputs.at(4)
        shortDescription.simulate('blur',{
          target: {
            value: 'test-description',
          }
        })
        expect(shortDescription.props().isInvalid).toEqual(false)
      })

      it('verify component renders correctly', () => {
        const groups = ['AWS-SOMEGROUP', 'EDG-SOMEGROUP','SOMEGROUP', 'G90-SOMEGROUP']
        const wrapper = shallow(<MyApplicationForm router={{ query: {} }} loggedInUser={{groups: groups}}/>)

        const nameControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'id')
        const teamPdlControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'teamPdl')

        expect(nameControl).toHaveLength(1)
        expect(teamPdlControl).toHaveLength(1)
      })

      it('verify component renders necessary inputs and bindings', async() => {
        const groups = ['AWS-SOMEGROUP', 'EDG-SOMEGROUP','SOMEGROUP', 'G90-SOMEGROUP']
        const wrapper = shallow(<MyApplicationForm router={{ query: {} }} loggedInUser={{groups: groups}}/>)
        const nameControl = wrapper.find('ValidatedInput').filterWhere(c => c.props().id === 'id')
        const teamPdlControl = wrapper.find('ValidatedInput').filterWhere(c => c.props().id === 'teamPdl')
        const subjectControl = wrapper.find('ValidatedInput').filterWhere(c => c.props().id === 'ADGroup')
        const shortDescriptionControl = wrapper.find('ValidatedInput').filterWhere(c => c.props().id === 'shortDescription')
        expect(nameControl.props().type).toEqual('text')
        nameControl.simulate('blur', { target: { value: 'Foo' } })
        expect(teamPdlControl.props().type).toEqual('text')
        teamPdlControl.simulate('blur', { target: { value: 'Foo@jd.com' } })
        expect(subjectControl.props().value).toEqual(null)
        expect(shortDescriptionControl.props().as).toEqual('textarea')
        shortDescriptionControl.simulate('blur', { target: { value: 'Foo' } })
      })

      it('Verify that Cancel button works', () => {
        const onCancel = jest.fn();
        const wrapper = shallow(<MyApplicationForm router={{ query: {} }} onCancel={onCancel}/>)
        const buttons = wrapper.find(Button)
        const cancel = wrapper.find(Button).filterWhere(button => button.props().id === 'cancelApplication');
        cancel.simulate('click');
        expect(onCancel.mock.calls).toBeNull
    });

})
