import ListedDatasets from '../../components/ListedDatasets'
import Adapter from 'enzyme-adapter-react-16';
import { configure, shallow } from 'enzyme';
import { Alert, ListGroup } from 'react-bootstrap';
import { act } from 'react-dom/test-utils'
global.fetch = require('jest-fetch-mock');

configure({ adapter: new Adapter() });

describe('ListedDatasets test suite', () => {
  afterEach(() => {
    fetch.resetMocks()
  })

  it('should render correctly with zero accessible datasets', () => {
    const wrapper = shallow(<ListedDatasets displayedDatasets={[]} type={'accessible'} />)
    const paragraphs = wrapper.find(Alert).find('p')
    expect(paragraphs).toHaveLength(6)
    expect(paragraphs.at(0).prop('hidden')).toEqual(true)
    expect(paragraphs.at(1).prop('hidden')).toEqual(true)
    expect(paragraphs.at(2).prop('hidden')).toEqual(true)
    expect(paragraphs.at(3).prop('hidden')).toEqual(false)
    expect(paragraphs.at(4).prop('hidden')).toEqual(true)
    expect(paragraphs.at(5).prop('hidden')).toEqual(true)
  })

  it('should render correctly display datasets alphabetically', () => {
    const datasets = [{ id: 0, name: 'Subha', version: 1, phase: 'raw' }, { id: 1, name: 'Prada', version: 2, phase: 'raw' }]
    const wrapper = shallow(<ListedDatasets displayedDatasets={datasets} />)
    const items = wrapper.find(ListGroup).find(ListGroup.Item)
    expect(items).toHaveLength(2);
    expect(items.at(0).text()).toEqual("Prada ()")
    expect(items.at(1).text()).toEqual('Subha ()')
  })

  it('should render correctly with less than 10 datasets', () => {
    const datasets = [{ id: 0, name: '1', version: 1, phase: 'raw' }, { id: 1, name: '2', version: 2, phase: 'raw' }]
    const wrapper = shallow(<ListedDatasets displayedDatasets={datasets} />)
    const items = wrapper.find(ListGroup).find(ListGroup.Item)
    expect(items).toHaveLength(2)
  })

  it('should render correctly with more than 10 datasets', () => {
    const datasets = (new Array(15)).fill({ id: 0, name: '1', version: 1, phase: 'raw' })
    const wrapper = shallow(<ListedDatasets displayedDatasets={datasets} />)
    const items = wrapper.find(ListGroup).find(ListGroup.Item)
    expect(items).toHaveLength(11)
    items.at(10).simulate('click')
    expect(wrapper.find(ListGroup).find(ListGroup.Item)).toHaveLength(15)
  })

  it('should display modal', async () => {
    const datasets = [{ id: 0, name: '1', version: 1, phase: 'raw' }]
    fetch.mockResponse(JSON.stringify(datasets[0]))
    const wrapper = shallow(<ListedDatasets displayedDatasets={datasets} />)
    const items = wrapper.find(ListGroup).find(ListGroup.Item)
    expect(items).toHaveLength(1)

    await items.at(0).props().onClick()

    expect(wrapper.find('DatasetModal').at(0).props().dataset).toEqual(datasets[0])
  })

  it('should cancel modal', () => {
    const datasets = [{ id: 0, name: '1', version: 1, phase: 'raw' }]
    const wrapper = shallow(<ListedDatasets displayedDatasets={datasets} />)
    wrapper.setState({
      showPreview: true,
      selectedDataset: datasets[0]
    })

    act(() => {
      wrapper.find('DatasetModal').at(0).props().onCancel()
    })

    expect(wrapper.state().selectedDataset).toEqual(null)
    expect(wrapper.state().showPreview).toEqual(false)
  })
})
