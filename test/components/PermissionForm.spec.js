import Accordion from "../../components/Accordion";

jest.useFakeTimers();

import { configure, shallow} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { PermissionForm } from '../../components/PermissionForm';
import { Card, Button, Form, Col, Row } from 'react-bootstrap'
import DatePicker from '../../components/UXFrame/DatePicker/DataPicker';
import ConfirmationModal from '../../components/ConfirmationModal';
import { act } from 'react-dom/test-utils'
import ValidatedInput from '../../components/ValidatedInput';
import PermissionFormWizard from "../../components/PermissionFormWizard";
import permissionModel from '../../src/model/permissionModel';
import utils from '../../components/utils';
import { getAccessibleDatasets } from '../../apis/acls';
import { getDataset } from '../../apis/datasets';
import { postPermission, getGroupsPermissions } from '../../apis/permissions';

jest.mock('../../components/utils');
jest.mock('../../src/model/permissionModel');
jest.mock('../../apis/acls');
jest.mock('../../apis/datasets');
jest.mock('../../apis/permissions');

global.fetch = require('jest-fetch-mock');

configure({ adapter: new Adapter() });

const allViews = ["edl.testview1", "edl.testview2", "edl.testview3"];
const loggedInUser = {groups: ['AWS_GROUP_A']};
const sourceRoute = ({query: { sources: ['com.deere.enterprise.datalake.enhance.core.manufacturing.ProductCatalogData']}, push: jest.fn()});
const sourceDatasets = [
  {
    id: "com.deere.enterprise.datalake.enhance.core.manufacturing.ProductCatalogData",
    createdBy: "js91162",
    updatedBy: "js91162",
    createdAt: "2019-06-10T16:45:31.446Z",
    updatedAt: "2019-06-10T16:45:31.446Z",
    name: "Core Manufacturing Product Catalog Data",
    custodian: "G90_C3_INV_SYS_ADMIN",
    sourceDatasets: [],
    businessValue: "Medium",
    category: "Transactional",
    environmentName: "com.deere.enterprise.datalake.enhance.core.manufacturing.ProductCatalogData",
    phase: "Enhance Domain",
    technology: "AWS",
    physicalLocation: "us-east-1",
    schemas: [],
    classifications: [
      {
        community: "Product",
        countriesRepresented: [
          "ALL"
        ],
        gicp: "Unclassified",
        personalInformation: false,
        development: false,
        additionalTags: []
      }
    ],
    status: "AVAILABLE",
    approvals: [],
    version: 1,
    selectedEntitlement: []
  }
]
const expectedSourceEntitlements = [
  {
    "additionalTags": [],
     "community": "Product",
     "countriesRepresented": ["ALL"],
     "derivedFrom": {
       "id": "com.deere.enterprise.datalake.enhance.core.manufacturing.ProductCatalogData",
       "name": "Core Manufacturing Product Catalog Data"
      },
      "development": false,
      "gicp": "Unclassified",
      "id": expect.anything(),
      "personalInformation": false
    }
  ];
const permissions = [
  {
    id: 1,
    name: "perm1",
    createdBy: "cl98561",
    createdAt: "2019-06-22T20:53:15.948Z",
    updatedBy: "cl98561",
    updatedAt: "2019-06-23T20:53:15.948Z",
    group: "AWS-GIT-DWIS-DEV",
    clientId: "",
    businessCase: "I really wanna access this data!",
    startDate: "2019-06-24T20:53:15.948Z",
    endDate: "",
    status: "AVAILABLE",
    roleType: "human",
    approvals: [
      {
        community: {
          id: "Channel"
        },
        status: "PENDING",
        user: null,
        comment: null,
        updatedAt: null
      },
      {
        community: {
          id: "Customer"
        },
        status: "APPROVED",
        user: "cl98561",
        comment: "Done",
        updatedAt: "2019-06-10T16:45:31.446Z"
      },
      {
        community: {
          id: "Product"
        },
        status: "PENDING",
        user: null,
        comment: null,
        updatedAt: null
      }
    ],
    entitlements: [
      {
        id: 1,
        community: {
          id: 1,
          name: "Channel"
        },
        subCommunity: {
          id: 4,
          name: "Service Delivery"
        },
        gicp: {
          id: 1,
          name: "Confidential"
        },
        countriesRepresented: [
          {
            id: 1,
            name: "ALL"
          }
        ],
        additionalTags: [],
      }
    ]
  },
  {
    id: 2,
    name: "perm2",
    createdBy: "cl98561",
    createdAt: "2019-06-22T20:53:15.948Z",
    updatedBy: "cl98561",
    updatedAt: "2019-06-23T20:53:15.948Z",
    group: 2,
    clientId: "",
    businessCase: "Testing businessCase",
    startDate: "2019-06-24T20:53:15.948Z",
    endDate: "2020-06-24T20:53:15.948Z",
    status: "PENDING",
    roleType: "human",
    approvals: [
      {
        community: {
          id: "Channel"
        },
        status: "PENDING",
        user: null,
        comment: null,
        updatedAt: null
      },
      {
        community: {
          id: "Customer"
        },
        status: "APPROVED",
        user: "cl98561",
        comment: "Done",
        updatedAt: "2019-06-10T16:45:31.446Z"
      },
      {
        community: {
          id: "Product"
        },
        status: "PENDING",
        user: null,
        comment: null,
        updatedAt: null
      }
    ],
    entitlements: [
      {
        community: {
          id: 1,
          name: "Channel"
        },
        subCommunity: {
          id: 4,
          name: "Service Delivery"
        },
        gicp: {
          id: 1,
          name: "Confidential"
        },
        countriesRepresented: [
          {
            id: 1,
            name: "ALL"
          }
        ],
        additionalTags: [],
      }
    ]
  },
  {
    id: 3,
    name: "perm3",
    createdBy: "cl98561",
    createdAt: "2019-06-22T20:53:15.948Z",
    updatedBy: "cl98561",
    updatedAt: "2019-06-23T20:53:15.948Z",
    group: 3,
    clientId: "",
    businessCase: "Testing businessCase2",
    startDate: "2019-06-24T20:53:15.948Z",
    endDate: "2020-06-24T20:53:15.948Z",
    status: "PENDING",
    approvals: [
      {
        community: {
          id: "Channel"
        },
        status: "PENDING",
        user: null,
        comment: null,
        updatedAt: null
      },
      {
        community: {
          id: "Customer"
        },
        status: "APPROVED",
        user: "cl98561",
        comment: "Done",
        updatedAt: "2019-06-10T16:45:31.446Z"
      },
      {
        community: {
          id: "Product"
        },
        status: "PENDING",
        user: null,
        comment: null,
        updatedAt: null
      }
    ],
    entitlements: [
      {
        community: {
          id: 1,
          name: "Channel"
        },
        subCommunity: {
          id: 4,
          name: "Service Delivery"
        },
        gicp: {
          id: 1,
          name: "Confidential"
        },
        countriesRepresented: [
          {
            id: 1,
            name: "ALL"
          }
        ],
        additionalTags: [],
      }
    ]
  }
]

