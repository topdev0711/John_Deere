import { waitFor } from '@testing-library/react';
import { configure, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import mount from 'enzyme/build/mount';
import MetricsModal from '../../components/MetricsModal';

global.fetch = require('jest-fetch-mock');
configure({ adapter: new Adapter() });

const applications = [
  "some app",
  "other app"
];

const metrics = [
  {
    "year": "2020", 
    "month": "1", 
    "application": "enterprise-data-lake", 
    "interactiveDbus": "4", 
    "automatedDbus": "3", 
    "interactiveCost": "4000000", 
    "automatedCost": "1500000"
  },
  {
    "year": "2020", 
    "month": "2", 
    "application": "enterprise-data-lake", 
    "interactiveDbus": "4", 
    "automatedDbus": "3", 
    "interactiveCost": "4000000", 
    "automatedCost": "1500000"
  }
];
const title = "some title";

describe('MetricsModal Test Suite', () => {
  window.URL.createObjectURL = jest.fn();
  beforeEach(() => {
    fetch.mockResponseOnce(JSON.stringify(metrics));
  })

  afterEach(() => {
    fetch.resetMocks();
  })

  it('should render with a title and loading', () => {
    const wrapper = shallow(<MetricsModal title={title}/>);
    const modalTitle = wrapper.find("ModalTitle").filterWhere(object => object.props().id === `${title}-modal-header`);
    const loadingComponent = wrapper.find("div").filterWhere(object => object.props().id === `${title}-modal-spinner`);

    expect(wrapper).toBeDefined();
    expect(modalTitle.text().includes(title)).toEqual(true);
    expect(loadingComponent.text()).toEqual("Loading...")
  });

  it('should fetch applications and display', async () => {
    const wrapper = mount(<MetricsModal 
      title={title}
      applications={applications}
    />);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    wrapper.update();
    const modal = wrapper.find("Modal").filterWhere(object => object.props().id === `${title}-modal`);

    expect(fetch).toHaveBeenCalledWith(
      `/api/metrics?applications=some app,other app`,
      {
        "credentials": "same-origin", 
        "headers": {"Content-Type": "application/json"}, 
        "method": "GET"
      }
    );
    expect(modal.props().show).toEqual(true);
  });

  it('should be able to close modal', async () => {
    const wrapper = mount(<MetricsModal 
      title={title}
      applications={applications}
    />);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    wrapper.update();
    const closeButton = wrapper.find("Button").filterWhere(object => object.props().id === `${title}-modal-close`);
    closeButton.simulate("click");
    wrapper.update();
    const modal = wrapper.find("Modal").filterWhere(object => object.props().id === `${title}-modal`);

    expect(modal.props().show).toEqual(false);
  });

  it('should load metrics charts', async () => {
    const expectedCostProps = {
      id: title + "-cost-line-graph",
      isPrefix: true,
      label: "Cost",
      parentData: [
        [
          {
            date: new Date(metrics[0].year, metrics[0].month - 1),
            value: 5500000
          },
          {
            date: new Date(metrics[1].year, metrics[1].month - 1),
            value: 5500000
          }
        ]
      ],
      parentSize: expect.anything(),
      type: "line",
      units: "$",
      xAxis: "Date",
      yAxis: "Cost in Dollars",
    };
    const expectedCostBreakdownProps = {
      id: title + "-cost-breakdown-stacked-area-graph",
      isPrefix: true,
      label: "Cost",
      parentData: [
        [
          {
            date: new Date(metrics[0].year, metrics[0].month - 1),
            name: "Interactive",
            value: 4000000
          },
          {
            date: new Date(metrics[1].year, metrics[1].month - 1),
            name: "Interactive",
            value: 4000000
          }
        ],
        [
          {
            date: new Date(metrics[0].year, metrics[0].month - 1),
            name: "Automated",
            value: 1500000
          },
          {
            date: new Date(metrics[1].year, metrics[1].month - 1),
            name: "Automated",
            value: 1500000
          }
        ]
      ],
      parentSize: expect.anything(),
      type: "stacked-area",
      units: "$",
      xAxis: "Date",
      yAxis: "Cost in Dollars",
    };
    const expectedDbuProps = {
      id: title + "-dbus-line-graph",
      isPrefix: false,
      parentData: [
        [
          {
            date: new Date(metrics[0].year, metrics[0].month - 1),
            name: "Interactive",
            value: 4
          },
          {
            date: new Date(metrics[1].year, metrics[1].month - 1),
            name: "Interactive",
            value: 4
          }
        ],
        [
          {
            date: new Date(metrics[0].year, metrics[0].month - 1),
            name: "Automated",
            value: 3
          },
          {
            date: new Date(metrics[1].year, metrics[1].month - 1),
            name: "Automated",
            value: 3
          }
        ]
      ],
      parentSize: expect.anything(),
      type: "line",
      units: " DBUs",
      xAxis: "Date",
      yAxis: "DBUs",
    };

    const wrapper = mount(<MetricsModal
      title={title} 
      applications={applications}
    />);

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    wrapper.update();
    const costChart = wrapper.find("Chart").filterWhere(object => object.props().id === `${title}-cost-line-graph`);
    const costBreakdownChart = wrapper.find("Chart").filterWhere(object => object.props().id === `${title}-cost-breakdown-stacked-area-graph`);
    const dbuChart = wrapper.find("Chart").filterWhere(object => object.props().id === `${title}-dbus-line-graph`);

    expect(costChart.props()).toEqual(expectedCostProps);
    expect(costBreakdownChart.props()).toEqual(expectedCostBreakdownProps);
    expect(dbuChart.props()).toEqual(expectedDbuProps);
  });

  describe('sad paths', () => {
    it('should handle and display error when no metrics are found', async () => {
      fetch.resetMocks();
      fetch.mockResponseOnce(JSON.stringify([]));
  
      const wrapper = mount(<MetricsModal 
        title={title}
        applications={applications}
      />);
  
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      const error = wrapper.find("div").filterWhere(object => object.props().id === `${title}-modal-error`);
      
      expect(error.text()).toEqual("This application does not have any Databricks usage recorded.");
    });
  
    it('should handle and display error when getting metrics', async () => {
      const errorMessage = 'some error';
      fetch.resetMocks();
      fetch.mockResponseOnce(JSON.stringify({error: errorMessage}), {status: '400'});
  
      const wrapper = mount(<MetricsModal 
        title={title}
        applications={applications}
      />);
  
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      const error = wrapper.find("div").filterWhere(object => object.props().id === `${title}-modal-error`);
      
      expect(error.text()).toEqual(errorMessage);
    });
  
    it('should handle and display error when error is thrown', async () => {
      const errorMessage = 'some error';
      fetch.resetMocks();
      fetch.mockRejectOnce({ message: errorMessage }, {status: '500'});
  
      const wrapper = mount(<MetricsModal 
        title={title}
        applications={applications}
      />);
  
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      wrapper.update();
      const error = wrapper.find("div").filterWhere(object => object.props().id === `${title}-modal-error`);
      
      expect(error.text()).toEqual(errorMessage);
    });
  });
});