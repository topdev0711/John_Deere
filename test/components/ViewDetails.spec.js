import { configure, shallow, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import ViewDetail from '../../components/ViewDetail';
import { waitFor } from '@testing-library/react';
import testPermissions from '../ViewDetailsPermissions.json'

global.fetch = require('jest-fetch-mock');
configure({ adapter: new Adapter() });

describe('ViewDetail Test Suite', () => {

  const name = 'edl_views.views_remediation_drift_test_diana';
  const props = {
    router: {
      query: {
        id: 'edl_views.views_remediation_drift_test_diana'
      }
    },
    appProps: {
      permissions: [],
      loggedInUser: {
        groups: ['AWS-GIT-DWIS-DEV']
      }
    }
  };

  const sampleViewDetails = {
    name: 'edl_views.views_remediation_drift_test_diana',
    description: 'edl_views.views_remediation_drift_test_diana description',
    isDynamic: true,
    fields: [],
    datasets: []
  };

  beforeEach(() => {
    fetch.mockResponse(req => {
      if (req.url.startsWith('/api/views')) {
        return Promise.resolve(JSON.stringify(sampleViewDetails));
      }
      if (req.url.startsWith('/api/permissions')) {
        console.log(req.url)
        console.log(testPermissions)
        return Promise.resolve(JSON.stringify(testPermissions));
      }
    })
  })

  afterEach(() => {
    fetch.resetMocks();
  })

  it('should render', () => {
    const wrapper = shallow(<ViewDetail {...props} />);
    expect(wrapper).toBeDefined();
  });

  it('should get view details for a given view-name', async () => {
    const wrapper = mount(<ViewDetail {...props}/>);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch).toHaveBeenCalledWith(
      `/api/views/${name}`,
      {
        credentials: 'same-origin',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  });

  it('should display an error if returned', async () => {
    fetch.mockResponseOnce(JSON.stringify({error: 'some error'}), {status: '400'});
    const wrapper = mount(<ViewDetail {...props}/>);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    wrapper.update();
    const errorDiv = wrapper.find('div').filterWhere(div => div.props().id === 'error-div');

    expect(errorDiv.text()).toContain('some error');
  });

  it('should display an error if returned and rejects', async () => {
    fetch.mockRejectOnce(JSON.stringify({message: 'some error'}), {status: '400'});
    const wrapper = mount(<ViewDetail {...props}/>);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    wrapper.update();
    const errorDiv = wrapper.find('div').filterWhere(div => div.props().id === 'error-div');

    expect(errorDiv.text()).toContain('An unexpected error occurred when getting view details.');
  });

  it('should display view name', async () => {
    const wrapper = mount(<ViewDetail {...props}/>);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    const body = wrapper.find('div').filterWhere(div => div.props().id === 'view-name');
    expect(body.text()).toContain(sampleViewDetails.name);
  });

  it('should display dynamic fields if is dynamic true', async () => {
    const wrapper = mount(<ViewDetail {...props}/>);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    wrapper.update();
    const body = wrapper.find('span').filterWhere(div => div.props().id === 'dynamic-fields-span');
    expect(body.text()).toContain('Dynamic Fields');
  });

  it('should render Related Datasets Tab', async () => {
    const wrapper = mount(<ViewDetail {...props}/>);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    wrapper.update();
    const navLink = wrapper.find('NavLink').filterWhere(navLink => navLink.props().eventKey === 'datasets-edl_views.views_remediation_drift_test_diana');
    navLink.simulate('click');
    wrapper.update();
    const tabPane = wrapper.find('TabPane').filterWhere(navLink => navLink.props().eventKey === 'datasets-edl_views.views_remediation_drift_test_diana');
    expect(tabPane.text()).toContain('The following 0 datasets are currently accessible with these entitlements');
  });

  it('should render View Permissions Tab', async () => {
    const wrapper = mount(<ViewDetail {...props}/>);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    wrapper.update();
    const navLink = wrapper.find('NavLink').filterWhere(navLink => navLink.props().eventKey === 'view-permissions-edl_views.views_remediation_drift_test_diana');
    navLink.simulate('click');
    wrapper.update();
    const tabPane = wrapper.find('TabPane').filterWhere(navLink => navLink.props().eventKey === 'view-permissions-edl_views.views_remediation_drift_test_diana');
    expect(tabPane.text()).toContain('The following 2 AD Groups contain 2 active permissions that have explicit access to this view.');
  });

});
