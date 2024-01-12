import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import ClassificationDetail from '../../components/ClassificationDetail';
import { act } from 'react-dom/test-utils';
import Accordion from '../../components/Accordion';
import {Badge, Card, Form} from 'react-bootstrap';

jest.mock('react-visual-diff');

configure({ adapter: new Adapter() });

const items = [{
  id: 'foo',
  community: { name: 'bar' },
  subCommunity: { name: 'baz' },
  gicp: { name: 'baz' },
  countriesRepresented: [{ name: 'baz', label: "baz" }],
  additionalTags: ['baz'],
  personalInformation: true,
  development: true
}];

const modifiedPrevItems = [{
  id: 'foo',
  community: { name: 'bar' },
  subCommunity: { name: 'baz' },
  gicp: { name: 'baz' },
  countriesRepresented: [{ name: 'ALL' }],
  additionalTags: ['baz'],
  personalInformation: true,
  development: true
}]

const prevItems = [{
  id: 'foo',
  community: { name: 'bar' },
  subCommunity: { name: 'baz' },
  gicp: { name: 'baz' },
  countriesRepresented: [{ name: 'baz' }],
  additionalTags: ['baz'],
  personalInformation: true,
  development: true
}]

const itemsNoTags = [{
  id: 'foo',
  community: { name: 'bar' },
  subCommunity: { name: 'baz' },
  gicp: { name: 'baz' },
  countriesRepresented: [{ name: 'baz', label: "baz" }],
  additionalTags: [],
  personalInformation: true,
  development: true
}];

describe('ClassificationSelectionModal test suite', () => {
  it('should render standard details with items', () => {
    const wrapper = shallow(<ClassificationDetail items={items} />)
    const accordion = wrapper.find(Accordion).at(0)
    expect(accordion.props().items).toHaveLength(1)
    expect(accordion.props().items[0].header).toBeDefined()
    expect(accordion.props().items[0].body).toBeDefined()
  })

  it('should show modified diff', () => {
    const wrapper = mount(<ClassificationDetail items={items} showDiff={true} prevItems={modifiedPrevItems}/>);
    const card = wrapper.find(Card).filterWhere(card => card.props().id === 'foo');

    expect(card.text().includes("Modified")).toEqual(true);
  })

  it('should show no change diff', () => {
    const wrapper = mount(<ClassificationDetail items={items} showDiff={true} prevItems={prevItems}/>);
    
    const card = wrapper.find(Card).filterWhere(card => card.props().id === 'foo');

    expect(card.text().includes("Modified")).toEqual(false);
    expect(card.text().includes("New")).toEqual(false);
    expect(card.text().includes("Removed")).toEqual(false);
  })

  it('should show removed diff', () => {
    const wrapper = mount(<ClassificationDetail items={[]} showDiff={true} prevItems={prevItems}/>);
    const card = wrapper.find(Card).filterWhere(card => card.props().id === 'foo');
    expect(card.text().includes("Removed")).toEqual(true);
  })

  it('should show new diff', () => {
    const wrapper = mount(<ClassificationDetail items={items} showDiff={true} prevItems={[]}/>);
    
    const card = wrapper.find(Card).filterWhere(card => card.props().id === 'foo');

    expect(card.text().includes("New")).toEqual(true);
  })

  it('should render standard details with items and diff', () => {
    const newItems = [...items, {...items[0], id: 'bar'}];
    const newPrev =  [{...items[0], countriesRepresented:  []}, {...items[0], id: 'baz'}]
    const wrapper = shallow(<ClassificationDetail items={newItems} prevItems={newPrev} showDiff />)
    const accordion = wrapper.find(Accordion).at(0)
    expect(accordion.props().items).toHaveLength(3)
    expect(accordion.props().items[0].header).toBeDefined()
    expect(accordion.props().items[0].body).toBeDefined()
  })

  it('should render non standard details with items', () => {
    const nonStdDetails = [{id: 'foo', countriesRepresented: [], additionalTags: []}]
    const wrapper = shallow(<ClassificationDetail items={nonStdDetails} />)
    const accordion = wrapper.find(Accordion).at(0)
    expect(accordion.props().items).toHaveLength(1)
    expect(accordion.props().items[0].header).toBeDefined()
    expect(accordion.props().items[0].body).toBeDefined()
  })

  it('should add check when selectable', () => {
    const callback = jest.fn()
    const wrapper = shallow(<ClassificationDetail items={items} selectable onSelect={callback} />)
    const accordion = wrapper.find(Accordion).at(0)
    const check = shallow(accordion.props().items[0].header).find(Form.Check)
    expect(check).toHaveLength(1)

    act(() => {
      check.at(0).props().onChange()
    })

    expect(wrapper.state().selected).toEqual(['foo'])
    expect(callback).toHaveBeenCalledWith([items[0]])
  })

  it('should display additional tags using Badges', () => {
    const wrapper = mount(<ClassificationDetail items={items} showDiff={false}/>);
    const badge = wrapper.find(Badge);
    expect(badge).toHaveLength(1);
  })

  it('should display empty additional tags with a dash', () => {
    const wrapper = mount(<ClassificationDetail items={itemsNoTags} showDiff={false}/>);
    const card = wrapper.find(Card).filterWhere(card => card.props().id === 'foo');
    expect(card.text().includes("Additional Tags: -")).toEqual(true);
  })
})