const permissionsSystem = [
  {
    id: "1",
    name: "perm1sys",
    createdBy: "cl98561",
    createdAt: "2019-05-22T20:53:15.948Z",
    updatedBy: "cl98561",
    updatedAt: "2019-05-23T20:53:15.948Z",
    group: "AWS-GIT-DWIS-DEV",
    clientId: "somecoolclientid1",
    businessCase: "I really wanna access this data!",
    startDate: "2019-06-24T20:53:15.948Z",
    endDate: "2020-06-24T20:53:15.948Z",
    status: "PENDING",
    roleType: "system",
    approvals: [
      {
        community: {
          id: "Channel"
        },
        status: "PENDING",
        user: null,
        comment: null,
        updatedAt: null
      },
      {
        community: {
          id: "Customer"
        },
        status: "APPROVED",
        user: "cl98561",
        comment: "Done",
        updatedAt: "2019-06-10T16:45:31.446Z"
      },
      {
        community: {
          id: "Engineering"
        },
        status: "PENDING",
        user: null,
        comment: null,
        updatedAt: null
      }
    ],
    entitlements: [
      {
        community: {
          id: 1,
          name: "Channel"
        },
        subCommunity: {
          id: 4,
          name: "Service Delivery"
        },
        gicp: {
          id: 1,
          name: "Confidential"
        },
        countriesRepresented: [
          {
            id: 1,
            name: "ALL"
          }
        ],
        additionalTags: [],
        existing: false,
        derivedFrom: true
      },
      {
      community: {
        id: 1,
        name: "Channel"
      },
      subCommunity: {
        id: 4,
        name: "Service Delivery"
      },
      gicp: {
        id: 1,
        name: "Confidential"
      },
      countriesRepresented: [
        {
          id: 1,
          name: "ALL"
        }
      ],
      additionalTags: [],
      existing: true,
      derivedFrom: true

    }
    ]
  },
  {  id: 2,
  name: "perm2sys",
  createdBy: "cl98561",
  createdAt: "2019-05-22T20:53:15.948Z",
  updatedBy: "cl98561",
  updatedAt: "2019-05-23T20:53:15.948Z",
  group: 2,
  clientId: 2,
  businessCase: "I really wanna access this data!",
  startDate: "2019-06-24T20:53:15.948Z",
  endDate: "2020-06-24T20:53:15.948Z",
  status: "PENDING",
  roleType: "system",
  approvals: [
    {
      community: {
        id: "Channel"
      },
      status: "PENDING",
      user: null,
      comment: null,
      updatedAt: null
    },
    {
      community: {
        id: "Customer"
      },
      status: "APPROVED",
      user: "cl98561",
      comment: "Done",
      updatedAt: "2019-06-10T16:45:31.446Z"
    },
    {
      community: {
        id: "Engineering"
      },
      status: "PENDING",
      user: null,
      comment: null,
      updatedAt: null
    }
  ],
  entitlements: 'Testing entitlements'
  }
];

const tweakedState = {
  nonExpiring: false,
  group: {id: 'someADGroup', name: 'someName'},
  clientId: {id: 'someClient', name: 'someName'},
  roleType: {id: 'human', name: 'Human'},
  entitlements: [{id: 'some entitlements'}],
  modal: null,
  sourceDatasets: []}
const localStorageStatuses = ['AVAILABLE', 'PENDING', 'REJECTED'];

