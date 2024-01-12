import { DatasetForm } from '../../../../components/datasets/edit/DatasetForm';
import Select from '../../../../components/Select';
import {Button, Card, Form, Modal} from 'react-bootstrap';
import Router from 'next/router';
import { shallow, mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import {waitFor} from "@testing-library/react";
import uuid from 'uuid';
import ConfirmationModal from '../../../../components/ConfirmationModal';
import Accordion from '../../../../components/Accordion';
import datasetModel from '../../../../src/model/datasetModel';
import schemaService from '../../../../src/services/schemaValidationService';
import ValidatedInput from '../../../../components/ValidatedInput';
import SchemaForm from '../../../../components/datasets/edit/SchemaForm';
import MyApplicationForm from '../../../../components/MyApplicationForm';
import {getAllVersions, getDatasetsForSchema, getLinkedDatasetsForDatasetSchema, findApplications, unlockDataset, getDetailedDataset, deleteDataset, postDataset, getAllAvailableDatasetSummaries} from '../../../../apis/datasets';
import { findUsabilityDetails } from '../../../../apis/usability';
import utils from '../../../../components/utils';

const { resetAllWhenMocks } = require('jest-when');
global.fetch = require('jest-fetch-mock');

jest.mock('next/router');
jest.mock('../../../../src/model/datasetModel');
jest.mock('../../../../src/services/schemaValidationService');
jest.mock('../../../../components/utils');
jest.mock('../../../../apis/datasets');
jest.mock('../../../../apis/usability');

const context = {
  datasets: [{ id: 1, name: 'ds1', phase: { id: 1, name: 'enhance' }, classifications: [{ community: { id: 1, name: 'test' }, subCommunity: { id: 1, name: 'test' }, gicp: { id: 1, name: 'test' }, countriesRepresented: [], development: false, personalInformation: false }]
}],
referenceData: {
  communities: [{ id: 1, name: 'comm', subCommunities: [{ id: 1, name: 'sub' }] }],
  gicp: [{ id: 1, name: 'gicp' }],
  countries: [{ id: 1, name: 'country' }],
  phases: [{ id: 1, name: 'Raw' },{ id: 2, name: 'Enhance.Domain' },{ id: 3, name: 'Enhance.Core' }],
  businessValues: [{ id: 1, name: 'biz' }],
  categories: [{ id: 1, name: 'cat' }],
  technologies: [{ id: 1, name: 'AWS' }],
  physicalLocations: [{ id: 1, name: 'us-east-1' }],
},
loggedInUser:{
  url:"url",
  name:"name",
  firstName:"firstName",
  lastName:"lastName",
  email:"username@jdnet.deere.com",
  username:"username",
  groups:['AWS-SOMEGROUP', 'EDG-SOMEGROUP', 'SOMEGROUP', 'G90-SOMEGROUP'],
},
usability: 0
}

const dataset =
{
  id: 1, name: 'ds1', phase: {name: 'Enhance'}, classifications: [{id: 1, community: { id: 1, name: 'test' }, subCommunity: { id: 1, name: 'test' }, gicp: { id: 1, name: 'test' }, countriesRepresented: [{id: 1, name: 'US'}], development: false, personalInformation: false}],
  linkedSchemas: [],
  schemas:
  [
    {
        testing: false,
        name: "schema1",
        id: "alert.mk_alert_defn_localized_dm@3.0.0",
        version: 1
    },
    {
      name: "schema1",
      id: "alert.mk_alert_defn_localized_dm@4.0.0",
      version: 1
    },
    {
      name: '',
      id: "alert.@4.00",
      version: 1,
    }
  ],
  usability: 0,
  sources: []
}

const detailedDataset =
  {
    id: 1, name: 'ds1', phase: {name: 'Enhance'}, classifications: [{id: 1, community: { id: 1, name: 'test' }, subCommunity: { id: 1, name: 'test' }, gicp: { id: 1, name: 'test' }, countriesRepresented: [{id: 1, name: 'US'}], development: false, personalInformation: false}],
    linkedSchemas: [],
    schemas:
      [
        {
          linkedDatasets: [],
          testing: false,
          status: { id: 2, name: "old"},
          name: "schema1",
          updateFrequency: "None",
          fields: [
            {
              attribute: {
                id: 1,
                name: "Attribute1"
              },
              datatype: {
                id: 1,
                name: "long"
              },
              description: "Desc",
              id: 1,
              nullable: false,
              name: "field1",
            }
          ],
          updatedAt: "2019-06-10T16:45:31.446Z",
          createdAt: "2019-06-10T16:45:31.446Z",
          id: "alert.mk_alert_defn_localized_dm@3.0.0",
          documentation: "None",
          description: "None",
          createdBy: "js91162",
          version: 1,
          updatedBy: "js91162",
        },
        {
          linkedDatasets: [],
          status: { id: 1, name: "latest"},
          name: "schema1",
          updateFrequency: "None",
          fields: [
            {
              attribute: {
                id: 1,
                name: "Attribute1"
              },
              datatype: {
                id: 1,
                name: "long"
              },
              description: "Desc",
              id: 1,
              nullable: false,
              name: "field1",
            }
          ],
          updatedAt: "2019-06-10T16:45:31.446Z",
          createdAt: "2019-06-10T16:45:31.446Z",
          id: "alert.mk_alert_defn_localized_dm@4.0.0",
          documentation: "None",
          description: "None",
          createdBy: "js91162",
          version: 1,
          updatedBy: "js91162",
          partitionedBy: []

        },
        {
          linkedDatasets: [],
          name: '',
          updateFrequency: "None",
          id: "alert.@4.00",
          documentation: "None",
          description: "None",
          createdBy: "js91162",
          version: 1,
          updatedBy: "js91162",
          fields: [],
          partitionedBy: []

        }
      ],
    description: '',
    documentation: '',
    sources: []
  };

  const requestBody = {
    name: 'ds1',
    description: '',
    requestComments: 'No comments',
    documentation: '',
    custodian: '',
    sourceDatasets: [],
    application: '',
    category: undefined,
    dataRecovery: false,
    phase: undefined,
    technology: 1,
    physicalLocation: 1,
    linkedSchemas: [],
    deletedSchemas: [],
    tables: [],
    paths: [],
    schemas:
     [ { id: 'alert.mk_alert_defn_localized_dm@3.0.0',
         name: 'schema1',
         version: 1,
         description: 'None',
         documentation: 'None',
         partitionedBy: [],
         testing: false,
         updateFrequency: 'None',
         fields: expect.anything() },
       { id: 'alert.mk_alert_defn_localized_dm@4.0.0',
         name: 'schema1',
         version: 1,
         description: 'None',
         documentation: 'None',
         partitionedBy: [],
         testing: false,
         updateFrequency: 'None',
         fields: expect.anything() },
       { id: 'alert.@4.00',
         name: '',
         version: 1,
         description: 'None',
         documentation: 'None',
         partitionedBy: [],
         testing: false,
         updateFrequency: 'None',
         fields: [] } ],
    classifications:
     [ { id: 1,
         community: 1,
         subCommunity: 1,
         gicp: 1,
         countriesRepresented: expect.anything(),
         development: false,
         personalInformation: false,
         additionalTags: [] } ],
    attachments: { newAttachments: [], deletedAttachments: [] },
    id: 1,
    version: 1,
    sources: []
  };

const attributeOptions = [
  { id: "None", name: "None" },
  { id: "id", name: "id" },
  { id: "extract time", name: "extract time"},
  { id: "delete indicator", name: "delete indicator", datatype: { id: "int", name: "int" } },
]

function createExpectedConstructBody(initialDataset) {
  return {
    ...initialDataset,
    sourceDatasets: [{id: 1, version: 1 }],
    schemas: [
      {
        testing: false,
        partitionedBy: ["field1"],
        id: "alert.mk_alert_defn_localized_dm",
        documentation: "None",
        description: "None",
        version: "1",
        name: "schema1",
        updateFrequency: "None",
        fields: [
          {
            attribute: "id",
            datatype: "decimal",
            scale: "0",
            precision: 10,
            description: "Desc",
            name: "field1",
            nullable: true
          },
          {
            attribute: "id",
            datatype: "int",
            description: "Desc",
            name: "field2",
            nullable: false
          },
          {
            attribute: "extract time",
            datatype: "long",
            description: "Desc",
            name: "field3",
            nullable: false
          },
          {
            attribute: "delete indicator",
            datatype: "int",
            description: "Desc",
            name: "field4",
            nullable: false,
          },
          {
            attribute: "None",
            datatype: "int",
            description: "Desc",
            nullable: false,
            name: "field5",
          }
        ]
      }
    ]
  };
}

function createConstructBodyTestDataset() {
  return {
    ...dataset,
    version: 1,
    schemas: [
      {
        partitionedBy: ["field1"],
        testing: false,
        name: "schema1",
        updateFrequency: "None",
        fields: [
          {
            attribute: attributeOptions[1].name,
            datatype: "decimal",
            scale: "0",
            precision: 10,
            description: "Desc",
            nullable: true,
            name: "field1",
          },
          {
            attribute: attributeOptions[1].name,
            datatype: "int",
            description: "Desc",
            nullable: false,
            name: "field2",
          },
          {
            attribute: attributeOptions[2].name,
            datatype: "long",
            description: "Desc",
            nullable: false,
            name: "field3",
          },
          {
            attribute: attributeOptions[3].name,
            datatype: "int",
            description: "Desc",
            nullable: false,
            name: "field4",
          },
          {
            attribute: attributeOptions[0].name,
            datatype: "int",
            description: "Desc",
            nullable: false,
            name: "field5",
          }
        ],
        updatedAt: "2019-06-10T16:45:31.446Z",
        createdAt: "2019-06-10T16:45:31.446Z",
        id: "alert.mk_alert_defn_localized_dm",
        documentation: "None",
        description: "None",
        createdBy: "js91162",
        version: "1",
    }
    ]
  }
}
const localStorageStatuses = ['AVAILABLE', 'PENDING', 'REJECTED'];

describe('DatasetForm component test suite', () => {

  afterEach( () => {
    localStorage.clear();
  })

  beforeEach( () => {
    delete window.location;
    window.location = { assign: jest.fn() };
    getAllVersions.mockResolvedValue([dataset])
    getDatasetsForSchema.mockReturnValue([]);
    getLinkedDatasetsForDatasetSchema.mockReturnValue([]);
    getDetailedDataset.mockResolvedValue(detailedDataset);
    findApplications.mockResolvedValue([]);
    findUsabilityDetails.mockResolvedValue({ usability: 0, dimensions: [] })
    utils.localStorageStatuses = localStorageStatuses;
    resetAllWhenMocks();
  })

  describe('Input validation', () => {
    it('verify inputs are invalid', async () => {
      datasetModel.validateAllFields.mockReturnValue({ details: [ { context: { name: 'name' } } ] })
      const wrapper = shallow(<DatasetForm context={context} title="Register Dataset" />)
      wrapper.setState({
        documentation: new Array(1501).fill().map(() => 'a').join(''),
        datasetErrors: [
          { context: { key: 'name' }, path: [] },
          { context: { key: 'description' }, path: [] },
          { context: { key: 'documentation' }, path: [] },
          { context: { key: 'owner' }, path: [] },
          { context: { key: 'custodian' }, path: [] },
          { context: { key: 'category' }, path: [] },
          { context: { key: 'phase' }, path: [] },
        ]
      })
      const validatedInputs = wrapper.find(ValidatedInput)
      expect(validatedInputs).toHaveLength(7)
      expect(validatedInputs.at(0).props().isInvalid).toEqual(true)
      expect(validatedInputs.at(1).props().isInvalid).toEqual(true)
      expect(validatedInputs.at(2).props().isInvalid).toEqual(true)
      expect(validatedInputs.at(3).props().isInvalid).toEqual(true)
      expect(validatedInputs.at(4).props().isInvalid).toEqual(true)
      expect(validatedInputs.at(5).props().isInvalid).toEqual(true)
      expect(validatedInputs.at(6).props().isInvalid).toEqual(true)
    })

    it('verify inputs are valid', async () => {
      const wrapper = shallow(<DatasetForm context={context} title="Register Dataset" />)
      wrapper.setState({
        name: 'foo',
        description: 'foo',
        category: {id: 'foo', name: 'foo'},
        phase: {id: 'enhance', name: 'enhance'},
        custodian: 'some cust',
        documentation: new Array(1500).fill().map(() => 'a').join('')
      })
      await wrapper.instance().validateForm()
      const validatedInputs = wrapper.find(ValidatedInput)
      expect(validatedInputs).toHaveLength(7)
      expect(validatedInputs.at(0).props().isInvalid).toEqual(false)
      expect(validatedInputs.at(1).props().isInvalid).toEqual(false)
      expect(validatedInputs.at(2).props().isInvalid).toEqual(false)
      expect(validatedInputs.at(3).props().isInvalid).toEqual(false)
      expect(validatedInputs.at(4).props().isInvalid).toEqual(false)
      expect(validatedInputs.at(5).props().isInvalid).toEqual(false)
      expect(validatedInputs.at(6).props().isInvalid).toEqual(false)
    })

    it('verify schemas are invalid', async () => {
      schemaService.validateSchemas.mockReturnValue([{ details: [ 'test' ] }])
      const wrapper = mount(<DatasetForm context={context} title="Register Dataset" />)
      wrapper.setState({
        schemas: [{ id: 'foo', environmentName: '', fields: [] }],
        phase: {name: 'Enhance'}
      })
      await wrapper.instance().validateForm()
      wrapper.update()
      const accordion = wrapper.find(Accordion).at(0)
      expect(accordion.find(SchemaForm).at(0).props().errors.length > 0).toEqual(true)
    })

    it('verify classifications are invalid', async () => {
      datasetModel.validateAllFields.mockReturnValue({
        details: [ { context: { classifications: 'classifications' }, path: [ 'classifications', 0 ] } ]
      });
      const wrapper = shallow(<DatasetForm context={context} title="Register Dataset" />);
      wrapper.setState({
        classifications: [{ id: 'foo' }],
      });
      await wrapper.instance().validateForm();
      wrapper.update();
      const accordion = wrapper.find(Accordion).at(0);
      const errors = accordion.props().items[0].body.props.errors;
      expect(errors.length > 0).toEqual(true)
    })
  })

  describe('Schema field enablement', () => {
    it('verify field is disabled', () => {
      const wrapper = shallow(<DatasetForm context={context} title="Register Dataset" />)
      wrapper.setState({ previousVersion: { schemas: [{ id: 'schema1' }] } })
      const component = wrapper.instance()
      const result = component.isSchemaFieldEnabled({ id: 'schema1' }, true)
      expect(result).toEqual(false)
    })

    it('verify field is enabled', () => {
      const wrapper = shallow(<DatasetForm context={context} title="Register Dataset" />)
      wrapper.setState({ previousVersion: { schemas: [{ id: 'schema1' }] } })
      const component = wrapper.instance()
      const result = component.isSchemaFieldEnabled({ id: 'schema2' }, true)
      expect(result).toEqual(true)
    })

    it('verify field is disabled when linked', () => {
      const wrapper = shallow(<DatasetForm context={context} title="Register Dataset" />)
      wrapper.setState({ previousVersion: { schemas: [{ id: 'schema1' }] } })
      const component = wrapper.instance()
      const result = component.isSchemaFieldEnabled({ id: 'schema2', linkedFrom: true }, false)
      expect(result).toEqual(false)
    })

    it('verify field is enabled and is not linked', () => {
      const wrapper = shallow(<DatasetForm context={context} title="Register Dataset" />)
      wrapper.setState({ previousVersion: { schemas: [{ id: 'schema1' }] } })
      const component = wrapper.instance()
      const result = component.isSchemaFieldEnabled({ id: 'schema1' }, false)
      expect(result).toEqual(true)
    })

    it('should allow removal of schema if not in previous version', () => {
      const wrapper = shallow(<DatasetForm context={context} title="Register Dataset" />)
      wrapper.setState({ previousVersion: { schemas: [{ id: 'schema2' }] } })
      const result = wrapper.instance().isSchemaInPreviousVersion({id: 'schema1'})
      const isRemovalDisabled = false
      expect(result).toEqual(isRemovalDisabled)
    })

    it('should not allow removal of schema if in previous version', () => {
      const wrapper = shallow(<DatasetForm context={context} title="Register Dataset" />)
      wrapper.setState({ previousVersion: { schemas: [{ id: 'schema1' }] } })
      const result = wrapper.instance().isSchemaInPreviousVersion({id: 'schema1'})
      const isRemovalDisabled = true
      expect(result).toEqual(isRemovalDisabled)
    })
  })

  describe('Delete DataSet Tests',() => {
    it('Display delete button when editing the existing dataset',() => {
      const wrapper = shallow(<DatasetForm context={context} title="Register Dataset" isEditing={true} dataset={dataset}/>);
      const deleteButton = wrapper.find(Button).filterWhere(button => button.props().id === 'deleteDatasetButton');
      expect(deleteButton.props().hidden).toEqual(false);
    });

    it('Should not display delete button when creating new dataset',() => {
      const wrapper = shallow(<DatasetForm context={context} title="Register Dataset" isEditing={false} />);
      const deleteButton = wrapper.find(Button).filterWhere(button => button.props().id === 'deleteDatasetButton');
      expect(deleteButton.props().hidden).toEqual(true);
    });

    it('Clicking the delete dataset should ask for confirmation', async () => {
      const expectedBody =
        <div>
          <div>Are you sure you want to delete this dataset?</div>
          <br />
          <div className="text-muted">
            <i>This action <b style={{color: "Red"}}>will remove {dataset.name}</b> from EDL and the EDL Data Catalog.</i>
          </div>
          <hr />
          <div>
            <Form.Label>Comments</Form.Label>
            <Form.Control
            as="textarea"
            isInvalid={false}
            id='requestComments'
            placeholder={"Provide details about this request for approvers"}
            onBlur={expect.anything()}/>
          </div>
        </div>;
      const wrapper = shallow(<DatasetForm context={context} title="Register Dataset" isEditing={true} dataset={dataset}  />);
      await wrapper.instance().setInitialState(dataset);
      const deleteButton = wrapper.find(Button).filterWhere(button => button.props().id === 'deleteDatasetButton');
      deleteButton.simulate('click');
      const confirmationModal = wrapper.find(ConfirmationModal).filterWhere(modal => modal.props().id === 'deletionConfirmation');
      expect(confirmationModal.props().show).toEqual(true);
      expect(confirmationModal.props().body).toEqual(expectedBody);
    });

    it('Accepting confirmation should fail when no comments entered', async () => {
      const expectedBody =
        <div>
          <div>Are you sure you want to delete this dataset?</div>
          <br />
          <div className="text-muted">
            <i>This action <b style={{color: "Red"}}>will remove {dataset.name}</b> from EDL and the EDL Data Catalog.</i>
          </div>
          <hr />
          <div>
            <Form.Label>Comments</Form.Label>
            <Form.Control
            as="textarea"
            isInvalid={true}
            id='requestComments'
            placeholder={"Required: Provide details about this request for approvers"}
            onBlur={expect.anything()}/>
          </div>
        </div>;
      const wrapper = shallow(<DatasetForm context={context} title="Register Dataset" isEditing={true} dataset={dataset} />);
      await wrapper.instance().setInitialState(dataset);
      const deleteButton = wrapper.find(Button).filterWhere(button => button.props().id === 'deleteDatasetButton');
      deleteButton.simulate('click');
      const confirmationModal = wrapper.find(ConfirmationModal).filterWhere(modal => modal.props().id === 'deletionConfirmation');
      confirmationModal.props().onAccept();
      const latestConfirmationModal = wrapper.find(ConfirmationModal).filterWhere(modal => modal.props().id === 'deletionConfirmation');
      expect(latestConfirmationModal.props().show).toEqual(true);
      expect(latestConfirmationModal.props().body).toEqual(expectedBody);
    });

    it('Accepting confirmation should be successful when comments entered', async () => {
      deleteDataset.mockResolvedValue({ status: 200, ok:true });
      const wrapper = shallow(<DatasetForm context={context} title="Register Dataset" isEditing={true} dataset={dataset} />);
      await wrapper.instance().setInitialState(dataset);
      const deleteButton = wrapper.find(Button).filterWhere(button => button.props().id === 'deleteDatasetButton');
      deleteButton.simulate('click');
      const confirmationModal = wrapper.find(ConfirmationModal).filterWhere(modal => modal.props().id === 'deletionConfirmation');
      wrapper.instance().updateRequestComments({ target: { value:'test' } })
      confirmationModal.props().onAccept();
      expect(wrapper.state().requestComments).toEqual('test');
      expect(deleteDataset).toHaveBeenCalledWith(dataset.id, {requestComments:'test'});
    });
  });

  it('should initialize with given dataset', async () => {
    getAllVersions.mockResolvedValue([])
    const initialDataset = {...dataset, requestComments: 'some comments'};
    const expectedState = {
      ...detailedDataset,
      _isMounted: false,
      version: null,
      description: '',
      application: '',
      documentation: '',
      owner: {},
      userId:'',
      custodian: '',
      sourceDatasets: [],
      category: '',
      classificationPrediction: '',
      technology: { id: 1, name: 'AWS' },
      physicalLocation: { id: 1, name: 'us-east-1' },
      mdPreview: '',
      showDocsModal: false,
      modal: null,
      isLoading: false,
      showSchemaSelector: false,
      previousVersion: null,
      selectData: [],
      showApplicationModal: false,
      showClassificationsModal: false,
      modalDataset: {},
      datasetErrors: [],
      datasetSummaries: [],
      schemaErrors: [],
      showToast: false,
      requestComments: '',
      deleteModal: null,
      deletedSchemas: [],
      tables: [],
      paths: [],
      canSave: true,
      dataRecovery: false,
      deletedAttachments: [],
      newAttachments: [],
      stagingUuid: '',
      usability: 0,
      usabilityDetails: { usability: 0, dimensions: [] },
      sources: []
    };

    const wrapper = shallow(<DatasetForm context={ context } dataset={initialDataset} title="Register Dataset" />)
    await wrapper.instance().setInitialState(initialDataset);
    expect(wrapper.state()).toEqual(expectedState);
  });

  it('verify component renders correctly', () => {
    const wrapper = shallow(<DatasetForm context={ context } title="Register Dataset" />)
    const titleHeader = wrapper.find(Card.Header).filterWhere(h => h.props().id === 'title')
    const nameControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'name')
    const descriptionControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'description')
    const documentationControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'documentation')

    expect(titleHeader).toHaveLength(1)
    expect(titleHeader.text()).toContain('Register Dataset')
    expect(nameControl).toHaveLength(1)
    expect(descriptionControl).toHaveLength(1)
    expect(documentationControl).toHaveLength(1)
  })

  it('verify component renders necessary inputs and bindings', async () => {
    const wrapper = shallow(<DatasetForm context={ context } title="Register Dataset" />)
    wrapper.setState({ name: 'Name', description: 'Desc', documentation: 'Docs', custodian: 'Cust' })
    const nameControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'name')
    const descriptionControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'description')
    const documentationControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'documentation')
    const custodianControl = wrapper.find(ValidatedInput).filterWhere(c => c.props().id === 'custodian')

    expect(nameControl.props().type).toEqual('text')
    nameControl.simulate('blur', { target: { value: 'Foo' } })
    await wrapper.instance().handleChange();
    expect(wrapper.state().name).toEqual('Foo')

    expect(descriptionControl.props().type).toEqual('text')
    descriptionControl.simulate('blur', { target: { value: 'Foo' } })
    await wrapper.instance().handleChange();
    expect(wrapper.state().description).toEqual('Foo')


    expect(documentationControl.props().as).toEqual('textarea')
    documentationControl.simulate('blur', { target: { value: 'Foo' } })
    await wrapper.instance().handleChange();
    expect(wrapper.state().documentation).toEqual('Foo')

    expect(custodianControl.props().value).toEqual({value: 'Cust', label: 'Cust'})
    custodianControl.simulate('change', { value: 'Foo', label: 'Foo' })
    await wrapper.instance().handleChange();
    expect(wrapper.state().custodian).toEqual('Foo')
  })

  it('verify component renders necessary selects and bindings', async () => {
    const wrapper = shallow(<DatasetForm context={ context } title="Register Dataset" />)
    const sourceDatasets = wrapper.find(Select).filterWhere(s => s.props().instanceId === 'sourceDatasets')
    const category = wrapper.find(ValidatedInput).filterWhere(s => s.props().id === 'category')
    const phase = wrapper.find(ValidatedInput).filterWhere(s => s.props().id === 'phase')
    const technology = wrapper.find(Select).filterWhere(s => s.props().instanceId === 'technology')
    const physicalLocation = wrapper.find(Select).filterWhere(s => s.props().instanceId === 'physicalLocation')
    const application = wrapper.find(Select).filterWhere(s => s.props().instanceId === 'application')

    expect(sourceDatasets.props().value).toEqual([])
    sourceDatasets.simulate('change', [{ id: 2, name: 'ds2' }])
    expect(wrapper.state().sourceDatasets).toEqual([{ id: 2, name: 'ds2' }])

    expect(category.props().options).toEqual(context.referenceData.categories)
    expect(category.props().value).toEqual("")
    category.simulate('change', { id: 2, name: 'cat2' })
    await wrapper.instance().handleChange();
    expect(wrapper.state().category).toEqual({ id: 2, name: 'cat2' })

    expect(phase.props().options).toEqual(context.referenceData.phases)
    expect(phase.props().value).toEqual('')
    phase.simulate('change', { id: 2, name: 'phase2' })
    await wrapper.instance().handleChange();
    expect(wrapper.state().phase).toEqual({ id: 2, name: 'phase2' })

    expect(technology.props().options).toEqual([{ id: 1, name: 'AWS' }])
    expect(technology.props().isDisabled).toEqual(true)

    expect(physicalLocation.props().options).toEqual([{ id: 1, name: 'us-east-1' }])
    expect(physicalLocation.props().isDisabled).toEqual(true)

    expect(application.props().options).toEqual([])
    expect(application.props().value).toEqual(null)
    application.simulate('change', { value: 'test tag', label: 'test tag'})
    expect(wrapper.state().application).toEqual('test tag')
  })

  it('should filter out groups that are not AWS or EDG', () => {
    const expectedGroups = [{label: 'AWS-SOMEGROUP', value: 'AWS-SOMEGROUP'}, {label: 'EDG-SOMEGROUP', value: 'EDG-SOMEGROUP'}]
    const wrapper = shallow(<DatasetForm context={ context } title="Register Dataset"/>)
    const custodianOptions = wrapper.find('ValidatedInput').filterWhere(s => s.props().id === 'custodian')
    expect(custodianOptions.props().options).toEqual(expectedGroups)
  })

  it('verify component renders classification blocks', () => {
    const wrapper = shallow(<DatasetForm context={ context } title="Register Dataset" />)
    const addButton = wrapper.find(Button).filterWhere(w => w.text() === '<MdAdd /> Add Classification')
    expect(addButton).toHaveLength(1)
    expect(wrapper.state().classifications).toHaveLength(0)
    addButton.at(0).simulate('click');
    addButton.at(0).simulate('click');
    expect(wrapper.state().classifications).toHaveLength(2)
  })

  it('verify component removes classification blocks', () => {
    const wrapper = shallow(<DatasetForm context={context} title="Register Dataset" />)
    wrapper.setState({ classifications: [{ id: 1 }], lockedBy: null })
    wrapper.instance().removeGovBlock(1)
    expect(wrapper.state().classifications).toHaveLength(0)
  })

  it('verify classification button is highlighted when validating classification block minimum fields entry', () => {
    const wrapper = shallow(<DatasetForm context={context} title="Register Dataset" />)
    wrapper.setState({ datasetErrors: [{context: {key: 'classifications'}}]})
    const link = wrapper.find('Button').filterWhere(button=>button.props().id === `addClassification`);
    expect(link.props().variant).toEqual('outline-danger')
  })

  it('verify component removes schemas', () => {
    const wrapper = mount(<DatasetForm context={context} title="Register Dataset" />);
    wrapper.setState({phase: {name: 'Enhance'}});
    const addSchemaButton = wrapper.find(Button).filterWhere(button => button.props().id === 'addSchema');
    addSchemaButton.simulate('click');
    wrapper.update();

    const schemas = wrapper.find(Accordion).filterWhere(accordion => accordion.props().id === 'schemaAccordion');

    expect(schemas.props().items.length).toEqual(1);
    expect(wrapper.state().schemas).toHaveLength(1);

    wrapper.instance().removeSchema(1);

    expect(wrapper.state().schemas).toHaveLength(1);
    expect(wrapper.state().deletedSchemas).toEqual([1]); // ????
  })

  it('verify component handles accept action on copied classifications', () => {
    const wrapper = shallow(<DatasetForm context={ context } title="Register Dataset" />)
    const modal = wrapper.find('ClassificationSelectionModal')
    expect(wrapper.state().classifications).toHaveLength(0)
    act(() => {
      modal.at(0).props().onAccept([{ id: 1, name: 'ds1' }])
    })
    expect(wrapper.state().classifications).toHaveLength(1)
  })

  it('verify component handles skip action on copied classifications', () => {
    const wrapper = shallow(<DatasetForm context={ context } title="Register Dataset" />)
    const modal = wrapper.find('ClassificationSelectionModal')
    expect(wrapper.state().classifications).toHaveLength(0)
    act(() => {
      modal.at(0).props().onCancel()
    })
    expect(wrapper.state().classifications).toHaveLength(0)
  })

  it('verify component presents classifications modal when adding source datasets', async () => {
    getAllAvailableDatasetSummaries.mockResolvedValue(context.datasets);
    const wrapper = shallow(<DatasetForm context={ context } title="Register Dataset" />);
    const sourceDatasets = wrapper.find(Select).filterWhere(s => s.props().instanceId === 'sourceDatasets')
    await wrapper.update();
    await waitFor(() => expect(getAllAvailableDatasetSummaries).toHaveBeenCalled());
    expect(wrapper.state().classifications).toHaveLength(0);
    sourceDatasets.simulate('change', [{ id: 1, name: 'ds1' }]);
    const expected = context.datasets.find(ds => ds.id === 1)
    const actual = wrapper.find('ClassificationSelectionModal').at(0).props().dataset
    actual.classifications.forEach(c => {
      delete c.derivedFrom
      delete c.id
    })
    expect(actual).toEqual(expected)
  })

  it('verify component removes duplicate classifications when adding source datasets', async () => {
    const newDataset = {
      ...dataset,
      classifications: [
        {
          id: 'some-existing-id',
          community: { id: 1, name: 'test' },
          subCommunity: { id: 1, name: 'test' },
          gicp: { id: 1, name: 'test' },
          countriesRepresented: [{id: 1, name: 'US'}],
          development: false,
          personalInformation: false
        }
      ]
    };
    const newClassifications = [{id: 'some-new-id'}, {id: 'some-existing-id'}];
    const uuidReturn = 'test uuid'
    jest.spyOn(uuid, 'v4').mockReturnValue(uuidReturn);
    const wrapper = shallow(<DatasetForm context={ context } dataset={newDataset} title="Register Dataset" />);

    await wrapper.instance().setInitialState(newDataset);
    wrapper.instance().acceptSourceClassifications(newClassifications);

    expect(wrapper.state().classifications.length).toEqual(newDataset.classifications.length + newClassifications.length);
    expect(wrapper.state().classifications[1].id).toEqual(uuidReturn);
  })

  it('verify component handles classification changes', () => {
    const wrapper = shallow(<DatasetForm context={ context } title="Register Dataset" />)
    wrapper.setState({ classifications: [{ id: 1 }] })

    const fake = { id: 1, name: 'Foo' }

    wrapper.instance().governanceDetailChanged(1, 'community', fake)
    wrapper.instance().governanceDetailChanged(1, 'subCommunity', fake)
    wrapper.instance().governanceDetailChanged(1, 'gicp', fake)
    wrapper.instance().governanceDetailChanged(1, 'countriesRepresented', [fake])
    wrapper.instance().governanceDetailChanged(1, 'personalInformation', true)
    wrapper.instance().governanceDetailChanged(1, 'development', true)
    wrapper.instance().governanceDetailChanged(1, 'additionalTags', [{ label: '    Foo   ' }])

    const classification = wrapper.state().classifications[0]

    expect(classification.community).toEqual(fake)
    expect(classification.subCommunity).toEqual(fake)
    expect(classification.gicp).toEqual(fake)
    expect(classification.countriesRepresented).toEqual([fake])
    expect(classification.personalInformation).toEqual(true)
    expect(classification.development).toEqual(true)
    expect(classification.additionalTags).toEqual(['Foo'])
  })

  it('verify component handles cancellation', async () => {
    const onCancel = jest.fn()
    const cancelAndUnlock = jest.fn()
    fetch.mockReturnValue({ ok: true });
    const wrapper = shallow(<DatasetForm isEditing={true} cancelAndUnlock={cancelAndUnlock} context={context} dataset={{...dataset, status: 'AVAILABLE', schemas: [], linkedSchemas: []}} onCancel={onCancel} title="Register Dataset" />)
    await wrapper.instance().handleCancelAndUnlock();
    expect(cancelAndUnlock).toBeCalledTimes(1)
  })

  it('verify component handles md preview', () => {
    const callback = jest.fn()
    const wrapper = shallow(<DatasetForm context={context} title="Register Dataset" />)
    wrapper.instance().handleMdPreview({ preventDefault: callback })
    expect(callback).toBeCalledTimes(1)
    expect(wrapper.state().showDocsModal).toEqual(true)
    wrapper.instance().handleMdPreview()
    expect(wrapper.state().showDocsModal).toEqual(false)
  })

  it('Verify addSchemas adds schemas based on input parameter and overrides field ids and schema ids', async () => {
    const wrapper = shallow(<DatasetForm context={context} dataset={detailedDataset} title="Register Dataset"  />)
    await wrapper.instance().setInitialState(detailedDataset);
    wrapper.instance().addSchema(null)
    expect(wrapper.state().schemas).toHaveLength(4)
    expect(wrapper.state().schemas[0].isNew).toEqual(true)

    wrapper.instance().addSchema(detailedDataset.schemas[0])
    const oldSchemaId = detailedDataset.schemas[0].id;
    const newSchemaId = wrapper.state().schemas[0].id;
    const oldFieldId = detailedDataset.schemas[0].fields[0].id;
    const newFieldId = wrapper.state().schemas[0].fields[0].id;

    expect(wrapper.state().schemas).toHaveLength(5)
    expect(oldSchemaId).not.toEqual(newSchemaId);
    expect(oldFieldId).not.toEqual(newFieldId);

    const id = wrapper.state().schemas[1].id
    wrapper.instance().updateSchemas({...detailedDataset.schemas[0], id: id}, false)
    expect(wrapper.state().schemas[1]).toEqual({...detailedDataset.schemas[0], id: id})

    wrapper.instance().addSchema(detailedDataset.schemas[0])
    expect(wrapper.state().schemas).toHaveLength(6)
  })

  it('Verify updateSchemas updates correct schemas, adds if new id, and removes properly', () => {
    const wrapper = shallow(<DatasetForm context={context} title="Register Dataset"  />)
    expect(wrapper.state().schemas).toHaveLength(0)
    wrapper.instance().addSchema(detailedDataset.schemas[0])
    expect(wrapper.state().schemas).toHaveLength(1)

    wrapper.instance().updateSchemas({id: 1, name: 'newSchema'}, false)
    expect(wrapper.state().schemas).toHaveLength(2)

    const id = wrapper.state().schemas[0].id
    wrapper.instance().updateSchemas({id: id, name: 'newSchema'}, false)
    expect(wrapper.state().schemas).toHaveLength(2)
    expect(wrapper.state().schemas[0].name).toEqual('newSchema')

    wrapper.instance().updateSchemas({id: 1, name: 'newSchema'}, true)
    expect(wrapper.state().schemas).toHaveLength(1)
  })

  it('Verify onCancel in ConfirmationModal', async () => {
    const wrapper = shallow(<DatasetForm context={context} dataset={detailedDataset} title="Register Dataset" />)
    await wrapper.instance().setInitialState(detailedDataset);
    expect(wrapper.find(ConfirmationModal).filterWhere(c => c.props().id === "confirmation").props().show).toEqual(false)
    wrapper.find(Button).filterWhere(b => b.props().id === 'addSchema').simulate('click')
    const accordions = wrapper.find(Accordion)
    act(() => {
      accordions.at(1).props().items[0].actions[0].handler()
    })
    expect(wrapper.state().modal).toBeDefined
    expect(wrapper.find(ConfirmationModal).filterWhere(c => c.props().id === "confirmation").props().show).toEqual(true)
    act(() => {
      wrapper.find(ConfirmationModal).filterWhere(c => c.props().id === "confirmation").prop('onCancel')()
    })
    expect(wrapper.state().modal).toBeUndefined
    expect(wrapper.find(ConfirmationModal).filterWhere(c => c.props().id === "confirmation").props().show).toEqual(false)
  })

  it('Verify constructBody works as expected', async ()=> {
    const initialDataset = createConstructBodyTestDataset()

    const wrapper = shallow(<DatasetForm context={context} dataset={initialDataset} title="Register Dataset"  />);
    await wrapper.instance().setInitialState(detailedDataset);
    wrapper.setState({ sourceDatasets: [initialDataset], schemas: initialDataset.schemas});

    const expectedConstructBody = createExpectedConstructBody(initialDataset);

    const result = wrapper.instance().constructDatasetToBeStored();
    expect(result.sourceDatasets).toHaveLength(context.datasets.length);
    expect(result.sourceDatasets[0].id).toEqual(context.datasets[0].id);
    expect(result.name).toEqual(dataset.name);
    expect(result.technology).toEqual(context.referenceData.technologies[0].id);
    expect(result.physicalLocation).toEqual(context.referenceData.physicalLocations[0].id);
    expect(result.classifications[0].community).toEqual(dataset.classifications[0].community.id);
    expect(result.classifications[0].subCommunity).toEqual(dataset.classifications[0].subCommunity.id);
    expect(result.classifications[0].gicp).toEqual(dataset.classifications[0].gicp.id);
    expect(result.classifications[0].personalInformation).toEqual(dataset.classifications[0].personalInformation);
    expect(result.classifications[0].development).toEqual(dataset.classifications[0].development);
    expect(result.classifications[0].countriesRepresented).toHaveLength(dataset.classifications[0].countriesRepresented.length);
    expect(result.classifications[0].countriesRepresented[0]).toEqual(dataset.classifications[0].countriesRepresented[0].id);
    expect(result.schemas[0].name).toEqual(dataset.schemas[0].name);
    expect(result.schemas).toEqual(expectedConstructBody.schemas);
    expect(result.application).toEqual('');
  });

  it('Verify that page will handle EDL formatted dataset', async () => {
    getDatasetsForSchema.mockResolvedValue([]);
    const initialDataset = createConstructBodyTestDataset();
    const constructBodyFormat = createExpectedConstructBody(initialDataset);
    const wrapper = shallow(<DatasetForm context={context} dataset={constructBodyFormat} title="Register Dataset"  />);
    await wrapper.instance().setInitialState(constructBodyFormat);
    await wrapper.instance().getSchemasWithLinkedInfo();

    let expectedSchemas = initialDataset.schemas;
    delete expectedSchemas[0].createdAt;
    delete expectedSchemas[0].createdBy;
    delete expectedSchemas[0].updatedAt;
    delete expectedSchemas[0].updatedby;
    expectedSchemas[0].version = "1";
    expectedSchemas[0].fields[0].scale = "0";
    expectedSchemas[0].fields[0].precision = 10;
    expectedSchemas[0].fields.forEach(f => {
      delete f.id
    });
    delete expectedSchemas[0].partitionedBy[0].id;
    expectedSchemas[0].linkedDatasets = [];
    wrapper.update();
    const received = wrapper.state().schemas;
    received[0].fields.forEach(f => {
      delete f.id
    });
    delete received[0].partitionedBy[0].id;

    expect(received).toEqual(expectedSchemas);
  })

  it('should be able to link Schemas with EDLs format correctly', async () => {
    const linkedSchema =
      {
        name: 'someLinkedSchema',
        environmentName: "env name2",
        testing: false,
        partitionedBy: ["field1"],
        id: "alert.mk_alert_defn_localized_dm",
        documentation: "None",
        description: "None",
        fields: createExpectedConstructBody().schemas[0].fields,
      };

    const initialDataset = {...createExpectedConstructBody(createConstructBodyTestDataset()), linkedSchemas: [linkedSchema]};

    const linkedDataset = {name: "linkedSchemaDataset", id: '12345', schemas: [linkedSchema]};
    getLinkedDatasetsForDatasetSchema.mockResolvedValue([linkedDataset]);

    const wrapper = shallow(<DatasetForm context={context} dataset={initialDataset} title="Register Dataset"  />);
    await wrapper.instance().setInitialState(initialDataset);

    wrapper.update();
    const received = {...wrapper.state().schemas[1]};

    const expectedLinkedSchema = {...linkedSchema, linkedFrom: linkedDataset};
    expect(received).toEqual(expectedLinkedSchema);
  })

  it('Verify removeSchema works with new schema', async () => {
    const wrapper = shallow(<DatasetForm context={context} dataset={dataset} title="Register Dataset"  />)
    await wrapper.instance().setInitialState(dataset);
    wrapper.instance().addSchema(null)
    expect(wrapper.state().schemas).toHaveLength(4)

    const id = wrapper.state().schemas[0].id
    wrapper.instance().removeSchema(id)
    expect(wrapper.state().schemas).toHaveLength(3)
  })

  it('Verify removeSchema works with linked schema', async () => {
    const detailedSchemas =  {schemas:[ {id: 'someschemastay'}], linkedSchemas: [{id: 'someschema'}]};
    getDetailedDataset.mockResolvedValue({...detailedDataset, ...detailedSchemas});
    const newDataset = { ...dataset, schemas: [{'id': 'someschemastay'}], linkedSchemas: [{'id': 'someschema'}]};
    const wrapper = shallow(<DatasetForm context={context} dataset={newDataset} title="Register Dataset"  />);
    await wrapper.instance().setInitialState(newDataset);
    wrapper.instance().removeSchema('someschema');
    expect(wrapper.state().linkedSchemas).toBeNull;
    expect(wrapper.state().schemas).toEqual([{'id': 'someschemastay', linkedDatasets: []}]);
  })

  it('Verify removeSchema works with existing schema', async () => {
    const newDataset = { ...dataset, schemas: [{'id': 'someschema'}, {'id': 'someschemastay'}]}
    getDetailedDataset.mockResolvedValue(newDataset);
    const wrapper = shallow(<DatasetForm context={context} dataset={newDataset} title="Register Dataset"  />)
    await wrapper.instance().setInitialState(newDataset);
    wrapper.instance().removeSchema('someschema')
    expect(wrapper.state().schemas).toBeNull
    expect(wrapper.state().schemas).toEqual([{'id': 'someschemastay', linkedDatasets: []}])
  })

  it('Verify schemas Accordion renders with correct items and can remove', async () => {
    const initialDataset = {...detailedDataset, phase: {name: 'Enhance'}};
    const wrapper = shallow(<DatasetForm context={context} dataset={initialDataset} title="Register Dataset" />)
    await wrapper.instance().setInitialState(initialDataset);

    const accordions = wrapper.find(Accordion)
    expect(accordions).toHaveLength(2)
    expect(accordions.at(1).props().items).toHaveLength(3)
    expect(wrapper.state().modal).toBeUndefined
    expect(wrapper.find(ConfirmationModal).at(0).props().show).toEqual(false)

    act(() => {
      accordions.at(1).props().items[0].actions[0].handler()
    })
    expect(wrapper.state().modal).toEqual({action: 'remove', onAccept: expect.anything()})
    expect(wrapper.find(ConfirmationModal).at(0).props().show).toEqual(true)
    expect(wrapper.state().schemas).toHaveLength(3)
    act(() => {
      wrapper.find(ConfirmationModal).at(0).prop('onAccept')()
    })
    expect(wrapper.state().schemas).toHaveLength(2)
  })

  it('schema selector handles selected schema', () => {
    const wrapper = shallow(<DatasetForm context={context} title="Register Dataset" />)
    wrapper.setState({ showSchemaSelector: true, phase: {name: 'Enhance'} })
    const selector = wrapper.find('DatasetSchemaSelector')
    expect(selector).toHaveLength(1)

    const expected = {
      dataset: { id: 'ds1', name: 'ds1' },
      schema: { id: 'schema1', name: 'schema1' }
    }

    act(() => {
      selector.props().onSchemaSelected(expected)
    })

    expect(wrapper.state().schemas).toEqual([{ "id": "schema1", "isNew": true, "linkedFrom": { "id": "ds1", "name": "ds1" }, "name": "schema1" }])
  })

  it('should not set localstorage when mounting', () => {
    shallow(<DatasetForm context={context} dataset={{...dataset, status: 'AVAILABLE'}} isEditing={true} title="Editing Dataset" />);
    expect(utils.setLocalStorage).toHaveBeenCalledTimes(0);
  })

  it('should not set localstorage when mounting and not editing', () => {
    shallow(<DatasetForm context={context} dataset={{...dataset, status: 'AVAILABLE'}} isEditing={false} title="Editing Dataset" />);
    expect(utils.setLocalStorage).toHaveBeenCalledTimes(0);
  })

  it('should POST dataset when submitting', async () => {
    delete window.location;
    window.location = { assign: jest.fn() };
    datasetModel.validateAllFields.mockImplementation();
    schemaService.validateSchemas.mockImplementation();
    postDataset.mockResolvedValue({ ok: true });
    unlockDataset.mockResolvedValue({ ok: true });
    const setDataset = jest.fn();
    const expectedDataset = {
      ...detailedDataset,
      previousVersion: expect.anything(),
      id: 1,
      version: 1,
      status: 'AVAILALBE'
    }
    const wrapper = shallow(<DatasetForm context={context} setDataset={setDataset} dataset={expectedDataset} isEditing={true} title="Editing Dataset" />);
    await wrapper.instance().setInitialState(expectedDataset);
    await wrapper.instance().handleSubmit();
    expect(postDataset).toHaveBeenCalledWith(expectedDataset, requestBody);
    expect(Router.push).toBeCalledWith('/approvals');
  });

  it('Should allow the user to enable data recovery', () => {
    const wrapper = shallow(<DatasetForm context={context}/>);

    const checkbox = wrapper.find(Form.Check).filterWhere(checkbox => checkbox.props().id === 'dataRecoveryCheck');
    checkbox.simulate('change', {target: {checked: true}});
    wrapper.update();

    expect(wrapper.state().dataRecovery).toEqual(true)
  });

  describe('localstorage tests', () => {
    it('should pass initial dataset and current state in the same format when saving', async () => {
      const linkedDataset = { name: "some dataset", schemas: [{ id: 'some other schema' }] };
      getDetailedDataset.mockResolvedValue({...detailedDataset, linkedSchemas: [{ id: 'some other schema' }]});
      getLinkedDatasetsForDatasetSchema.mockResolvedValue([linkedDataset]);

      const inputDataset = {
        ...detailedDataset,
        linkedSchemas: [{ id: 'some other schema' }],
        version: 1,
        description: '',
        status: '',
        documentation: '',
        owner: {},
        custodian: '',
        sourceDatasets: [],
        application: '',
        category: '',
        tables: [],
        paths: [],
        dataRecovery: false,
        deletedAttachments: [],
        stagingUuid: ''
      }
      const expectedDataset = {
        ...inputDataset,
        deletedSchemas: [],
        linkedSchemas: [
          ...inputDataset.linkedSchemas.map(s => ({ ...s, linkedFrom: linkedDataset }))
        ]
      };
      const newName = 'new name';
      const changedDataset = { ...expectedDataset, name: newName };
      delete expectedDataset.version;
      const wrapper = shallow(<DatasetForm context={context} dataset={inputDataset} isEditing={true} />);
      await wrapper.instance().setInitialState(inputDataset);
      wrapper.setState({ name: newName });
      wrapper.update();
      await waitFor(() => expect(utils.setLocalStorage).toHaveBeenCalledWith(true, expectedDataset, changedDataset));
    });

    it('localstorage should handle storage full error', async () => {
      utils.setLocalStorage.mockImplementation(() => {throw {error: 'Boom'}});

      const wrapper = shallow(<DatasetForm context={context} dataset={detailedDataset} isEditing={true} title="Editing Dataset" />);
      await wrapper.instance().setInitialState(detailedDataset);
      wrapper.setState({ name: 'some new name' });
      wrapper.update();

      await waitFor(() => expect(utils.setLocalStorage).toHaveBeenCalledTimes(2));
      wrapper.update();

      const modal =  wrapper.find(ConfirmationModal).filterWhere(modal => modal.props().id === 'confirmation');
      localStorage.setItem.mockClear();

      expect(modal.props().show).toEqual(true);
      expect(modal.props().body.props.children.props.children).toEqual("Your browser's cache is full. You can still edit and submit for approval, but changes will not be saved if you close the tab or window.");
      expect(wrapper.state().canSave).toEqual(false);
    })
  });

  describe('pull Component Tags tests', () => {
    it('should make a POST request with expected request body', async() => {
      const wrapper = shallow(<DatasetForm context={context}/>);
      await wrapper.instance().getApplications();
      expect(findApplications).toHaveBeenCalledTimes(2);
    });

    it('should not throw error if fails to fetch component tags', async() => {
      const wrapper = shallow(<DatasetForm context={context}/>);
      await wrapper.instance().getApplications();
      expect(findApplications).toHaveBeenCalledTimes(2);
      expect(wrapper.state().selectData).toEqual([])
    });

    it('should show correct options for components ', async() => {
      const context = {
        datasets: [{ id: 1, name: 'ds1', phase: { id: 1, name: 'enhance' }, classifications: [{ community: { id: 1, name: 'test' }, subCommunity: { id: 1, name: 'test' }, gicp: { id: 1, name: 'test' }, countriesRepresented: [], development: false, personalInformation: false }]
      }],
      referenceData: {
        communities: [{ id: 1, name: 'comm', subCommunities: [{ id: 1, name: 'sub' }] }],
        gicp: [{ id: 1, name: 'gicp' }],
        countries: [{ id: 1, name: 'country' }],
        phases: [{ id: 1, name: 'Raw' },{ id: 2, name: 'Enhance.Domain' },{ id: 3, name: 'Enhance.Core' }],
        businessValues: [{ id: 1, name: 'biz' }],
        categories: [{ id: 1, name: 'cat' }],
        technologies: [{ id: 1, name: 'AWS' }],
        physicalLocations: [{ id: 1, name: 'us-east-1' }],
      },
      loggedInUser:{
        url:"url",
        name:"name",
        firstName:"firstName",
        lastName:"lastName",
        email:"username@jdnet.deere.com",
        username:"username",
        groups:[],
      }
    }
      const wrapper = mount(<DatasetForm context={context}/>);
      const application = wrapper.find(Select).filterWhere(s => s.props().instanceId === 'application')
      act(() => {application.prop('onChange')([])});
      await waitFor(() => expect(application.props().options).toEqual([]));
      expect(application.props().options).toEqual([]);
    });

    it('verify component presents create application modal', () => {
      const wrapper = shallow(<DatasetForm context={ context } title="Register Dataset" />)
      const application = wrapper.find(Select).filterWhere(s => s.props().instanceId === 'application')
      act(() => {application.prop('showModal')()});
      expect(wrapper.state().showApplicationModal).toEqual(true)
      const actual = wrapper.find(Modal).at(1).props().show
      expect(actual).toEqual(true);
    });

    it('verify behavior of handleSuccess', () => {
      findApplications.mockResolvedValue({ ok: true, json: () => ([]) });
      const wrapper = shallow(<DatasetForm context={context} title="Register Dataset" />);
      const myAppForm = wrapper.find(MyApplicationForm).at(0);
      act(() => {myAppForm.prop('onSuccess')()});
      expect(findApplications).toHaveBeenCalledTimes(1);
      expect(wrapper.state().showApplicationModal).toEqual(false);
      expect(wrapper.state().application).toEqual('');
    });
  });
});
