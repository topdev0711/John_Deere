import { EnhancedClassificationForm } from '../../components/EnhancedClassificationForm';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { Form } from 'react-bootstrap';
import { act } from 'react-dom/test-utils'
import ValidatedInput from '../../components/ValidatedInput';
import util from '../../components/utils';

jest.mock('../../components/utils');

configure({ adapter: new Adapter() });

const context = {
    datasets: [
      { id: 1, name: 'ds1', classifications: [{ community: { id: 1, name: 'test' }, subCommunity: { id: 1, name: 'test', enabled: true }, gicp: { id: 1, name: 'test' }, countriesRepresented: [], development: false, personalInformation: false, additionalTags: ['tag1', 'tag2', 'tag3'] }]},
      { id: 2, name: 'ds2', classifications: [{ community: { id: 1, name: 'test' }, subCommunity: { id: 1, name: 'test', enabled: true }, gicp: { id: 1, name: 'test' }, countriesRepresented: [], development: false, personalInformation: false, additionalTags: ['tag4', 'tag5', 'tag6'] }]},
      { id: 3, name: 'ds3', classifications: [{ community: { id: 1, name: 'test' }, subCommunity: { id: 1, name: 'test', enabled: true }, gicp: { id: 1, name: 'test' }, countriesRepresented: [], development: false, personalInformation: false, additionalTags: ['tag7', 'tag8', 'tag9'] }]}
    ],
    referenceData: {
        communities: [{ id: 1, name: 'comm', subCommunities: [{ id: 1, name: 'sub', enabled: true }] }],
        gicp: [{ id: 1, name: 'gicp' }],
        countries: [{ id: 10, name: 'country' }],
        phases: [{ id: 1, name: 'phase' }],
        businessValues: [{ id: 1, name: 'biz' }],
        categories: [{ id: 1, name: 'cat' }],
        technologies: [{ id: 1, name: 'AWS' }],
        physicalLocations: [{ id: 1, name: 'us-east-1' }]
    },
    defaultValue: {
      additionalTags: ['Default']
    }
  }
const context2 = {
  datasets: [
    { id: 1, name: 'ds1', classifications: [{ community: { id: 1, name: 'test' }, subCommunity: { id: 1, name: 'test', enabled: true }, gicp: { id: 1, name: 'test' }, countriesRepresented: [], development: false, personalInformation: false, additionalTags: [] }]}
  ],
  referenceData: {
      communities: [{ id: 1, name: 'comm', subCommunities: [{ id: 1, name: 'sub', enabled: true }] }],
      gicp: [{ id: 1, name: 'gicp' }],
      phases: [{ id: 1, name: 'phase' }],
      businessValues: [{ id: 1, name: 'biz' }],
      categories: [{ id: 1, name: 'cat' }],
      technologies: [{ id: 1, name: 'AWS' }],
      physicalLocations: [{ id: 1, name: 'us-east-1' }],
  },
  defaultValue: {
  },
}

describe('ClassificationFo component test suite', () => {

  beforeEach(() => {
    const expectedGicpOp =  [
      {"groupLabel": "Recommended", "options": [{"id": '1', "name": "test"}]}
    ];
    util.createGicpOpts.mockReturnValue(expectedGicpOp);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

    it('verify component renders with no errors', () => {
        const wrapper = shallow(<EnhancedClassificationForm { ...context } />);
        const validatedInputs = wrapper.find(ValidatedInput)
        expect(validatedInputs).toHaveLength(5)
        expect(validatedInputs.at(0).props().isInvalid).toEqual(false)
        expect(validatedInputs.at(1).props().isInvalid).toEqual(false)
        expect(validatedInputs.at(2).props().isInvalid).toEqual(false)
        expect(validatedInputs.at(3).props().isInvalid).toEqual(undefined)
        expect(validatedInputs.at(4).props().isInvalid).toEqual(undefined)
    })

    it('verify component renders with errors', () => {
        const wrapper = shallow(
          <EnhancedClassificationForm
            errors={[
              { context: { key: 'community' } },
              { context: { key: 'subCommunity' } },
              { context: { key: 'gicp' } },
            ]}
            {...context}
          />
        )

        const validatedInputs = wrapper.find(ValidatedInput)
        expect(validatedInputs).toHaveLength(5)
        expect(validatedInputs.at(0).props().isInvalid).toEqual(true)
        expect(validatedInputs.at(1).props().isInvalid).toEqual(true)
        expect(validatedInputs.at(2).props().isInvalid).toEqual(true)
        expect(validatedInputs.at(3).props().isInvalid).toEqual(undefined)
        expect(validatedInputs.at(4).props().isInvalid).toEqual(undefined)
    })

    it('Verify Form.Check renders and handles change', () => {
      const onChange = jest.fn()
      const wrapper = shallow(<EnhancedClassificationForm errors={[]} {...context} onChange={onChange} />)
      const checks = wrapper.find(Form.Check)
      expect(checks).toHaveLength(2)
      expect(checks.at(0).props().label).toEqual('Personal Information')
      expect(checks.at(1).props().label).toEqual('Development')
      expect(onChange.mock.calls).toHaveLength(0)
      expect(wrapper.find(Form.Check).at(0).props().checked).toEqual(false)
      expect(wrapper.state().personalInformation).toEqual(false)
      act(() =>{
        checks.at(0).prop('onChange')({target: {checked: true}})
      })
      expect(onChange.mock.calls).toHaveLength(1)
      expect(wrapper.find(Form.Check).at(0).props().checked).toEqual(true)
      expect(wrapper.state().personalInformation).toEqual(true)
      act(() =>{
        checks.at(0).prop('onChange')({target: {checked: false}})
      })
      expect(wrapper.state().personalInformation).toEqual(false)
    })

    it('should select communties', () => {
      const onChange = jest.fn()
      const wrapper = shallow(<EnhancedClassificationForm errors={[]} {...context} onChange={onChange} />)
      const groups = wrapper.find(Form.Group)
      expect(groups).toHaveLength(7)
      expect(groups.at(0).find(Form.Label).text()).toMatch(/^Community/);

      const select = groups.at(0).find(ValidatedInput)
      expect(select).toHaveLength(1);
      expect(select.props().options).toEqual(context.referenceData.communities)


      expect(onChange.mock.calls).toHaveLength(0)
      expect(wrapper.state().communities).toBeNull

      const expectedCommunity = {name:'anyCommunity', id:1}
      wrapper.state().subCommunity = 'anySubCommunity';
      act(() =>{
        select.at(0).prop('onChange')(expectedCommunity)
      })

      expect(wrapper.state().community).toEqual(expectedCommunity)
      expect(wrapper.find(Form.Group).at(1).find(ValidatedInput).props().placeholder).toEqual('Select a GICP classification')
      expect(wrapper.state().subCommunity).toBeNull

      const options = wrapper.instance().subCommunitiesOptions()
      expect(options).toEqual([{ id: 1, name: 'sub', enabled: true }])
    });

    it('Verify that empty defaults render correctly', () => {
      const wrapper = shallow(<EnhancedClassificationForm errors={[]} {...context2} />)
      expect(wrapper.state().additionalTags).toEqual([])
      expect(wrapper.find(ValidatedInput).at(3).props().options).toEqual([])
      expect(wrapper.find(ValidatedInput).at(4).props().noOptionsMessage()).toEqual('Type a value and press enter...')
    })
})
