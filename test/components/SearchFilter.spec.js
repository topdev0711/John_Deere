import { SearchFilter } from '../../components/SearchFilter';
import Select from '../../components/Select';
import { Button } from 'react-bootstrap';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import util from '../../components/utils';

jest.mock('../../components/utils');
jest.mock('../../apis/lineage');

configure({ adapter: new Adapter() });

const context = {
  referenceData: {
    communities: [{ id: 1, name: 'comm', subCommunities: [{ id: 1, name: 'sub' }] }],
    gicp: [{ id: '1', name: 'Company Use' }, { id: 'cbd24f83-5a0a-4230-b1d0-7525047663ad', name: 'Unclassified' }],
    countries: [{ id: 1, name: 'country' }],
    phases: [{ id: 1, name: 'phase' }],
    categories: [{ id: 1, name: 'cat' }]
  },
  loggedInUser: {
    username: 'some-username',
    groups: ['group1', 'group2']
  }
}

describe('SearchFilter component test suite', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('verify component renders appropriately', () => {
    const expectedRoleTypeOp = [{ id: 'human', name: 'human' }, { id: 'system', name: 'system' }];
    const expectedPhaseOp = [{ id: 1, name: 'phase' }];
    const expectedGicpOp =  [
      {"groupLabel": "Recommended", "options": [{"id": '1', "name": "Company Use"}]},
      {"groupLabel": "Deprecated", "options": [{"id": 'cbd24f83-5a0a-4230-b1d0-7525047663ad', "name": "Unclassified"}]}
    ];
    const expectedCategoryOp = [{ id: 1, name: 'cat' }];
    const expectedCommunityOp = [{ id: 1, name: 'comm', subCommunities: [{id: 1, name: 'sub'}]}];
    const expectedSubCommunityOp = [{ id: 1, name: 'sub' }];
    const expectedCountriesRepOp = [{ id: 1, name: 'country' }];
    const expectedPersonalInfoOp = [{ id: true, name: 'true' }, { id: false, name: 'false' }];
    const expectedDevelopmentOp = [{ id: true, name: 'true' }, { id: false, name: 'false' }];
    const expectedAccessOp = [{ id: true, name: 'true' }, { id: false, name: 'false' }];
    const expectedCustodianOp = [{ id: 'group1', name: 'group1' }, { id: 'group2', name: 'group2' }];
    const expectedMyDatasetOp = [{ id: true, name: 'true', createdBy: 'some-username' }, { id: false, name: 'false', createdBy: 'some-username' }];
    util.createGicpOpts.mockReturnValue(expectedGicpOp);
    const wrapper = shallow(<SearchFilter context={context} onChange="foo" />)
    const selects = wrapper.find(Select)
    const roleTypeSelector = selects.filterWhere(s => s.props().id === 'roleType');
    const phaseSelector = selects.filterWhere(s => s.props().id === 'phase');
    const gicpSelector = selects.filterWhere(s => s.props().id === 'gicp');
    const categorySelector = selects.filterWhere(s => s.props().id === 'category');
    const communitySelector = selects.filterWhere(s => s.props().id === 'community');
    const subCommunitySelector = selects.filterWhere(s => s.props().id === 'subCommunity');
    const countriesRepresentedSelector = selects.filterWhere(s => s.props().id === 'countriesRepresented');
    const personalInformationSelector = selects.filterWhere(s => s.props().id === 'personalInformation');
    const developmentSelector = selects.filterWhere(s => s.props().id === 'development');
    const accessSelector = selects.filterWhere(s => s.props().id === 'access');
    const custodianSelector = selects.filterWhere(s => s.props().id === 'custodian');
    const myDatasetSelector = selects.filterWhere(s => s.props().id === 'myDataset');

    expect(selects).toHaveLength(12)
    expect(roleTypeSelector.props().options).toEqual(expectedRoleTypeOp);
    expect(phaseSelector.props().options).toEqual(expectedPhaseOp);
    expect(gicpSelector.props().options).toEqual(expectedGicpOp);
    expect(categorySelector.props().options).toEqual(expectedCategoryOp);
    expect(communitySelector.props().options).toEqual(expectedCommunityOp);
    expect(subCommunitySelector.props().options).toEqual(expectedSubCommunityOp);
    expect(countriesRepresentedSelector.props().options).toEqual(expectedCountriesRepOp);
    expect(personalInformationSelector.props().options).toEqual(expectedPersonalInfoOp);
    expect(developmentSelector.props().options).toEqual(expectedDevelopmentOp);
    expect(accessSelector.props().options).toEqual(expectedAccessOp);
    expect(custodianSelector.props().options).toEqual(expectedCustodianOp);
    expect(myDatasetSelector.props().options).toEqual(expectedMyDatasetOp);
  })

  it('verify component handles state', () => {
    const wrapper = shallow(<SearchFilter context={context} onChange={() => {}} />)
    const selects = wrapper.find(Select)
    const mockOpt = { id: 1, name: 'foo' }
    selects.forEach(s => {
      s.prop('onChange')(mockOpt)
    })
    
    expect(wrapper.state().phase).toEqual(mockOpt)
    expect(wrapper.state().category).toEqual(mockOpt)
    expect(wrapper.state().community).toEqual(mockOpt)
    expect(wrapper.state().subCommunity).toEqual(mockOpt)
    expect(wrapper.state().gicp).toEqual(mockOpt)
    expect(wrapper.state().countriesRepresented).toEqual(mockOpt)
    expect(wrapper.state().personalInformation).toEqual(mockOpt)
    expect(wrapper.state().development).toEqual(mockOpt)
  })

  it('verify handles subcomms for communities selected', () => {
    const wrapper = shallow(<SearchFilter context={context} onChange={() => {}} />)
    wrapper.setState({ community: [context.referenceData.communities[0]] })
    const selects = wrapper.find(Select)
    expect(wrapper.state().community).toEqual([context.referenceData.communities[0]])
    expect(selects.at(5).prop('options')).toEqual(context.referenceData.communities[0].subCommunities)
  })

  it('verify component notifies parent on apply, dataset catalog', () => {
    const callback = jest.fn()
    const callback2 = jest.fn()
    const wrapper = shallow(<SearchFilter context={context} onChange={callback} applySearch={callback2} />)
    console.log(wrapper.debug())
    const applyButton = wrapper.find(Button).get(1)
    applyButton.props.onClick()
    
    expect(callback2).toBeCalledTimes(0)
  })

  it('verify component notifies parent on cancel', () => {
    const callback = jest.fn()
    const wrapper = shallow(<SearchFilter context={context} onChange={callback} />)
    expect(callback).toBeCalledTimes(0)

    const cancelButton = wrapper.find(Button).get(0)
    cancelButton.props.onClick()
    
    expect(callback).toBeCalledTimes(1)
    expect(callback).toBeCalledWith({})
  })
})
