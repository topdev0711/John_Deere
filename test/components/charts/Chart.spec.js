import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import Chart from '../../../components/charts/Chart';

configure({ adapter: new Adapter() });

describe('Chart Test Suite', () => {
  const parentSize = {
    height:'10',
    width: '10'
  };

  const data = [
    { value: 'something' }
  ];

  const units = 'some unit';
  const isPrefix = false;
  const yAxis = "Y";
  const xAxis = "X";

  it('should render', () => {
    const wrapper = shallow(<Chart />);

    expect(wrapper).toBeDefined();
  });

  it('should render a line chart', () => {
    const label = "some chart";
    const wrapper = shallow(<Chart 
      label={label} 
      type="line"
      parentSize={parentSize}
      parentData={data}
      yAxis={yAxis}
      xAxis={xAxis}
      units={units}
      isPrefix={isPrefix}
    />);
    const chart = wrapper.find('ForwardRef(LoadableComponent)').filterWhere(obj => obj.props().id === `${label}-line-graph`);

    expect(chart).toBeDefined();
    expect(chart.props().parentSize).toEqual(parentSize);
    expect(chart.props().data).toEqual(data);
    expect(chart.props().units).toEqual(units);
    expect(chart.props().isPrefix).toEqual(isPrefix);
    expect(chart.props().yAxis).toEqual(yAxis);
    expect(chart.props().xAxis).toEqual(xAxis);
    expect(chart.props().label).toEqual(label);
  });

  it('should render a stacked area chart', () => {
    const label = "some chart";
    const wrapper = shallow(<Chart 
      label={label} 
      type="stacked-area"
      parentSize={parentSize}
      parentData={data}
      yAxis={yAxis}
      xAxis={xAxis}
      units={units}
      isPrefix={isPrefix}
    />);
    const chart = wrapper.find('ForwardRef(LoadableComponent)').filterWhere(obj => obj.props().id === `${label}-stacked-area-graph`);

    expect(chart).toBeDefined();
    expect(chart.props().parentSize).toEqual(parentSize);
    expect(chart.props().data).toEqual(data);
    expect(chart.props().units).toEqual(units);
    expect(chart.props().isPrefix).toEqual(isPrefix);
    expect(chart.props().yAxis).toEqual(yAxis);
    expect(chart.props().xAxis).toEqual(xAxis);
    expect(chart.props().label).toEqual(label);
    expect(chart.props().stacked).toEqual(true);
  });
});