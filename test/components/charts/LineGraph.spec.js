import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import LineGraph from '../../../components/charts/LineGraph';

configure({ adapter: new Adapter() });

const sampleData = [
  [
    {
      date: new Date(2020, 0),
      name: "Interactive",
      value: 4000000
    },
    {
      date: new Date(2020, 1),
      name: "Interactive",
      value: 4000000
    }
  ]
];
const parentRect = {
  height: 10,
  width: 10
}

const label = 'Some label';
const unit = "some unit";

describe('LineGraph Test Suite', () => {
  it('should render', () => {
    const wrapper = shallow(<LineGraph />);

    expect(wrapper).toBeDefined();
  });

  it('should render stacked area chart', () => {
    const expectedStyle = {
      height: 400,
      width: 400
    };

    const expectedLayout = {
      autosize: true,
      legend: {
        traceorder: 'normal'
      },
      showlegend: false,
      xaxis: {
        tickformat: "%b\n%Y"
      },
      yaxis: {
        tickprefix: unit
      }
    };

    const wrapper = mount(<LineGraph 
      data={sampleData}
      stacked={true}
      parentSize={parentRect}
      label={label}
      isPrefix={true}
      units={unit}
    />);
    const chart = wrapper.find("ForwardRef(LoadableComponent)").filterWhere(object => object.props().id === `${label}-line-chart`);

    expect(chart.props().style).toEqual(expectedStyle);
    expect(chart.props().layout).toEqual(expectedLayout);
    expect(chart.props().data[0].stackgroup).toEqual("one");
    expect(chart.props().data[0].mode).toEqual("markers+lines");
  });

  it('should render line chart', () => {
    const expectedLayout = {
      autosize: true,
      legend: {},
      showlegend: false,
      xaxis: {
        tickformat: "%b\n%Y"
      },
      yaxis: {
        tickprefix: unit
      }
    };

    const wrapper = mount(<LineGraph 
      data={sampleData}
      parentSize={parentRect}
      label={label}
      isPrefix={true}
      units={unit}
    />);
    const chart = wrapper.find("ForwardRef(LoadableComponent)").filterWhere(object => object.props().id === `${label}-line-chart`);

    expect(chart.props().layout).toEqual(expectedLayout);
    expect(chart.props().data[0].type).toEqual("lines+markers");
    expect(chart.props().data[0].name).toEqual(sampleData[0][0].name);
    expect(chart.props().data[0].hovertemplate.includes(label)).toEqual(true);
    expect(chart.props().data[0].hovertemplate.includes(unit)).toEqual(true);
  });
});