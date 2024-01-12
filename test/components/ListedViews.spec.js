 import ListedViews from '../../components/ListedViews';
 import Adapter from 'enzyme-adapter-react-16';
 import { configure, mount } from 'enzyme';
 import { Col, Button } from 'react-bootstrap';

 configure({ adapter: new Adapter() });

describe('ListedViews TestSuite', () => {
  it('should display views', () => {
    const views = [{"name": "edl.testview1", "status":"DRIFTED"}, {"name": "edl.testview2", "status":"AVAILABLE"}, {"name": "edl.testview3", "status":"AVAILABLE"}];
    const wrapper = mount(<ListedViews views={views} />)
    const cols = wrapper.find(Col).filterWhere(col => col.props().id === 'views')
    expect(cols).toHaveLength(3)
  })
  it('should render correctly with more than 10 views', () => {
    const views = (new Array(15)).fill([{"name": "edl.testview", "status":"AVAILABLE"}])
    const wrapper = mount(<ListedViews views={views} />)
    const cols = wrapper.find(Col).filterWhere(col => col.props().id === 'views')
    expect(cols).toHaveLength(11)
    cols.at(10).find(Button).simulate('click')
    expect(wrapper.find(Col).filterWhere(col => col.props().id === 'views')).toHaveLength(15)
  })
  it('should display as added view', () => {
    const views = [{"name": "edl.testview1", "status": "DRIFTED"}, {"name": "edl.testview2", "status": "AVAILABLE"}, {"name": "edl.testview3", "status": "DELETED"}];
    const prevViews = [{"name": "edl.testview1", "status": "DRIFTED"}, {"name": "edl.testview2", "status": "AVAILABLE"}];
    const wrapper = mount(<ListedViews views={views} prevViews={prevViews} hasChanges={true} showDiff={true} />)
    const cols = wrapper.find(Col).filterWhere(col => col.props().id === 'addedViews')
    expect(cols).toHaveLength(1)
    expect(cols.text().trim()).toEqual('edl.testview3  (Deleted)')
  })
  it('should display as deleted views', () => {
    const views = [{"name": "edl.testview1", "status":"DRIFTED"}, {"name": "edl.testview2", "status":"AVAILABLE"}];
    const prevViews = [{"name": "edl.testview1", "status":"DRIFTED"}, {"name": "edl.testview2", "status":"AVAILABLE"}, {"name": "edl.testview3", "status":"AVAILABLE"}];
    const wrapper = mount(<ListedViews views={views} prevViews={prevViews} hasChanges={true} showDiff={true} />)
    const cols = wrapper.find(Col).filterWhere(col => col.props().id === 'removedViews')
    expect(cols).toHaveLength(1)
    expect(cols.text().trim()).toEqual('edl.testview3')
  })
  it('should have both added and removed view', () => {
    const views = [{"name": "edl.testview1", "status":"AVAILABLE"}, {"name": "edl.testview3", "status":"AVAILABLE"}];
    const prevViews = [{"name": "edl.testview1", "status":"AVAILABLE"}, {"name": "edl.testview2", "status":"AVAILABLE"}];
    const wrapper = mount(<ListedViews views={views} prevViews={prevViews} hasChanges={true} showDiff={true}/>)
    const added = wrapper.find(Col).filterWhere(col => col.props().id === 'addedViews')
    const removed = wrapper.find(Col).filterWhere(col => col.props().id === 'removedViews')
    expect(added).toHaveLength(1)
    expect(removed).toHaveLength(1)
  })
})