describe('PermissionForm component test suite', () =>{
  beforeEach(() => {
    fetch.mockResponse(JSON.stringify([]));
    getAccessibleDatasets.mockResolvedValue([]);
    postPermission.mockResolvedValue({});
    getGroupsPermissions.mockResolvedValue(permissions);
    utils.findLatestAvailableVersions.mockImplementation((ds) => ds);
    utils.localStorageStatuses = localStorageStatuses;
  })

  afterEach(() => {
    fetch.resetMocks();
    window.localStorage.clear();
  })

  it('should handle src datasets', async () => {
    getDataset.mockResolvedValue(sourceDatasets[0]);
    const router = { query: {sources: sourceDatasets[0].id} };

    const wrapper = shallow(<PermissionForm router={router} loggedInUser={loggedInUser} pendingApprovals={['id2']} allViews={allViews}/>);
    await wrapper.instance().updateSourceDatasets();
    await wrapper.update();

    expect(wrapper.state().entitlements.length).toEqual(sourceDatasets[0].classifications.length);
  });

  it('should set state for selected existing permission', async () => {
    const perms = [
      { group: 'AWS_GROUP_A', name: 'MY PERM', id: 'id1', roleType: 'human', status: 'AVAILABLE',views: [{name: 'view.existing'}]},
      { group: 'AWS_GROUP_A', name: 'MY PERM 2', id: 'id2', roleType: 'human', status: 'AVAILABLE' },
      { group: 'AWS_GROUP_A', name: 'MY PERM 2', id: 'id2', roleType: 'human', status: 'PENDING' }

    ];
    getGroupsPermissions.mockResolvedValue(perms);
    const wrapper = shallow(<PermissionForm router={{ query: {} }} loggedInUser={loggedInUser} pendingApprovals={['id2']} allViews={allViews}/>);
    await wrapper.instance().setGroupsPermissions();
    wrapper.update();

    const onPermSelected = wrapper.find(PermissionFormWizard).at(0).prop('onPermissionSelected');
    const options = wrapper.find(PermissionFormWizard).at(0).prop('options');

    act(() => onPermSelected(perms[0]));

    expect(options[0].isDisabled).toEqual(false);
    expect(options[1].isDisabled).toEqual(true);
    expect(wrapper.state().id).toEqual('id1');
    expect(wrapper.state().name).toEqual('MY PERM');
    expect(wrapper.state().roleType).toEqual({id: 'human', name: 'Human'});
    expect(wrapper.state().group).toEqual({id: 'AWS_GROUP_A', name: 'AWS_GROUP_A'});
    expect(wrapper.state().views).toEqual(['view.existing']);

    const endDate = wrapper.find(ValidatedInput).filterWhere(val => val.props().id === 'endDate');
    expect(endDate.props().defaultValue).toEqual(null);
  });

  it('should set state for null selected existing permission', () => {
    const wrapper = shallow(<PermissionForm router={{ query: {} }} loggedInUser={loggedInUser} pendingApprovals={[]} allViews={allViews}/>);

    wrapper.setState({id: 'foo', name: 'bar'});

    const onPermSelected = wrapper.find(PermissionFormWizard).at(0).prop('onPermissionSelected');

    act(() => onPermSelected(null));

    expect(wrapper.state().id).toEqual(undefined);
    expect(wrapper.state().version).toEqual(undefined);
    expect(wrapper.state().name).toEqual('');
    expect(wrapper.state().roleType).toEqual('');
    expect(wrapper.state().group).toEqual(null);
  });

  it('Verify state maps properly to request format for human role', () => {
      const wrapper = shallow(<PermissionForm router={{ query: {} }} loggedInUser={{}} allViews={allViews}/>)
      const expected = {
        roleType: 'human',
        requestComments: 'No comments',
        businessCase: 'biz case',
        startDate: '2019-06-24T20:53:15.948Z',
        endDate: '2019-06-24T20:53:15.948Z',
        entitlements: [
          {
            community: 'comm',
            subCommunity: 'subComm',
            countriesRepresented: ['us'],
            gicp: 'gicp',
            additionalTags: ['foo'],
            development: false,
            personalInformation: false
          }
        ],
        group: 'AD_GROUP',
        views: []
      }

      wrapper.setState({
        name: expected.name,
        roleType: { id: expected.roleType },
        businessCase: expected.businessCase,
        startDate: expected.startDate,
        endDate: expected.endDate,
        group: { id: expected.group },
        clientId: null,
        entitlements: [{
          community: { id: 'comm' },
          subCommunity: { id: 'subComm' },
          gicp: { id: 'gicp' },
          countriesRepresented: [{ id: 'us' }],
          additionalTags: [{value: 'foo', label: 'foo'}],
        }],
        views: []
      })
      const req = wrapper.instance().constructBody()
      expect(req).toEqual(expected)
    })

    it('Verify state maps properly to request format when values missing', () => {
      const wrapper = shallow(<PermissionForm router={{ query: {} }} loggedInUser={{}} allViews={allViews}/>)
      const expected = {
        requestComments: 'No comments',
        roleType: 'human',
        businessCase: 'biz case',
        startDate: '2019-06-24T20:53:15.948Z',
        endDate: '2019-06-24T20:53:15.948Z',
        entitlements: [
          {
            community: null,
            subCommunity: null,
            countriesRepresented: [],
            gicp: null,
            additionalTags: [],
            development: false,
            personalInformation: false
          }
        ],
        group: 'AD_GROUP',
        views: []
      }

      wrapper.setState({
        name: expected.name,
        roleType: { id: expected.roleType },
        businessCase: expected.businessCase,
        startDate: expected.startDate,
        endDate: expected.endDate,
        group: { id: expected.group },
        clientId: null,
        entitlements: [{}],
        views: []
      })
      const req = wrapper.instance().constructBody()
      expect(req).toEqual(expected)
    })

    it('Verify state maps properly to request format when permission provided', () => {
      const expected = {
        name: 'test',
        roleType: 'human',
        businessCase: 'biz case',
        startDate: '2019-06-24T20:53:15.948Z',
        endDate: '2019-06-24T20:53:15.948Z',
        requestComments: 'No comments',
        entitlements: [
          {
            community: 'comm',
            subCommunity: 'subComm',
            countriesRepresented: ['us'],
            gicp: 'gicp',
            additionalTags: ['foo'],
            development: false,
            personalInformation: false
          }
        ],
        group: 'AD_GROUP',
        views: []
      }

      const wrapper = shallow(<PermissionForm router={{ query: {} }} loggedInUser={{}} permission={expected} allViews={allViews}/>)
      wrapper.setState({
        name: expected.name,
        roleType: { id: expected.roleType },
        businessCase: expected.businessCase,
        startDate: expected.startDate,
        endDate: expected.endDate,
        group: { id: expected.group },
        clientId: null,
        entitlements: [{
          community: { id: 'comm' },
          subCommunity: { id: 'subComm' },
          gicp: { id: 'gicp' },
          countriesRepresented: [{ id: 'us' }],
          additionalTags: [{ value: 'foo', label: 'foo' }],
        }],
        views: []
      })
      const req = wrapper.instance().constructBody()
      expect(req).toEqual(expected)
    })

    it('Verify state maps properly to request format when additional tags format mixed', () => {
      const wrapper = shallow(<PermissionForm router={{ query: {} }} loggedInUser={{}} allViews={allViews}/>)
      const expected = {
        roleType: 'human',
        requestComments: 'No comments',
        businessCase: 'biz case',
        startDate: '2019-06-24T20:53:15.948Z',
        endDate: '2019-06-24T20:53:15.948Z',
        entitlements: [
          {
            community: null,
            subCommunity: null,
            countriesRepresented: [],
            gicp: null,
            additionalTags: ['foo', 'bar'],
            development: false,
            personalInformation: false
          }
        ],
        group: 'AD_GROUP',
        views: []
      }

      wrapper.setState({
        name: expected.name,
        roleType: { id: expected.roleType },
        businessCase: expected.businessCase,
        startDate: expected.startDate,
        endDate: expected.endDate,
        group: { id: expected.group },
        clientId: null,
        entitlements: [{
          additionalTags: ['foo', { label: 'bar' }]
        }],
        views: []
      })
      const req = wrapper.instance().constructBody()
      expect(req).toEqual(expected)
    })

    it('Verify state maps properly to request format for system role', () => {
      const wrapper = shallow(<PermissionForm router={{ query: {} }} loggedInUser={{}} allViews={allViews}/>)
      const expected = {
        requestComments: 'No comments',
        roleType: 'system',
        businessCase: 'biz case',
        startDate: '2019-06-24T20:53:15.948Z',
        endDate: '2019-06-24T20:53:15.948Z',
        entitlements: [
          {
            community: 'comm',
            subCommunity: 'subComm',
            countriesRepresented: ['us'],
            gicp: 'gicp',
            additionalTags: ['foo'],
            development: false,
            personalInformation: false
          }
        ],
        group: 'AD_GROUP',
        clientId: 'client',
        views: []
      }

      wrapper.setState({
        name: expected.name,
        roleType: { id: expected.roleType },
        businessCase: expected.businessCase,
        startDate: expected.startDate,
        endDate: expected.endDate,
        group: { id: expected.group },
        clientId: expected.clientId,
        entitlements: [{
          community: { id: 'comm' },
          subCommunity: { id: 'subComm' },
          gicp: { id: 'gicp' },
          countriesRepresented: [{ id: 'us' }],
          additionalTags: [{value: 'foo', label: 'foo      '}]
        }],
        views: []
      })
      const req = wrapper.instance().constructBody()
      expect(req).toEqual(expected)
    })


    it('Verify state maps properly to request format when values missing', () => {
      const wrapper = shallow(<PermissionForm router={{ query: {} }} loggedInUser={{}} allViews={allViews}/>)
      const expected = {
        requestComments: 'No comments',
        roleType: 'human',
        businessCase: 'biz case',
        startDate: '2019-06-24T20:53:15.948Z',
        endDate: '2019-06-24T20:53:15.948Z',
        entitlements: [
          {
            community: null,
            subCommunity: null,
            countriesRepresented: [],
            gicp: null,
            additionalTags: [],
            development: false,
            personalInformation: false
          }
        ],
        group: 'AD_GROUP',
        views: []
      }

      wrapper.setState({
        name: expected.name,
        roleType: { id: expected.roleType },
        businessCase: expected.businessCase,
        startDate: expected.startDate,
        endDate: expected.endDate,
        group: { id: expected.group },
        clientId: null,
        entitlements: [{}],
        views: []
      })
      const req = wrapper.instance().constructBody()
      expect(req).toEqual(expected)
    })

    it('Verify state maps properly to request format when comments added', () => {
      const expected = {
        name: 'test',
        roleType: 'human',
        businessCase: 'biz case',
        startDate: '2019-06-24T20:53:15.948Z',
        endDate: '2019-06-24T20:53:15.948Z',
        requestComments: 'My name is Subha',
        entitlements: [
          {
            community: 'comm',
            subCommunity: 'subComm',
            countriesRepresented: ['us'],
            gicp: 'gicp',
            additionalTags: ['foo'],
            development: false,
            personalInformation: false
          }
        ],
        group: 'AD_GROUP',
        views: []
      }

      const wrapper = shallow(<PermissionForm router={{ query: {} }} loggedInUser={{}} permission={expected} allViews={allViews}/>)

      wrapper.setState({
        name: expected.name,
        roleType: { id: expected.roleType },
        businessCase: expected.businessCase,
        startDate: expected.startDate,
        endDate: expected.endDate,
        requestComments: expected.requestComments,
        group: { id: expected.group },
        clientId: null,
        entitlements: [{
          community: { id: 'comm' },
          subCommunity: { id: 'subComm' },
          gicp: { id: 'gicp' },
          countriesRepresented: [{ id: 'us' }],
          additionalTags: [{ value: 'foo', label: 'foo' }],
        }],
        views: []
      })
      const req = wrapper.instance().constructBody()
      expect(req).toEqual(expected)
    })

    it('Verify component renders with basic details', () => {
        const wrapper = shallow(<PermissionForm router={{query:{}}} loggedInUser={{}} sourceDatasets={sourceDatasets} allViews={allViews}/>)
        expect(wrapper).toBeDefined
        const cards = wrapper.find(Card)
        const rows = wrapper.find(Row)
        const cols = wrapper.find(Col)
        expect(cards).toHaveLength(2)
        expect(rows).toHaveLength(3)
        expect(cols).toHaveLength(6)
        expect(cards.find(Card.Header).at(0).text()).toEqual('Request Permissions')
        expect(cols.at(0).text().includes('Start Date')).toEqual(true)
        expect(cols.at(1).text().includes('End Date')).toEqual(true)
        expect(cols.at(2).find(Form.Check).props().id).toEqual('custom-checkbox-nonexp')
      })

    it('Verify that Cancel button works and accept confirmation', async () => {
      fetch.mockReturnValue(Promise.resolve(new Response('')));
      const onCancel = jest.fn();
      const cancelAndUnlock = jest.fn();
      const wrapper = shallow(<PermissionForm cancelAndUnlock={cancelAndUnlock} onCancel={onCancel} isEditing={true} router={{query:{}}} loggedInUser={{}} permission={{...permissions[0], version: 1, status: 'AVAILABLE'}} sourceDatasets={sourceDatasets} allViews={allViews}/>)
      const confirmationModals = wrapper.find(ConfirmationModal)
      expect(confirmationModals).toHaveLength(1)
      expect(wrapper.find(ConfirmationModal).at(0).props().show).toEqual(false)
      expect(wrapper.state().modal).toBeNull()
      const cancel = wrapper.find(Button).filterWhere(button => button.props().id === 'cancelPermission');
      cancel.simulate('click')
      expect(wrapper.state().modal).toEqual({'action': 'cancel', 'onAccept': expect.anything()})
      expect(wrapper.find(ConfirmationModal).at(0).props().show).toEqual(true)
      expect(onCancel.mock.calls).toBeNull
      await wrapper.instance().handleCancelAndUnlock();
      expect(cancelAndUnlock.mock.calls).toHaveLength(1)
    })

    it('Verify that cancel confirmation works', () => {
      const wrapper = shallow(<PermissionForm router={{query:{}}} loggedInUser={{}} sourceDatasets={sourceDatasets} allViews={allViews}/>)
      const confirmationModals = wrapper.find(ConfirmationModal)
      const cancel = wrapper.find(Button).filterWhere(button => button.props().id === 'cancelPermission');
      expect(confirmationModals).toHaveLength(1)
      expect(wrapper.find(ConfirmationModal).at(0).props().show).toEqual(false)
      expect(wrapper.state().modal).toBeNull()
      cancel.simulate('click')
      expect(wrapper.find(ConfirmationModal).at(0).props().show).toEqual(true)
      act(() => wrapper.find(ConfirmationModal).prop('onCancel')());
      expect(wrapper.state().modal).toBeNull
    })


    it('Verify that Submit for Approval button works', () => {
      const wrapper = shallow(<PermissionForm router={{query:{}}} loggedInUser={{}} sourceDatasets={sourceDatasets} allViews={allViews}/>)
      const submit = wrapper.find(Button).filterWhere(button => button.props().id === 'submitPermission');
      submit.simulate('click')
      expect(submit.length).toEqual(1)
      expect(submit.text()).toEqual('Submit for Approval')
      expect(submit.prop('onClick')).toEqual(expect.any(Function))

    })

    it('Verify Role Type Select component working correctly', () => {
      const wrapper = shallow(<PermissionForm router={{query:{}}} loggedInUser={{}} sourceDatasets={sourceDatasets} allViews={allViews}/>)
      const groupSelector = wrapper.find(ValidatedInput).filterWhere(g => g.props().id === 'groupSelect')
      const clientIdSelector = wrapper.find(ValidatedInput).filterWhere(g => g.props().id === 'clientSelect')
      expect(wrapper.state().roleType).toEqual('')
      expect(groupSelector).toHaveLength(0)
      expect(clientIdSelector).toHaveLength(0)
    })

    it('Verify selecting human role type shows AD group', () => {
      const wrapper = shallow(<PermissionForm router={{query:{}}} loggedInUser={{}} sourceDatasets={sourceDatasets} allViews={allViews}/>)
      const roleTypeSelect = wrapper.find(ValidatedInput).filterWhere(s => s.props().id === 'roleSelect')
      act(() => roleTypeSelect.prop('onChange')({id: 'human', name: 'Human' }));
      const clientIdSelector = wrapper.find(ValidatedInput).filterWhere(g => g.props().id === 'clientSelect')
      const groupSelector = wrapper.find(ValidatedInput).filterWhere(g => g.props().id === 'groupSelect')
      expect(groupSelector).toHaveLength(1)
      expect(groupSelector.props().isDisabled).toEqual(false)
      expect(clientIdSelector).toHaveLength(1)
      expect(clientIdSelector.props().disabled).toEqual(true)
      expect(wrapper.state().roleType).toEqual({id: 'human', name: 'Human' })
    })

    it('Verify existing permission with systems role type enables AD group and disables client ID', () => {
      const wrapper = shallow(<PermissionForm router={{query:{}}} loggedInUser={{}} sourceDatasets={sourceDatasets} permission={permissionsSystem[0]} allViews={allViews}/>);
      const clientIdSelector = wrapper.find(ValidatedInput).filterWhere(g => g.props().id === 'clientSelect');
      const groupSelector = wrapper.find(ValidatedInput).filterWhere(g => g.props().id === 'groupSelect');
      expect(groupSelector).toHaveLength(1);
      expect(groupSelector.props().isDisabled).toEqual(false);
      expect(clientIdSelector).toHaveLength(1);
      expect(clientIdSelector.props().disabled).toEqual(true);
      expect(wrapper.state().roleType).toEqual({id: 'system', name: 'System' });
    })

    it('Verify existing permission with human role type disables AD group', () => {
      const wrapper = shallow(<PermissionForm router={{query:{}}} loggedInUser={{}} sourceDatasets={sourceDatasets} permission={permissions[0]} allViews={allViews}/>);
      const groupSelector = wrapper.find(ValidatedInput).filterWhere(g => g.props().id === 'groupSelect');
      expect(groupSelector).toHaveLength(1);
      expect(groupSelector.props().isDisabled).toEqual(true);
      expect(wrapper.state().roleType).toEqual({id: 'human', name: 'Human' });
    })

    it('Verify selecting system role type shows Client and AD group selectors', () => {
      const wrapper = shallow(<PermissionForm router={{query:{}}} loggedInUser={{}} sourceDatasets={sourceDatasets} allViews={allViews}/>)
      const roleTypeSelect = wrapper.find(ValidatedInput).filterWhere(s => s.props().id === 'roleSelect')
      act(() => roleTypeSelect.prop('onChange')({id: 'system', name: 'System' }))
      let clientIdSelector = wrapper.find(ValidatedInput).filterWhere(g => g.props().id === 'clientSelect')
      const groupSelector = wrapper.find(ValidatedInput).filterWhere(g => g.props().id === 'groupSelect')
      expect(groupSelector).toHaveLength(1)
      expect(clientIdSelector).toHaveLength(1)
      expect(groupSelector.props().isDisabled).toEqual(false)
      expect(clientIdSelector.props().disabled).toEqual(false)
      expect(wrapper.state().roleType).toEqual({id: 'system', name: 'System' })

      act(() => {
        groupSelector.prop('onChange')({id: 'someGroup', name: 'someGroupName'})
      })
      clientIdSelector = wrapper.find(ValidatedInput).filterWhere(g => g.props().id === 'clientSelect')
      expect(clientIdSelector.props().disabled).toEqual(false)
    })

    it('Verify updating business case, start date, end date, business case updates state', () => {
      const wrapper = shallow(<PermissionForm router={{query:{}}} loggedInUser={{}} sourceDatasets={sourceDatasets} initialPermission={false} allViews={allViews}/>)
      const datePickers = wrapper.find(ValidatedInput).filterWhere(item => item.props().component === DatePicker)
      const checks = wrapper.find(Form.Check)
      const businessCase = wrapper.find('#businessCase');
      expect(businessCase.props().placeholder).toEqual('Describe the intended use of the data. Click the info icon for tips.')
      businessCase.simulate('change', {target: {value: "testing  updating business case"}} )
      expect(wrapper.state().businessCase).toEqual('testing  updating business case')
      datePickers.at(0).simulate('change', '2')
      expect(wrapper.state().startDate).toEqual('2')
      datePickers.at(1).simulate('change', '3')
      expect(wrapper.state().endDate).toEqual('3')
      checks.at(0).simulate('change', {target: {checked: true}})
      expect(wrapper.state().nonExpiring).toEqual(true)
      expect(wrapper.state().endDate).toEqual('')
    })

    it('Verify switching role types clears state and maintains derived entitlements', ()=> {
      const wrapper = shallow(<PermissionForm router={{query:{sources: String(sourceDatasets[0].id)}}} loggedInUser={{}} sourceDatasets={sourceDatasets} initialPermission={false} allViews={allViews}/>)
      const roleSelector = wrapper.find(ValidatedInput).filterWhere(s => s.props().id === 'roleSelect')
      const expectedEntitlements = [permissionsSystem[0].entitlements[0], {...permissionsSystem[0].entitlements[1], derivedFrom: false}] // Have one derived ent and one not
      expect(roleSelector).toHaveLength(1)
      expect(roleSelector.props().value).toEqual('')
      const initialState = wrapper.state()
      const initialSrcDatasets = initialState.sourceDatasets
      wrapper.setState({...tweakedState, entitlements: expectedEntitlements , sourceDatasets: initialSrcDatasets})
      console.log(wrapper.state())
      act(() => {
        roleSelector.prop('onChange')({ id: 'system', name: 'System' })
      })
      expect(wrapper.state()).toEqual({...initialState, isLoadingAccessibleDatasets: true, entitlements: expectedEntitlements, roleType: { id: 'system', name: 'System' }})
    })

    it('should filter out groups that are not AWS or EDG', () => {
      const groups = ['AWS-SOMEGROUP', 'EDG-SOMEGROUP','SOMEGROUP', 'G90-SOMEGROUP']
      const expectedGroups = [{id: 'AWS-SOMEGROUP', name: 'AWS-SOMEGROUP'}, {id: 'EDG-SOMEGROUP', name: 'EDG-SOMEGROUP'}]
      const wrapper = shallow(<PermissionForm router={{query:{sources: String(sourceDatasets[0].id)}}} loggedInUser={{groups: groups}} sourceDatasets={sourceDatasets} initialPermission={false} allViews={allViews}/>)
      wrapper.setState({roleType: {id: 'human', name: 'Human'}})
      const groupsSelect = wrapper.find('ValidatedInput').filterWhere(s => s.props().id === 'groupSelect')
      expect(groupsSelect.props().options).toEqual(expectedGroups)
    })

    it('should validate permission form and set errors in state', () => {
      const wrapper = shallow(<PermissionForm router={{ query: {}}} loggedInUser={{ groups: []}} sourceDatasets={sourceDatasets} allViews={allViews}/>)
      wrapper.instance().validateForm()
      expect(wrapper.state().errors).toContainEqual({"context": {"key": "endDate"}})
    })

    it('should display errors for invalid inputs', () => {
      const wrapper = shallow(<PermissionForm router={{ query: {} }} loggedInUser={{ groups: [] }} allViews={allViews}/>)
      wrapper.setState({
        roleType: { id: 'system', name: 'system' },
        entitlements: [{id: 1}],
        errors: [
          { context: { key: 'name' }, path: [] },
          { context: { key: 'clientId' }, path: [] },
          { context: { key: 'roleType' }, path: [] },
          { context: { key: 'group' }, path: [] },
          { context: { key: 'businessCase' }, path: [] },
          { context: { key: 'startDate' }, path: [] },
          { context: { key: 'endDate' }, path: [] },
          { path: ['entitlements', 0] }
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

      const perms = wrapper.find(Accordion)
      expect(perms.props().items[0].invalid).toEqual(true)
    })

    it('should handle adding entitlement', () => {
      const wrapper = shallow(<PermissionForm router={{ query: {} }} loggedInUser={{ groups: [] }} allViews={allViews}/>)
      const addEntitlement = wrapper.find(Button).filterWhere(button => button.props().id === 'addEntitlement');
      addEntitlement.simulate('click');

      expect(wrapper.state().entitlements).toHaveLength(1);
    })

    it('should handle changing entitlement', () => {
      const wrapper = shallow(<PermissionForm router={{ query: {} }} loggedInUser={{ groups: [] }} allViews={allViews}/>)
      wrapper.setState({ entitlements: [{id: 1, foo: 'bar'}] });
      const accordions = wrapper.find(Accordion);
      const item = accordions.at(0).props().items[0];
      act(() => {
        item.body.props.onChange('foo', 'baz');
      })
      expect(wrapper.state().entitlements[0]).toEqual({id: 1, foo: 'baz'});
    })

    it('should handle removing entitlement', () => {
      const wrapper = shallow(<PermissionForm router={{ query: {} }} loggedInUser={{ groups: [] }} allViews={allViews}/>)
      wrapper.setState({ entitlements: [{id: 1}] });
      const accordions = wrapper.find(Accordion);
      const action = accordions.at(0).props().items[0].actions[0];
      act(() => {
        action.handler();
      });
      const modal = wrapper.find(ConfirmationModal);

      act(() => {
        modal.props().onAccept();
      });

      expect(wrapper.state().entitlements).toHaveLength(0);
    })

    it('should not display errors for valid inputs', () => {
      const wrapper = shallow(<PermissionForm router={{ query: {} }} loggedInUser={{ groups: [] }} sourceDatasets={sourceDatasets} allViews={allViews}/>)
      wrapper.setState({roleType: { id: 'system', name: 'system' }});

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

    it('should not set localstorage when mounting', () => {
      const permission = permissions[0];
      const wrapper = shallow(<PermissionForm router={{ query: {}}} isEditing={true} loggedInUser={{ groups: []}} sourceDatasets={sourceDatasets} permission={permission} allViews={allViews}/>);
      const result = JSON.parse(window.localStorage.getItem(permission.id))
      expect(result).toBeNull();
    })

    it('should not set localstorage when mounting and not editing', () => {
      const permission = permissions[0];
      const wrapper = shallow(<PermissionForm router={{ query: {}}} isEditing={false} loggedInUser={{ groups: []}} sourceDatasets={sourceDatasets} permission={permission} allViews={allViews}/>);
      expect(window.localStorage.getItem(permission.id)).toBeNull();
    })

    it('should remove localstorage when canceling', async () => {
      fetch.mockReturnValue({ ok: true });
      const onCancel = jest.fn();
      let permission = permissions[0];
      const cancelAndUnlock = jest.fn();
      permission.entitlements = []
      const wrapper = shallow(<PermissionForm cancelAndUnlock={cancelAndUnlock} isEditing={true} router={{ query: {}}} onCancel={onCancel} loggedInUser={{ groups: []}} sourceDatasets={sourceDatasets} permission={permission} allViews={allViews}/>);
      await wrapper.instance().handleCancelAndUnlock()
      expect(cancelAndUnlock.mock.calls).toHaveLength(1);
    })

    it('should unlock record on submit', async () => {
      delete window.location;
      window.location = {assign: jest.fn()};
      permissionModel.validate.mockImplementation();
      postPermission.mockResolvedValue({ ok: true, json: async () => []});
      const permission = {...permissions[0], version: 1};
      const pushFn = jest.fn();
      const wrapper = shallow(<PermissionForm router={{ query: {}, push: pushFn}} isEditing={true} loggedInUser={{ groups: []}} sourceDatasets={sourceDatasets} permission={permission} allViews={allViews}/>);
      await wrapper.instance().handleSubmit();

      expect(fetch).toHaveBeenCalledWith('/api/permissions/1/1/unlock', {method: 'POST', credentials: 'same-origin'});
      expect(pushFn).toBeCalledWith('/approvals');
    });

    it('localstorage should handle storage full error', async () => {
      utils.setLocalStorage.mockImplementation(() => {throw {error: 'Boom'}});

      const permission = permissions[0];
      const wrapper = shallow(<PermissionForm router={{ query: {}}} isEditing={true} loggedInUser={{ groups: []}} sourceDatasets={sourceDatasets} permission={permission} allViews={allViews}/>);
      const expectation = "Some great description2";
      wrapper.setState({
          businessCase: expectation
      })
      wrapper.update()
      const modal =  wrapper.find(ConfirmationModal).filterWhere(modal => modal.props().id === 'confirmation');
      localStorage.setItem.mockClear();

      expect(modal.props().show).toEqual(true);
      expect(modal.props().body.props.children.props.children).toEqual("Your browser's cache is full. You can still edit and submit for approval, but changes will not be saved if you close the tab or window.");
      expect(wrapper.state().canSave).toEqual(false);
    })

    it('should initialize with given permissions', () => {
      const initialPermission = {...permissions[0], requestComments: 'some comments'};
      const expectedState = {
        ...permissions[0],
        version: undefined,
        nonExpiring: true,
        clientId: '',
        modal: null,
        sourceDatasets: [],
        isLoading: false,
        accessibleDatasets: [],
        isLoadingAccessibleDatasets: false,
        errors: [],
        showToast: false,
        requestComments: '',
        endDateTipsTarget: null,
        businessCaseTipsTarget: null,
        group: {id: permissions[0].group, name: permissions[0].group},
        roleType: {id: permissions[0].roleType, name: 'Human'},
        entitlements: initialPermission.entitlements,
        canSave: true,
        sourceEntitlements: [],
        views: [],
        groupsPermissions: [],
        selectedEntitlement: []
      };

      const wrapper = shallow(<PermissionForm router={ {query: {}}} isEditing={true} loggedInUser={{ groups: []}} sourceDatasets={sourceDatasets} permission={initialPermission} allViews={allViews}/>);
      expect(wrapper.state()).toEqual(expectedState);
    });

    it('should set entitlements to incoming source dataset entitlements', async () => {
      getDataset.mockResolvedValue(sourceDatasets[0]);
      const wrapper = shallow(<PermissionForm router={sourceRoute} isEditing={false} loggedInUser={{ groups: []}} sourceDatasets={sourceDatasets} allViews={allViews}/>);
      await wrapper.instance().updateSourceDatasets();
      expect(wrapper.state().entitlements).toEqual(expectedSourceEntitlements);
    });

    it('should be able to remove a permission by end dating an existing permission', async () => {
      const mockDate = new Date(1604966400000);
      const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      const endDate = new Date().toISOString();
      const wrapper = shallow(<PermissionForm router={sourceRoute} isEditing={true} loggedInUser={{ groups: []}} sourceDatasets={sourceDatasets} permission={permissions[0]} allViews={allViews}/>);
      const preBody = wrapper.instance().constructBody();
      const expectedBody = {...preBody, endDate};

      await wrapper.instance().acceptRemoval();
      wrapper.update();
      const postBody = wrapper.instance().constructBody();

      expect(postBody).toEqual(expectedBody);
      dateSpy.mockRestore();
    });

    it('should not be able to remove a permission on a new permission', async () => {
      const pushFn = jest.fn();
      const wrapper = shallow(<PermissionForm router={sourceRoute} isEditing={false} loggedInUser={{ groups: []}} sourceDatasets={sourceDatasets} allViews={allViews}/>);

      const removalButton = wrapper.find(Button).filterWhere(button => button.props().id === 'removePermission')

      expect(removalButton.props().hidden).toEqual(true);
    });


    it('should clear any changes from a permission if removing', async () => {
      const mockDate = new Date(1604966400000);
      const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      const endDate = new Date().toISOString();
      const pushFn = jest.fn();
      const wrapper = shallow(<PermissionForm router={sourceRoute} isEditing={true} loggedInUser={{ groups: []}} sourceDatasets={sourceDatasets} permission={permissions[0]} allViews={allViews}/>);
      const preBody = wrapper.instance().constructBody();
      const expectedBody = {...preBody, endDate};
      wrapper.setState({ name: 'some new name'});

      await wrapper.instance().acceptRemoval();
      wrapper.update();
      const postBody = wrapper.instance().constructBody();

      expect(postBody).toEqual(expectedBody);
      dateSpy.mockRestore();
    });

    it('should display views when request access', async () => {
      const router = { query: { sourceView: ['edl.testview1'], isViewRequest: true }};
      const wrapper = shallow(<PermissionForm router={router} loggedInUser={{ groups: [] }} allViews={allViews}/>);
      expect(wrapper).toBeDefined
      const col = wrapper.find(Col).filterWhere(col => col.props().id === 'addedViews')
      expect(col.text().trim()).toEqual('edl.testview1')
    })
    
    it('should merge views with existing views on permission', async () => {
      const router = { query: { sourceView: ['edl.testview1'], isViewRequest: true }};
      const wrapper = shallow(<PermissionForm router={router} loggedInUser={{ groups: [] }} allViews={allViews}/>);
      const perms = [
        { 
          group: 'AWS_GROUP_A',
          name: 'MY PERM',
          id: 'id1',
          roleType: 'human',
          status: 'AVAILABLE',
          views: [
            {
              name: 'view.existing'
            }
          ]
        }
      ];
      getGroupsPermissions.mockResolvedValue(perms);

      await wrapper.instance().setGroupsPermissions();
      wrapper.update();
  
      const onPermSelected = wrapper.find(PermissionFormWizard).at(0).prop('onPermissionSelected');
  
      act(() => onPermSelected(perms[0]));
      const existingViews = wrapper.find(Col).filterWhere(col => col.props().id === 'existingViews');
      const addedViews = wrapper.find(Col).filterWhere(col => col.props().id === 'addedViews');

      expect(existingViews.text()).toContain('view.existing');
      expect(addedViews.text()).toContain('edl.testview1')
    })

    it('Verify selecting system role type not shows views', () => {
      const wrapper = shallow(<PermissionForm router={{query:{}}} loggedInUser={{}} sourceDatasets={sourceDatasets} allViews={allViews}/>)
      const roleTypeSelect = wrapper.find(ValidatedInput).filterWhere(s => s.props().id === 'roleSelect')
      act(() => roleTypeSelect.prop('onChange')({id: 'system', name: 'System' }));
      const viewSelector = wrapper.find(ValidatedInput).filterWhere(g => g.props().id === 'viewSelect')
      expect(viewSelector).toHaveLength(0)
    })

    it('Verify selecting system role type not shows views', () => {
      const wrapper = shallow(<PermissionForm router={{query:{}}} loggedInUser={{}} sourceDatasets={sourceDatasets} allViews={allViews}/>)
      const roleTypeSelect = wrapper.find(ValidatedInput).filterWhere(s => s.props().id === 'roleSelect')
      act(() => roleTypeSelect.prop('onChange')({id: 'human', name: 'Human' }));
      const viewSelector = wrapper.find(ValidatedInput).filterWhere(g => g.props().id === 'viewSelect')
      expect(viewSelector).toHaveLength(1)
    })
    describe('utils test', () => {
      const initialPermission = {
        id: '1',
        name: 'something',
        roleType: 'type',
        group: 'group',
        entitlements: [],
        version: 1
      };

      const updatedInitial = {
        id: '1',
        name: 'something',
        roleType: { id:'type', name: 'Type' },
        group: { id: 'group', name: 'group' },
        entitlements: [],
        nonExpiring: true,
        sourceDatasets: [],
        sourceEntitlements: [],
        clientId: null,
        endDate: null
      };

      const currentState = {
        "businessCase": "new",
        "clientId": null,
        "endDate": null,
        "entitlements": [],
        "group": {"id": "group", "name": "group"},
        "id": "1",
        "name": "something",
        "nonExpiring": true,
        "roleType": {"id": "type", "name": "Type"},
        "sourceDatasets": [],
        "sourceEntitlements": [],
        "startDate": "",
        "views": [],
        version: 1
      }

      it('should pass perms with initialized structures to util set local', () => {
        const wrapper = shallow(<PermissionForm
          router={{ query: {} }}
          loggedInUser={{}}
          permissions={permissions}
          permission={initialPermission}
          allViews={allViews}
          isEditing={true}
        />);

        wrapper.setState({ businessCase: 'new' });

        expect(utils.setLocalStorage).toHaveBeenCalledWith(true, updatedInitial, currentState);
      });

      it('should get local stored copy from utils by passing initialized perm', () => {
        localStorage.getItem.mockReturnValueOnce({id: 'test'});
        utils.getLocalStorageItem.mockReturnValueOnce({ ...updatedInitial, version: 1});
        shallow(<PermissionForm router={{ query: {} }} loggedInUser={{}} permission={initialPermission} allViews={allViews} isEditing={true}/>);

        expect(utils.getLocalStorageItem).toHaveBeenCalledWith(updatedInitial.id, { ...updatedInitial, version: 1 });
      });

      it('Verify selecting end date should clear non-expiring', () => {
        const expectedDate = "some date"
        const wrapper = shallow(<PermissionForm router={{query:{}}} loggedInUser={{}} sourceDatasets={sourceDatasets} allViews={allViews}/>);
        const nonExpiring = wrapper.find("FormCheck").filterWhere(s => s.props().id === 'custom-checkbox-nonexp');
        act(() => nonExpiring.prop('onChange')({ target: { checked: true } }));
        expect(wrapper.state().nonExpiring).toEqual(true);

        const roleTypeSelect = wrapper.find(ValidatedInput).filterWhere(s => s.props().id === 'endDate');
        act(() => roleTypeSelect.prop('onChange')([ expectedDate ]));

        expect(wrapper.state().nonExpiring).toEqual(false);
        expect(wrapper.state().endDate).toEqual(expectedDate);
      });
    });
  });
